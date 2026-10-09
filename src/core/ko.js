// Korean particles after a word that changes: 을/를, 이/가, 은/는, 과/와, 으로/로 by the last letter's 받침.
// A word ending in a digit or a Latin letter gets the form without 받침 (not perfect, rarely seen).
export function josa(word, pair) {
    const [a, b] = { '을': ['을', '를'], '를': ['을', '를'], '이': ['이', '가'], '가': ['이', '가'], '은': ['은', '는'], '는': ['은', '는'], '과': ['과', '와'], '와': ['과', '와'] }[pair] || [pair, pair];
    const w = String(word ?? '');
    const c = w.trim().slice(-1).charCodeAt(0);
    const jong = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0;
    if (pair === '으로' || pair === '로') return w + (jong && jong !== 8 ? '으로' : '로'); // ㄹ 받침은 "로"
    return w + (jong ? a : b);
}
