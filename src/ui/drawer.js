// The extension's drawer in SillyTavern's Extensions tab, and its entry in the wand menu.
// 게임 열기 · 오늘(트래커가 읽은 것) · 손으로 맞추기 · 프롬프트(+미리보기) · 트래커 모양 · 보기 · 새 판

import { emit, on } from '../core/bus.js';
import { EPAG, dateLabel, partInfo, seasonName } from '../core/clock.js';
import { DATA } from '../core/data.js';
import { applyInjection, buildBlock } from '../core/inject.js';
import { DEFAULT_TRACKER_RE, VERSION, saveSettings, settings } from '../core/settings.js';
import { ctx, hasChat } from '../core/st.js';
import { getState, resetState, saveState } from '../core/state.js';
import { lastTracker, placeInfo, readPlace, setByHand, syncFromChat, trackerRegex, weatherOf } from '../core/tracker.js';
import { dropNews, newsStatus, pending, prepared } from '../core/news.js';
import { connSettings, listModels, parseServiceAccount, vxTokens } from '../core/ai.js';
import { aiLabel, testConn } from '../packs/adventure/ai.js';
import { ensureAdventure } from '../packs/adventure/gen.js';
import { sunLeft } from '../core/sun.js';
import { FEATHER } from './icon.js';
import { today as gameDay } from '../core/ledger.js';
import { esc } from './popups.js';
import { applyTheme, openGame } from './window.js';

const $id = id => document.getElementById(id);

