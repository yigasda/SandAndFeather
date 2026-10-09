// 원정: 밤의 두아트. At evening or night, once a game day, for 태양 기운 3: pick Set or Horus, pack up to two
// dishes, and go down a short road of forks (fights, events, treasure, rest) to a gatekeeper. Nobody dies:
// at 0 체력 or full 공포 the companion carries Somang back up with half of what she found.
// 체력 = 13 + 3 × 체력 stat. 신앙 gives a spell once a fight. Set hits hard and takes hits; Horus sees the road.
// A run is saved in the chat's game, so closing the window mid-way picks it up again.

import { give, itemInfo, nameOf, ofKind, takeUid } from '../../core/bag.js';
import { emit } from '../../core/bus.js';
import { DATA } from '../../core/data.js';
import { canDo, markDone } from '../../core/ledger.js';
import { addXP, hasSkill, journal, rank } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { bar, list, para, stack } from '../../ui/kit.js';
import { onSpot } from '../../ui/window.js';
import { josa } from '../../core/ko.js';

const D = () => DATA.duat || {};
const FEAR_MAX = 10;
const KIND = { fight: '⚔ 싸움', event: '❔ 사건', treasure: '💰 보물', rest: '🔥 쉼터' };
const roll = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickW = w => { let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0); for (const [k, v] of Object.entries(w)) { r -= v; if (r <= 0) return k; } return Object.keys(w)[0]; };

let ui = null, close = null;
const save = async () => { await saveState(); emit('duat:changed', {}); };
function show(o) { close?.(); close = ui.showCard({ tag: '원정', title: '두아트', wide: true, ...o }); }

function head(r) {
    const comp = D().companions?.[r.comp];
    return stack(
        para(`${josa(comp?.ko || '', '와')} 함께 · ${r.layer < r.layers ? `${r.layer + 1}번째 길 / ${r.layers}` : '마지막 문'}`, 'sf_money'),
        bar(`체력 ${r.hp}/${r.max}`, r.hp / r.max, 'sf_hp'),
        bar(`공포 ${r.fear}/${FEAR_MAX}`, r.fear / FEAR_MAX, 'sf_fear'),
        r.loot.length ? para(`가져갈 것: ${r.loot.map(id => itemInfo(id)?.ko).join(', ')}`) : null);
}

// ---- start
onSpot('duat', (spot, u) => {
    ui = u;
    const s = getState();
    if (s.duat) { step(); return; }
    if (!['evening', 'night'].includes(s.part)) { u.showCard({ tag: '원정', title: spot.title, text: `${spot.text}\n문은 저녁과 밤에만 열려. 지금은 닫혀 있어.` }); return; }
    if (!canDo(s, 'duat')) { u.showCard({ tag: '원정', title: spot.title, text: '오늘 밤은 이미 다녀왔어. 다음 날 밤에 다시.' }); return; }
    prep(s.party.with || 'set', []);
});

function prep(comp, packed) {
    const s = getState();
    const foods = ofKind(s, 'food');
    const C = D().companions || {};
    const rows = foods.map(f => { const on = packed.includes(f.uid), fd = itemInfo(f.id).food || {}; return {
        icon: itemInfo(f.id).icon, name: nameOf(f), sub: [fd.heal ? `회복 ${fd.heal}` : '', fd.fear ? `공포 −${fd.fear}` : ''].filter(Boolean).join(' '),
        buttons: [{ label: on ? '빼기' : '챙기기', primary: on, disabled: !on && packed.length >= 2, onClick: () => prep(comp, on ? packed.filter(x => x !== f.uid) : [...packed, f.uid]) }] }; });
    show({
        body: stack(
            para('누구와 내려갈까?'),
            list(Object.entries(C).map(([id, c]) => ({ icon: id === comp ? '✔' : '', name: c.ko, sub: c.about, buttons: [{ label: id === comp ? '함께' : '고르기', primary: id === comp, onClick: () => prep(id, packed) }] }))),
            para('음식은 두 개까지 챙길 수 있어.'),
            list(rows, '챙길 음식이 없어. 부엌에서 만들 수 있어.'),
            para(`체력 ${13 + 3 * s.stats.strength} · 신앙 ${s.stats.faith}${rank(s) >= 2 ? ' · 모험 등급 2라 길이 하나 더 길어' : ''}`)),
        buttons: [{ label: '그만두기' }, { label: '내려가기 · 태양 기운 3', primary: true, disabled: sunLeft(s) < 3, onClick: () => { start(comp, packed); } }],
    });
}

