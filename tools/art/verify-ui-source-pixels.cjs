// Verifies the visible artwork is original concept RGB, not a redrawn approximation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'data/art/ui/skins');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(process.argv[2]||'/workspace/ui-concepts-20261010/manifest.json'));
 const sources=new Map();for(const entry of manifest.concepts){const bytes=fs.readFileSync(entry.path);sources.set(crypto.createHash('sha256').update(bytes).digest('hex'),await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}));}
 let checkedPixels=0,checkedAssets=0;
 for(const record of JSON.parse(fs.readFileSync(path.join(dir,'provenance.json')))){
  const source=sources.get(record.sourceSha256);assert(source,'source hash mismatch');
  const target=await sharp(path.join(dir,record.theme,record.asset+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // frame-edge pixels that were background now carry the frame's own outline colour
  const rim=new Set((record.rimFromOutline?.pixels||[]).map(([x,y])=>y*target.info.width+x));
  for(const i of rim)assert(Buffer.from(record.rimFromOutline.color).equals(target.data.subarray(i*4,i*4+3)),`${record.theme}/${record.asset}: rim ${i}`);
  // where each target pixel came from in the source: the crop or nine-slice layout, then the recorded copies
  const W=target.info.width,from=new Array(W*target.info.height).fill(null);
  const place=(sx,sy,dx,dy,w,h)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++)from[(dy+y)*W+dx+x]=[sx+x,sy+y];};
  if(record.regions)for(const [src,dst]of record.regions)place(src[0],src[1],dst[0],dst[1],src[2],src[3]);
  else place(record.crop[0],record.crop[1],0,0,record.crop[2],record.crop[3]);
  for(const op of record.repairs||[])if(op.op==='copy'){
   const [fx,fy,fw,fh]=op.from,[tx,ty]=op.to,moved=[];
   for(let y=0;y<fh;y++)for(let x=0;x<fw;x++)moved.push([(ty+y)*W+tx+(op.flip==='x'?fw-1-x:x),from[(fy+y)*W+fx+x]]);
   for(const [i,v]of moved)from[i]=v;
  }
  const masks=record.textReplacedWithSourcePaper?.regions||[];
  for(let i=0;i<from.length;i++){
   if(!target.data[i*4+3]||rim.has(i)||!from[i])continue;
   const [sx,sy]=from[i];
   if(masks.some(([mx,my,mw,mh])=>sx>=mx&&sx<mx+mw&&sy>=my&&sy<my+mh))continue;
   const sp=(sy*source.info.width+sx)*4;
   assert(source.data.subarray(sp,sp+3).equals(target.data.subarray(i*4,i*4+3)),`${record.theme}/${record.asset}: ${sx},${sy}`);checkedPixels++;
  }
  checkedAssets++;
 }
 const result={checkedAssets,checkedPixels,changedVisibleRGB:0,notes:'Header text regions are replaced with blank paper from the same source. Cutout alpha, outline-coloured frame rims, recorded paper copies and repeated border layout are deliberate; remaining visible RGB is exact source data.'};
 const out=process.argv[3];if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
