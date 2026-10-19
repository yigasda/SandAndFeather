// 출입구 왕복 검수(OPUS-HANDOFF "모든 맵 공통: 출입구·착지·왕복 기준"): 화면 터치(조이스틱)만으로, 동행과 함께
//   1. 출구로 걸어 들어가 스틱을 계속 누른 채 도착 → 1.2초 더 눌러도 되돌아가지 않음, 도착 지점이 착지, 출구 트리거 밖
//   2. 도착 뒤 짧게 앞·뒤·좌·우(사람 폭만큼) → 맵이 바뀌지 않음
//   3. 동행이 트리거 밖에 섬
//   4. 일부러 다시 출구로 걸어가면 정상 귀환(같은 입력으로 두 번 넘어가지 않음)
//   5. 저장·다시 불러오기(새로고침 뒤 게임 다시 열기) → 같은 맵·같은 자리
// 양방향 영상과 도착 화면을 out에 남긴다.
//   node tools/st-test/portal-walk.cjs [out] [--connections]
// --temple-02-15: current 02-A <-> 15-D, one fixture then real round trips.
// --connections: historical retired graph; use only against its historical code. T1W -> T1E -> 15 -> T1E -> T1W twice, one initial fixture placement only.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/maps/portal-02-t1w');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
// [from map, start entry, exit id, to map, landing entry]
const TEMPLE = process.argv.includes('--temple-02-15');
const ARRIVALS = process.argv.includes('--arrivals');
const INNER = process.argv.includes('--widths-inner');
const WIDTHS = INNER || process.argv.includes('--widths');
const CONNECTIONS = TEMPLE || ARRIVALS || WIDTHS || process.argv.includes('--connections');
const PAIRS = TEMPLE ? [
    ['desert_buried_temple','temple','temple','desert_colonnade','south'],
    ['desert_colonnade','south','south','desert_buried_temple','temple'],
] : INNER ? [
    ['desert_forecourt_east','west','east','desert_colonnade','forecourt'],
    ['desert_colonnade','forecourt','forecourt','desert_forecourt_east','east'],
] : WIDTHS ? [
    ['desert_buried_temple','temple','temple','desert_forecourt_west','south'],
    ['desert_forecourt_west','south','east','desert_forecourt_east','west'],
    ['desert_forecourt_east','west','east','desert_colonnade','forecourt'],
    ['desert_colonnade','forecourt','forecourt','desert_forecourt_east','east'],
    ['desert_forecourt_east','east','west','desert_forecourt_west','east'],
    ['desert_forecourt_west','east','south','desert_buried_temple','temple'],
] : CONNECTIONS ? [
    ['desert_forecourt_west', 'east', 'east', 'desert_forecourt_east', 'west'],
    ['desert_forecourt_east', 'west', 'east', 'desert_colonnade', 'forecourt'],
    ['desert_colonnade', 'forecourt', 'forecourt', 'desert_forecourt_east', 'east'],
    ['desert_forecourt_east', 'east', 'west', 'desert_forecourt_west', 'east'],
] : [['desert_buried_temple', 'west', 'temple', 'desert_forecourt_west', 'south'], ['desert_forecourt_west', 'yard', 'south', 'desert_buried_temple', 'temple']];
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: OUT, size: { width: 412, height: 900 } } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    // ST's own errors (no model connected, its outside services unreachable) are not the game's, as in common.js
    const errors = []; page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
    const sleep = ms => page.waitForTimeout(ms);
    const W = require('./touch-walk.cjs')(page, cdp);
    const boot = async () => {
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 }); await sleep(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await sleep(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async base => { window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', ledger: 'core/ledger', map: 'world/map', data: 'core/data', field: 'packs/duat/field' })) T[k] = await import(base + 'src/' + f + '.js'); }, BASE);
    };
    const where = () => page.evaluate(() => {
        const p = T.player.player, m = T.win.currentMap(), q = T.player.follower();
        return { map: m.id, x: p.x, y: p.y, inExit: !!m.exitAt(p.x + 0.5, p.y + 0.8), mateInExit: !!m.exitAt(q.x + 0.5, q.y + 0.8), mate: {x:q.x,y:q.y}, floor: !m.solidRect(p.x+.22,p.y+.62,p.x+.78,p.y+.96), mateFloor: !m.solidRect(q.x+.22,q.y+.62,q.x+.78,q.y+.96) };
    });
    async function walkBackToLanding(entry) {
        const clear=await page.evaluate(e=>{
            const p=T.player.player,m=T.win.currentMap(),n=Math.ceil(Math.hypot(p.x-e.x,p.y-e.y)/.04);
            for(let k=0;k<=n;k++){const t=n?k/n:0,x=p.x+(e.x-p.x)*t,y=p.y+(e.y-p.y)*t;
                if(m.solidRect(x+.22,y+.62,x+.78,y+.96)||m.exits.some(ex=>T.map.containsExit(ex,x+.5,y+.8)))return false;}
            return true;
        },entry);
        if(!clear)return W.walkToPoint(entry.x,entry.y,30000,.4);
        // Do not round a collision-safe start onto a blocked grid point beside a doorway post.
        const pad=await W.padBox();await W.touch('touchStart',pad.x,pad.y);
        let arrived=false;
        for(let k=0;k<160;k++){
            const me=await where(),dx=entry.x-me.x,dy=entry.y-me.y,d=Math.hypot(dx,dy);
            if(d<.18){arrived=true;break;}
            const speed=Math.max(.15,Math.min(1,d/.6));
            await W.touch('touchMove',pad.x+dx/d*pad.lim*speed,pad.y+dy/d*pad.lim*speed);await sleep(50);
        }
        await W.touch('touchEnd');await sleep(150);return arrived;
    }
    try {
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await boot();
        await page.evaluate(async () => {
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, 'horus'); await T.win.openGame(); window.toastr?.clear();
        });
        if(process.argv.includes('--follower-contract')) {
            const probe=await page.evaluate(()=>{
                const P=T.player,s=T.state.getState(),saved={pos:structuredClone(s.pos),lead:T.heroes.leadOf(s),with:T.heroes.withOf(s)};
                const failures=[];let checked=0,minGap=Infinity;
                const ids=Object.keys(T.data.DATA.maps).filter(id=>id==='ombos'||id.startsWith('desert_'));
                for(const id of ids){const m=T.map.getMap(id);if(!m)continue;
                    const entries=Object.entries(m.d.entries||{});if(!entries.length)entries.push(['spawn',m.d.spawn]);
                    for(const [name,entry] of entries)for(const lead of ['set','horus','somang'])for(const mate of ['set','horus','somang']){
                        if(lead===mate)continue;T.heroes.setLead(s,lead);T.heroes.setWith(s,mate);s.pos={map:id,...entry};P.placePlayer(m);
                        const f=P.follower(),gap=Math.hypot(f.x-P.player.x,f.y-P.player.y);minGap=Math.min(minGap,gap);checked++;
                        const safe=q=>!m.solidRect(q.x+.22,q.y+.62,q.x+.78,q.y+.96)&&!m.exits.some(e=>T.map.containsExit(e,q.x+.5,q.y+.8));
                        if(!safe(f)||gap<.4*(m.d.actorScale||1))failures.push({id,name,lead,mate,phase:'placement',gap});
                        const controlled={...f,walkT:3};P.mateWalk.pos=controlled;
                        if(P.follower()!==controlled)failures.push({id,name,phase:'combat priority'});P.mateWalk.pos=null;
                        P.stepPlayer(m,1,0,.01);const next=P.follower();
                        if(!safe(next)||Math.hypot(next.x-P.player.x,next.y-P.player.y)<.3*(m.d.actorScale||1))failures.push({id,name,phase:'first step'});
                    }
                }
                T.heroes.setLead(s,saved.lead);T.heroes.setWith(s,saved.with);s.pos=saved.pos;P.placePlayer(T.map.getMap(s.pos.map));
                return {checked,minGap,failures,kind:'synchronous placement/API fixtures, not a walking substitute'};
            });
            fs.writeFileSync(path.join(OUT,'follower-contract.json'),JSON.stringify(probe,null,2));
            ok(!probe.failures.length,`동행 초기화·첫 걸음·교대·전투 위치 우선 계약: ${probe.checked} 조합, 실패 ${probe.failures.length}`);
        }
        if(WIDTHS && !TEMPLE) {
            const checks=await page.evaluate(()=>{
                const m=T.map.getMap('desert_forecourt_east'),e=m.d.exits.find(e=>e.id==='east'),px=m.d.authoredCollision.pixelWalk.pixelsPerTile;
                const p=(x,y)=>T.map.containsExit(e,x/px,y/px);
                const f=T.map.getMap('desert_colonnade').d.exits.find(e=>e.id==='forecourt');
                const fifteen=f.polygon?.length===4 && T.map.containsExit(f,1720/px,620/px) && !T.map.containsExit(f,1707/px,651/px);
                const legacy={x0:1,y0:2,x1:3,y1:4};
                return {polygon:e.polygon?.length===5,fifteen,inside:p(1699,295),outside:!p(1666,340)&&!p(1732,249),legacy:T.map.containsExit(legacy,1,2)&&T.map.containsExit(legacy,3,4)&&!T.map.containsExit(legacy,.99,3)};
            });
            for(const [name,value] of Object.entries(checks))ok(value,'출구 실제 판정 계약: '+name);
        }
        let shot = 0;
        if (CONNECTIONS) {
            // One fixture placement, then two continuous touch-only round trips, with no travel between legs.
            await page.evaluate(async start => T.win.travel(start[0], start[1]), PAIRS[0]);
            await sleep(1200);
            await page.evaluate(() => {
                T.moves = [];
                // Observe the map assignment without changing movement or inputs. The microtask runs
                // after placePlayer completes, before the next requestAnimationFrame can walk again.
                const p = T.player.player; let current = p.map;
                Object.defineProperty(p, 'map', { configurable: true, enumerable: true,
                    get: () => current,
                    set: value => { const from = current, sourceFeet={x:p.x+.5,y:p.y+.8}; current = value; if (from === value) return;
                        queueMicrotask(() => { const q=T.player.follower();
                            T.moves.push({from,sourceFeet,to:p.map,x:p.x,y:p.y,dir:p.dir,mate:{x:q.x,y:q.y}});
                        });
                    }
                });
            });
        }
        if (CONNECTIONS) await page.evaluate(() => {
            T.overlay = false;
            T.win.onDraw(scene => {
                if (!T.overlay) return;
                scene.extra.push({x:0,y:10000,draw(g,sx,sy,z,ts) {
                    const oy=sy-10000*ts; g.save(); g.lineWidth=3;
                    for(const e of T.win.currentMap().d.exits) {g.strokeStyle='#ff40ed'; if(e.polygon){g.beginPath();e.polygon.forEach(([x,y],i)=>i?g.lineTo(sx+x*ts,oy+y*ts):g.moveTo(sx+x*ts,oy+y*ts));g.closePath();g.stroke();}else g.strokeRect(sx+e.x0*ts,oy+e.y0*ts,(e.x1-e.x0)*ts,(e.y1-e.y0)*ts);}
                    for(const [p,color] of [[T.player.player,'#00ff55'],[T.player.follower(),'#00ffff']]) {
                        g.strokeStyle=color;g.strokeRect(sx+(p.x+.22)*ts,oy+(p.y+.62)*ts,.56*ts,.34*ts);
                    }
                    g.restore();
                }});
            });
        });
        const trips = ARRIVALS ? PAIRS : WIDTHS ? [...PAIRS,...PAIRS,...PAIRS] : CONNECTIONS ? [...PAIRS, ...PAIRS] : PAIRS;
        let leg = 0;
        for (const [from, at, exitId, to, land] of trips) {
            const name = `${from.replace('desert_', '')} → ${to.replace('desert_', '')}`;
            if (!CONNECTIONS) { await page.evaluate(async ([from, at]) => T.win.travel(from, at), [from, at]); await sleep(1200); }
            ok((await where()).map === from, `${name}: 연속 왕복의 출발 맵`);
            // walk to just before the exit (its middle, a step back toward the start), then push into it and keep pushing
            let ex = await page.evaluate(([from, exitId]) => { const e = T.win.currentMap().d.exits.find(x => x.id === exitId); return { cx: (e.x0 + e.x1) / 2, cy: (e.y0 + e.y1) / 2 }; }, [from, exitId]);
            const me = await where();
            const fx = me.x + 0.5, fy = me.y + 0.8, d = Math.hypot(ex.cx - fx, ex.cy - fy), ux = (ex.cx - fx) / d, uy = (ex.cy - fy) / d;
            // walk (stick) to the landing that belongs to this exit (the way in from it), then on into the exit
            const near = await page.evaluate(([from, exitId]) => T.win.currentMap().d.entries[exitId], [from, exitId]);
            if (WIDTHS) {
                const lane=Math.floor(leg/PAIRS.length);
                const approach=await page.evaluate(([exitId,lane,temple])=>{
                    const m=T.win.currentMap(),e=m.d.exits.find(x=>x.id===exitId);
                    if(temple) {
                        // These two thresholds are crossed vertically; sample across their full width.
                        const n=m.id==='desert_buried_temple'?-1:1;
                        const y=n<0?e.y1-.08:e.y0+.08,slots=[];
                        const free=(x,y)=>!m.solidRect(x-.28,y-.18,x+.28,y+.16);
                        for(let x=e.x0;x<=e.x1;x+=.02){if(T.map.containsExit(e,x,y)&&free(x,y))slots.push(x);}
                        if(!slots.length)return null;
                        // Only lanes with a continuous inland approach are usable door width.
                        const approaches=[];
                        for(const x of slots) {
                            for(const d of [1.5,1,.6,.4,.3,2,2.5]) {
                                const py=y-n*d;
                                if(m.exits.some(e=>T.map.containsExit(e,x,py)))continue;
                                let clear=true;
                                for(let t=0;t<=d;t+=.02)if(!free(x,y-n*t)){clear=false;break;}
                                if(clear){approaches.push({x,pre:{x:x-.5,y:py-.8}});break;}
                            }
                        }
                        if(!approaches.length)return null;
                        const selected=approaches[Math.round((approaches.length-1)*[.12,.5,.88][lane])];
                        return {cx:selected.x,cy:y,pre:selected.pre,vertical:true,lane,t:selected.x,
                            range:[approaches[0].x,approaches.at(-1).x],thresholdRange:[slots[0],slots.at(-1)]};
                    }
                    if(e.polygon) {
                        // Approach the registered threshold's long inner edge along its normal.
                        const a=e.polygon[0],b=e.polygon.at(-1),len=Math.hypot(b[0]-a[0],b[1]-a[1]);
                        const axis=[(b[0]-a[0])/len,(b[1]-a[1])/len],n=[axis[1],-axis[0]];
                        const free=(x,y)=>!m.solidRect(x-.28,y-.18,x+.28,y+.16),slots=[];
                        for(let t=0;t<=len;t+=.02){const x=a[0]+axis[0]*t+n[0]*.08,y=a[1]+axis[1]*t+n[1]*.08;
                            if(free(x,y)&&T.map.containsExit(e,x,y))slots.push({x,y,t});}
                        if(!slots.length)return null;
                        const selected=slots[Math.round((slots.length-1)*[.12,.5,.88][lane])];let pre=null;
                        for(const d of [1.5,1,2,.6,2.5]){const x=selected.x-n[0]*d,y=selected.y-n[1]*d;
                            if(free(x,y)&&!m.exits.some(e=>T.map.containsExit(e,x,y))){pre={x:x-.5,y:y-.8};break;}}
                        return pre?{cx:selected.x,cy:selected.y,pre,axis,origin:a,lane,t:selected.t,range:[slots[0].t,slots.at(-1).t]}:null;
                    }
                    const direction=m.id==='desert_colonnade'?'right':exitId==='west'||exitId==='south'?'down':'up';
                    const vertical=direction!=='right',n=direction==='up'?[0,-1]:direction==='down'?[0,1]:[1,0];
                    const fixed=direction==='up'?e.y1-.08:direction==='down'?e.y0+.08:e.x0+.08;
                    const lo=vertical?e.x0:e.y0,hi=vertical?e.x1:e.y1;
                    const free=(x,y)=>!m.solidRect(x-.28,y-.18,x+.28,y+.16);
                    const slots=[];for(let t=lo;t<=hi;t+=.02){const x=vertical?t:fixed,y=vertical?fixed:t;if(free(x,y))slots.push({x,y,t});}
                    if(!slots.length)return null;
                    const selected=slots[Math.round((slots.length-1)*[.12,.5,.88][lane])];
                    let pre=null;
                    for(const d of [1.5,1,2,.6,2.5]){const x=selected.x-n[0]*d,y=selected.y-n[1]*d;if(free(x,y)&&!m.exits.some(e=>T.map.containsExit(e,x,y))){pre={x:x-.5,y:y-.8};break;}}
                    return pre?{cx:selected.x,cy:selected.y,pre,vertical,lane,t:selected.t,range:[slots[0].t,slots.at(-1).t]}:null;
                },[exitId,lane,TEMPLE]);
                ok(!!approach,`${name}: 문 폭 ${['왼쪽/위','중앙','오른쪽/아래'][lane]} 보행 가능한 접근`);
                if(!approach)throw new Error('no lane '+name);
                ex=approach;
                // Walk the eastern paved perimeter, avoiding the existing shield soldier without changing it.
                if(from==='desert_forecourt_west' && ((await where()).y>18 || exitId==='south')) {
                    const px=52/1.55;ok(await W.walkToPoint(1530/px-.5,650/px-.8,90000,.4),'T1W 기존 몹을 바꾸지 않고 동쪽 석재 길로 걷기');
                }
                ok(await W.walkToPoint(ex.pre.x,ex.pre.y,90000,.2),`${name}: 지정 폭 접근점까지 실제 조이스틱`);
            } else if (near) await W.walkToPoint(near.x, near.y, 90000, 0.4); else await W.walkToPoint(ex.cx - ux * 2 - 0.5, ex.cy - uy * 2 - 0.8, 90000, 0.5);
            const p = await W.padBox();
            const now = await where(), gx = ex.cx - (now.x + 0.5), gy = ex.cy - (now.y + 0.8), gn = Math.hypot(gx, gy) || 1;
            await W.touch('touchStart', p.x, p.y); await W.touch('touchMove', p.x + gx / gn * p.lim, p.y + gy / gn * p.lim);
            await page.waitForFunction(to => T.win.currentMap()?.id === to, to, { timeout: 15000 }).catch(() => {});
            const arrivedAt = await where();
            if (CONNECTIONS && leg < PAIRS.length) {
                await W.touch('touchEnd');
                await page.screenshot({path:path.join(OUT, `${String(shot++).padStart(2,'0')}-arrival-${to}-${land}.png`)});
                await page.evaluate(()=>{T.overlay=true}); await sleep(180);
                await page.screenshot({path:path.join(OUT, `${String(shot-1).padStart(2,'0')}-arrival-overlay-${to}-${land}.png`)});
                await page.evaluate(()=>{T.overlay=false});
                console.log('ARRIVAL_CAPTURE', to, land);
            }
            await sleep(1200);   // still pushing, 1.2 s after arriving
            const held = await where();
            const transition = CONNECTIONS ? await page.evaluate(()=>T.moves.at(-1)) : null;
            res.push('  positions '+JSON.stringify({leg,arrival:arrivedAt,held}));
            if (!CONNECTIONS || leg >= PAIRS.length) await W.touch('touchEnd'); await sleep(500);
            const entry = await page.evaluate(([to, land]) => T.map.getMap(to).d.entries[land], [to, land]);
            res.push(`  ${name}: 출구 앞 ${now.map.replace('desert_', '')} (${now.x.toFixed(1)}, ${now.y.toFixed(1)}) → 도착 ${arrivedAt.map.replace('desert_', '')} (${arrivedAt.x.toFixed(1)}, ${arrivedAt.y.toFixed(1)})`);
            ok(arrivedAt.map === to && Math.hypot(arrivedAt.x - entry.x, arrivedAt.y - entry.y) < 0.6 && !arrivedAt.inExit, `${name}: 걸어서 도착, 착지 ${land}(${entry.x.toFixed(1)}, ${entry.y.toFixed(1)}) 자리, 트리거 밖`);
            ok(held.map === to && !held.inExit, `${name}: 도착 뒤 1.2초 ${CONNECTIONS && leg < PAIRS.length ? '정지' : '입력 유지'}에도 되돌아가지 않음 (${held.map.replace('desert_', '')})`);
            await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-${to.replace('desert_', '')}-${land}.png`) });
            // Held input may carry the party away from its landing, even to the doorway wall.
            // Walk back (never teleport) before the separate landing-neighbourhood checks.
            if(CONNECTIONS && leg >= PAIRS.length && held.map===to) {
                ok(await walkBackToLanding(entry),`${name}: 유지 입력 검사 뒤 착지로 실제 걸어 돌아옴`);
            }
            // short steps every way
            const back = [];
            for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                await W.touch('touchStart', p.x, p.y); await W.touch('touchMove', p.x + dx * p.lim, p.y + dy * p.lim); await sleep(260); await W.touch('touchEnd'); await sleep(350);
                const w = await where(); if (w.map !== to) back.push(`${dx},${dy}`);
                if (w.map !== to) break;
            }
            ok(!back.length, `${name}: 도착 뒤 짧게 앞·뒤·좌·우로 움직여도 그대로 ${back.join(' ')}`);
            const mate = await where();
            ok(!mate.mateInExit && mate.floor && mate.mateFloor, `${name}: 플레이어·동행 발 전체 바닥 안, 동행 트리거 밖`);
            if(CONNECTIONS) {
                const move=transition;
                ok(move?.mate && Math.hypot(move.x-move.mate.x,move.y-move.mate.y) >= .6,`${name}: 최초 도착 동행 간격 유지`);
                ok(move?.to===to && Math.hypot(move.x-entry.x,move.y-entry.y)<0.05, `${name}: 첫 도착 프레임 정확한 착지`);
                if(WIDTHS) { const t=ex.axis?(move.sourceFeet.x-ex.origin[0])*ex.axis[0]+(move.sourceFeet.y-ex.origin[1])*ex.axis[1]:ex.vertical?move.sourceFeet.x:move.sourceFeet.y; ok(Math.abs(t-ex.t)<.35,`${name}: 실제 문턱 통과가 지정 폭 lane ${ex.lane} 안 (${t.toFixed(2)} / ${ex.t.toFixed(2)})`); }
                fs.writeFileSync(path.join(OUT,'moves.json'), JSON.stringify(await page.evaluate(()=>T.moves),null,2));
                fs.writeFileSync(path.join(OUT,'result.txt'),res.join('\n')+'\n');
            }
            leg++;
            if(back.length){await page.screenshot({path:path.join(OUT,'unexpected-reentry.png')});res.push('STOP: unexpected re-entry; remaining route not run');break;}
        }
        if (!CONNECTIONS) {
        // the return on purpose and save / load: from T1W's landing, walk back into its exit; then reload where she is
        await page.evaluate(async () => T.win.travel('desert_forecourt_west', 'south')); await sleep(1200);
        const ex = await page.evaluate(() => { const e = T.win.currentMap().d.exits.find(x => x.id === 'south'); return { cx: (e.x0 + e.x1) / 2, cy: (e.y0 + e.y1) / 2 }; });
        const p = await W.padBox();
        await W.touch('touchStart', p.x, p.y); await W.touch('touchMove', p.x, p.y + p.lim);
        await page.waitForFunction(() => T.win.currentMap()?.id === 'desert_buried_temple', null, { timeout: 15000 }).catch(() => {});
        await W.touch('touchEnd'); await sleep(1500);
        const ret = await where();
        ok(ret.map === 'desert_buried_temple', `T1W 착지에서 일부러 아래로 걸어가면 02로 돌아감 (${ret.map})`);
        await sleep(800);
        const twice = await where();
        ok(twice.map === 'desert_buried_temple' && !twice.inExit, '같은 입력으로 두 번 넘어가지 않음');
        } else {
            ok(await page.evaluate(()=>T.moves.length) === trips.length, `연속 왕복: 정확히 ${trips.length}번 전환, 튕김 없음`);
        }
        // reload: fold the game (saves where she is), reload the page, open it again
        await page.evaluate(async () => T.win.foldGame()); await sleep(800);
        const before = await page.evaluate(() => { const s = T.state.getState(); return s.pos; });
        await page.reload({ waitUntil: 'domcontentloaded' }); await boot();
        await page.evaluate(async () => { await T.win.openGame(); window.toastr?.clear(); }); await sleep(2000);
        const after = await where();
        ok(after.map === before.map && Math.hypot(after.x - before.x, after.y - before.y) < 0.05 && !after.inExit, `저장·다시 불러오기: ${after.map.replace('desert_', '')} (${after.x.toFixed(1)}, ${after.y.toFixed(1)}) 그대로, 트리거 밖`);
        await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-after-reload.png`) });
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) { try { fs.renameSync(await v.path(), path.join(OUT, 'portal.webm')); } catch {} }
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
