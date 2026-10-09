// The game window: the map fills it, the HUD sits on top. Open (full), folded (a small chip over the chat) or closed.
// The frame loop runs only while it is open. Where she stands is saved to the chat when the window closes or folds.

import { on } from '../core/bus.js';
import { seasonOf } from '../core/clock.js';
import { settings } from '../core/settings.js';
import { hasChat } from '../core/st.js';
import { getState, saveState } from '../core/state.js';
import { syncFromChat } from '../core/tracker.js';
import { bindPad, input, startInput, stopInput } from '../world/input.js';
import { getMap } from '../world/map.js';
import { feet, placePlayer, player, rememberPosition, stepPlayer } from '../world/player.js';
import { MODE, Renderer } from '../world/render.js';
import { buildHud, placeBubble, setTab, shortDate, todayBody, updateHud } from './hud.js';
import { bagCard } from './items.js';
import { personCard } from './talk.js';
import { cardOpen, closeCards, showCard, toast } from './popups.js';

let root = null, chip = null, hud = null, renderer = null, map = null;
let mode = 'closed'; // 'open' | 'folded' | 'closed'
let raf = 0, last = 0, miniAt = 0, near = null;

export const gameMode = () => mode;

// what packs get to show things with: cards, a toast, folding the window
const ui = {
    showCard: o => showCard(root, o),
    toast: t => toast(root, t),
    fold: () => foldGame(),
};
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
    for (const el of [root, chip, document.getElementById('sf_settings')]) el?.classList.toggle('sf_dark', dark);
}

function build() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'sf_game';
    root.hidden = true;
    document.body.append(root);
    hud = buildHud(root);
    renderer = new Renderer(hud.view);
    new ResizeObserver(() => { renderer.resize(); if (mode === 'open') frameNow(); }).observe(hud.view);
    bindPad(hud.pad, hud.knob);
    hud.close.addEventListener('click', closeGame);
    hud.collapse.addEventListener('click', foldGame);
    hud.talk.addEventListener('click', talk);
    hud.bag.addEventListener('click', () => { if (!cardOpen()) bagCard(ui, map); });
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

    on('sync', refresh);
    // a new chat or a new game: show that chat's game, or close when no chat is open
    on('state', () => {
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
    placePlayer(map);
    renderer.setMap(map, seasonOf(s?.date.month ?? 0));
}

export async function openGame() {
    if (!hasChat()) { window.toastr?.info?.('채팅을 먼저 열어 줘', '모래와 깃털'); return; }
    build();
    applyTheme();
    document.activeElement?.blur?.();
    root.hidden = false;
    chip.hidden = true;
    mode = 'open';
    enterMap();
    renderer.resize();
    await syncFromChat();
    refresh();
    startInput(talk);
    window.addEventListener('keydown', onEscape, true);
    last = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
}

async function remember() { if (rememberPosition()) await saveState(); }

export async function foldGame() {
    if (mode !== 'open') return;
    stop();
    root.hidden = true;
    mode = 'folded';
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
    chip.innerHTML = `<span class="sf_chip_ank">☥</span>${shortDate(s)}`;
    if (map) renderer.setMap(map, seasonOf(s.date.month));
    if (mode === 'open') frameNow();
}

function frameNow() { if (map && renderer.cv.width > 1) draw(performance.now()); }

function draw(t) {
    const s = getState();
    near = map.nearest(feet().x, feet().y);
    renderer.draw({ player, npcs: map.npcs, part: s?.part || 'day', time: t / 1000, near });
    placeBubble(hud, renderer, cardOpen() ? null : near);
    if (t - miniAt > 250) { miniAt = t; renderer.minimap(hud.miniCv, player); }
}

function frame(t) {
    if (mode !== 'open') return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    if (!cardOpen()) stepPlayer(map, input.dx, input.dy, dt);
    else player.moving = false;
    draw(t);
    raf = requestAnimationFrame(frame);
}

// 말 걸기 (button, E, Space, Enter): a place opens its card (or a pack's), a person their card
function talk() {
    if (mode !== 'open') return;
    if (cardOpen()) { closeTopCard(); return; }
    if (!near) { toast(root, '가까이에 말 걸 곳이 없어'); return; }
    if (near.kind === 'spot') {
        const act = spotActs.get(near.id);
        if (act) { act(near, ui, map); return; }
        showCard(root, { tag: MODE[near.mode] || '', title: near.title || near.label, text: near.text || '' });
        return;
    }
    personCard(ui, map.npcs.find(n => n.id === near.id) || near, map);
}

function openToday() {
    const s = getState();
    if (!s) return;
    showCard(root, {
        title: '오늘',
        body: todayBody(s),
        buttons: [
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
    const box = document.createElement('div');
    box.append(cv);
    const note = document.createElement('div');
    note.className = 'sf_note';
    note.textContent = '다른 지역은 원신 층 넓히기 단계에서 열려.';
    box.append(note);
    showCard(root, { title: map.d.name || '지도', body: box, wide: true, onClose: () => setTab(hud, 'world') });
}

const SOON = {
    somang: ['소망', '능력치, 일정판, 칭호는 육성 단계에서 열려.'],
    party: ['파티', '함께 걷는 신들과 원정 파티는 원정 단계에서 열려.'],
    quests: ['임무', '매일 의뢰와 신화 1장은 임무와 말 걸기 단계에서 열려.'],
};
function pickTab(id) {
    closeCards(root);
    hud.mini.classList.toggle('sf_on', id === 'map');
    setTab(hud, id);
    if (id === 'world') return;
    if (id === 'map') { openMap(); return; }
    const [title, text] = SOON[id];
    showCard(root, { title, text, onClose: () => setTab(hud, 'world') });
}