async function start(comp, packed) {
    const s = getState();
    if (!spend(s, 3)) { ui.toast('태양 기운이 모자라'); return; }
    markDone(s, 'duat');
    const layers = rank(s) >= 2 ? 4 : 3;
    const max = 13 + 3 * s.stats.strength;
    const pack = packed.map(uid => takeUid(s, uid)?.id).filter(Boolean);
    s.duat = { comp, hp: max, max, fear: 0, layer: 0, layers, pack, loot: [], phase: 'path', doors: doors(), fight: null, event: null, boss: false, won: false };
    await save();
    step();
}
const doors = () => [pickW({ fight: 4, event: 3, treasure: 1.5, rest: 1.5 }), pickW({ fight: 4, event: 3, treasure: 1.5, rest: 1.5 })];

// ---- the road
function step() {
    const r = getState().duat;
    if (!r) return;
    if (r.phase === 'fight') return fightCard();
    if (r.phase === 'event') return eventCard();
    if (r.phase === 'end') return endCard();
    // choosing a door
    const sees = r.comp === 'horus';
    const btns = r.doors.map((k, i) => ({ label: sees ? `${i ? '오른쪽' : '왼쪽'} · ${KIND[k]}` : `${i ? '오른쪽' : '왼쪽'} 길`, primary: true, onClick: () => { enter(k); } }));
    if (r.layer >= r.layers) btns.splice(0, 2, { label: '마지막 문을 두드린다', primary: true, onClick: () => { enter('boss'); } });
    show({
        body: stack(head(r), para(r.layer >= r.layers ? '검은 물 너머로 거대한 문이 보인다. 비늘 소리가 들린다.' : sees ? '호루스가 높이 날아 두 갈래 길 끝을 보고 온다.' : '길이 두 갈래로 갈라진다. 어느 쪽도 끝이 보이지 않는다.')),
        buttons: [{ label: '여기서 올라가기', onClick: () => { finish(false); } }, ...btns],
    });
}

async function enter(kind) {
    const s = getState(), r = s.duat;
    r.fear = Math.min(FEAR_MAX, r.fear + 1);
    if (r.fear >= FEAR_MAX) return finish(true);
    if (kind === 'boss' || kind === 'fight') {
        const pool = (D().enemies || []).filter(e => e.id !== 'ammit' || r.layer >= 2);
        const e = kind === 'boss' ? D().boss : pool[roll(0, pool.length - 1)];
        r.boss = kind === 'boss';
        r.fight = { id: e.id, ko: e.ko, hp: e.hp, max: e.hp, atk: e.atk, skill: false, spell: false, dodge: false, log: `${josa(e.ko, '가')} 길을 막는다.` };
        r.phase = 'fight';
    } else if (kind === 'event') {
        const ev = D().events || [];
        r.event = ev[roll(0, ev.length - 1)].id;
        r.phase = 'event';
    } else if (kind === 'treasure') {
        const id = Math.random() < 0.3 ? D().relics[roll(0, D().relics.length - 1)] : D().materials[roll(0, D().materials.length - 1)];
        r.loot.push(id); r.layer++; r.doors = doors();
        ui.toast(`${itemInfo(id)?.icon || ''} ${josa(itemInfo(id)?.ko, '을')} 주웠어`);
    } else if (kind === 'rest') {
        r.hp = Math.min(r.max, r.hp + 4); r.fear = Math.max(0, r.fear - 2); r.layer++; r.doors = doors();
        ui.toast('꺼지지 않는 불 옆에서 숨을 골랐어. 체력 +4, 공포 −2');
    }
    await save();
    step();
}