export function renderDrawer(problems = []) {
    if ($id('sf_settings')) return;
    const st = settings();
    const months = [...DATA.calendar.months.map((m, i) => [i, `${m.en} · ${m.ko}`]), [EPAG, `${DATA.calendar.epagomenal.en} · ${DATA.calendar.epagomenal.ko}`]];
    const opt = (list, cur) => list.map(([v, l]) => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('');
    const html = `
    <div id="sf_settings" class="extension_settings">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b class="sf_title">${FEATHER} 모래와 깃털 <span class="sf_ver">v${VERSION}</span></b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <div class="sf_body">
            <button type="button" class="sf_btn sf_primary sf_wide" id="sf_open">${FEATHER} 게임 열기</button>
            ${problems.length ? `<div class="sf_box sf_warn"><b>데이터 확인</b>${problems.map(p => `<div class="sf_sub">${esc(p)}</div>`).join('')}</div>` : ''}

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
              <div class="sf_news" id="sf_news"></div>
            </div>

            <details class="sf_box">
              <summary><b>트래커 모양</b><span class="sf_hint">정규식</span></summary>
              <div class="sf_sub">트래커 줄을 찾는 정규식이야. 찾은 줄 안에서 시간, 날짜, 장소, 날씨는 칸 순서와 상관없이 따로 찾아. 비우면 기본값.</div>
              <textarea class="sf_ta" id="sf_tracker_re" rows="4" spellcheck="false" placeholder="${esc(DEFAULT_TRACKER_RE)}">${esc(st.trackerRe || '')}</textarea>
              <div class="sf_line_btns"><button type="button" class="sf_btn sf_small" id="sf_tracker_default">기본값</button></div>
              <div class="sf_sub" id="sf_tracker_test"></div>
            </details>

            <div class="sf_box">
              <div class="sf_box_head"><b>작은 모험</b><span class="sf_hint" id="sf_adv_ai_label"></span></div>
              <div class="sf_grid">
                <label>새 모험 쓰는 쪽<select id="sf_conn_mode">${opt([['custom', '커스텀 API'], ['vertex', 'Vertex AI'], ['archive-draft', '아카이브 초안 모델'], ['archive-ai', '아카이브 AI 기능 모델'], ['off', '끄기 · 무작위만']], connSettings().mode)}</select></label>
                <label>하루 모험 수<input type="number" min="1" max="10" id="sf_adv_per_day" value="${Number(st.advPerDay) || 3}"></label>
              </div>
              <div class="sf_conn" data-for="custom">
                <label class="sf_field">주소<input type="text" id="sf_conn_url" placeholder="https://…/v1" value="${esc(connSettings().url)}" spellcheck="false" autocomplete="off"></label>
                <label class="sf_field">키<input type="password" id="sf_conn_key" placeholder="sk-…" value="${esc(connSettings().key)}" autocomplete="off"></label>
                <div class="sf_grid">
                  <label>형식<select id="sf_conn_fmt">${opt([['', '주소 보고 자동'], ['openai', 'OpenAI 호환'], ['anthropic', 'Anthropic']], connSettings().fmt)}</select></label>
                  <label>모델<input type="text" id="sf_conn_model" list="sf_conn_models" value="${esc(connSettings().model)}" spellcheck="false" autocomplete="off"><datalist id="sf_conn_models"></datalist></label>
                </div>
                <div class="sf_line_btns"><button type="button" class="sf_btn sf_small" id="sf_conn_list">모델 불러오기</button></div>
              </div>
              <div class="sf_conn" data-for="vertex">
                <label class="sf_field">서비스 계정 JSON<textarea class="sf_ta" id="sf_conn_vxjson" rows="3" spellcheck="false" placeholder="${connSettings().vxJson ? '저장됨 · 바꾸려면 새 JSON을 붙여넣기' : '키 파일 내용을 통째로 붙여넣기'}"></textarea></label>
                <div class="sf_sub" id="sf_conn_vxinfo"></div>
                <div class="sf_grid">
                  <label>위치<input type="text" id="sf_conn_vxloc" value="${esc(connSettings().vxLocation)}" spellcheck="false"></label>
                  <label>모델<input type="text" id="sf_conn_vxmodel" value="${esc(connSettings().vxModel)}" spellcheck="false"></label>
                </div>
              </div>
              <div class="sf_conn" data-for="archive-draft archive-ai">
                <label class="sf_field">아카이브 폴더<input type="text" id="sf_archive_folder" value="${esc(st.archiveFolder || 'NarrativeArchive')}"></label>
              </div>
              <div class="sf_conn" data-for="custom vertex archive-draft archive-ai">
                <div class="sf_grid"><label>답 최대 길이<input type="number" min="1024" step="1024" id="sf_conn_max" value="${Number(connSettings().max) || 6000}"></label></div>
                <div class="sf_line_btns"><button type="button" class="sf_btn sf_small" id="sf_conn_test">연결 시험</button></div>
                <div class="sf_sub" id="sf_conn_result"></div>
              </div>
              <div class="sf_sub" id="sf_adv_status"></div>
              <div class="sf_line_btns"><button type="button" class="sf_btn sf_small" id="sf_adv_new">지금 새 모험 만들기</button></div>
              <details><summary class="sf_sub">개발용: 지금 모험 전체 보기 · 스포일러</summary><pre class="sf_pre" id="sf_adv_dump"></pre></details>
            </div>

            <div class="sf_box">
              <div class="sf_box_head"><b>보기</b></div>
              <div class="sf_grid">
                <label>달 이름<select id="sf_monthstyle">${opt([['en', 'Hathyr'], ['ko', '하티르']], st.monthStyle)}</select></label>
                <label>하루 태양 기운<input type="number" min="4" max="30" id="sf_sunmax" value="${Number(st.sunMax) || 12}"></label>
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
    for (const ev of ['adventure:changed', 'clock:synced', 'game:loaded']) on(ev, () => refreshDrawer());
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
    $id('sf_monthstyle').addEventListener('change', e => { set('monthStyle', e.target.value); emit('view:changed', {}); });
    $id('sf_theme').addEventListener('change', e => { set('theme', e.target.value); applyTheme(); });
    $id('sf_sunmax').addEventListener('change', async e => {
        st.sunMax = Math.max(4, Math.min(30, Number(e.target.value) || 12));
        e.target.value = st.sunMax;
        saveSettings();
        if (hasChat()) { sunLeft(); await saveState(); emit('sun:changed', {}); }
    });
    // the adventure model's connection
    const conn = (k, v) => { connSettings()[k] = v; saveSettings(); refreshDrawer(); };
    $id('sf_conn_mode').addEventListener('change', e => conn('mode', e.target.value));
    $id('sf_adv_per_day').addEventListener('change', e => { st.advPerDay = Math.max(1, Math.min(10, Number(e.target.value) || 3)); e.target.value = st.advPerDay; saveSettings(); });
    $id('sf_conn_url').addEventListener('change', e => conn('url', e.target.value.trim()));
    $id('sf_conn_key').addEventListener('change', e => conn('key', e.target.value.trim()));
    $id('sf_conn_fmt').addEventListener('change', e => conn('fmt', e.target.value));
    $id('sf_conn_model').addEventListener('change', e => conn('model', e.target.value.trim()));
    $id('sf_conn_max').addEventListener('change', e => conn('max', Math.max(1024, Number(e.target.value) || 6000)));
    $id('sf_conn_vxloc').addEventListener('change', e => conn('vxLocation', e.target.value.trim() || 'global'));
    $id('sf_conn_vxmodel').addEventListener('change', e => conn('vxModel', e.target.value.trim()));
    $id('sf_conn_vxjson').addEventListener('change', e => { const v = e.target.value.trim(); if (!v) return; connSettings().vxJson = v; vxTokens.clear(); e.target.value = ''; e.target.placeholder = '저장됨 · 바꾸려면 새 JSON을 붙여넣기'; saveSettings(); refreshDrawer(); });
    $id('sf_conn_list').addEventListener('click', async e => {
        const b = e.currentTarget, out = $id('sf_conn_result');
        b.disabled = true; out.textContent = '모델 목록을 불러오는 중…';
        try {
            const ids = await listModels(connSettings());
            $id('sf_conn_models').innerHTML = ids.map(id => `<option value="${esc(id)}"></option>`).join('');
            out.textContent = `모델 ${ids.length}개. 모델 칸을 누르면 골라져.`;
            if (!connSettings().model) { connSettings().model = ids[0]; $id('sf_conn_model').value = ids[0]; saveSettings(); refreshDrawer(); }
        } catch (err) { out.textContent = String(err.message || err); }
        b.disabled = false;
    });
    $id('sf_conn_test').addEventListener('click', async e => {
        const b = e.currentTarget, out = $id('sf_conn_result');
        b.disabled = true; out.textContent = '물어보는 중…';
        try { const r = await testConn(); out.textContent = `됐어: ${String(r).slice(0, 80)}`; }
        catch (err) { out.textContent = `안 됐어: ${String(err.message || err).slice(0, 200)}`; }
        b.disabled = false;
    });
    $id('sf_archive_folder').addEventListener('change', e => { set('archiveFolder', e.target.value.trim() || 'NarrativeArchive'); });
    $id('sf_adv_new').addEventListener('click', async () => {
        const s = hasChat() ? getState() : null;
        if (!s) return;
        if (s.adv.cur && !window.confirm('지금 모험을 버리고 새로 만들까?')) return;
        s.adv.cur = null; await saveState();
        $id('sf_adv_status').textContent = '만드는 중…';
        await ensureAdventure({ force: true });
        refreshDrawer();
    });
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
        emit('game:loaded', { reset: true });
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
    // the game's happenings still waiting for the chat, each can be taken out
    const news = $id('sf_news');
    const list = s ? [...prepared(s), ...pending(s)] : [];
    news.innerHTML = list.length ? `<div class="sf_sub">챗에 넘길 일</div>${list.map(n => `<div class="sf_news_row"><span>${esc(n.ko || n.text)}</span><span class="sf_hint">${n.prepared ? '입력칸에 준비됨. 보내면 들어가' : newsStatus(n) === 'live' ? '방금 답장에 넣음' : '다음 답장에'}</span><button type="button" class="sf_icon_btn sf_news_x" data-id="${esc(n.id)}" title="빼기"><i class="fa-solid fa-xmark"></i></button></div>`).join('')}` : '';
    news.querySelectorAll('.sf_news_x').forEach(b => b.addEventListener('click', () => dropNews(b.dataset.id)));

    // the small adventure: where it came from, the last AI error, the whole thing only on request
    if (s) {
        const c = s.adv.cur;
        const per = Math.max(1, Number(settings().advPerDay) || 3), used = s.adv.count?.day === gameDay(s) ? s.adv.count.n : 0;
        $id('sf_adv_status').textContent = `오늘 모험 ${used}/${per} · ` + (c ? `진행 중: ${c.title} · ${({ ai: 'AI가 씀', random: '무작위 조립', hand: '손으로 만든 것', seed: '예전 선택에서 이어짐' })[c.source] || ''}${s.adv.lastError ? ` · 지난 AI 실패: ${s.adv.lastError}` : ''}` : (s.adv.lastError ? `지난 AI 실패: ${s.adv.lastError}` : used >= per ? '오늘 모험은 다 했어. 다음 날 또 생겨' : '진행 중인 모험 없음'));
        $id('sf_adv_dump').textContent = c ? JSON.stringify(c, null, 1) : '';
    }
    aiLabel().then(t => { const el = $id('sf_adv_ai_label'); if (el) el.textContent = t; });
    // only the fields of the chosen connection
    const mode = connSettings().mode;
    document.querySelectorAll('#sf_settings .sf_conn').forEach(el => { el.hidden = !el.dataset.for.split(' ').includes(mode); });
    const vx = $id('sf_conn_vxinfo');
    if (vx) { const j = connSettings().vxJson; try { vx.textContent = j ? (sa => `프로젝트 ${sa.project_id} · ${sa.client_email}`)(parseServiceAccount(j)) : ''; } catch (e) { vx.textContent = e.message; } }

    // what the tracker pattern reads from the newest message that has one
    const test = $id('sf_tracker_test');
    if (!trackerRegex()) { test.innerHTML = '<span class="sf_bad">정규식이 깨졌어.</span>'; return; }
    const found = hasChat() ? lastTracker() : null;
    if (!found) { test.textContent = '챗에서 트래커를 못 찾았어.'; return; }
    const { tr } = found;
    const pl = readPlace(tr.place);
    const w = weatherOf(tr.weather);
    test.innerHTML = `#${found.i} 메시지에서 읽음 · 시간 <b>${esc(tr.time || '없음')}</b> · 날짜 <b>${esc(tr.date || '없음')}</b> · 장소 <b>${esc(placeInfo(pl.place)?.ko || '모름')}</b>${pl.room ? ` → ${esc(pl.room)}` : ''} · 날씨 <b>${esc(w?.ko || '없음')}</b><br>없음으로 나온 칸은 이전 값을 그대로 둬.`;
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
            <div class="extensionsMenuExtensionButton sf_wand_icon">${FEATHER}</div><span>모래와 깃털</span></div>`;
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
