// 작은 모험: one at a time, a few steps on the map. The definition (handmade, assembled at random, or written
// by an AI in the same form) is resolved to map positions when it starts and saved in the chat's game, so a
// refresh or a regenerated reply never changes it. Only the current step shows: what to do next, never the rest.
// Steps: follow (a guide hops from point to point), touch (look at every mark), find (pick something up),
// bring (take a thing to someone), choice (two ways to end, each with its own result), overlay (the map changes).

import { find, give, itemInfo, nameOf, takeUid } from '../../core/bag.js';
import { emit } from '../../core/bus.js';
import { DATA } from '../../core/data.js';
import { josa } from '../../core/ko.js';
import { today } from '../../core/ledger.js';
import { addStat, addXP, didAct, journal } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { addThings } from '../../world/things.js';
import { getMap } from '../../world/map.js';

const A = () => DATA.adventures || {};
const save = async () => { await saveState(); emit('adventure:changed', {}); };

export const current = (s = getState()) => s?.adv.cur || null;
export function hint(s = getState()) {
    const c = current(s);
    if (!c) return s?.adv.wait ? '새 모험을 준비하는 중…' : '';
    const st = c.steps[c.step];
    return st?.text || c.title;
}

// thing names for a step
const guideOf = id => A().guides?.[id] || { ko: '무언가', sprite: 'sparkle', verb: '움직인다' };
const merchant = () => getMap('ombos')?.npcs.find(n => n.id === 'merchant');

addThings((mapId, s) => {
    const c = current(s);
    if (!c || (c.map || 'ombos') !== mapId) return [];
    const st = c.steps[c.step];
    if (!st) return [];
    const T = (o, act) => ({ id: `adv:${c.step}:${o.x}:${o.y}`, ...o, act });
    switch (st.kind) {
        case 'follow': { const p = st.path[c.sub || 0], g = guideOf(st.guide); return [T({ x: p.x, y: p.y, label: g.ko, sprite: g.sprite }, ui => hop(ui))]; }
        case 'touch': return st.marks.map((m, k) => (c.touched?.includes(k) ? null : T({ x: m.x, y: m.y, label: m.label, sprite: m.sprite || 'sparkle' }, ui => touch(ui, k))));
        case 'find': return [T({ x: st.x, y: st.y, label: st.label, sprite: st.sprite || 'chest' }, ui => findIt(ui))];
        case 'bring': { const n = merchant(); return n ? [T({ x: n.x + 1, y: n.y, label: `${n.label}에게 가져가기`, sprite: 'sparkle' }, ui => bring(ui))] : []; }
        case 'choice': return [T({ x: st.x, y: st.y, label: st.label || '어떻게 할까', sprite: 'sparkle' }, ui => choose(ui))];
        default: return [];
    }
});

async function next(ui) {
    const s = getState(), c = s.adv.cur;
    c.step++; c.sub = 0; c.touched = [];
    const st = c.steps[c.step];
    if (!st) return finish(ui);
    if (st.kind === 'overlay') {
        s.flags[`overlay:${c.map || 'ombos'}:${st.id}`] = true;
        emit('world:changed', { map: c.map || 'ombos' });
        ui.showCard({ tag: '모험', title: c.title, text: st.text || '' });
        return next(ui);
    }
    // a choice right after a find happens on the spot
    if (st.kind === 'choice' && st.x === undefined) { const prev = c.steps[c.step - 1]; st.x = prev?.x ?? 0; st.y = prev?.y ?? 0; await save(); return choose(ui); }
    await save();
    ui.toast(st.text || '');
}

