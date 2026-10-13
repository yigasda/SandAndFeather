import { DATA } from './data.js';
import { emit } from './bus.js';
import { canDo, markDone, today } from './ledger.js';
import { record } from './facts.js';
import { itemInfo, takeUid } from './bag.js';
import { journal } from './progress.js';
import { fillBond } from './bond-state.js';
import { plainText } from './picks.js';
import { ctx } from './st.js';
import { getState, saveState } from './state.js';

export const BOND_NAMES = { set: '세트', horus: '호루스', both: '세트·호루스' };
export const normalizeQuote = s => String(s || '').normalize('NFKC').replace(/[\p{P}\p{Z}\s]/gu, '').toLowerCase();
export function hashText(text) {
    let h = 2166136261;
    for (const ch of String(text)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16);
}
export const visibleMessage = m => !!m && !m.is_system && !m.is_hidden && !m.extra?.isHidden && !m.extra?.is_hidden;
export const messageHash = m => hashText(`${m?.send_date ?? ''}|${plainText(m?.mes)}`);
export const sourceRef = (chat, at, quote) => ({ at, sendDate: String(chat[at]?.send_date ?? ''), quote, hash: messageHash(chat[at]) });
export const sameSource = (a, b) => a.src?.some(x => b.src?.some(y => x.at === y.at && x.sendDate === y.sendDate && normalizeQuote(x.quote) === normalizeQuote(y.quote)));
export const fingerprint = e => hashText((e.src || []).map(x => `${x.at}|${x.sendDate}|${normalizeQuote(x.quote)}`).sort().join('\n'));
export const bondMembers = s => {
    const members = [s.party?.lead || 'somang', s.party?.with || ''];
    return members.includes('somang') ? ['set', 'horus'].filter(id => members.includes(id)) : [];
};

function remember(s, who, kind, line, pts = 0, itemId = '') {
    const b = fillBond(s);
    b.log.push({ id: `b${++b.seq}`, who, kind, line, pts, itemId, day: today(s) });
    if (b.log.length > 200) b.log.splice(0, b.log.length - 200);
    journal(s, { ko: line, say: line.split(' · ')[0], en: kind === 'gift' ? `Somang gave ${itemInfo(itemId)?.en || 'an item'} to ${who === 'set' ? 'Set' : 'Horus'}.` : line.split(' · ')[0], marks: [BOND_NAMES[who]], kind: 'bond' }); // prepared only when the user chooses 꺼내기
    record(s, `bond:${kind}`, { itemId, source: who });
    emit('bond:changed', {});
}
function raise(s, who, n) {
    const b = fillBond(s)[who], before = b.pts;
    b.pts = Math.min(100, Math.max(0, before + n));
    for (const step of [20, 40, 60, 80, 100]) if (b.pts >= step && !Object.hasOwn(b.steps, step)) {
        b.steps[step] = today(s);
        record(s, 'bond:stage', { source: `${who}:${step}` });
    }
    return b.pts - before;
}
export function bondActivity(s, kind, { special = false } = {}) {
    if (special || s.duat) return []; // Duat/special rewards await approval
    if (['fish', 'adventure'].includes(kind)) record(s, kind);
    const n = DATA.bond?.activities?.[kind];
    if (!n) return [];
    const out = [];
    for (const who of bondMembers(s)) {
        const key = `bond:act:${who}:${kind}`;
        if (!canDo(s, key)) continue;
        markDone(s, key);
        const pts = raise(s, who, n);
        const label = { fish: '낚시', cook: '요리', study: '공부', adventure: '작은 모험' }[kind];
        const line = `${BOND_NAMES[who]}와 함께 ${label} · 유대 +${pts}`;
        remember(s, who, 'activity', line, pts);
        out.push(line);
    }
    return out;
}
export function giftPoints(who, itemId) {
    const g = DATA.bond?.gifts?.[who] || {};
    if (g.dislike?.includes(itemId)) return 0;
    if (g.special?.includes(itemId) || g.love?.includes(itemId)) return 8;
    return g.like?.includes(itemId) ? 5 : 2;
}
// Synchronous mutation after all checks; caller persists while its button is locked.
export function giveBondGift(s, who, uid, repeatedConfirmed = false) {
    if (!bondMembers(s).includes(who) || s.duat) throw new Error('소망과 받는 사람이 같은 일행에 있어야 해.');
    const item = s.bag.items.find(x => x.uid === uid);
    if (!item || !itemInfo(item.id) || itemInfo(item.id).kind === 'record') throw new Error('지금 가방에 선물할 물건이 없어.');
    const key = `bond:gift:${who}`, first = canDo(s, key);
    if (!first && !repeatedConfirmed) return { confirm: true };
    const pts = first ? giftPoints(who, item.id) : 0;
    takeUid(s, uid);
    markDone(s, key);
    const b = fillBond(s), gained = raise(s, who, pts);
    b[who].gifts[item.id] ??= today(s);
    const line = `${BOND_NAMES[who]}에게 ${itemInfo(item.id).ko} 선물 · 유대 +${gained}`;
    remember(s, who, 'gift', line, gained, item.id);
    return { pts: gained, line };
}
const giftLocks = new WeakSet();
export const giftBusy = s => giftLocks.has(s);
export async function giveBondGiftNow(s, who, uid, confirmed = false) {
    if (giftLocks.has(s)) throw new Error('선물을 저장 중이야. 잠깐만 기다려 줘.');
    if (getState() !== s) throw new Error('채팅이 바뀌었어. 다시 열어 줘.');
    giftLocks.add(s);
    try {
        const result = giveBondGift(s, who, uid, confirmed);
        if (!result.confirm) await saveState();
        return result;
    } finally { giftLocks.delete(s); }
}

