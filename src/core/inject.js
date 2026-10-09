// What goes into the prompt: a short English block, never numbers or stage names (SPEC 2-2, 2-3).
//   [Egypt — Hathyr 9, Akhet, afternoon. Ombos, the west wing.]
//   …lines that packs add, newest and most important first, cut at the word cap
// Packs add lines with addLines(fn): fn(state) → [{ text, weight }] (higher weight stays when the block is cut).

import { dateLabelEn, partInfo, seasonOf } from './clock.js';
import { DATA } from './data.js';
import { PROMPT_KEY, settings } from './settings.js';
import { ctx, hasChat } from './st.js';
import { getState } from './state.js';
import { placeInfo, roomEn } from './tracker.js';

const sources = new Set();
export const addLines = fn => { sources.add(fn); return () => sources.delete(fn); };

export function headLine(s) {
    const season = DATA.calendar.seasons[seasonOf(s.date.month)].en;
    const where = placeInfo(s.place)?.en || 'Egypt';
    const room = s.room ? roomEn(s.room) : '';
    return `[Egypt — ${dateLabelEn(s.date)}, ${season}, ${partInfo(s.part).en}. ${where}${room ? `, ${room}` : ''}.]`;
}

const words = t => (String(t).match(/\S+/g) || []).length;
export function buildBlock(s = getState()) {
    if (!s) return '';
    const head = headLine(s);
    const lines = [];
    for (const fn of sources) {
        try { for (const l of fn(s) || []) if (l?.text) lines.push(l); } catch (e) { console.error('[SandAndFeather] inject line', e); }
    }
    lines.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    const cap = Math.max(20, Number(settings().wordCap) || 80);
    const kept = [];
    let n = words(head);
    for (const l of lines) { const w = words(l.text); if (n + w > cap) continue; kept.push(l.text); n += w; }
    return [head, ...kept].join('\n');
}

export function applyInjection() {
    const c = ctx(), st = settings();
    const s = hasChat() ? getState() : null;
    // a chat that never had a tracker (and was never set by hand) is not an Egypt chat: nothing goes in
    if (!s || !st.enabled || !st.inject || !s.linked) { c.setExtensionPrompt?.(PROMPT_KEY, '', 1, 1); return ''; }
    const text = buildBlock(s);
    const pos = [0, 1, 2].includes(Number(st.position)) ? Number(st.position) : 1;
    c.setExtensionPrompt?.(PROMPT_KEY, text, pos, Math.max(0, Number(st.depth) || 0), false, Number(st.role) || 0);
    return text;
}
