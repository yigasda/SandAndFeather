import { getState, saveState } from '../core/state.js';
import { ctx } from '../core/st.js';
import { on } from '../core/bus.js';
import { fillBond } from '../core/bond-state.js';
import { BOND_NAMES, addTie, bondMembers, decideCandidate, giveBondGiftNow, giftBusy, setAliases, sourceRef, sourceStatus, visibleMessage } from '../core/bond.js';
import { changedChunks, createScanJob, isScanning, rpMessages, runScan, scanPreview, scanReady, stopScan } from '../core/bond-scan.js';
import { plainText, sentences } from '../core/picks.js';
import { itemInfo } from '../core/bag.js';
import { itemArt } from './itemart.js';
import { feel } from '../packs/life/poses.js';
import { leadOf as leadNow, withOf as withNow } from '../core/heroes.js';
// 0.9.70: the one who got the gift turns shy for a moment (쑥스러움 ♥) on the map behind the window
const shyFor = (s, who) => { if (withNow(s) === who) feel('shy', { lead: false, ms: 2200 }); else if (leadNow(s) === who) feel('shy', { mate: false, ms: 2200 }); };

const art = new URL('../../data/art/ui/bond/', import.meta.url);
const redrawn = new URL('../../data/art/ui/bond/redrawn/', import.meta.url);
// only the icons the theme has no match for (the user's marked set); frames, cards, buttons and lines are the UI theme's
const REDRAWN = {section_book:'27-section-book',section_plant:'28-section-sprout',section_gift:'29-section-gift',section_branch:'30-section-branch',bond_heart:'31-heart',reward_gift_red:'34-reward-red',reward_gift_gold:'36-reward-chest',reward_gift_open:'35-reward-gold',reward_80:'35-reward-gold',gift_icon_bow:'64-gift-cream',activity_fishing_icon:'43-fishing',activity_cooking_icon:'44-cooking',activity_study_icon:'45-study',activity_explore_icon:'46-exploration',footer_feather:'47-feather',memory_book_icon:'48-memory-book'};
const node = (tag, cls = '', text = '') => { const e = document.createElement(tag); e.className = cls; e.textContent = text; return e; };
function img(name, cls = '') { const e = node('img', cls); e.src = new URL(`${REDRAWN[name] || name}.png`, REDRAWN[name] ? redrawn : art).href; e.alt = ''; e.decoding = 'async'; return e; }
function button(text, fn, cls = 'sf_btn sf_small') {
    const b = node('button', cls, text); b.type = 'button';
    b.addEventListener('click', async () => { if (b.disabled) return; b.disabled = true; try { await fn(); } catch (e) { window.toastr?.error?.(e.message, '인연과 유대'); } finally { b.disabled = false; b.refreshDisabled?.(); } });
    return b;
}
const row = (...children) => { const e = node('div', 'sf_bond_actions'); e.append(...children); return e; };
function section(title, icon, help = '') {
    const el = node('section', 'sf_bond_section'), h = node('header', 'sf_bond_section_head');
    h.append(img(icon), node('h3', '', title)); if (help) h.append(node('small', '', help)); el.append(h); return el;
}
function field(label, value = '', type = 'text') {
    const wrap = node('label', 'sf_bond_field', label), input = node(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') input.type = type;
    input.value = value; wrap.append(input); return { wrap, input };
}
function select(label, options, value) {
    const wrap = node('label', 'sf_bond_field', label), input = node('select');
    for (const [v, text] of options) { const o = node('option', '', text); o.value = v; input.append(o); }
    input.value = value; wrap.append(input); return { wrap, input };
}
function check(label, value) {
    const wrap = node('label', 'sf_bond_check'), input = node('input'); input.type = 'checkbox'; input.checked = value;
    wrap.append(input, document.createTextNode(label)); return { wrap, input };
}
const assertState = s => { if (getState() !== s) throw new Error('채팅이 바뀌었어. 현재 채팅에서 다시 열어 줘.'); };
function sourceView(ui, src) {
    const block = node('div', 'sf_bond_sources');
    for (const q of src) block.append(node('blockquote', '', `#${q.at} · ${q.quote}`), button('원문 보기', () => {
        const el = document.querySelector(`#chat .mes[mesid="${Number(q.at)}"]`);
        if (el) { ui.fold?.(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        else ui.toast('채팅에서 이전 메시지를 불러온 뒤 해당 번호를 확인해 줘.');
    }));
    return block;
}

export function bondCard(ui, initial = 'set', onBack = null) {
    const s = getState(); if (!s) return;
    const b = fillBond(s), box = node('div', 'sf_bond'), tabs = node('div', 'sf_bond_tabs');
    let who = ['set', 'horus'].includes(initial) ? initial : 'set', selected = '', closed = false, ready = false;
    tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', '인물 선택');
    const content = node('div', 'sf_bond_columns');
    box.append(tabs, content);
    const close = ui.showCard({ title: '인연과 유대', body: box, kind: 'bond', wide: true, buttons: [], onClose: () => { closed = true; off(); change(); onBack?.(); } });
    const wrap = box.closest('.sf_pop_wrap');
    // the theme's own title bar, plain words; the line under it opens the window
    box.prepend(node('p', 'sf_bond_subtitle', '함께한 시간이, 더 특별한 내일을 만듭니다.'));
    const off = on('bond:changed', () => { if (!closed && getState() === s) draw(); });
    const change = on('game:loaded', () => { if (getState() !== s) { close(); change(); } });
    const originalClose = wrap.querySelector('.sf_pop_x'); originalClose.addEventListener('click', change, { once: true });
    scanReady().then(v => { ready = v; if (!closed) draw(); });

    function draw() {
        tabs.replaceChildren(); content.replaceChildren();
        for (const id of ['set', 'horus']) {
            const tab = button('', () => { who = id; selected = ''; draw(); }, `sf_btn sf_bond_tab${who === id ? ' sf_on' : ''}`);
            tab.setAttribute('aria-pressed', String(who === id));
            const portrait = node('img', 'sf_bond_portrait'); portrait.src = new URL(id === 'set' ? '25-set-symbol.png' : '26-horus-symbol.png', redrawn).href; portrait.alt = '';
            tab.append(portrait, node('span', '', BOND_NAMES[id])); tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(who === id)); tab.dataset.bondWho = id; tabs.append(tab);
        }
        const left = node('div', 'sf_bond_left'), right = node('div', 'sf_bond_right');
        const records = section('인연의 기록', 'section_book', '함께한 순간들이, 소중한 이야기가 됩니다.');
        const recordsBox = node('div', 'sf_bond_records');
        const ties = b.ties.filter(t => t.who === who || t.who === 'both').slice().reverse();
        if (!ties.length) recordsBox.append(node('p', 'sf_list_row sf_bond_empty', 'RP에서 이어 온 인연을 기록해 보세요. 직접 고르거나, AI가 찾은 후보를 확인한 뒤 남길 수 있어요.'));
        for (const tie of ties) {
            const card = node('article', 'sf_list_row sf_bond_record');
            const text = node('div', 'sf_bond_record_text');
            text.append(node('small', '', [tie.when, tie.where].filter(Boolean).join(' · ') || '인연의 기록'), node('b', '', tie.summary || tie.title));
            const details = node('details'); details.append(node('summary', '', '원문 · 관리'), sourceView(ui, tie.src));
            const status = sourceStatus(tie);
            details.append(node('p', '', { live: '원문 연결됨', away: '다른 스와이프에 있음', changed: '원문이 바뀜' }[status]));
            if (status !== 'live') details.append(button('기록 남기기', async () => { assertState(s); tie.kept = true; await saveState(); ui.toast('기록을 남겼어. 원문 상태는 계속 표시해.'); }));
            details.append(button('기록 지우기', () => {
                ui.showCard({ title: '기록을 지울까?', text: tie.title, buttons: [{ label: '취소' }, { label: '지우기', onClick: () => { assertState(s); b.ties = b.ties.filter(t => t.id !== tie.id); saveState(); draw(); } }] });
            })); text.append(details); card.append(text); recordsBox.append(card);
        }
        records.append(recordsBox);
        const ai = button('AI로 인연 찾아오기', () => scanCard(ui, s)); ai.disabled = !ready;
        const sync = button('새로운 인연 동기화', () => scanCard(ui, s, 'sync')); sync.disabled = !ready;
        const management = node('details', 'sf_bond_management'); management.append(node('summary', '', '기록 추가 · AI 분석'));
        management.append(row(ai, sync, button('직접 기록하기', () => manualTieCard(ui, who, draw))));
        const count = b.cand.length + b.scan.pending.length;
        if (count) management.append(button(`후보 검토 ${count}개`, () => reviewCard(ui, s, draw)));
        if (b.options.notify && rpMessages().filter(m => m.at > b.scan.upTo).length >= 40) records.append(node('p', 'sf_bond_notice', '새 RP 메시지가 40개 이상 쌓였어. 새로운 인연을 찾아볼 수 있어.'));
        management.append(button('분석 설정 · 별칭', () => bondOptionsCard(ui, s))); records.append(management);
        left.append(records);

        const bond = section('오늘부터 쌓는 유대', 'section_plant', '작은 마음도, 언젠가 큰 인연이 됩니다.');
        const panel = node('div', 'sf_list_row sf_bond_progress_panel'), progress = node('div', 'sf_bond_progress');
        const track = node('div', 'sf_bond_track'), fill = node('div', 'sf_bond_fill'); fill.style.width = `${b[who].pts}%`;
        track.setAttribute('role', 'progressbar'); track.setAttribute('aria-label', `${BOND_NAMES[who]} 유대`); track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', '100'); track.setAttribute('aria-valuenow', String(b[who].pts));
        track.append(fill, node('b', '', `${b[who].pts} / 100`)); progress.append(img('bond_heart'), track);
        const stages = node('div', 'sf_bond_stages');
        for (const step of [20, 40, 60, 80, 100]) {
            const unlocked = b[who].pts >= step;
            const marker = button('', () => ui.showCard({ title: `유대 ${step}`, text: step === 20 ? unlocked ? '선물 취향을 확인할 수 있는 단계야. 아직 정해진 특별 선호는 없어. 모든 선물은 기본 +2야.' : '유대 20에서 선물 취향 단서를 확인할 수 있어.' : '이 단계의 공동 활동과 보상은 아직 정해지지 않았어. 점수 달성만 기록해 둬.' }), 'sf_bond_stage');
            marker.append(img(step === 100 ? 'reward_gift_gold' : step === 80 ? 'reward_80' : unlocked ? 'reward_gift_open' : 'reward_gift_red'), node('span', '', String(step)));
            marker.setAttribute('aria-label', `${step}단계 ${unlocked ? '달성' : '미달성'}`); stages.append(marker);
        }
        panel.append(progress, stages); bond.append(panel); right.append(bond);

        const gifts = section('선물하기', 'section_gift', '마음을 담은 선물은 유대를 깊게 합니다.');
        const giftrow = node('div', 'sf_bond_giftrow'); const slots = node('div', 'sf_bond_slots');
        const groups = new Map();
        for (const it of s.bag.items) if (itemInfo(it.id) && itemInfo(it.id).kind !== 'record') {
            if (!groups.has(it.id)) groups.set(it.id, []); groups.get(it.id).push(it);
        }
        if (!selected || !s.bag.items.some(it => it.uid === selected)) selected = groups.values().next().value?.[0]?.uid || '';
        for (const [id, items] of groups) {
            const slot = button('', () => { selected = items[0].uid; draw(); }, `sf_inventory_slot sf_bond_slot${items.some(it => it.uid === selected) ? ' sf_on' : ''}`);
            const icon = itemArt(id);
            slot.append(icon, node('span', 'sf_bond_count', String(items.length))); slot.title = itemInfo(id).ko; slot.setAttribute('aria-label', `${itemInfo(id).ko} ${items.length}개`); slot.setAttribute('aria-pressed', String(items.some(it => it.uid === selected)));
            const cell = node('span', 'sf_bond_cell'); cell.append(slot); slots.append(cell);
        }
        if (!groups.size) for (let n = 0; n < 4; n++) slots.append(node('div', 'sf_inventory_slot sf_empty_slot sf_bond_slot sf_empty'));
        const gift = button('선물하기', async () => {
            assertState(s);
            const uid = selected, recipient = who;
            let result;
            try { result = await giveBondGiftNow(s, recipient, uid); } finally { draw(); }
            if (result.confirm) {
                const controls = node('div'); let busy = false;
                let dismiss;
                controls.append(button('선물하기', async () => { if (busy) return; busy = true; try { assertState(s); const r = await giveBondGiftNow(s, recipient, uid, true); ui.toast(r.line); shyFor(s, recipient); dismiss(); } finally { busy = false; draw(); } }, 'sf_btn sf_primary'));
                dismiss = ui.showCard({ title: '오늘의 두 번째 선물', text: '오늘은 이미 유대를 쌓았어. 선물은 소모되지만 유대는 오르지 않아.', body: controls });
            } else { ui.toast(result.line); shyFor(s, recipient); draw(); }
        }, 'sf_btn sf_primary sf_bond_give');
        gift.prepend(img('gift_icon_bow'));
        gift.disabled = giftBusy(s) || !selected || !bondMembers(s).includes(who) || !!s.duat;
        giftrow.append(slots, gift); gifts.append(giftrow);
        if (!bondMembers(s).includes(who)) gifts.append(node('small', '', `소망과 ${BOND_NAMES[who]}가 같은 일행일 때 선물할 수 있어.`));
        right.append(gifts);

        const activities = section('함께하는 활동', 'section_branch', '함께하는 시간을 더 많이 만들어 보세요.');
        const activityGrid = node('div', 'sf_bond_activity_grid');
        for (const [id, title, sub, help] of [['fishing', '낚시', '강가에서 여유를', '소망과 함께 선착장에서 낚시를 마치면 하루 한 번 유대 +2.'], ['cooking', '요리', '맛있는 걸 함께', '소망과 함께 부엌에서 요리를 마치면 하루 한 번 유대 +2.'], ['study', '공부', '새로운 걸 배워요', '소망과 함께 필사실에서 공부를 마치면 하루 한 번 유대 +2.'], ['explore', '탐험', '낯선 곳을 함께', '소망과 함께 작은 모험을 완료하면 하루 한 번 유대 +3.']]) {
            const act = button('', () => ui.showCard({ title, text: help }), 'sf_list_row sf_bond_activity');
            act.append(img(`activity_${id}_icon`), node('b', '', title), node('span', 'sf_bond_arrow', '›'), node('small', '', sub)); activityGrid.append(act);
        }
        activities.append(activityGrid); right.append(activities);
        const footer = node('div', 'sf_bond_footer'); const note = node('div', 'sf_list_row sf_bond_motto');
        note.append(img('footer_feather'), node('span', '', '인연은 이어지고, 유대는 오늘부터 쌓입니다.'));
        const memory = button('', () => memoryCard(ui, s, who), 'sf_btn sf_primary sf_bond_memory'); memory.append(img('memory_book_icon'), node('span', '', '추억 수첩'), node('span', '', '›'));
        footer.append(note, memory); content.append(left, right, footer);
    }
    draw(); return close;
}

function memoryCard(ui, s, who) {
    const box = node('div', 'sf_bond_form');
    const logs = fillBond(s).log.filter(l => l.who === who).slice().reverse();
    box.append(node('p', '', '이 게임에서 함께한 사실만 기록돼. RP 인연 기록은 유대 점수를 바꾸지 않아.'));
    for (const l of logs) box.append(node('p', 'sf_list_row sf_bond_log', `${l.day + 1}일 · ${l.line}`));
    if (!logs.length) box.append(node('p', '', '아직 함께 쌓은 기록이 없어.'));
    ui.showCard({ title: `${BOND_NAMES[who]} · 추억 수첩`, body: box, wide: true });
}
export function manualTieCard(ui, initial = 'set', done = () => {}, picked = null) {
    const s = getState(), chat = structuredClone(ctx().chat || []), box = node('div', 'sf_bond_form'); if (!s) return;
    const who = select('인물', Object.entries(BOND_NAMES), initial), title = field('제목', '', 'text'), summary = field('내용', '', 'textarea');
    title.input.maxLength = 24; summary.input.maxLength = 160;
    const when = field('날짜'), where = field('장소'), source = node('div', 'sf_bond_sources');
    let choice = picked, page = 0;
    const messages = rpMessages(chat).reverse();
    const choose = (at, quote) => { choice = { at, quote }; title.input.value = quote.slice(0, 24); summary.input.value = quote.slice(0, 160); source.replaceChildren(node('blockquote', '', `#${at} · ${quote}`)); };
    if (picked) choose(picked.at, picked.quote);
    else {
        const choices = node('div', 'sf_bond_manual_messages');
        const drawMessages = () => {
            choices.replaceChildren();
            for (const m of messages.slice(page * 20, (page + 1) * 20)) {
                const d = node('details'); d.append(node('summary', '', `#${m.at} ${m.name} · ${m.text.slice(0, 45)}`));
                for (const sentence of sentences(m.text)) d.append(button(sentence, () => choose(m.at, sentence)));
                choices.append(d);
            }
            if (!messages.length) choices.append(node('p', '', '이 채팅에 고를 RP 메시지가 없어.'));
        };
        box.append(choices, row(button('이전', () => { page = Math.max(0, page - 1); drawMessages(); }), button('다음', () => { page = Math.min(Math.max(0, Math.ceil(messages.length / 20) - 1), page + 1); drawMessages(); })));
        drawMessages();
    }
    box.append(source, who.wrap, title.wrap, summary.wrap, when.wrap, where.wrap);
    const save = button('인연의 기록에 남기기', async () => {
        assertState(s);
        if (!choice) throw new Error('원문에서 문장을 먼저 골라 줘.');
        const now = ctx().chat || [];
        if (!visibleMessage(now[choice.at]) || now[choice.at]?.mes !== chat[choice.at]?.mes || !plainText(now[choice.at].mes).includes(choice.quote)) throw new Error('원문이 바뀌었어. 다시 골라 줘.');
        const added = addTie(s, { who: who.input.value, title: title.input.value, summary: summary.input.value, when: when.input.value, where: where.input.value, src: [sourceRef(now, choice.at, choice.quote)], origin: 'manual', certainty: 'clear', edited: true, kind: 'event' });
        await saveState(); ui.toast(added ? '인연의 기록에 남겼어. 유대 점수는 그대로야.' : '이미 기록한 원문이야.'); close(); done();
    }, 'sf_btn sf_primary'); box.append(save);
    const close = ui.showCard({ title: '직접 기록하기', body: box, wide: true });
}

export function bondOptionsCard(ui, s) {
    const b = fillBond(s), box = node('div', 'sf_bond_form');
    const precise = check('후보 정밀 확인(추가 AI 호출)', b.options.precise), notify = check('새 메시지 40개마다 동기화 알림만 표시', b.options.notify);
    const size = select('묶음 크기', [['12000', '작게 · 약 1만 2천 자'], ['24000', '보통 · 약 2만 4천 자'], ['48000', '크게 · 약 4만 8천 자']], String(b.options.chunkSize));
    const a = field('세트 별칭 · 쉼표로 구분', b.alias.set.join(', ')), h = field('호루스 별칭 · 쉼표로 구분', b.alias.horus.join(', '));
    box.append(precise.wrap, notify.wrap, size.wrap, a.wrap, h.wrap, node('p', '', '별칭에는 이름만 적어 줘. 그·그녀 같은 대명사는 사용할 수 없어. AI 연결은 기존 작은 모험의 연결을 사용해.'));
    box.append(button('저장', async () => { assertState(s); const draft = structuredClone(s); setAliases(draft, 'set', a.input.value.split(',')); setAliases(draft, 'horus', h.input.value.split(',')); b.alias = draft.bond.alias; b.options = { precise: precise.input.checked, notify: notify.input.checked, chunkSize: Number(size.input.value) }; await saveState(); close(); }, 'sf_btn sf_primary'));
    const close = ui.showCard({ title: '인연 분석 설정', body: box, wide: true });
}

export function reviewCard(ui, s, done = () => {}) {
    const b = fillBond(s), box = node('div', 'sf_bond_form');
    let picked = new Map();
    const draw = () => {
        box.replaceChildren(); picked = new Map();
        box.append(node('p', 'sf_bond_notice', `검토 목록 ${b.cand.length}개 · 이어서 볼 후보 ${b.scan.pending.length}개. 승인한 기록만 반영돼. 원문 근거가 있다는 표시는 해석의 정확성을 보장하지 않아.`));
        const bulk = button('체크한 후보 승인', async () => { assertState(s); try { for (const [id, form] of picked) if (form.checkbox.checked) decideCandidate(s, id, true, form.values()); } finally { await saveState(); draw(); done(); } });
        box.append(bulk);
        for (const c of b.cand.slice()) {
            const card = node('details', 'sf_bond_candidate'), head = node('summary');
            const checked = check(c.title, c.certainty === 'clear' && sourceStatus(c) === 'live');
            checked.input.addEventListener('click', e => e.stopPropagation());
            head.append(checked.wrap, node('small', '', `${BOND_NAMES[c.who]} · ${c.when || ''} ${c.where || ''}`));
            card.append(head, node('p', c.certainty === 'check' ? 'sf_bond_notice' : '', c.certainty === 'clear' ? '원문 근거 있음' : `확인 필요 · ${(c.reasons || []).join(' · ')}`));
            card.append(node('p', 'sf_bond_ai_summary', `AI 요약: ${c.summary}`), sourceView(ui, c.src));
            const title = field('제목', c.title), summary = field('요약', c.summary, 'textarea'), who = select('인물', Object.entries(BOND_NAMES), c.who), when = field('날짜', c.when), where = field('장소', c.where);
            title.input.maxLength = 24; summary.input.maxLength = 160;
            card.append(title.wrap, who.wrap, summary.wrap, when.wrap, where.wrap);
            const values = () => ({ title: title.input.value, summary: summary.input.value, who: who.input.value, when: when.input.value, where: where.input.value });
            picked.set(c.id, { checkbox: checked.input, values });
            card.append(row(button('승인', async () => { assertState(s); decideCandidate(s, c.id, true, values()); await saveState(); draw(); done(); }), button('제외', async () => { assertState(s); decideCandidate(s, c.id, false); await saveState(); draw(); done(); })));
            box.append(card);
        }
        if (!b.cand.length) box.append(node('p', '', '검토할 후보가 없어. 분석 화면에서 남은 묶음을 이어서 확인할 수 있어.'));
    };
    draw(); ui.showCard({ title: '인연 후보 검토', body: box, wide: true, kind: 'bond-review' });
}

export function scanCard(ui, s, initial = 'recent') {
    const b = fillBond(s), box = node('div', 'sf_bond_form');
    let closed = false;
    const scope = select('범위', [['recent', '최근 300개'], ['all', '전체'], ['range', '번호 범위'], ['sync', '새 메시지 동기화']], initial);
    const from = field('시작 메시지 번호', '0', 'number'), to = field('끝 메시지 번호', String((ctx().chat || []).length - 1), 'number');
    from.input.min = to.input.min = '0';
    const estimate = node('p', 'sf_bond_notice'), progress = node('p'); progress.setAttribute('role', 'status');
    const preview = () => scanPreview(s, { mode: scope.input.value, from: Number(from.input.value), to: Number(to.input.value) });
    const update = () => { const p = preview(); from.wrap.hidden = to.wrap.hidden = scope.input.value !== 'range'; estimate.textContent = `${p.messages}개 메시지 · ${p.chars.toLocaleString()}자 · 입력 약 ${p.tokens.toLocaleString()}토큰 + 맥락/정밀 확인 · 기본 호출 ${p.calls}회(형식 재시도 별도) · 약 ${Math.ceil(p.seconds / 60)}분 이상`; };
    [scope.input, from.input, to.input].forEach(e => e.addEventListener('change', update));
    box.append(node('p', '', '이 채팅의 RP 글이 설정한 AI로 보내져. 후보를 검토하고 승인하기 전에는 인연의 기록에 반영되지 않아.'), scope.wrap, from.wrap, to.wrap, estimate, progress);
    const actions = node('div', 'sf_bond_actions');
    const start = button('시작', async () => {
        assertState(s); if (!(await scanReady())) throw new Error('AI 연결을 먼저 설정해 줘.');
        const p = preview(); if (!p.chunks.length) throw new Error('분석할 메시지가 없어.');
        createScanJob(s, p); await saveState(); await execute();
    });
    const resume = button('이어서 하기', async () => { assertState(s); if (!(await scanReady())) throw new Error('AI 연결을 먼저 설정해 줘.'); await execute(); });
    const stop = button('중단', () => { stopScan(s); progress.textContent = '현재 요청을 마친 뒤 저장하고 멈춰. 다음 요청은 보내지 않아.'; });
    const cancel = button('남은 분석 취소', () => ui.showCard({ title: '남은 분석을 취소할까?', text: '이미 저장된 후보와 기록은 남아 있어.', buttons: [{ label: '닫기' }, { label: '취소하기', onClick: () => { assertState(s); if (isScanning(s)) return false; b.scan.job = null; saveState(); controls(); } }] }));
    const review = button('후보 검토', () => reviewCard(ui, s, controls));
    actions.append(start, resume, stop, review, cancel); box.append(actions);
    function controls() { const job = b.scan.job, running = isScanning(s), waiting = !!job && job.cursor < job.chunks.length;
        start.disabled = running || waiting; resume.disabled = running || !waiting || b.cand.length >= 60 || b.scan.pending.length > 0;
        stop.disabled = !running; cancel.disabled = running || !job; review.textContent = `후보 검토 ${b.cand.length + b.scan.pending.length}개`;
    }
    async function execute() {
        const promise = runScan(s, { onProgress: t => { if (!closed) { progress.textContent = t; controls(); } } }); controls();
        try { await promise; } finally { controls(); showChanges(); }
    }
    for (const b of [start, resume, stop, cancel, review]) b.refreshDisabled = controls;
    const changed = node('div'); box.append(changed);
    async function retry(messages, before = null, index = null) {
        assertState(s);
        const ats = messages.map(m => m.at);
        const p = scanPreview(s, { mode: 'range', from: Math.min(...ats), to: Math.max(...ats) });
        if (p.chunks.length !== 1 && Number.isInteger(index)) { ui.toast('메시지 길이가 바뀌었어. 번호 범위로 다시 분석해 줘.'); return; }
        createScanJob(s, p, ctx().chat, index); b.scan.job.carry = before; await saveState(); return execute();
    }
    function showChanges() {
        changed.replaceChildren();
        const changedIds = changedChunks(s);
        if (changedIds.length) changed.append(node('p', '', `바뀐 부분 ${changedIds.length}곳`));
        for (const i of [...new Set([...changedIds, ...b.scan.chunks.flatMap((c,i) => c.staleAfter ? [i] : [])])]) changed.append(button(`${i + 1}번째 묶음 다시 분석`, () => retry(b.scan.chunks[i].messages, b.scan.chunks[i - 1]?.carry || null, i)));
        const stale = b.scan.chunks.filter(c => c.staleAfter).length;
        if (stale) changed.append(node('p', '', `이후 ${stale}묶음 다시 확인 권장`));
        for (const e of b.scan.failures) changed.append(button(`실패 묶음 ${e.chunk + 1} 재시도 · ${e.message}`, () => retry(e.messages)));
    }
    update(); controls(); showChanges();
    if (b.scan.job) progress.textContent = `${b.scan.job.cursor}/${b.scan.job.chunks.length} 묶음 저장됨`;
    ui.showCard({ title: 'AI로 인연 찾아오기', body: box, wide: true, onClose: () => { closed = true; stopScan(s); } });
}
