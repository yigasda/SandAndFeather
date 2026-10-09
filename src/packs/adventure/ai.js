// The AI writes one small adventure in the same form the engine runs, inside limits the game sets:
// only these map points, these guides, these items, these step kinds, rewards under a cap. Its answer is
// checked (form, every name exists, can be finished, rewards capped) before it is used; anything off and the
// game assembles one at random instead. One call per new adventure; nothing is called while playing it.
// The call goes through NarrativeArchive's own connection (its draft model, or its AI 기능 model).

import { itemInfo } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { rank } from '../../core/progress.js';
import { settings } from '../../core/settings.js';
import { ctx } from '../../core/st.js';
import { getMap } from '../../world/map.js';
import { resolve } from './engine.js';

async function archive() {
    const folder = settings().archiveFolder || 'NarrativeArchive';
    try { return await import(new URL(`../../../../${folder}/src/ai.js`, import.meta.url).href); } catch { return null; }
}
export async function aiLabel() {
    const m = await archive();
    if (!m) return '아카이브 확장을 못 찾았어';
    const src = settings().advAI;
    if (src === 'off') return '꺼짐';
    if (src === 'draft' && m.draftReady?.()) return `아카이브 초안 모델 · ${m.drLabel?.() || ''}`;
    return `아카이브 AI 기능 모델 · ${m.aiLabel?.() || ''}`;
}
async function ask(system, prompt) {
    const m = await archive();
    if (!m) throw new Error('NarrativeArchive 확장을 못 찾았어. 확장 폴더 이름을 설정에서 확인해 줘');
    if (settings().advAI === 'draft' && m.draftReady?.()) return m.askDraft(prompt, { system, maxTokens: 4000, effort: 'low', force: true });
    return m.askAI(prompt, { system, maxTokens: 4000 });
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
    const recent = (s.adv.recent || []).map(r => `${r.tpl}${r.guide ? `/${r.guide}` : ''}${r.item ? `/${r.item}` : ''}`).join(', ') || 'none';
    const prompt = `Write the next small adventure. Every name you use must come from these lists.

MAP POINTS (use the id): ${map.anchors.map(a => `${a.id} = ${a.ko}`).join('; ')}
GUIDES (for follow): ${Object.entries(A.guides || {}).map(([id, g]) => `${id} = ${g.ko}`).join('; ')}
ITEMS (for find): ${items.map(id => `${id} = ${itemInfo(id).ko}`).join('; ')}
SOMEONE TO BRING THINGS TO: merchant (시장 상인)
RECENT ADVENTURES, do not repeat their shape, guide or item: ${recent}
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
    return { title: str(d.title, 20) || '작은 모험', steps,
        end: { xp: num(e.xp, 4, 10), deben: num(e.deben, 0, 20), journal: str(e.journal, 120), en: str(e.en, 260), say: str(e.say, 80), marks: (Array.isArray(e.marks) ? e.marks : []).map(m => str(m, 12)).filter(m => m.length >= 2).slice(0, 3) } };
}
