// The game, saved per chat in the chat's metadata. One object with a version, so later stages can move fields.

import { MODULE } from './settings.js';
import { ctx } from './st.js';

export const STATE_VERSION = 2;

export const freshState = () => ({
    v: STATE_VERSION,
    date: { year: 1, month: 0, day: 1 },          // month 0–11, or 12 for the five epagomenal days
    part: 'day',                                   // dawn | day | evening | night
    place: 'ombos',                                // places.json id
    room: '',                                      // the tracker's room words, as written
    pos: { map: 'ombos', x: null, y: null, dir: 'down' },
    sync: { at: -1, raw: '', ok: false, when: 0 }, // the last tracker read: message index, its text
    linked: false,                                 // a tracker was read or the date was set by hand at least once
    ledger: { lastDay: -1, acts: {} },             // ledger.js: the newest day already handled, once-a-day actions done
    bag: { items: [], deben: 0, seq: 0 },          // bag.js
    news: [],                                      // news.js: what the chat should hear about
    recent: { finds: [] },                         // what came up lately, so it does not come up again at once
    started: Date.now(),
});

function migrate(s) {
    const f = freshState();
    for (const [k, v] of Object.entries(f)) if (!Object.hasOwn(s, k)) s[k] = structuredClone(v);
    for (const k of ['date', 'pos', 'sync', 'ledger', 'bag', 'recent']) if (!s[k] || typeof s[k] !== 'object') s[k] = structuredClone(f[k]);
    if (!Array.isArray(s.news)) s.news = [];
    for (const k of ['ledger', 'bag', 'recent']) for (const [kk, v] of Object.entries(f[k])) if (!Object.hasOwn(s[k], kk)) s[k][kk] = structuredClone(v);
    s.v = STATE_VERSION;
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
