// Compare selected unoccluded interior regions of the ACTUAL renderer with the
// approved source atlas at 1:1 source-pixel scale (game zoom 4). Ground seams and
// UI/actors are intentionally outside these regions; this is not a whole-frame claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out=path.resolve(process.argv[2]||'/tmp/duat-reference-review');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const page=await b.newPage();await page.goto('http://127.0.0.1:8000');await page.waitForSelector('#sf_open',{state:'attached'});
const result=await page.evaluate(async()=>{
 const base='/scripts/extensions/third-party/SandAndFeather/src/';
 const {DATA,loadData}=await import(base+'core/data.js');await loadData();
 const {GameMap}=await import(base+'world/map.js'),{Renderer}=await import(base+'world/render.js');
 const m=new GameMap(DATA.maps.ombos),cv=document.createElement('canvas'),r=new Renderer(cv);
 r.setMap(m,'akhet');r.setSprites(DATA.sprites);cv.width=832;cv.height=878;r.zoom=4;
 const cameraPlayer={x:(464*4+416)/64-.5,y:(76*4+45+439)/64-.5,dir:'down',step:0};
 const atlas=document.createElement('canvas');atlas.width=1704;atlas.height=923;const ag=atlas.getContext('2d');ag.drawImage(DATA.sceneArt.duat.image,0,0);
 const regions=[['high_cliff',600,96,70,50],['left_rock',352,288,50,70],['door_depth',500,260,90,75],['guardian',684,420,64,115],['stepping_stones',500,645,140,110],['palm_shadow',420,755,130,90],['paving',300,870,220,18],['raised_bank',715,790,90,70]];
 const frames=[],comparisons=[];
 for(const part of ['day','night']){
  r.draw({player:cameraPlayer,people:[],part,time:0});
  const dx=464*4-r.cam.x,dy=76*4-r.cam.y;
  for(const [name,x,y,w,h] of regions){
   const actual=r.g.getImageData(dx+x,dy+y,w,h).data,expected=ag.getImageData(x+(part==='night'?854:0),y,w,h).data;
   let mismatch=0,maxError=0;for(let i=0;i<actual.length;i+=4){let different=false;for(let c=0;c<4;c++){const error=Math.abs(actual[i+c]-expected[i+c]);maxError=Math.max(maxError,error);different ||= error!==0;}if(different)mismatch++;}
   comparisons.push({part,name,pixels:w*h,mismatch,maxError});
  }
  const expectedFrame=document.createElement('canvas');expectedFrame.width=832;expectedFrame.height=878;expectedFrame.getContext('2d').drawImage(DATA.sceneArt.duat.image,part==='night'?854:0,45,832,878,0,0,832,878);
  frames.push({part,url:cv.toDataURL(),reference:expectedFrame.toDataURL()});
 }
 // Verify a live actor can be occluded behind the authored guardian and appear
 // over it when its feet are in front. The red probe is only used in this test.
 const person=r.person.bind(r);r.person=(g,look,x,y,dir,step,z)=>{if(look==='probe'){g.fillStyle='#FF0000';g.fillRect(x,y,16*z,16*z);}else person(g,look,x,y,dir,step,z);};
 const probe=[];
 for(const y of [12,12.5]){r.draw({player:cameraPlayer,people:[{look:'probe',x:40,y,dir:'down',step:0}],part:'day',time:0});probe.push([...r.g.getImageData((464+710*.25)*4-r.cam.x,(76+504*.25)*4-r.cam.y,1,1).data]);}
 r.draw({player:cameraPlayer,people:[{look:'probe',x:34.5,y:6,dir:'down',step:0}],part:'day',time:0});
 const bareGroundProbe=[...r.g.getImageData(554*4-r.cam.x,100*4-r.cam.y,1,1).data];
 const releaseBefore=r.referenceActors.width*r.referenceActors.height;r.release();
 return {comparisons,frames,probe,bareGroundProbe,releaseBefore,released:r.referenceActors.width===1&&r.referenceActors.height===1};
});
for(const f of result.frames){fs.writeFileSync(path.join(out,`actual-source-scale-${f.part}.png`),Buffer.from(f.url.split(',')[1],'base64'));fs.writeFileSync(path.join(out,`reference-source-scale-${f.part}.png`),Buffer.from(f.reference.split(',')[1],'base64'));}delete result.frames;
fs.writeFileSync(path.join(out,'reference-comparison.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));assert(result.comparisons.every(x=>x.mismatch===0));assert.notDeepEqual(result.probe[0],[255,0,0,255]);assert.deepEqual(result.probe[1],[255,0,0,255]);assert.deepEqual(result.bareGroundProbe,[255,0,0,255]);assert(result.released);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
