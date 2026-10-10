// Settings shared by every chat (extension_settings). The game itself is saved per chat (state.js).

import { ctx } from './st.js';

export const VERSION = '0.9.1';
export const MODULE = 'sand_feather';
export const PROMPT_KEY = 'sand_feather_world';
export const UI_THEMES = [
    {id:'classic',label:'1 · 클래식 크림',about:'또렷한 이중 테두리와 클래식 메뉴',colors:['#f6e7c9','#483123','#cf7938']},
    {id:'walnut',label:'2 · 월넛 골드',about:'짙은 갈색 창과 금빛 장식',colors:['#35271e','#c4a36a','#f3e4c7']},
    {id:'journal',label:'3 · 사막 여행수첩',about:'종이 수첩과 목록형 가방',colors:['#f8edcf','#ab7950','#c87537']},
    {id:'temple',label:'4 · 청동 신전',about:'모래색 창과 차분한 청록색',colors:['#f1e2c3','#517c70','#b28b51']},
    {id:'cozy',label:'5 · 포근한 픽셀 동화',about:'따뜻한 크림색과 작은 꽃 장식',colors:['#f8ebd3','#423023','#bf602e']},
];

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
    uiTheme: 'cozy',    // shared artwork; only window styling/layout changes
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
    if (!UI_THEMES.some(t => t.id === s.uiTheme)) s.uiTheme = 'cozy';
    return s;
}
export const saveSettings = () => ctx().saveSettingsDebounced?.();
export const trackerPattern = () => { const v = String(settings().trackerRe || '').trim(); return v || DEFAULT_TRACKER_RE; };
