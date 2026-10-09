// 게임에 반영하기: a feather button on every chat message. Somang picks one sentence of it and takes it into
// the game as a learning goal, a seed for the next AI adventure, or a memo. Nothing more: no reward, no stat,
// and it goes away again with the reply it came from (picks.js).
// The button goes into SillyTavern's message template (#message_template .extraMesButtons), so every message
// rendered from now on carries it, and into the messages already on screen.

import { on } from '../core/bus.js';
import { DATA } from '../core/data.js';
import { josa } from '../core/ko.js';
import { addPick, sentences } from '../core/picks.js';
import { lessonList } from '../core/progress.js';
import { settings } from '../core/settings.js';
import { ctx, hasChat } from '../core/st.js';
import { getState } from '../core/state.js';
import { aiOn } from '../packs/adventure/ai.js';
import { list, para, stack } from './kit.js';
import { showCard } from './popups.js';
import { applyTheme } from './window.js';

const CLS = 'sf_mes_pick';
const BTN = `<div title="게임에 반영하기" class="mes_button ${CLS} fa-solid fa-feather" tabindex="0"></div>`;

export function addMesButtons() {
    const put = box => { if (!box.querySelector(`.${CLS}`)) box.insertAdjacentHTML('afterbegin', BTN); };
    document.querySelectorAll('#message_template .extraMesButtons, #chat .mes .extraMesButtons').forEach(put);
}
// the button shows only in a chat the game follows (one that ever had a tracker)
export function markChat() {
    const s = hasChat() ? getState() : null;
    document.body.classList.toggle('sf_linked', !!(s?.linked && settings().enabled));
    addMesButtons();
}

on('clock:synced', () => markChat());

const say = (msg, kind = 'success') => window.toastr?.[kind]?.(msg, '모래와 깃털');

let root = null;
function host() {
    if (!root) {
        root = document.createElement('div');
        root.id = 'sf_pick';
        document.body.append(root);
    }
    applyTheme();
    return root;
}
const card = o => showCard(host(), o);

function openPick(at) {
    const s = getState(), m = (ctx().chat || [])[at];
    if (!s?.linked || !m) return;
    const lines = sentences(m.mes);
    if (!lines.length) return say('이 메시지엔 고를 문장이 없어.', 'info');
    let snip = '';
    const box = document.createElement('div');
    box.className = 'sf_pick_lines';
    const edit = document.createElement('textarea');
    edit.className = 'sf_pick_edit';
    edit.rows = 2;
    edit.hidden = true;
    for (const t of lines) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sf_pick_line';
        b.textContent = t;
        b.addEventListener('click', () => {
            box.querySelectorAll('.sf_pick_line').forEach(x => x.classList.toggle('sf_on', x === b));
            snip = t;
            edit.value = t;
            edit.hidden = false;
            pop.querySelectorAll('.sf_pop_btns .sf_btn').forEach(x => { x.disabled = false; });
        });
        box.append(b);
    }
    const text = () => edit.value.replace(/\s+/g, ' ').trim().slice(0, 200) || snip;
    const take = async kind => {
        await addPick(getState(), { kind, text: text(), snip, at });
        say(kind === 'idea' ? (aiOn() ? '다음 AI 모험의 소재로 받았어.' : '모험 소재로 받았어. AI 모험이 켜져 있을 때 쓰여.') : '임무 탭에 적어 뒀어.');
    };
    card({ tag: '게임에 반영하기', title: '문장 하나를 골라', wide: true,
        body: stack(box, edit, para('받은 건 하기로 한 일일 뿐이야. 이 답장이 재생성으로 사라지면 같이 사라져.')),
        buttons: [
            { label: '배움 목표', disabled: true, onClick: () => { lessonPick(at, snip, text()); } },
            { label: '모험 소재', disabled: true, onClick: () => { take('idea'); } },
            { label: '메모', primary: true, disabled: true, onClick: () => { take('note'); } },
        ] });
    const pop = root.lastElementChild;
}

// which learning goal: the ones whose words the sentence has come first
function lessonPick(at, snip, text) {
    const s = getState();
    const score = L => (L.words || []).filter(w => text.includes(w)).length;
    const left = lessonList().filter(L => !s.lessons.done.includes(L.id)).map(L => ({ L, n: score(L) })).sort((a, b) => b.n - a.n);
    if (!left.length) return say('배움을 다 익혔어.', 'info');
    const close = card({ tag: '배움 목표', title: '무엇을 익힐까', text,
        body: list(left.map(({ L, n }, k) => ({ icon: s.lessons.cur === L.id ? '▶️' : '📜', name: L.ko,
            sub: `${k === 0 && n ? '추천 · ' : ''}${L.about}`,
            buttons: [{ label: '이걸로', primary: k === 0 && n > 0, onClick: async () => {
                await addPick(getState(), { kind: 'lesson', text, snip, at, lesson: L.id });
                close();
                say(`배움 목표를 ${josa(L.ko, '로')} 정했어.`);
            } }] }))),
        buttons: [{ label: '취소' }] });
}

document.addEventListener('click', e => {
    const b = e.target.closest?.(`.${CLS}`);
    if (!b || !DATA.lessons) return;
    e.stopPropagation();
    const at = Number(b.closest('.mes')?.getAttribute('mesid'));
    if (Number.isInteger(at)) openPick(at);
});
