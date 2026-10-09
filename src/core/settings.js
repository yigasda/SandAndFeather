// Settings shared by every chat (extension_settings). The game itself is saved per chat (state.js).

import { ctx } from './st.js';

export const VERSION = '0.8.11';
export const MODULE = 'sand_feather';
export const PROMPT_KEY = 'sand_feather_world';

// finds the tracker; what is inside is read field by field in tracker.js, in any order:
// "<tracker> 🌇 05:48 오후 | 하티르 여드렛날, 2년 | 옴보스 → 서쪽 별채 | ☀️ 맑음 </tracker>"
// (a closing tag that never came: the rest of that line)
export const DEFAULT_TRACKER_RE = String.raw`<tracker>([\s\S]*?)<\/tracker>|<tracker>([^\n]*)`;

const DEFAULTS = {
    enabled: true,      // the extension at all
    inject: true,       // the short world block in the prompt
    position: 1,        // 1 in chat at a depth, 0 after the main prompt, 2 before it
    depth: 2,
    role: 0,            // 0 system, 1 user, 2 assistant
    wordCap: 80,
    trackerRe: '',      // '' = DEFAULT_TRACKER_RE
    monthStyle: 'en',   // how month names show in the game: 'en' Hathyr, 'ko' 하티르
    theme: 'auto',      // 'auto' follows NarrativeArchive / SillyTavern, or 'light' / 'dark'
    sunMax: 12,         // 태양 기운 a game day holds
    advAI: 'draft',     // (0.4) carried into conn.mode once; conn holds the adventure model's connection (core/ai.js)
    advPerDay: 3,       // small adventures a game day can bring; the next starts when one ends
    archiveFolder: 'NarrativeArchive', // NarrativeArchive's folder under third-party, for its connection
};

export function settings() {
    const es = ctx().extensionSettings;
    if (!es[MODULE] || typeof es[MODULE] !== 'object') es[MODULE] = {};
    const s = es[MODULE];
    for (const [k, v] of Object.entries(DEFAULTS)) if (!Object.hasOwn(s, k)) s[k] = v;
    return s;
}
export const saveSettings = () => ctx().saveSettingsDebounced?.();
export const trackerPattern = () => { const v = String(settings().trackerRe || '').trim(); return v || DEFAULT_TRACKER_RE; };
