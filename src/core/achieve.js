// 업적·칭호 (data/records.json achievements): each is reached from what the game already keeps (tally from facts.js,
// the 도감, 낚시 기록, 탐사율, flags), never a count of its own, so the same action cannot count twice. A reward is
// taken once with 받기; a reached one's title can be worn by one of the three, one title each. Titles are only shown
// (under the name in 일행); they change no ability, nothing about who they are in the chat, and are not sent to it.

import { itemInfo } from './bag.js';
import { DATA } from './data.js';
import { bestCm } from './fishing.js';
import { regionPct } from './explore.js';
import { today } from './ledger.js';
import { addXP } from './progress.js';
import { HEROES } from './heroes.js';

export const ACHIEVEMENTS = () => DATA.records?.achievements || [];
export const achievement = id => ACHIEVEMENTS().find(a => a.id === id) || null;

// how far it is: { n, goal } (goal 1 for yes/no ones)
export function progressOf(s, a) {
    const need = a.need || {};
    if (need.tally) return { n: s.tally?.[need.tally] || 0, goal: need.n || 1 };
    if (need.codex) {
        const box = s.codex?.[need.codex] || {};
        const ids = Object.keys(box).filter(id => !need.itemKind || itemInfo(id)?.kind === need.itemKind);
        return { n: ids.length, goal: need.n || 1 };
    }
    if (need.bestCm) return { n: bestCm(s), goal: need.bestCm };
    if (need.explore) return { n: regionPct(s, need.explore), goal: 100 };
    if (need.flag) return { n: s.flags?.[need.flag] ? 1 : 0, goal: 1 };
    return { n: 0, goal: 1 };
}
export const reached = (s, a) => { const p = progressOf(s, a); return p.n >= p.goal; };
export const hasReward = a => !!(a.reward?.deben || a.reward?.xp);
export const claimable = (s, a) => reached(s, a) && hasReward(a) && !Object.hasOwn(s.achieve.claimed, a.id);

// take its reward once → the reward, or null
export function claim(s, id) {
    const a = achievement(id);
    if (!a || !claimable(s, a)) return null;
    s.achieve.claimed[a.id] = today(s);
    if (a.reward.deben) s.bag.deben += a.reward.deben;
    if (a.reward.xp) addXP(s, a.reward.xp);
    return a.reward;
}

// titles: one worn by each of the three; only a reached achievement's title
export const titleOf = (s, who) => { const a = achievement(s?.achieve?.worn?.[who]); return a && reached(s, a) ? a.title : ''; };
export function wear(s, who, id) {
    if (!HEROES.includes(who)) return false;
    if (!id) { delete s.achieve.worn[who]; return true; }
    const a = achievement(id);
    if (!a?.title || !reached(s, a)) return false;
    s.achieve.worn[who] = id;
    return true;
}
