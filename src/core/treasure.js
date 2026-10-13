// 모래 아래 잠든 보물 (data/records.json treasure): the map scrap, once read (flags.garden_hint), is the first clue;
// three more come one each from fishing (river), the fallen temple's sandstone wall (stone) and a small adventure
// (sun). With all of them a glint shows where it lies; digging there gives it once a save, never again.
// Mutates only; the caller saves.

import { give, itemInfo } from './bag.js';
import { DATA } from './data.js';
import { record } from './facts.js';
import { today } from './ledger.js';
import { addXP, journal } from './progress.js';
import { josa } from './ko.js';

export const TREASURE = () => DATA.records?.treasure || {};
export const LATER_CLUES = ['river', 'stone', 'sun'];
export const clueInfo = id => (TREASURE().clues || []).find(c => c.id === id) || null;

export const started = s => !!s?.flags?.garden_hint;
export const isFound = s => (s?.treasure?.found ?? -1) >= 0;
export const hasClue = (s, id) => (id === 'scrap' ? started(s) : Object.hasOwn(s?.treasure?.clues || {}, id));
export const ready = s => started(s) && !isFound(s) && LATER_CLUES.every(id => hasClue(s, id));

// one of the three later clues turned up: the first time only, after the scrap is read → the clue, else null
export function clueFound(s, id) {
    if (!LATER_CLUES.includes(id) || !started(s) || isFound(s) || hasClue(s, id)) return null;
    const c = clueInfo(id);
    if (!c) return null;
    s.treasure.clues[id] = today(s);
    journal(s, { ko: `보물지도 단서 「${c.ko}」를 찾았다.`, say: `지도 조각에 그려진 표시와 맞는 「${c.ko}」 단서 이야기를 꺼낸다.`,
        en: `Somang found another clue to the old map scrap: ${id === 'river' ? 'a red cord on reeds from the river' : id === 'stone' ? 'the same mark carved in the fallen temple\'s sandstone' : 'a tale of the fallen temple\'s shadow at sunset'}.`,
        marks: [c.ko], kind: 'treasure' });
    return c;
}

// what the treasure gives: the first of the rare relics not yet in the 도감, or the instead set when all five are known
export function treasureRelic(s) {
    const T = TREASURE();
    const id = (T.relics || []).find(r => itemInfo(r) && !Object.hasOwn(s.codex?.items || {}, r));
    return id ? { [id]: 1 } : { ...(T.instead || {}) };
}

// dig it up: once a save → { relic: {id: n}, deben, gives: {id: n}, xp }, or null (not ready or already found)
export function digTreasure(s) {
    if (!ready(s)) return null;
    const T = TREASURE();
    const relic = treasureRelic(s), gives = { ...(T.gives || {}) };
    s.treasure.found = today(s);           // first, so nothing below can give it twice
    s.flags['treasure:found'] = true;
    for (const [id, n] of Object.entries(relic)) give(s, id, n, 'treasure');
    for (const [id, n] of Object.entries(gives)) give(s, id, n, 'treasure');
    s.bag.deben += T.deben || 0;
    if (T.xp) addXP(s, T.xp);
    const got = { relic, deben: T.deben || 0, gives, xp: T.xp || 0, map: T.map, anchor: T.anchor };
    s.treasure.got = got;
    const names = Object.keys(relic).map(id => itemInfo(id)?.ko).join('·');
    record(s, 'treasure', { itemId: Object.keys(relic)[0] || '', source: `${T.map}:${T.anchor}` });
    journal(s, { ko: `${T.ko || '보물'}을 찾았다. ${josa(names, '와')} 황금 장식이 모래 아래 상자에 들어 있었다.`,
        say: '지도 조각에서 시작해 찾아낸 모래 아래 보물 이야기를 꺼낸다.',
        en: `Following an old map scrap and three clues, Somang dug up a buried chest behind the fallen temple: ${Object.keys(relic).map(id => itemInfo(id)?.en).join(', ')} and a gold ornament.`,
        marks: ['보물'], kind: 'treasure' });
    return got;
}
