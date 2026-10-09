// Growing: 지혜 · 체력 · 신앙, the 모험 등급 every activity feeds, the journal of things worth telling,
// and the day's two commissions. All of it lives in the chat's game; nothing here goes to the prompt.

import { emit } from './bus.js';
import { DATA } from './data.js';
import { today } from './ledger.js';
import { getState, saveState } from './state.js';

export const STATS = { wisdom: '지혜', strength: '체력', faith: '신앙' };
const RANKS = [0, 10, 25, 45, 70, 100, 140, 190, 250, 320, 400];
export function rankInfo(xp) {
    let r = 1;
    while (r < RANKS.length && xp >= RANKS[r]) r++;
    const cur = RANKS[r - 1], next = RANKS[r] ?? null;
    return { rank: r, xp, cur, next, frac: next ? (xp - cur) / (next - cur) : 1 };
}
export const rank = (s = getState()) => rankInfo(s?.stats.xp || 0).rank;

// both change the state; the caller saves (or the *Now forms save)
export function addXP(s, n) {
    const before = rankInfo(s.stats.xp).rank;
    s.stats.xp += Math.max(0, n | 0);
    const after = rankInfo(s.stats.xp).rank;
    emit('stats:changed', { rankUp: after > before ? after : 0 });
    return after > before ? after : 0;
}
export function addStat(s, k, n = 1) {
    s.stats[k] = Math.max(0, (s.stats[k] || 0) + n);
    emit('stats:changed', {});
}

// the journal: ko is how the game shows it, say is the sentence for the input box, en the fact for the prompt,
// marks the words that show a sent message still carries it (talk.js)
export function journal(s, { ko, say = '', en = '', marks = [], kind = '' }) {
    const entry = { id: `j${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`, ko, say, en, marks, kind, day: today(s), told: false };
    s.journal.push(entry);
    if (s.journal.length > 60) s.journal = s.journal.slice(-60);
    emit('journal:added', { entry });
    return entry;
}

// today's four commissions, any two of them count; the same four however often it is asked
export const DAILY_NEED = 2;
export function dailyTasks(s = getState()) {
    if (!s) return [];
    const t = today(s);
    if (s.daily.day !== t) {
        const all = DATA.daily?.tasks || [];
        const pick = [];
        let seed = (t * 2654435761) >>> 0;
        while (pick.length < Math.min(4, all.length)) { seed = (seed * 1103515245 + 12345) >>> 0; const k = seed % all.length; if (!pick.includes(k)) pick.push(k); }
        s.daily = { day: t, tasks: pick.map(k => ({ kind: all[k].kind, ko: all[k].ko, done: false })) };
    }
    return s.daily.tasks;
}

// an activity finished: counts for the commissions; returns a line to show if one was completed
export function didAct(s, kind) {
    emit('act:done', { kind });
    lessonStep(s, kind);
    const tasks = dailyTasks(s);
    const task = tasks.find(x => x.kind === kind && !x.done);
    if (!task || tasks.filter(x => x.done).length >= DAILY_NEED) return '';
    task.done = true;
    const r = DATA.daily?.reward || { deben: 10, xp: 3 };
    s.bag.deben += r.deben;
    addXP(s, r.xp);
    return `매일 의뢰 완료: ${task.ko} · 데벤 ${r.deben}`;
}

export const commit = async () => { await saveState(); };

// ---- 배움: one learning goal at a time, step by step, never failing; finished ones are skills
export const lessonList = () => DATA.lessons?.lessons || [];
export const hasSkill = (s, id) => (s?.lessons.done || []).includes(id);
export function pickLesson(s, id) { s.lessons.cur = id; s.lessons.prog[id] ||= { step: 0, n: 0 }; }
export function lessonState(s) {
    const L = lessonList().find(l => l.id === s.lessons.cur);
    if (!L) return null;
    const p = s.lessons.prog[L.id] ||= { step: 0, n: 0 };
    return { L, p, st: L.steps[p.step] };
}
// an activity counts toward the goal; the last step makes it a skill
function lessonStep(s, kind) {
    const x = lessonState(s);
    if (!x || !x.st || x.st.act !== kind) return;
    x.p.n++;
    if (x.p.n < x.st.n) return;
    x.p.step++; x.p.n = 0;
    if (x.p.step < x.L.steps.length) return;
    s.lessons.done.push(x.L.id); s.lessons.cur = '';
    addXP(s, 8);
    journal(s, { ko: `${x.L.ko}를 익혔다. 이제 ${x.L.skill}를 할 수 있어.`, say: `${x.L.ko}를 익힌 이야기를 꺼낸다.`, en: `Somang has learned ${({ read: 'to read old inscriptions', carry: 'to handle fragile loads safely', seal: 'to handle sealed objects' })[x.L.id] || x.L.id}.`, marks: [x.L.ko.split(' ')[0]], kind: 'lesson' });
    emit('stats:changed', { lesson: x.L.ko });
}
