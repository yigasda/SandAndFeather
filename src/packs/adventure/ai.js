// The AI writes one small adventure in the same form the engine runs, inside limits the game sets:
// only these map points, these guides, these items, these step kinds, rewards under a cap. Its answer is
// checked (form, every name exists, can be finished, rewards capped) before it is used; anything off and the
// game assembles one at random instead. One call per new adventure; nothing is called while playing it.
// The call goes through NarrativeArchive's own connection (its draft model, or its AI 기능 model).

import { itemInfo } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { lessonList, lessonState, rank } from '../../core/progress.js';
import { partInfo, seasonOf } from '../../core/clock.js';
import { placeInfo, roomEn } from '../../core/tracker.js';
import { settings } from '../../core/settings.js';
import { callConn, connSettings, ownReady } from '../../core/ai.js';
import { livePicks, usePick } from '../../core/picks.js';
import { ctx } from '../../core/st.js';
import { getMap } from '../../world/map.js';
import { resolve } from './engine.js';

async function archive() {
    const folder = settings().archiveFolder || 'NarrativeArchive';
    try { return await import(new URL(`../../../../${folder}/src/ai.js`, import.meta.url).href); } catch { return null; }
}
// which model writes: the game's own connection (custom URL or Vertex), NarrativeArchive's, or none
export const aiOn = () => connSettings().mode !== 'off';
export async function aiLabel() {
    const t = connSettings();
    if (t.mode === 'off') return '꺼짐 · 무작위만';
    if (t.mode === 'custom') return ownReady(t) ? `커스텀 · ${t.model}` : '커스텀 · 주소와 모델을 넣어 줘';
    if (t.mode === 'vertex') return ownReady(t) ? `Vertex · ${t.vxModel}` : 'Vertex · JSON과 모델을 넣어 줘';
    const m = await archive();
    if (!m) return '아카이브 확장을 못 찾았어';
    if (t.mode === 'archive-draft' && m.draftReady?.()) return `아카이브 초안 모델 · ${m.drLabel?.() || ''}`;
    return `아카이브 AI 기능 모델 · ${m.aiLabel?.() || ''}`;
}
// a tiny request to see the connection answers
export const testConn = () => ask('Reply with one short Korean greeting and nothing else.', '인사해 줘.');

async function ask(system, prompt) {
    const t = connSettings();
    const max = Math.max(1024, Number(t.max) || 6000);
    if (t.mode === 'custom' || t.mode === 'vertex') {
        if (!ownReady(t)) throw new Error(t.mode === 'custom' ? '커스텀 API 주소와 모델을 넣어 줘' : 'Vertex JSON과 모델을 넣어 줘');
        return callConn(t, system, prompt, max, 'low');
    }
    const m = await archive();
    if (!m) throw new Error('NarrativeArchive 확장을 못 찾았어. 아카이브 폴더 이름을 확인해 줘');
    if (t.mode === 'archive-draft' && m.draftReady?.()) return m.askDraft(prompt, { system, maxTokens: max, effort: 'low', force: true });
    return m.askAI(prompt, { system, maxTokens: max });
}

// the last few chat messages, trackers and markup taken out, for mood only
function chatMood() {
    const chat = ctx().chat || [];
    return chat.filter(m => !m.is_system).slice(-4).map(m => `${m.is_user ? 'Somang' : m.name}: ${String(m.mes || '').replace(/<tracker>[\s\S]*?(<\/tracker>|$)/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 300)}`).join('\n');
}

const SYSTEM = `You design one small adventure for a cozy walking game set in an ancient Egyptian village, Ombos.
The player is Somang. The gods Set and Horus live nearby, but the game never decides what they say, feel or do.
Reply with one JSON object and nothing else: no code fence, no comments.`;

