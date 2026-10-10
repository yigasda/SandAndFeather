// The game window: the map fills it, the HUD sits on top. Open (full), folded (a small chip over the chat) or closed.
// The frame loop runs only while it is open. Where she stands is saved to the chat when the window closes or folds.

import { on } from '../core/bus.js';
import { DATA } from '../core/data.js';
import { seasonOf } from '../core/clock.js';
import { settings } from '../core/settings.js';
import { hasChat } from '../core/st.js';
import { getState, saveState } from '../core/state.js';
import { syncFromChat } from '../core/tracker.js';
import { bindPad, input, startInput, stopInput } from '../world/input.js';
import { getMap } from '../world/map.js';
import { feet, follower, placePlayer, player, rememberPosition, stepPlayer } from '../world/player.js';
import { thingsOn } from '../world/things.js';
import { MODE, Renderer } from '../world/render.js';
import { buildHud, placeBubble, setTab, shortDate, todayBody, updateHud } from './hud.js';
import { FEATHER } from './icon.js';
import { bagCard } from './items.js';
import { personCard } from './talk.js';
import { partyCard, questsCard, somangCard } from './tabs.js';
import { cardOpen, closeCards, showCard, toast } from './popups.js';
import { appearanceCard } from './appearance.js';

let root = null, chip = null, hud = null, renderer = null, map = null;
let mode = 'closed'; // 'open' | 'folded' | 'closed'
let raf = 0, last = 0, miniAt = 0, drawnAt = 0, near = null;
// frames drawn a second: walking, standing (only the river moves), a card is open
const FPS = { walk: 30, still: 8, card: 4 };

export const gameMode = () => mode;

// what packs get to show things with: cards, a toast, folding the window
const ui = {
    showCard: o => showCard(root, o),
    toast: t => toast(root, t),
    fold: () => foldGame(),
};
// packs that want to know the window opened (to settle works, start an adventure): onOpen(fn)
const openers = new Set();
export const onOpen = fn => { openers.add(fn); };
// the game's ui for a pack that shows something on its own (a day closed while the window is open)
export const gameUi = () => ui;
// more buttons on the 오늘 card: addTodayButton({ label, onClick(ui) })
const todayBtns = [];
export const addTodayButton = b => { todayBtns.push(b); };
// more inside the 지도 card: addMapPart(ui => element | null)
const mapParts = [];
export const addMapPart = fn => { mapParts.push(fn); };
// marks on the big map: addMapMarks(mapId => [{ x, y, on }])
const markers = [];
export const addMapMarks = fn => { markers.push(fn); };
// a pack takes over a place: onSpot('dock', (spot, ui, map) => …)
const spotActs = new Map();
export const onSpot = (id, fn) => { spotActs.set(id, fn); };

// the look: 'auto' follows NarrativeArchive's dark switch if it is there, else SillyTavern's text colour
function isDark() {
    const t = settings().theme;
    if (t === 'dark') return true;
    if (t === 'light') return false;
    if (document.body.classList.contains('na_darkui')) return true;
    const m = getComputedStyle(document.body).color.match(/\d+(\.\d+)?/g);
    if (!m) return false;
    const [r, g, b] = m.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}
export function applyTheme() {
    const dark = isDark();
    const s = settings();
    for (const el of [root, chip, document.getElementById('sf_settings'), document.getElementById('sf_pick')]) if (el) {
        el.classList.toggle('sf_dark', dark);
        el.dataset.uiTheme = s.uiTheme;
    }
    const themeSelect=document.getElementById('sf_ui_theme'), brightness=document.getElementById('sf_theme');
    if(themeSelect)themeSelect.value=s.uiTheme;
    if(brightness)brightness.value=s.theme;
}

