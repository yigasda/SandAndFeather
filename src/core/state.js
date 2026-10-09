// The game, saved per chat in the chat's metadata. One object with a version, so later stages can move fields.

import { MODULE } from './settings.js';
import { ctx } from './st.js';

export const STATE_VERSION = 5;

export const freshState = () => ({
    v: STATE_VERSION,
    date: { year: 1, month: 0, day: 1 },          // month 0–11, or 12 for the five epagomenal days
    part: 'day',                                   // dawn | day | evening | night
    place: 'ombos',                                // places.json id
    room: '',                                      // the tracker's room words, as written
    weather: '',                                   // calendar.json weather id from the tracker, or ''
    pos: { map: 'ombos', x: null, y: null, dir: 'down' },
    sync: { at: -1, raw: '', ok: false, when: 0 }, // the last tracker read: message index, its text
    linked: false,                                 // a tracker was read or the date was set by hand at least once
    ledger: { lastDay: -1, acts: {} },             // ledger.js: the newest day already handled, once-a-day actions done
    bag: { items: [], deben: 60, seq: 0 },         // bag.js
    news: [],                                      // news.js: what the chat should hear about
    recent: { finds: [] },                         // what came up lately, so it does not come up again at once
    sun: { day: -1, left: 0 },                     // sun.js: today's 태양 기운
    stats: { wisdom: 0, strength: 0, faith: 0, xp: 0 }, // progress.js: 지혜 · 체력 · 신앙, 모험 경험치
    party: { with: '' },                           // the companion walking with her: '' | 'set' | 'horus'
    garden: { plots: [] },                         // garden.js: [{ seed, day }] or null per plot
    works: {},                                     // works.js: { canal: { start, ready, done } }
    flags: {},                                     // one-time things: secrets found, overlays opened, hints read
    journal: [],                                   // progress.js: what happened, each can be brought out in the chat
    daily: { day: -1, tasks: [] },                 // progress.js: today's two commissions
    adv: { cur: null, done: [], recent: [], memory: [], day: -1, wait: false }, // packs/adventure
    duat: null,                                    // packs/duat: a run in progress
    lessons: { cur: '', prog: {}, done: [] },      // progress.js: the learning goal and what was learned
    picks: [],                                     // picks.js: what was taken from chat messages, while they still say it
    started: Date.now(),
});

// Upgrading an older save, one version at a time: STEPS[n] turns a version n save into version n+1.
// A step only moves or renames what changed shape; new fields are filled from freshState() after the steps.
// A save from a newer version of the extension is left as it is (never cut down to this version's shape).
const STEPS = {
    1: () => {},  // 1 → 2: ledger, bag, news, recent are new; they are filled below
    // 2 → 3: 말 걸기 no longer moves the scene by itself. Talk lines made before that, still waiting, are dropped
    // so an ongoing scene is not pulled to the temple courtyard.
    2: s => { if (Array.isArray(s.news)) s.news = s.news.filter(n => n.key !== 'talk'); },
    // 3 → 4: the first playable version. Somang starts with some deben.
    3: s => { if (s.bag) s.bag.deben = Math.max(s.bag.deben || 0, 60); },
    4: () => {},  // 4 → 5: picks is new (게임에 반영하기); filled below
};

function fill(s) {
    const f = freshState();
    for (const [k, v] of Object.entries(f)) if (!Object.hasOwn(s, k)) s[k] = structuredClone(v);
    const objs = ['date', 'pos', 'sync', 'ledger', 'bag', 'recent', 'sun', 'stats', 'party', 'garden', 'works', 'flags', 'daily', 'adv', 'lessons'];
    for (const k of objs) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = structuredClone(f[k]);
    for (const k of ['news', 'journal', 'picks']) if (!Array.isArray(s[k])) s[k] = [];
    for (const k of objs) for (const [kk, v] of Object.entries(f[k])) if (!Object.hasOwn(s[k], kk)) s[k][kk] = structuredClone(v);
}

const checked = new WeakSet(); // each save object is looked over once, not on every frame
let warnedNewer = false;
function migrate(s) {
    if (checked.has(s)) return s;
    let v = Number(s.v) || 1;
    if (v > STATE_VERSION) {
        if (!warnedNewer) { warnedNewer = true; window.toastr?.warning?.('이 채팅의 게임은 더 새 버전 확장에서 저장됐어. 확장을 업데이트해 줘.', '모래와 깃털'); }
    } else {
        for (; v < STATE_VERSION; v++) STEPS[v]?.(s);
        s.v = STATE_VERSION;
    }
    fill(s);
    checked.add(s);
    return s;
}

// null when no chat is open
export function getState() {
    const md = ctx().chatMetadata;
    if (!md) return null;
    if (!md[MODULE] || typeof md[MODULE] !== 'object') md[MODULE] = freshState();
    return migrate(md[MODULE]);
}
export function resetState() {
    const md = ctx().chatMetadata;
    if (!md) return null;
    md[MODULE] = freshState();
    return md[MODULE];
}
export const saveState = async () => { await ctx().saveMetadata?.(); };
