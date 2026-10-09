// Where the next small adventure comes from, once a game day when none is running:
//   1. the handmade ones not done yet (숨은 정원 first)
//   2. a seed left by an earlier choice, a day or more later (an item left with the merchant has news)
//   3. the AI, when it is switched on (ai.js) — it writes the same form inside the limits given to it
//   4. otherwise, or when the AI fails: assembled at random from data/adventures.json, avoiding what came lately

import { itemInfo } from '../../core/bag.js';
import { on } from '../../core/bus.js';
import { DATA } from '../../core/data.js';
import { today } from '../../core/ledger.js';
import { rank } from '../../core/progress.js';
import { settings } from '../../core/settings.js';
import { getState, saveState } from '../../core/state.js';
import { getMap } from '../../world/map.js';
import { onOpen } from '../../ui/window.js';
import { aiOn, askAdventure } from './ai.js';
import { begin, current, resolve } from './engine.js';
import { josa } from '../../core/ko.js';

const A = () => DATA.adventures || {};
const pickOne = (arr, avoid = []) => { const pool = arr.filter(x => !avoid.includes(x)); const p = pool.length ? pool : arr; return p[Math.floor(Math.random() * p.length)]; };
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
const TOUCH = ['모래에 무언가 끌린 자국이 있다.', '돌 틈에 실오라기가 걸려 있다.', '누군가 급히 떨어뜨린 듯한 구슬 하나.', '벽에 손바닥 자국이 희미하게 남아 있다.', '갈대가 한쪽으로 꺾여 있다.', '젖은 발자국이 여기서 끊긴다.'];

export function randomAdventure(s) {
    const map = getMap('ombos'), recent = s.adv.recent || [];
    const tpl = pickOne(A().templates || [], recent.slice(-2).map(r => r.tpl));
    const used = recent.slice(-2).flatMap(r => r.anchors || []);
    const anchors = shuffle(map.anchors.filter(a => !used.includes(a.id)).length >= 4 ? map.anchors.filter(a => !used.includes(a.id)) : map.anchors);
    const guideId = pickOne(Object.keys(A().guides || {}), recent.slice(-1).map(r => r.guide));
    const g = A().guides[guideId];
    const item = pickOne(A().finds || [], recent.map(r => r.item));
    const ends = (A().endings || []).filter(e => e.id !== 'open' || itemInfo(item)?.open);
    const end = pickOne(ends, recent.slice(-2).map(r => r.end));
    const i = itemInfo(item);
    const choice = { kind: 'choice', text: end.text, a: end.a, b: end.b };
    const mat = Math.random() < 0.5 ? pickOne(A().rewards?.materials || []) : '';
    let steps, title;
    if (tpl.id === 'follow') {
        const path = anchors.slice(0, 3);
        title = `${josa(g.ko, '를')} 따라서`;
        steps = [{ kind: 'follow', guide: guideId, path: path.map(a => a.id), text: `${josa(g.ko, '가')} 보인다. 따라가 보자.` },
            { kind: 'find', at: path[2].id, item, label: i.ko, text: `${josa(g.ko, '가')} 멈춘 자리에 ${josa(i.ko, '이')} 놓여 있다.` }, choice];
    } else if (tpl.id === 'search') {
        const marks = anchors.slice(0, 3);
        title = `${marks[0].ko}의 흔적`;
        steps = [{ kind: 'touch', marks: marks.map((a, k) => ({ at: a.id, label: `${a.ko}의 흔적`, text: TOUCH[(k + Math.floor(Math.random() * TOUCH.length)) % TOUCH.length] })), text: '마을 여기저기 이상한 흔적이 있다. 살펴보자.' },
            { kind: 'find', at: marks[2].id, item, label: i.ko, text: `흔적이 끝나는 곳에 ${josa(i.ko, '이')} 묻혀 있다.` }, choice];
    } else if (tpl.id === 'carry') {
        title = `떨어진 ${i.ko}`;
        steps = [{ kind: 'find', at: anchors[0].id, item, label: i.ko, text: `${anchors[0].ko}에 누가 ${josa(i.ko, '을')} 떨어뜨렸다.` },
            { kind: 'bring', to: 'merchant', need: 'found', text: '시장 상인이라면 주인을 알지도 몰라. 가져가 보자.', reply: '상인이 물건을 이리저리 돌려 본다.' }, choice];
    } else {
        const relic = rank(s) >= 2 && Math.random() < 0.5 ? pickOne(A().rewards?.relics || []) : item;
        title = '상인의 부탁';
        steps = [{ kind: 'bring', to: 'merchant', need: 'food', text: '시장 상인이 배가 고프다며 음식을 하나 부탁한다.', reply: '상인이 맛있게 먹고는 좌판 밑에서 뭔가를 꺼내 준다.' },
            { kind: 'find', at: 'house_front', item: relic, label: itemInfo(relic).ko, text: `상인이 집 앞에 두었다는 답례품, ${itemInfo(relic).ko}.` }];
    }
    const def = { id: `r${Date.now().toString(36)}`, title, tpl: tpl.id, endId: end.id, guide: guideId, item, anchors: anchors.slice(0, 3).map(a => a.id), steps,
        end: { xp: 6, deben: 5 + Math.floor(Math.random() * 10), give: mat, journal: `${title}. 작은 일이 하나 끝났다.`, en: `Somang followed a small mystery around Ombos and came away with ${i.en}.`, say: `${title} 이야기를 꺼낸다.`, marks: [i.ko.split(' ').pop()] } };
    return resolve(def);
}

