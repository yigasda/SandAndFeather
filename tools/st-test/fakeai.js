const http = require('http'), fs = require('fs');
const adv = { title: '젖은 두루마리', steps: [
  { kind: 'touch', marks: [{ at: 'palm_shade', label: '젖은 자국', text: '물방울이 떨어져 있다.' }, { at: 'west_road', label: '찢긴 끈', text: '끈 조각이 걸려 있다.' }], text: '물 자국을 따라가 보자.' },
  { kind: 'find', at: 'meadow', item: 'sealed_letter', label: '봉인된 편지', text: '풀 사이에 편지가 있다.' },
  { kind: 'choice', text: '{물건}을 어떻게 할까?', a: { label: '상인에게', keep: false, deben: 5, xp: 3, journal: '상인에게 맡겼다.' }, b: { label: '간직한다', keep: true, deben: 0, xp: 3, journal: '간직했다.' } }],
  end: { xp: 6, deben: 5, journal: '젖은 편지를 찾았다.', en: 'Somang found a wet sealed letter in the meadow.', say: '풀밭에서 찾은 편지 이야기를 꺼낸다.', marks: ['편지'] } };
http.createServer((q, r) => {
  const h = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*', 'Content-Type': 'application/json' };
  if (q.method === 'OPTIONS') { r.writeHead(204, h); return r.end(); }
  let b = ''; q.on('data', c => b += c); q.on('end', () => {
    if (q.url.endsWith('/models')) { r.writeHead(200, h); return r.end(JSON.stringify({ data: [{ id: 'fake' }] })); }
    fs.writeFileSync(__dirname + '/last_req.json', b);
    r.writeHead(200, h); r.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: JSON.stringify(adv) } }] }));
  });
}).listen(8111);
