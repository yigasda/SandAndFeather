// Used only by the localhost test AI. No live provider or user RP is involved.
exports.bondReply = request => {
 const text = (request.messages || []).map(m => m.content || '').join('\n');
 if (!/Extract only events|Check each candidate/.test(text)) return null;
 const raw = text.includes('[/INSTRUCTIONS]') ? text.split('[/INSTRUCTIONS]').pop().trim() : request.messages.at(-1).content;
 const payload = JSON.parse(raw);
 if (payload.events) return { checks: payload.events.map((e,i) => ({ index:i, supported:!e.summary.includes('결심'), reason:e.summary.includes('결심')?'감정 단정':'' })) };
 return { events: payload.messages.map(m => ({
  title:String(m.number), who:'set', kind:'gift', summary:'소망과 세트가 선물을 주고받았다.',
  when:'', where:'', refs:[m.number], quotes:[{at:m.number,text:m.text.slice(0,120)}], continues:'', certainty:'clear'
 })), ledger:[], ongoing:[] };
};