function fromSeed(s) {
    const t = today(s);
    const k = s.adv.memory.findIndex(m => t - m.day >= 1 && A().seeds?.[m.tag]);
    if (k < 0) return null;
    const m = s.adv.memory.splice(k, 1)[0], seed = A().seeds[m.tag];
    const anchors = shuffle(getMap('ombos').anchors);
    const steps = seed.steps.map(st => {
        if (st.kind === 'touch') return { kind: 'touch', marks: anchors.slice(0, st.count || 2).map(a => ({ at: a.id, label: `${a.ko}의 문양`, text: '봉인과 같은 문양이 희미하게 새겨져 있다.' })), text: seed.intro };
        if (st.kind === 'find') return { kind: 'find', at: anchors[3].id, item: st.item, label: itemInfo(st.item)?.ko, text: '문양이 가리키던 곳이다.' };
        if (st.kind === 'bring') return { kind: 'bring', to: 'merchant', text: seed.intro, reply: '상인이 주인에게서 받아 두었다는 것을 건넨다.' };
        return st;
    });
    return resolve({ id: `s${Date.now().toString(36)}`, title: seed.ko, tpl: `seed:${m.tag}`, steps, end: { xp: 8, journal: `${seed.ko}. 예전에 고른 일이 돌아왔다.`, en: `Something Somang did days ago in Ombos came back to her: ${seed.ko === '맡긴 물건의 소식' ? 'the owner of a find she left with the merchant was found' : 'a mark matching an old seal turned up in the village'}.`, say: `${seed.ko} 이야기를 꺼낸다.`, marks: [seed.ko.split(' ').pop()] } });
}

let busy = false;
// makes sure one is running or on its way; safe to call often
export async function ensureAdventure({ force = false } = {}) {
    const s = getState();
    if (!s || busy || current(s)) return;
    // a new one when today's count is not used up; the count starts over on a new game day
    const t = today(s);
    if (s.adv.count?.day !== t) s.adv.count = { day: t, n: 0 };
    if (!force && s.adv.count.n >= Math.max(1, Number(settings().advPerDay) || 3)) return;
    busy = true;
    try {
        const hand = (A().handmade || []).find(h => !s.adv.done.includes(h.id));
        if (hand) { const r = resolve({ ...hand, hand: true }); if (r) return await begin(r, 'hand'); }
        const seeded = fromSeed(s);
        if (seeded) return await begin(seeded, 'seed');
        if (aiOn()) {
            s.adv.wait = true; await saveState();
            const def = await askAdventure(s).catch(e => { s.adv.lastError = String(e.message || e).slice(0, 200); return null; });
            if (def) { s.adv.lastError = ''; return await begin(def, 'ai'); }
        }
        const r = randomAdventure(s);
        if (r) await begin(r, 'random');
    } finally { busy = false; const st = getState(); if (st?.adv.wait) { st.adv.wait = false; await saveState(); } }
}

on('day:started', () => { ensureAdventure(); });
// one ended: the next of today's comes along a moment later
on('adventure:changed', () => { if (!current()) setTimeout(() => ensureAdventure(), 1500); });
onOpen(() => { ensureAdventure(); });