// ---- fights: one action, then the enemy answers
function fightCard() {
    const s = getState(), r = s.duat, f = r.fight;
    const comp = D().companions?.[r.comp];
    const acts = [
        { label: '공격', primary: true, onClick: () => { act('hit'); } },
        { label: `${comp?.ko} · ${comp?.skill}`, disabled: f.skill, onClick: () => { act('skill'); } },
        { label: '주문', disabled: f.spell || s.stats.faith < 1, onClick: () => { act('spell'); } },
        ...(hasSkill(s, 'carry') ? [{ label: '엄호', disabled: f.cover, onClick: () => { act('cover'); } }] : []),
        ...(hasSkill(s, 'seal') && !r.ward ? [{ label: '보호 주문', onClick: () => { act('ward'); } }] : []),
        ...r.pack.map((id, k) => ({ label: `${itemInfo(id)?.ko} 먹기`, onClick: () => { act('eat', k); } })),
    ];
    show({ body: stack(head(r), bar(`${f.ko} ${f.hp}/${f.max}`, f.hp / f.max, 'sf_enemy'), para(f.log, 'sf_pop_text')), buttons: acts });
}

async function act(kind, k) {
    const s = getState(), r = s.duat, f = r.fight;
    const C = D().companions?.[r.comp]?.ko;
    let log = '';
    if (kind === 'hit') { const d = 3 + s.stats.strength + roll(0, 2); f.hp -= d; log = `소망이 ${d}만큼 쳤다.`; }
    if (kind === 'skill') {
        f.skill = true;
        if (r.comp === 'set') { f.hp -= 6; log = `${C}의 폭풍이 ${josa(f.ko, '를')} 때렸다. 6.`; }
        else { f.hp -= 4; f.dodge = true; log = `${josa(C, '가')} 하늘에서 내려와 4를 쳤다. ${f.ko}의 다음 공격이 빗나갈 거야.`; }
    }
    if (kind === 'spell') {
        f.spell = true;
        let d = 2 + 2 * s.stats.faith;
        if (r.boss && s.flags.spell_name) d *= 2;
        f.hp -= d; r.fear = Math.max(0, r.fear - 1);
        log = `${s.flags.spell_name && r.boss ? '이름을 불렀다. ' : ''}주문이 ${d}만큼 태웠다. 공포 −1.`;
    }
    if (kind === 'cover') { f.cover = true; f.dodge = true; f.hp -= 2; log = `소망이 ${josa(C, '을')} 엄호했다. 2를 쳤고, 다음 공격은 막아.`; }
    if (kind === 'ward') { r.ward = true; r.hp = Math.min(r.max, r.hp + 4); r.fear = Math.max(0, r.fear - 2); log = '보호 주문이 둘을 감쌌다. 체력 +4, 공포 −2.'; }
    if (kind === 'eat') {
        const id = r.pack.splice(k, 1)[0], fd = itemInfo(id)?.food || {};
        r.hp = Math.min(r.max, r.hp + (fd.heal || 0)); r.fear = Math.max(0, r.fear - (fd.fear || 0));
        log = `${josa(itemInfo(id)?.ko, '을')} 먹었다.${fd.heal ? ` 체력 +${fd.heal}` : ''}${fd.fear ? ` 공포 −${fd.fear}` : ''}`;
    }
    if (f.hp <= 0) return win(log);
    // the enemy answers
    if (f.dodge) { f.dodge = false; log += ` ${f.ko}의 공격이 빗나갔다.`; }
    else { const d = Math.max(1, f.atk + roll(-1, 1) - (r.comp === 'set' ? 1 : 0)); r.hp -= d; log += ` ${f.ko}에게 ${d} 맞았다.`; }
    f.log = log;
    if (r.hp <= 0) return finish(true);
    await save();
    fightCard();
}

async function win(log) {
    const r = getState().duat, f = r.fight;
    let got = '';
    if (r.boss) { const id = D().relics[roll(0, D().relics.length - 1)]; r.loot.push(id, D().materials[roll(0, D().materials.length - 1)]); got = ` 비늘 아래에서 ${josa(itemInfo(id)?.ko, '이')} 나왔다.`; r.won = true; }
    else if (Math.random() < 0.5) { const id = D().materials[roll(0, D().materials.length - 1)]; r.loot.push(id); got = ` ${josa(itemInfo(id)?.ko, '을')} 주웠다.`; }
    ui.toast(`${josa(f.ko, '를')} 물리쳤어.${got}`);
    r.fight = null;
    if (r.boss) return finish(false);
    r.phase = 'path'; r.layer++; r.doors = doors();
    await save();
    step();
}

