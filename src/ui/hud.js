// What sits on top of the map: the date card, the minimap, the pad and buttons, the tab bar,
// and the little bubble over whatever she can talk to. Only DOM here; window.js decides what happens.

import { dateLabel, partInfo, seasonName, seasonAbout } from '../core/clock.js';
import { DATA } from '../core/data.js';
import { placeInfo } from '../core/tracker.js';
import { rankInfo } from '../core/progress.js';
import { sunLeft, sunMax } from '../core/sun.js';
import { hint } from '../packs/adventure/engine.js';
import { esc } from './popups.js';

export const TABS = [
    { id: 'world', label: '세계', icon: 'fa-house' },
    { id: 'somang', label: '소망', icon: 'fa-user' },
    { id: 'party', label: '파티', icon: 'fa-users' },
    { id: 'quests', label: '임무', icon: 'fa-scroll' },
    { id: 'map', label: '지도', icon: 'fa-map' },
];

export function buildHud(root) {
    root.innerHTML = `
      <canvas class="sf_view"></canvas>
      <div class="sf_top">
        <button type="button" class="sf_card sf_date_card" title="오늘">
          <b class="sf_date"></b>
          <span class="sf_date_sub"><span class="sf_season"></span><i class="sf_dot"></i><span class="sf_sync"></span></span>
        </button>
        <div class="sf_side_btns">
          <button type="button" class="sf_icon_btn sf_collapse" title="접기"><i class="fa-solid fa-chevron-down"></i></button>
          <button type="button" class="sf_icon_btn sf_close" title="닫기"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <button type="button" class="sf_card sf_mini" title="지도">
          <canvas class="sf_mini_cv" width="240" height="160"></canvas>
          <span class="sf_mini_name"></span>
        </button>
      </div>
      <div class="sf_chips">
        <span class="sf_chip sf_chip_sun" title="태양 기운"></span>
        <span class="sf_chip sf_chip_deben" title="데벤"></span>
        <span class="sf_chip sf_chip_rank" title="모험 등급"><b></b><i><s></s></i></span>
      </div>
      <button type="button" class="sf_hint_pill" hidden></button>
      <button type="button" class="sf_icon_btn sf_appearance" title="화면 설정" aria-label="화면 설정"><i class="fa-solid fa-gear" aria-hidden="true"></i></button>
      <div class="sf_bubble" hidden></div>
      <div class="sf_controls">
        <div class="sf_pad"><span class="sf_pad_arrows" aria-hidden="true"><i>▴</i><i>◂</i><i>▸</i><i>▾</i></span><div class="sf_knob"></div></div>
        <div class="sf_actions">
          <button type="button" class="sf_btn sf_climb" hidden></button>
          <button type="button" class="sf_round sf_bag"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i><span>가방</span></button>
          <button type="button" class="sf_round sf_talk"><i class="fa-solid fa-comment-dots" aria-hidden="true"></i><span>말 걸기</span></button>
        </div>
      </div>
      <nav class="sf_tabs">
        ${TABS.map(t => `<button type="button" class="sf_tab${t.id === 'world' ? ' sf_on' : ''}" data-tab="${t.id}"><i class="fa-solid ${t.icon}"></i><span>${t.label}</span></button>`).join('')}
      </nav>`;
    const q = s => root.querySelector(s);
    return {
        root, view: q('.sf_view'), dateCard: q('.sf_date_card'), date: q('.sf_date'), season: q('.sf_season'), dot: q('.sf_dot'), sync: q('.sf_sync'),
        collapse: q('.sf_collapse'), close: q('.sf_close'), appearance: q('.sf_appearance'), mini: q('.sf_mini'), miniCv: q('.sf_mini_cv'), miniName: q('.sf_mini_name'),
        bubble: q('.sf_bubble'), sun: q('.sf_chip_sun'), deben: q('.sf_chip_deben'), rank: q('.sf_chip_rank b'), rankBar: q('.sf_chip_rank s'), hint: q('.sf_hint_pill'), pad: q('.sf_pad'), knob: q('.sf_knob'), bag: q('.sf_bag'), talk: q('.sf_talk'), climb: q('.sf_climb'), tabs: q('.sf_tabs'),
    };
}