async function hop(ui) {
    const s = getState(), c = s.adv.cur, st = c.steps[c.step];
    const g = guideOf(st.guide);
    if ((c.sub || 0) < st.path.length - 1) { c.sub = (c.sub || 0) + 1; await save(); ui.toast(`${josa(g.ko, '가')} ${g.verb}`); return; }
    ui.toast(`${josa(g.ko, '가')} 멈췄어`);
    await next(ui);
}
async function touch(ui, k) {
    const s = getState(), c = s.adv.cur, st = c.steps[c.step];
    c.touched = [...(c.touched || []), k];
    const m = st.marks[k];
    const left = st.marks.length - c.touched.length;
    ui.showCard({ tag: '모험', title: m.label, text: `${m.text}${left ? `\n살펴볼 곳이 ${left}군데 남았어.` : ''}` });
    if (!left) await next(ui); else await save();
}
async function findIt(ui) {
    const s = getState(), c = s.adv.cur, st = c.steps[c.step];
    const [uid] = give(s, st.item, 1, 'adventure');
    c.found = uid;
    const i = itemInfo(st.item);
    ui.showCard({ tag: '발견', title: `${i?.icon || ''} ${i?.ko}`.trim(), text: `${st.text || ''}\n가방에 넣었어.` });
    await next(ui);
}
async function bring(ui) {
    const s = getState(), c = s.adv.cur, st = c.steps[c.step];
    const want = st.need === 'found' ? s.bag.items.find(i => i.uid === c.found)
        : st.need === 'food' ? s.bag.items.find(i => itemInfo(i.id)?.kind === 'food')
            : st.need ? s.bag.items.find(i => i.id === st.need) : null;
    if (st.need && !want) { ui.showCard({ tag: '모험', title: c.title, text: `${st.text}\n${st.need === 'food' ? '음식이 하나 있어야 해. 부엌에서 만들 수 있어.' : '가방에 그게 없어.'}` }); return; }
    if (want) { c.gave = nameOf(want); takeUid(s, want.uid); }
    ui.showCard({ tag: '모험', title: c.title, text: st.reply || st.text });
    await next(ui);
}
function choose(ui) {
    const s = getState(), c = s.adv.cur, st = c.steps[c.step];
    const it = c.found ? find(s.bag, c.found) : null;
    const name = it ? nameOf(it) : (c.gave || '그것');
    // {물건}, {물건:을} and {물건}을 (an AI often writes the particle after the brace) all come out right
    const fill = t => String(t || '').replace(/\{물건(?::([^}]+))?\}(을|를|이|가|은|는|과|와)?/g, (m, j, after) => (j || after ? josa(name, j || after) : name));
    const pick = o => async () => {
        const st2 = getState(), cc = st2.adv.cur;
        if (!o.keep && cc.found) takeUid(st2, cc.found);
        if (o.open && cc.found) { const x = find(st2.bag, cc.found), inf = x && itemInfo(x.id); if (inf?.open) { x.opened = true; if (inf.open.gives) give(st2, inf.open.gives, 1, 'adventure'); } }
        if (o.deben) st2.bag.deben += Math.min(40, o.deben);
        if (o.faith) addStat(st2, 'faith', Math.min(1, o.faith));
        if (o.give) give(st2, o.give, 1, 'adventure');
        if (o.memory) st2.adv.memory.push({ tag: o.memory, day: today(st2) });
        addXP(st2, Math.min(8, o.xp || 3));
        cc.chosen = { label: o.label, journal: fill(o.journal || '') };
        ui.toast(o.label);
        await next(ui);
    };
    ui.showCard({ tag: '모험', title: c.title, text: fill(st.text), buttons: [{ label: st.b.label, onClick: pick(st.b) }, { label: st.a.label, primary: true, onClick: pick(st.a) }] });
}

async function finish(ui) {
    const s = getState(), c = s.adv.cur;
    const e = c.end || {};
    addXP(s, Math.min(12, e.xp || 6));
    if (e.deben) s.bag.deben += Math.min(40, e.deben);
    if (e.give) give(s, e.give, 1, 'adventure');
    const d = didAct(s, 'adventure');
    const line = c.chosen?.journal || e.journal || `${josa(c.title, '을')} 마쳤다.`;
    if (e.en) journal(s, { ko: line, say: e.say || `${c.title} 이야기를 꺼낸다.`, en: e.en, marks: e.marks?.length ? e.marks : [c.title.split(' ').pop()], kind: 'adventure' });
    s.adv.recent = [...s.adv.recent, { tpl: c.tpl || c.id, guide: c.guide || '', anchors: c.anchors || [], item: c.item || '' }].slice(-5);
    if (c.hand) s.adv.done.push(c.id);
    s.adv.cur = null;
    await save();
    ui.showCard({ tag: '모험', title: `${c.title} · 끝`, text: `${line}${d ? `\n${d}` : ''}\n임무 탭 일지에서 이 일을 챗에 꺼낼 수 있어.` });
}

// a definition → positions on the map; returns null when something in it does not exist
export function resolve(def, mapId = 'ombos') {
    const map = getMap(mapId);
    const at = a => (typeof a === 'string' ? map.anchor(a) : a && Number.isFinite(a.x) ? a : null);
    const steps = [];
    for (const st of def.steps || []) {
        const o = { ...st };
        if (st.kind === 'follow') { o.path = (st.path || []).map(at); if (!o.path.length || o.path.some(p => !p)) return null; }
        if (st.kind === 'touch') { o.marks = (st.marks || []).map(m => { const p = at(m.at ?? m); return p ? { ...m, x: p.x, y: p.y } : null; }); if (!o.marks.length || o.marks.some(m => !m)) return null; }
        if (st.kind === 'find') { const p = at(st.at ?? st); if (!p || !itemInfo(st.item)) return null; o.x = p.x; o.y = p.y; }
        if (st.kind === 'choice' && st.at) { const p = at(st.at); if (p) { o.x = p.x; o.y = p.y; } }
        steps.push(o);
    }
    return { ...def, map: mapId, steps, step: 0, sub: 0, touched: [] };
}

// start one (it must already be resolved)
export async function begin(def, source) {
    const s = getState();
    s.adv.cur = { ...def, source, started: today(s) };
    s.adv.day = today(s);
    if (s.adv.count?.day !== s.adv.day) s.adv.count = { day: s.adv.day, n: 0 };
    s.adv.count.n++;
    s.adv.wait = false;
    await save();
}