function build() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'sf_game';
    root.hidden = true;
    document.body.append(root);
    hud = buildHud(root);
    renderer = new Renderer(hud.view);
    renderer.setSprites(DATA.sprites);
    new ResizeObserver(() => { renderer.resize(); if (mode === 'open') frameNow(); }).observe(hud.view);
    // coming back to the tab, or the browser giving the canvas back: paint the ground again
    document.addEventListener('visibilitychange', () => { if (!document.hidden && mode === 'open') { renderer.repaint(); frameNow(); } });
    hud.view.addEventListener('contextrestored', () => { renderer.repaint(); if (mode === 'open') frameNow(); });
    bindPad(hud.pad, hud.knob);
    hud.close.addEventListener('click', closeGame);
    hud.collapse.addEventListener('click', foldGame);
    hud.talk.addEventListener('click', talk);
    hud.bag.addEventListener('click', () => { if (!cardOpen()) bagCard(ui, map); });
    hud.appearance.addEventListener('click', () => { if (!cardOpen()) appearanceCard(ui, applyTheme); });
    hud.dateCard.addEventListener('click', openToday);
    hud.mini.addEventListener('click', openMap);
    hud.tabs.addEventListener('click', e => { const b = e.target.closest('.sf_tab'); if (b) pickTab(b.dataset.tab); });

    chip = document.createElement('button');
    chip.type = 'button';
    chip.id = 'sf_chip';
    chip.hidden = true;
    chip.title = '모래와 깃털 열기';
    chip.addEventListener('click', openGame);
    document.body.append(chip);

    on('clock:synced', refresh);
    on('view:changed', refresh);
    // the map changed under her (an overlay opened, a companion joined): same place, new map
    on('world:changed', () => { if (mode === 'open') { swapMap(); frameNow(); } });
    for (const ev of ['sun:changed', 'bag:changed', 'adventure:changed']) on(ev, refreshSoon);
    on('stats:changed', d => { refreshSoon(); if (d?.rankUp && mode === 'open') toast(root, `모험 등급 ${d.rankUp}!`); });
    // a new chat or a new game: show that chat's game, or close when no chat is open
    on('game:loaded', () => {
        if (!hasChat()) { closeGame(); return; }
        if (mode === 'open') enterMap();
        refresh();
    });
    applyTheme();
}

function closeTopCard() { const all = root.querySelectorAll('.sf_pop_wrap'); all[all.length - 1]?.querySelector('.sf_pop_x')?.click(); }

function enterMap() {
    const s = getState();
    map = getMap(s?.pos?.map || 'ombos');
    if (!map) { s.pos = { map: 'ombos', x: null, y: null, dir: 'down' }; map = getMap('ombos'); }
    placePlayer(map);
    swapMap();
}
// the current map as the game has it now, without moving her
function swapMap() {
    const s = getState();
    map = getMap(player.map) || map;
    map.setAway(s?.party.with ? [s.party.with] : []);
    renderer.setMap(map, seasonOf(s?.date.month ?? 0));
}
// to another map: on its spawn, or at pos
export async function travel(mapId, pos = null) {
    const s = getState();
    if (!s || !DATA.maps[mapId]) return;
    closeCards(root);
    setTab(hud, 'world');
    hud.mini.classList.remove('sf_on');
    s.pos = { map: mapId, x: pos?.x ?? null, y: pos?.y ?? null, dir: 'down' };
    await saveState();
    enterMap();
    refresh();
}
let soon = 0;
function refreshSoon() { clearTimeout(soon); soon = setTimeout(refresh, 60); }

export async function openGame() {
    if (!hasChat()) { window.toastr?.info?.('채팅을 먼저 열어 줘', '모래와 깃털'); return; }
    build();
    applyTheme();
    document.activeElement?.blur?.();
    root.hidden = false;
    chip.hidden = true;
    mode = 'open';
    enterMap();
    renderer.repaint();
    renderer.resize();
    await syncFromChat();
    refresh();
    for (const fn of openers) { try { await fn(ui); } catch (e) { console.error('[SandAndFeather] open', e); } }
    startInput(talk);
    window.addEventListener('keydown', onEscape, true);
    last = 0; drawnAt = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
}

async function remember() { if (rememberPosition()) await saveState(); }

export async function foldGame() {
    if (mode !== 'open') return;
    stop();
    root.hidden = true;
    mode = 'folded';
    renderer.release();
    refresh();
    chip.hidden = false;
    await remember();
}

export async function closeGame() {
    if (!root || mode === 'closed') return;
    const wasOpen = mode === 'open';
    stop();
    root.hidden = true;
    chip.hidden = true;
    mode = 'closed';
    renderer.release();
    if (wasOpen) await remember();
}

// Escape closes a card, then folds the window
function onEscape(e) {
    if (e.key !== 'Escape' || mode !== 'open') return;
    e.preventDefault(); e.stopPropagation();
    if (cardOpen()) closeTopCard(); else foldGame();
}

function stop() {
    window.removeEventListener('keydown', onEscape, true);
    cancelAnimationFrame(raf);
    raf = 0;
    stopInput();
    closeCards(root);
}

// date card, chip and season colours follow the chat's game
export function refresh() {
    if (!root) return;
    const s = getState();
    if (!s) return;
    updateHud(hud, s);
    chip.innerHTML = `<span class="sf_chip_mark">${FEATHER}</span>${shortDate(s)}`;
    // the map is painted only while it shows; folded, its pictures stay empty
    if (mode !== 'open') return;
    if (map) renderer.setMap(map, seasonOf(s.date.month));
    frameNow();
}

function frameNow() { if (map && renderer.cv.width > 1) draw(performance.now()); }