export async function askAdventure(s) {
    const map = getMap('ombos');
    const A = DATA.adventures || {};
    const items = [...(A.finds || []), ...(rank(s) >= 2 ? A.rewards?.relics || [] : []), 'map_scrap', 'wet_papyrus'].filter(id => itemInfo(id));
    // the last few, newest last: what each was about, its shape, and how she ended it
    const recent = (s.adv.recent || []).map(r => [r.title ? `"${r.title}"` : r.tpl, r.how, r.guide, r.item,
        r.chose ? `she chose "${r.chose}"${r.skill ? ' using what she learned' : r.kept === true ? ', kept the find' : r.kept === false ? ', let the find go' : ''}` : '',
        r.with ? `with ${r.with === 'set' ? 'Set' : 'Horus'}` : ''].filter(Boolean).join(' / ')).join('; ') || 'none';
    // a seed Somang took from the chat herself (게임에 반영하기) leads; it is used up once this adventure is written
    const idea = livePicks(s, 'idea').at(-1);
    // otherwise how closely this one may touch the story: mostly mood only, so a dinner scene does not breed fish adventures
    const dice = Math.random();
    const link = idea ? `SOMANG ASKED FOR THIS: build the adventure around it, as something she comes across later in the village. Do not end or change the current scene, do not use names other than Set and Horus, nothing romantic.\n${idea.text}`
        : dice < 0.7 ? 'MOOD: match the season, hour and feeling of the story, but do not reuse its objects or events.'
        : dice < 0.85 ? 'DIRECT: you may start from one object or place the story mentioned lately, as something Somang comes across later in the village; do not end or change the current scene.'
            : 'APART: make it unrelated to the story; just a small village happening.';
    const lesson = lessonState(s);
    const learned = (s.lessons.done || []).map(id => lessonList().find(l => l.id === id)?.skill).filter(Boolean);
    const place = `${placeInfo(s.place)?.en || 'Ombos'}${s.room ? `, ${roomEn(s.room) || s.room}` : ''}, ${partInfo(s.part).en}, ${DATA.calendar.seasons[seasonOf(s.date.month)]?.en || ''}`;
    const chosen = (s.adv.memory || []).map(m => m.tag).join(', ') || 'none';
    const prompt = `Write the next small adventure. Every name you use must come from these lists.

MAP POINTS (use the id): ${map.anchors.map(a => `${a.id} = ${a.ko}`).join('; ')}
GUIDES (for follow): ${Object.entries(A.guides || {}).map(([id, g]) => `${id} = ${g.ko}`).join('; ')}
ITEMS (for find): ${items.map(id => `${id} = ${itemInfo(id).ko}`).join('; ')}
SOMEONE TO BRING THINGS TO: merchant (시장 상인)
RECENT ADVENTURES, newest last; do not repeat their goal, shape, guide or item, and offer a different kind of choice than she made lately: ${recent}
WHERE THE STORY IS NOW (do not move or end it): ${place}
SOMANG IS LEARNING: ${lesson ? `${lesson.L.ko}, now ${lesson.st.ko}` : 'nothing in particular'}${learned.length ? `; she can already ${learned.join(', ')}` : ''}. A step or choice that uses this is welcome.
EARLIER CHOICES STILL OPEN: ${chosen}
HOW CLOSE TO THE STORY: ${link}
WHAT IS GOING ON IN THE STORY LATELY (mood and objects only; do not copy events, do not use names other than Set and Horus, nothing romantic):
${chatMood() || '(nothing)'}

FORM:
{"title": "Korean, under 14 letters",
 "steps": [ 2 to 5 of these, in a sensible order, ending with "find" or "choice":
   {"kind":"follow","guide":"<guide id>","path":["<point>","<point>","<point>"],"text":"Korean hint, one sentence"},
   {"kind":"touch","marks":[{"at":"<point>","label":"Korean, short","text":"Korean, what she sees"}, 2 or 3 marks],"text":"Korean hint"},
   {"kind":"find","at":"<point>","item":"<item id>","label":"Korean, short","text":"Korean, how it is found"},
   {"kind":"bring","to":"merchant","need":"found" or "food","text":"Korean hint","reply":"Korean, what happens"},
   {"kind":"choice","text":"Korean question; {물건} stands for the found item","a":{"label":"Korean, under 12 letters","keep":true or false,"deben":0-20,"xp":2-6,"journal":"Korean, what she did, one sentence"},"b":{same}}
 ],
 "end": {"xp": 4-10, "deben": 0-20,
   "journal": "Korean, one sentence of what happened",
   "en": "English, one plain sentence of what Somang did or found, for the story's narrator; no feelings, nothing said by the gods",
   "say": "Korean sentence Somang could write in the chat to bring it up, like '시장 뒤에서 찾은 도기 조각 이야기를 꺼낸다.'",
   "marks": ["a Korean noun from say, 2+ letters"]}}
Rules: a "choice" needs a "find" or a "bring" before it. A "bring" with need "found" needs a "find" before it. Use different points for different steps. Keep every Korean sentence short and concrete.`;
    const raw = await ask(SYSTEM, prompt);
    const def = check(parse(raw), map);
    const r = resolve({ ...def, id: `a${Date.now().toString(36)}`, tpl: 'ai', guide: def.steps.find(x => x.kind === 'follow')?.guide || '', item: def.steps.find(x => x.kind === 'find')?.item || '' });
    if (!r) throw new Error('AI 모험이 지도에 맞지 않아');
    if (idea) usePick(s, idea.id);
    return r;
}