// ---- events (data/duat.json)
function eventCard() {
    const r = getState().duat, ev = (D().events || []).find(e => e.id === r.event);
    if (!ev) { r.phase = 'path'; return step(); }
    const pickIt = o => async () => {
        const st = getState(), rr = st.duat;
        if (o.fear) rr.fear = Math.max(0, Math.min(FEAR_MAX, rr.fear + o.fear));
        if (o.hp) rr.hp = Math.min(rr.max, rr.hp + o.hp);
        if (o.loot) { rr.loot.push(o.loot); ui.toast(`${josa(itemInfo(o.loot)?.ko, '을')} 얻었어`); }
        rr.event = null; rr.phase = 'path'; rr.layer++; rr.doors = doors();
        if (rr.hp <= 0 || rr.fear >= FEAR_MAX) return finish(true);
        await save(); step();
    };
    show({ body: stack(head(r), para(ev.ko, 'sf_pop_text')), buttons: [{ label: ev.b.label, onClick: pickIt(ev.b) }, { label: ev.a.label, primary: true, onClick: pickIt(ev.a) }] });
}

// ---- back up
async function finish(rescued) {
    const s = getState(), r = s.duat;
    if (!r) return;
    const keep = rescued ? r.loot.slice(0, Math.floor(r.loot.length / 2)) : r.loot;
    for (const id of keep) give(s, id, 1, 'duat');
    for (const id of r.pack) give(s, id, 1, 'kitchen');
    const xp = 4 + 2 * r.layer + (r.won ? 4 : 0);
    addXP(s, xp);
    const comp = D().companions?.[r.comp];
    const names = keep.map(id => itemInfo(id)?.en).filter(Boolean);
    journal(s, {
        ko: `${josa(comp?.ko, '와')} 두아트에 내려갔다${r.won ? '. 마지막 문지기를 쓰러뜨렸다' : ''}${rescued ? `. ${josa(comp?.ko, '가')} 소망을 데리고 올라왔다` : ''}.`,
        say: `${josa(comp?.ko, '와')} 두아트에 내려갔던 이야기를 꺼낸다.`,
        en: `Somang went down into the Duat with ${comp?.en}${r.won ? ' and they got past the gatekeeper' : ''}; ${rescued ? `${comp?.en} carried her back up` : 'she came back up on her own feet'}${names.length ? ` with ${names.slice(0, 3).join(', ')}` : ''}.`,
        marks: ['두아트'], kind: 'duat' });
    r.phase = 'end'; r.result = { rescued, keep, xp };
    await save();
    endCard();
}
function endCard() {
    const s = getState(), r = s.duat;
    if (!r?.result) { s.duat = null; return; }
    const { rescued, keep, xp } = r.result;
    const comp = D().companions?.[r.comp]?.ko;
    show({
        body: stack(para(rescued ? `더는 버틸 수 없었다. ${josa(comp, '가')} 소망을 안고 올라왔다. 가져온 것의 절반만 남았다.` : r.won ? '마지막 문이 열렸다. 새벽빛이 들기 전에 올라왔다.' : '발걸음을 돌려 올라왔다.', 'sf_pop_text'),
            list(keep.map(id => ({ icon: itemInfo(id)?.icon, name: itemInfo(id)?.ko, sub: '가방에 넣었어' })), '가져온 건 없어.'),
            para(`모험 경험치 +${xp} · 이 일은 임무 탭 일지에서 챗에 꺼낼 수 있어.`)),
        buttons: [{ label: '닫기', primary: true, onClick: () => { const st = getState(); st.duat = null; save(); } }],
        onClose: () => { const st = getState(); if (st.duat?.phase === 'end') { st.duat = null; save(); } },
    });
}