// "Hathyr 9 · 낮"
export const shortDate = s => `${dateLabel(s.date)} · ${partInfo(s.part).ko}`;

export function updateHud(h, s) {
    if (!s) return;
    h.date.textContent = shortDate(s);
    h.season.textContent = `${seasonName(s.date.month)} · ${seasonAbout(s.date.month)} · `;
    h.dot.classList.toggle('sf_ok', !!s.sync.ok);
    h.sync.textContent = s.sync.ok ? '챗과 맞춰짐' : '트래커 없음';
    h.sync.classList.toggle('sf_ok', !!s.sync.ok);
    const map = DATA.maps[s.pos?.map || 'ombos'];
    h.miniName.textContent = map?.name || placeInfo(s.place)?.ko || '';
    h.sun.innerHTML = `<i class="fa-solid fa-sun"></i> ${sunLeft(s)}/${sunMax()}`;
    h.deben.innerHTML = `<i class="fa-solid fa-coins"></i> ${s.bag.deben}`;
    const r = rankInfo(s.stats.xp);
    h.rank.textContent = `모험 등급 ${r.rank}`;
    h.rankBar.style.width = `${Math.round(r.frac * 100)}%`;
    const tip = hint(s);
    h.hint.hidden = !tip;
    h.hint.textContent = tip ? `✦ ${tip}` : '';
}

// the bubble over the nearest place or person, in CSS pixels from the renderer's camera
export function placeBubble(h, r, near) {
    if (!near) { if (!h.bubble.hidden) h.bubble.hidden = true; h.talk.classList.remove('sf_ready'); return; }
    const ts = 16 * r.zoom, dpr = r.dpr || 1;
    // over a person's head: the approved standing pictures are taller than the tile they stand on
    const head = near.kind === 'npc' ? 6 + Math.max(0, (r.motion?.get(near.look)?.height ?? 16) - 16) * r.zoom / dpr : 18;
    const x = ((near.x + 0.5) * ts - r.cam.x) / dpr, y = (near.y * ts - r.cam.y) / dpr - head;
    const text = `${near.kind === 'npc' ? '말 걸기' : '살펴보기'} · ${near.label}`;
    if (h.bubble.textContent !== text) h.bubble.textContent = text;
    h.bubble.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
    h.bubble.hidden = false;
    h.talk.classList.add('sf_ready');
}

export function setTab(h, id) {
    h.tabs.querySelectorAll('.sf_tab').forEach(b => b.classList.toggle('sf_on', b.dataset.tab === id));
}

// the 오늘 card's inside: what the chat said and what the game took from it
export function todayBody(s) {
    const el = document.createElement('div');
    el.className = 'sf_rows';
    const pl = placeInfo(s.place);
    const rows = [
        ['날짜', `${dateLabel(s.date)}${s.date.year ? ` · ${s.date.year}년` : ''}`],
        ['계절', `${seasonName(s.date.month)} · ${seasonAbout(s.date.month)}`],
        ['시간대', partInfo(s.part).ko],
        ['장소', `${pl?.ko || s.place}${s.room ? ` → ${s.room}` : ''}`],
        ...(s.weather ? [['날씨', (DATA.calendar.weather || []).find(w => w.id === s.weather)?.ko || '']] : []),
    ];
    el.innerHTML = rows.map(([k, v]) => `<div class="sf_row"><span>${k}</span><b>${esc(v)}</b></div>`).join('')
        + (s.sync.ok
            ? `<div class="sf_note sf_ok_note">${s.sync.at >= 0 ? `#${s.sync.at} 메시지의 트래커와 맞춤` : ''}<code>${esc(s.sync.raw)}</code></div>`
            : '<div class="sf_note">챗에서 트래커를 못 찾았어. 확장 설정에서 손으로 맞추거나 트래커 모양을 바꿀 수 있어.</div>');
    return el;
}
