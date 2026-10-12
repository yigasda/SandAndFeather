// 챗에서 게임으로: a sentence Somang took from a chat message with "게임에 반영하기", kept as
//   lesson · a learning goal it set      idea · a seed for the next AI adventure      note · a memo in 임무
// Each is only something she means to do: no reward, no stat. Each remembers the message (at) and the sentence
// (snip) it came from, and lives only while that message still says it:
//   live  the message at `at` still has the sentence
//   away  it was swiped or regenerated away, but it is still the last reply and a swipe can bring it back
//   gone  anything else: dropped for good (a lesson goal it set goes back, if no step of it was taken yet)

import { emit } from './bus.js';
import { today } from './ledger.js';
import { trackerPattern } from './settings.js';
import { ctx } from './st.js';
import { getState, saveState } from './state.js';

const MAX = 20;

// a message as plain text: no tracker, no markup, one space between words
export function plainText(mes) {
    let t = String(mes || '');
    try { t = t.replace(new RegExp(trackerPattern(), 'gs'), ' '); } catch { /* a broken pattern: leave it */ }
    return t.replace(/<[^>]+>/g, ' ').replace(/[*_~#`]+/g, '').replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').trim();
}
// its sentences, for picking one
export function sentences(mes) {
    const out = [];
    for (const line of plainText(mes).split(/\n+/)) {
        for (const p of line.split(/(?<=[.!?。…~][”"'’)]?)\s+/)) {
            const t = p.trim();
            if (t.length >= 4) out.push(t.slice(0, 200));
        }
    }
    return [...new Set(out)].slice(0, 40);
}

export function pickStatus(p, chat = ctx().chat || []) {
    const m = chat[p.at];
    if (!m) return 'gone';
    if (plainText(m.mes).includes(p.snip)) return 'live';
    const last = p.at === chat.length - 1 && !m.is_user;
    return last && (m.swipes || []).some(sw => plainText(sw).includes(p.snip)) ? 'away' : 'gone';
}
export const livePicks = (s = getState(), kind = '') => (s?.picks || []).filter(p => (!kind || p.kind === kind) && pickStatus(p) === 'live');

// the lesson a goal from the chat set has had a step taken since: it is the game's now, not the chat's
function started(s, p) {
    if (s.lessons.done.includes(p.lesson)) return true;
    const g = s.lessons.prog[p.lesson] || { step: 0, n: 0 };
    return g.step !== p.base.step || g.n !== p.base.n;
}

export async function addPick(s, { kind, text, snip, at, lesson = '' }) {
    s.picks = s.picks.filter(p => !(p.kind === kind && p.snip === snip && p.at === at) && !(kind === 'lesson' && p.kind === 'lesson'));
    const p = { id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`, kind, text, snip, at, day: today(s) };
    if (kind === 'lesson') {
        const g = s.lessons.prog[lesson] || { step: 0, n: 0 };
        Object.assign(p, { lesson, prev: s.lessons.cur, base: { step: g.step, n: g.n } });
        s.lessons.cur = lesson;
        s.lessons.prog[lesson] ||= { step: 0, n: 0 };
    }
    s.picks.push(p);
    if (s.picks.length > MAX) s.picks = s.picks.slice(-MAX);
    await saveState();
    emit('picks:changed', {});
    return p;
}
// mutates only; the caller saves
export const usePick = (s, id) => { s.picks = s.picks.filter(p => p.id !== id); };
export async function dropPick(id) {
    const s = getState();
    if (!s) return;
    usePick(s, id);
    await saveState();
    emit('picks:changed', {});
}
// Somang chose a learning goal herself in the game: goals from the chat no longer get a say
export const dropLessonPicks = s => { s.picks = s.picks.filter(p => p.kind !== 'lesson'); };

// after the chat changed (a reply came, was swiped, edited or deleted): follow it. Saves when anything moved.
export async function syncPicks() {
    const s = getState();
    if (!s?.picks.length) return;
    const chat = ctx().chat || [];
    const before = JSON.stringify([s.picks, s.lessons.cur]);
    s.picks = s.picks.filter(p => {
        const st = pickStatus(p, chat);
        if (p.kind === 'lesson') {
            if (started(s, p)) return false;
            if (st === 'live' && s.lessons.cur === p.prev) s.lessons.cur = p.lesson;
            if (st !== 'live' && s.lessons.cur === p.lesson) s.lessons.cur = p.prev;
        }
        return st !== 'gone';
    });
    if (JSON.stringify([s.picks, s.lessons.cur]) === before) return;
    await saveState();
    emit('picks:changed', {});
    emit('stats:changed', {});
}
