// The extension's drawer in SillyTavern's Extensions tab, and its entry in the wand menu.
// 게임 열기 · 오늘(트래커가 읽은 것) · 손으로 맞추기 · 프롬프트(+미리보기) · 트래커 모양 · 보기 · 새 판

import { emit } from '../core/bus.js';
import { EPAG, dateLabel, partInfo, seasonName } from '../core/clock.js';
import { DATA } from '../core/data.js';
import { applyInjection, buildBlock } from '../core/inject.js';
import { DEFAULT_TRACKER_RE, VERSION, saveSettings, settings } from '../core/settings.js';
import { ctx, hasChat } from '../core/st.js';
import { getState, resetState, saveState } from '../core/state.js';
import { lastTracker, placeInfo, readPlace, setByHand, syncFromChat, trackerRegex } from '../core/tracker.js';
import { esc } from './popups.js';
import { applyTheme, openGame } from './window.js';

const $id = id => document.getElementById(id);

export function renderDrawer() {
    if ($id('sf_settings')) return;
    const st = settings();
    const months = [...DATA.calendar.months.map((m, i) => [i, `${m.en} · ${m.ko}`]), [EPAG, `${DATA.calendar.epagomenal.en} · ${DATA.calendar.epagomenal.ko}`]];
    const opt = (list, cur) => list.map(([v, l]) => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('');
    const html = `
    <div id="sf_settings" class="extension_settings">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b class="sf_title">☥ 모래와 깃털 <span class="sf_ver">v${VERSION}</span></b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <div class="sf_body">
            <button type="button" class="sf_btn sf_primary sf_wide" id="sf_open"><i class="fa-solid fa-ankh"></i> 게임 열기</button>

            <div class="sf_box">
              <div class="sf_box_head"><b>오늘</b><span class="sf_hint" id="sf_today_sync"></span></div>
              <div class="sf_today" id="sf_today"></div>
              <div class="sf_line_btns"><button type="button" class="sf_btn sf_small" id="sf_resync">챗에서 다시 읽기</button></div>
            </div>

            <details class="sf_box">
              <summary><b>손으로 맞추기</b><span class="sf_hint">트래커가 없거나 잘못 읽었을 때</span></summary>
              <div class="sf_grid">
                <label>해<input type="number" min="1" id="sf_h_year"></label>
                <label>달<select id="sf_h_month">${opt(months, 0)}</select></label>
                <label>날<input type="number" min="1" max="30" id="sf_h_day"></label>
                <label>시간대<select id="sf_h_part">${opt(DATA.calendar.parts.map(p => [p.id, p.ko]), 'day')}</select></label>
                <label>장소<select id="sf_h_place">${opt(DATA.places.places.map(p => [p.id, p.ko]), 'ombos')}</select></label>
              </div>
              <div class="sf_line_btns"><button type="button" class="sf_btn sf_small sf_primary" id="sf_h_apply">이대로 맞추기</button></div>
            </details>

            <div class="sf_box">
              <div class="sf_box_head"><b>프롬프트</b></div>
              <label class="sf_check"><input type="checkbox" id="sf_enabled"${st.enabled ? ' checked' : ''}><span>확장 켜기</span></label>
              <label class="sf_check"><input type="checkbox" id="sf_inject"${st.inject ? ' checked' : ''}><span>세계 블록 넣기</span></label>
              <div class="sf_grid">
                <label>위치<select id="sf_position">${opt([[1, '채팅 안'], [0, '메인 프롬프트 뒤'], [2, '메인 프롬프트 앞']], st.position)}</select></label>
                <label>깊이<input type="number" min="0" max="50" id="sf_depth" value="${Number(st.depth) || 0}"></label>
                <label>역할<select id="sf_role">${opt([[0, 'system'], [1, 'user'], [2, 'assistant']], st.role)}</select></label>
                <label>단어 상한<input type="number" min="20" max="400" id="sf_wordcap" value="${Number(st.wordCap) || 80}"></label>
              </div>
              <div class="sf_sub">지금 들어가는 블록</div>
              <pre class="sf_pre" id="sf_preview"></pre>
            </div>

            <details class="sf_box">
              <summary><b>트래커 모양</b><span class="sf_hint">정규식</span></summary>
              <div class="sf_sub">이름 붙은 묶음 time · date · place를 읽어. 비우면 기본값.</div>
              <textarea class="sf_ta" id="sf_tracker_re" rows="4" spellcheck="false" placeholder="${esc(DEFAULT_TRACKER_RE)}">${esc(st.trackerRe || '')}</textarea>
              <div class="sf_line_btns"><button type="button" class="sf_btn sf_small" id="sf_tracker_default">기본값</button></div>
              <div class="sf_sub" id="sf_tracker_test"></div>
            </details>

            <div class="sf_box">
              <div class="sf_box_head"><b>보기</b></div>
              <div class="sf_grid">
                <label>달 이름<select id="sf_monthstyle">${opt([['en', 'Hathyr'], ['ko', '하티르']], st.monthStyle)}</select></label>
                <label>테마<select id="sf_theme">${opt([['auto', '자동'], ['light', '밝게'], ['dark', '어둡게']], st.theme)}</select></label>
              </div>
            </div>

            <div class="sf_box">
              <div class="sf_box_head"><b>새 판</b><span class="sf_hint">이 채팅의 게임만 처음으로</span></div>
              <div class="sf_line_btns"><button type="button" class="sf_btn sf_small sf_danger" id="sf_reset">새 판 시작</button></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    const host = $id('extensions_settings2');
    if (!host) return;
    host.insertAdjacentHTML('beforeend', html);
    bind();
    applyTheme();
    refreshDrawer();
}

function bind() {
    const st = settings();
    const set = (k, v) => { st[k] = v; saveSettings(); applyInjection(); refreshDrawer(); };
    $id('sf_open').addEventListener('click', openGame);
    $id('sf_resync').addEventListener('click', async () => { await syncFromChat({ force: true }); applyInjection(); refreshDrawer(); });
    $id('sf_enabled').addEventListener('change', e => set('enabled', e.target.checked));
    $id('sf_inject').addEventListener('change', e => set('inject', e.target.checked));
    $id('sf_position').addEventListener('change', e => set('position', Number(e.target.value)));
    $id('sf_depth').addEventListener('change', e => set('depth', Math.max(0, Number(e.target.value) || 0)));
    $id('sf_role').addEventListener('change', e => set('role', Number(e.target.value)));
    $id('sf_wordcap').addEventListener('change', e => set('wordCap', Math.max(20, Number(e.target.value) || 80)));
    $id('sf_monthstyle').addEventListener('change', e => { set('monthStyle', e.target.value); emit('sync', {}); });
    $id('sf_theme').addEventListener('change', e => { set('theme', e.target.value); applyTheme(); });
    let reTimer;
    $id('sf_tracker_re').addEventListener('input', e => {
        clearTimeout(reTimer);
        reTimer = setTimeout(() => { st.trackerRe = e.target.value.trim(); saveSettings(); refreshDrawer(); }, 400);
    });
    $id('sf_tracker_default').addEventListener('click', () => { $id('sf_tracker_re').value = ''; st.trackerRe = ''; saveSettings(); refreshDrawer(); });
    $id('sf_h_apply').addEventListener('click', async () => {
        if (!hasChat()) return;
        await setByHand({
            year: Number($id('sf_h_year').value) || undefined,
            month: Number($id('sf_h_month').value),
            day: Number($id('sf_h_day').value) || undefined,
            part: $id('sf_h_part').value,
            place: $id('sf_h_place').value,
        });
        applyInjection();
        refreshDrawer();
    });
    $id('sf_reset').addEventListener('click', async () => {
        if (!hasChat()) return;
        const c = ctx();
        const ok = c.callGenericPopup
            ? (await c.callGenericPopup('이 채팅의 게임을 처음부터 다시 시작할까? 위치, 날짜가 지워지고 챗의 트래커에서 다시 읽어.', c.POPUP_TYPE.CONFIRM, '', { okButton: '새 판', cancelButton: '취소' })) === (c.POPUP_RESULT?.AFFIRMATIVE ?? 1)
            : window.confirm('이 채팅의 게임을 처음부터 다시 시작할까?');
        if (!ok) return;
        resetState();
        await saveState();
        await syncFromChat({ force: true });
        emit('state', { reset: true });
        applyInjection();
        refreshDrawer();
    });
}

// everything in the drawer that follows the chat
export function refreshDrawer() {
    if (!$id('sf_settings')) return;
    const s = hasChat() ? getState() : null;
    const today = $id('sf_today'), sync = $id('sf_today_sync');
    if (!s) {
        today.innerHTML = '<span class="sf_hint">채팅을 열면 보여.</span>';
        sync.textContent = '';
        $id('sf_preview').textContent = '';
    } else {
        const pl = placeInfo(s.place);
        today.innerHTML = `<b>${esc(dateLabel(s.date))}</b> · ${esc(partInfo(s.part).ko)} · ${esc(seasonName(s.date.month))}<br>${esc(pl?.ko || s.place)}${s.room ? ` → ${esc(s.room)}` : ''}`;
        sync.textContent = s.sync.ok ? '● 챗과 맞춰짐' : '○ 트래커 없음';
        sync.classList.toggle('sf_ok', !!s.sync.ok);
        $id('sf_preview').textContent = !settings().enabled || !settings().inject ? '꺼져 있어' : s.linked ? buildBlock(s) : '이 채팅엔 트래커가 없어서 안 넣어. 손으로 맞추면 들어가.';
        $id('sf_h_year').value = s.date.year;
        $id('sf_h_month').value = s.date.month;
        $id('sf_h_day').value = s.date.day;
        $id('sf_h_part').value = s.part;
        $id('sf_h_place').value = s.place;
    }
    // what the tracker pattern reads from the newest message that has one
    const test = $id('sf_tracker_test');
    if (!trackerRegex()) { test.innerHTML = '<span class="sf_bad">정규식이 깨졌어.</span>'; return; }
    const found = hasChat() ? lastTracker() : null;
    if (!found) { test.textContent = '챗에서 트래커를 못 찾았어.'; return; }
    const { tr } = found;
    const pl = readPlace(tr.place);
    test.innerHTML = `#${found.i} 메시지에서 읽음 · 시간 <b>${esc(tr.time || '없음')}</b> · 날짜 <b>${esc(tr.date || '없음')}</b> · 장소 <b>${esc(placeInfo(pl.place)?.ko || '모름')}</b>${pl.room ? ` → ${esc(pl.room)}` : ''}`;
}

// the wand menu: one "모래와 깃털" entry that opens the game. SillyTavern builds #extensionsMenu late, so wait for it.
export function addWandMenu() {
    const put = () => {
        const menu = $id('extensionsMenu');
        if (!menu) return false;
        if ($id('sf_wand_container')) return true;
        const box = document.createElement('div');
        box.id = 'sf_wand_container';
        box.className = 'extension_container';
        box.innerHTML = `<div id="sf_wand_open" class="list-group-item flex-container flexGap5 interactable" tabindex="0" title="모래와 깃털">
            <div class="fa-solid fa-ankh extensionsMenuExtensionButton"></div><span>모래와 깃털</span></div>`;
        const it = box.firstElementChild;
        it.addEventListener('click', openGame);
        it.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGame(); } });
        menu.append(box);
        return true;
    };
    if (put()) return;
    const mo = new MutationObserver(() => { if (put()) mo.disconnect(); });
    mo.observe(document.body, { childList: true });
}