export function sourceStatus(e, chat = ctx().chat || []) {
    const statuses = (e.src || []).map(src => {
        const m = chat[src.at], q = normalizeQuote(src.quote);
        if (!m || !q || String(m.send_date ?? '') !== src.sendDate || !visibleMessage(m)) return 'changed';
        if (normalizeQuote(plainText(m.mes)).includes(q)) return 'live';
        return (m.swipes || []).some(t => normalizeQuote(plainText(t)).includes(q)) ? 'away' : 'changed';
    });
    return statuses.length && statuses.every(x => x === 'live') ? 'live' : statuses.includes('changed') || !statuses.length ? 'changed' : 'away';
}
export async function syncBondSources() {
    const s = getState();
    if (!s) return;
    let changed = false;
    for (const e of [...fillBond(s).ties, ...s.bond.cand, ...s.bond.scan.pending]) {
        const status = sourceStatus(e);
        if (status !== e.status) { e.status = status; changed = true; }
    }
    if (changed) { await saveState(); emit('bond:changed', {}); }
}
export function addTie(s, e) {
    const b = fillBond(s);
    if (!['set', 'horus', 'both'].includes(e.who)) throw new Error('인물을 골라 줘.');
    if (!e.title?.trim() || !e.summary?.trim() || !e.src?.length) throw new Error('제목, 내용, 원문이 필요해.');
    if (b.ties.some(t => sameSource(t, e))) return false;
    if (b.ties.length >= 300) throw new Error('기록 300개가 찼어. 기존 기록을 정리하면 이어서 승인할 수 있어. 후보는 남아 있어.');
    b.ties.push({ ...e, id: `tie${++b.seq}`, title: e.title.trim().slice(0, 24), summary: e.summary.trim().slice(0, 160), day: today(s), status: e.status || 'live' });
    record(s, 'bond:tie', { source: e.who });
    emit('bond:changed', {});
    return true;
}
export function refillCandidates(s) {
    const b = fillBond(s);
    b.cand.push(...b.scan.pending.splice(0, Math.max(0, 60 - b.cand.length)));
}
export function decideCandidate(s, id, approve, changes = {}) {
    const b = fillBond(s), candidate = b.cand.find(x => x.id === id);
    if (!candidate) return;
    if (approve) {
        if (sourceStatus(candidate) !== 'live') throw new Error('원문이 바뀌었어. 현재 원문을 다시 확인해 줘.');
        // Evidence, certainty, origin and ids are never editable through form data.
        const edit = {};
        for (const k of ['title', 'who', 'summary', 'when', 'where']) if (changes[k] !== undefined) edit[k] = String(changes[k]);
        addTie(s, { ...candidate, ...edit, edited: Object.keys(edit).some(k => edit[k] !== candidate[k]), origin: 'ai' });
    } else {
        b.skip.push(...(candidate.src || []).map(src => fingerprint({ src: [src] })));
    }
    b.cand.splice(b.cand.indexOf(candidate), 1);
    refillCandidates(s);
}
export function setAliases(s, who, values) {
    const forbidden = new Set(['그', '그녀', '그분', '그이', '그신', '그남자', '신', '남자', '그대', 'he', 'him', 'she', 'her', 'thegod']);
    const clean = [...new Set(values.map(x => x.trim()).filter(Boolean))];
    if (!['set', 'horus'].includes(who) || clean.length > 30 || clean.some(x => x.length > 40 || normalizeQuote(x).length < 2 || forbidden.has(normalizeQuote(x)))) throw new Error('별칭은 인물을 특정하는 2~40자 이름만 넣어 줘(최대 30개).');
    fillBond(s).alias[who] = clean;
}