function parse(raw) {
    const t = String(raw || '');
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('AI 답에 JSON이 없어');
    return JSON.parse(t.slice(a, b + 1));
}

const str = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const num = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
// form, names, order and caps; throws on anything that would leave the adventure unfinishable
export function check(d, map) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.steps)) throw new Error('AI 모험 형식이 아니야');
    const A = DATA.adventures || {};
    const pt = id => { if (!map.anchor(id)) throw new Error(`없는 지점 ${id}`); return id; };
    let found = false, carried = false;
    const steps = d.steps.slice(0, 5).map(st => {
        switch (st.kind) {
            case 'follow': if (!A.guides?.[st.guide]) throw new Error(`없는 길잡이 ${st.guide}`); return { kind: 'follow', guide: st.guide, path: (st.path || []).slice(0, 4).map(pt), text: str(st.text, 80) };
            case 'touch': return { kind: 'touch', marks: (st.marks || []).slice(0, 3).map(m => ({ at: pt(m.at), label: str(m.label, 16), text: str(m.text, 120) })), text: str(st.text, 80) };
            case 'find': if (!itemInfo(st.item)) throw new Error(`없는 물건 ${st.item}`); found = true; return { kind: 'find', at: pt(st.at), item: st.item, label: str(st.label, 16), text: str(st.text, 120) };
            case 'bring': if (st.need === 'found' && !found) throw new Error('찾기 전에 가져가기'); carried = true; return { kind: 'bring', to: 'merchant', need: st.need === 'found' ? 'found' : 'food', text: str(st.text, 80), reply: str(st.reply, 120) };
            case 'choice': {
                if (!found && !carried) throw new Error('갈림길 앞에 찾기가 없어');
                const o = x => ({ label: str(x?.label, 14) || '그렇게 한다', keep: !!x?.keep, deben: num(x?.deben, 0, 20), xp: num(x?.xp, 2, 6), journal: str(x?.journal, 100) });
                return { kind: 'choice', text: str(st.text, 100), a: o(st.a), b: o(st.b) };
            }
            default: throw new Error(`모르는 단계 ${st.kind}`);
        }
    });
    if (steps.length < 2) throw new Error('단계가 너무 적어');
    if (steps.some(x => x.kind === 'follow' && x.path.length < 2) || steps.some(x => x.kind === 'touch' && !x.marks.length)) throw new Error('빈 단계');
    const e = d.end || {};
    if (!str(e.en, 300)) throw new Error('end.en이 없어');
    if (/\b(Set|Horus)\b[^.]*\b(says?|said|tells?|told|promis|asks?|feels?|decides?)/i.test(e.en)) throw new Error('신의 말이나 마음을 정한 문장');
    return { title: str(d.title, 20) || '작은 모험', steps,
        end: { xp: num(e.xp, 4, 10), deben: num(e.deben, 0, 20), journal: str(e.journal, 120), en: str(e.en, 260), say: str(e.say, 80), marks: (Array.isArray(e.marks) ? e.marks : []).map(m => str(m, 12)).filter(m => m.length >= 2).slice(0, 3) } };
}
