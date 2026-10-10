// Compare approved-scene interiors at source-pixel scale. Exclude live labels,
// actors and terrain seams; night is the same source with the game night tint.
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
 r.setMap(m,'akhet');r.setSprites(DATA.sprites);cv.width=896;cv.height=1120;r.zoom=4;
 const cameraPlayer={x:34.5,y:10.75,dir:'down',step:0};
 const atlas=document.createElement('canvas');atlas.width=1122;atlas.height=1402;const ag=atlas.getContext('2d');ag.drawImage(DATA.sceneArt.duat.image,0,0);
 const regions=[['cliff',450,60,160,90],['door_above_label',480,350,120,55],['guardian',705,550,65,85],['kitchen_shadow_and_objects',250,855,130,170],['palm',330,750,140,170],['stones',550,800,140,140]];
 const frames=[],comparisons=[];
 for(const part of ['day','night']){
  r.draw({player:cameraPlayer,people:[],part,time:0});
  const dx=448*4-r.cam.x,dy=40*4-r.cam.y;
  ag.clearRect(0,0,1122,1402);ag.drawImage(DATA.sceneArt.duat.image,0,0);
  if(part==='night'){ag.fillStyle='rgba(16,32,100,0.57)';ag.fillRect(0,0,1122,1402);}
  for(const [name,x,y,w,h] of regions){
   const actual=r.g.getImageData(dx+x,dy+y,w,h).data,expected=ag.getImageData(x,y,w,h).data;
   let mismatch=0,maxError=0;for(let i=0;i<actual.length;i+=4){let different=false;for(let c=0;c<4;c++){const error=Math.abs(actual[i+c]-expected[i+c]);maxError=Math.max(maxError,error);different ||= error!==0;}if(different)mismatch++;}
   comparisons.push({part,name,pixels:w*h,mismatch,maxError});
  }
  const expectedFrame=document.createElement('canvas');expectedFrame.width=896;expectedFrame.height=1120;expectedFrame.getContext('2d').drawImage(atlas,0,0,896,1120,0,0,896,1120);
  frames.push({part,url:cv.toDataURL(),reference:expectedFrame.toDataURL()});
 }
 // Verify a live actor can be occluded behind the authored guardian and appear
 // over it when its feet are in front. The red probe is only used in this test.
 const person=r.person.bind(r);r.person=(g,look,x,y,dir,step,z)=>{if(look==='probe'){g.fillStyle='#FF0000';g.fillRect(x,y,16*z,16*z);}else person(g,look,x,y,dir,step,z);};
 const probe=[];
 for(const y of [11.6,11.9]){r.draw({player:cameraPlayer,people:[{look:'probe',x:38.5,y,dir:'down',step:0}],part:'day',time:0});probe.push([...r.g.getImageData((448+720*.25)*4-r.cam.x,(40+625*.25)*4-r.cam.y,1,1).data]);}
 const releaseBefore=r.referenceActors.width*r.referenceActors.height;r.release();
 return {comparisons,frames,probe,releaseBefore,released:r.referenceActors.width===1&&r.referenceActors.height===1};
});
for(const f of result.frames){fs.writeFileSync(path.join(out,`actual-source-scale-${f.part}.png`),Buffer.from(f.url.split(',')[1],'base64'));fs.writeFileSync(path.join(out,`reference-source-scale-${f.part}.png`),Buffer.from(f.reference.split(',')[1],'base64'));}delete result.frames;
fs.writeFileSync(path.join(out,'reference-comparison.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));assert(result.comparisons.every(x=>x.mismatch===0));assert.notDeepEqual(result.probe[0],[255,0,0,255]);assert.deepEqual(result.probe[1],[255,0,0,255]);assert(result.released);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