// what she can use from where she stands, worked out now (also when the button is pressed between frames)
function lookAround() {
    const s = getState();
    const away = s?.party.with ? [s.party.with] : [];
    const things = thingsOn(map.id);
    near = map.nearest(feet().x, feet().y, things, away);
    return { s, away, things };
}

function draw(t) {
    const { s, away, things } = lookAround();
    const people = map.npcs.filter(n => !away.includes(n.id)).map(n => ({ look: n.look, x: n.x, y: n.y, dir: 'down', step: 0 }));
    if (away.length) { const f = follower(); people.push({ look: away[0], x: f.x, y: f.y, dir: f.dir, step: f.moving ? f.step : 0 }); }
    renderer.draw({ player, people, things, part: s?.part || 'day', time: t / 1000, near });
    placeBubble(hud, renderer, cardOpen() ? null : near);
    if (t - miniAt > 250) { miniAt = t; renderer.minimap(hud.miniCv, player); }
}

function frame(t) {
    if (mode !== 'open') return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    if (!cardOpen()) stepPlayer(map, input.dx, input.dy, dt);
    else player.moving = false;
    // the battery: draw only as often as something on screen changes
    const fps = cardOpen() ? FPS.card : player.moving ? FPS.walk : FPS.still;
    if (t - drawnAt >= 1000 / fps - 2) { drawnAt = t; draw(t); }
    raf = requestAnimationFrame(frame);
}

// 말 걸기 (button, E, Space, Enter): a place opens its card (or a pack's), a person their card
function talk() {
    if (mode !== 'open') return;
    if (cardOpen()) { closeTopCard(); return; }
    lookAround();
    if (!near) { toast(root, '가까이에 말 걸 곳이 없어'); return; }
    if (near.kind === 'spot') {
        const act = spotActs.get(near.id);
        if (act) { act(near, ui, map); return; }
        showCard(root, { tag: MODE[near.mode] || '', title: near.title || near.label, text: near.text || '' });
        return;
    }
    if (near.kind === 'thing') { near.act?.(ui, map); return; }
    personCard(ui, map.npcs.find(n => n.id === near.id) || near);
}

function openToday() {
    const s = getState();
    if (!s) return;
    showCard(root, {
        title: '오늘',
        body: todayBody(s),
        buttons: [
            ...todayBtns.map(b => ({ label: b.label, onClick: () => b.onClick(ui) })),
            { label: '챗에서 다시 읽기', onClick: () => { syncFromChat({ force: true }).then(r => { refresh(); toast(root, r.ok ? '챗의 트래커와 다시 맞췄어' : '트래커를 못 찾았어'); }); } },
            { label: '닫기', primary: true },
        ],
    });
}

function openMap() {
    const cv = document.createElement('canvas');
    cv.className = 'sf_bigmap';
    cv.width = map.w * 16; cv.height = map.h * 16;
    renderer.minimap(cv, player);
    // obelisks and such, as small triangles: gold when woken
    const g = cv.getContext('2d'), k = Math.min(cv.width / renderer.ground.width, cv.height / renderer.ground.height);
    const ox = (cv.width - renderer.ground.width * k) / 2, oy = (cv.height - renderer.ground.height * k) / 2, ts = renderer.ground.width / map.w;
    for (const fn of markers) for (const m of fn(map.id) || []) {
        const x = ox + (m.x + 0.5) * ts * k, y = oy + (m.y + 0.5) * ts * k, r = Math.max(4, cv.width / 90);
        g.fillStyle = m.on ? '#E0B040' : '#8A7A70'; g.strokeStyle = '#2a2018'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(x, y - r * 1.4); g.lineTo(x + r * 0.7, y + r); g.lineTo(x - r * 0.7, y + r); g.closePath(); g.fill(); g.stroke();
    }
    const box = document.createElement('div');
    box.className = 'sf_stack';
    box.append(cv);
    const note = document.createElement('div');
    note.className = 'sf_note';
    note.textContent = map.id === 'ombos' ? '선착장의 배를 고치고 모험 등급 3이 되면 강 건너 무너진 신전에 갈 수 있어.' : '배를 타면 옴보스로 돌아가.';
    box.append(note);
    for (const fn of mapParts) { try { const el = fn(ui, map); if (el) box.append(el); } catch (e) { console.error('[SandAndFeather] map part', e); } }
    showCard(root, { title: map.d.name || '지도', body: box, wide: true, onClose: () => setTab(hud, 'world') });
}

function pickTab(id) {
    closeCards(root);
    hud.mini.classList.toggle('sf_on', id === 'map');
    setTab(hud, id);
    if (id === 'world') return;
    if (id === 'map') { openMap(); return; }
    const back = () => setTab(hud, 'world');
    ({ somang: somangCard, party: partyCard, quests: questsCard })[id]?.(ui, back);
}
