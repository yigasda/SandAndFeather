// The three who can be played: Somang, Set and Horus. One walks in front (party.lead) and is the one moved on the
// map, fights in the Duat and grows; up to one other walks behind (party.with). Each keeps their own abilities,
// 모험 등급 and learning: the one in front has them in s.stats and s.lessons (so the rest of the game reads them as
// before), the others wait in s.chars until they step in front again.

import { freshState } from './state.js';

export const HEROES = ['somang', 'set', 'horus'];
export const HERO_NAME = { somang: '소망', set: '세트', horus: '호루스' };
// gods do not start from nothing: Set is strong, Horus sees and believes
const START = {
    somang: { wisdom: 0, strength: 0, faith: 0, xp: 0 },
    set: { wisdom: 1, strength: 3, faith: 1, xp: 0 },
    horus: { wisdom: 2, strength: 1, faith: 2, xp: 0 },
};

export const leadOf = s => (HEROES.includes(s?.party?.lead) ? s.party.lead : 'somang');
export const withOf = s => (HEROES.includes(s?.party?.with) && s.party.with !== leadOf(s) ? s.party.with : '');

export function statsOf(s, id) {
    if (id === leadOf(s)) return s.stats;
    return s.chars?.[id]?.stats || structuredClone(START[id]);
}

// put someone else in front: the one who led keeps their abilities aside and, if the new leader was walking with
// them, walks behind instead
export function setLead(s, id) {
    const cur = leadOf(s);
    if (!HEROES.includes(id) || id === cur) return;
    s.chars ||= {};
    s.chars[cur] = { stats: s.stats, lessons: s.lessons };
    const next = s.chars[id];
    s.stats = next?.stats || structuredClone(START[id]);
    s.lessons = next?.lessons || structuredClone(freshState().lessons);
    s.chars[id] = null;
    if (s.party.with === id) s.party.with = cur;
    s.party.lead = id;
}

export function setWith(s, id) { s.party.with = HEROES.includes(id) && id !== leadOf(s) ? id : ''; }
