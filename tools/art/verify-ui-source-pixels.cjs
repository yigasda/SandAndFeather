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
  function compare(sx,sy,dx,dy,w,h){for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const sp=((sy+y)*source.info.width+sx+x)*4,tp=((dy+y)*target.info.width+dx+x)*4;
    if(!target.data[tp+3])continue;
    const masks=record.textReplacedWithSourcePaper?.regions||[];
    if(masks.some(([mx,my,mw,mh])=>sx+x>=mx&&sx+x<mx+mw&&sy+y>=my&&sy+y<my+mh))continue;
    assert(source.data.subarray(sp,sp+3).equals(target.data.subarray(tp,tp+3)),`${record.theme}/${record.asset}: ${sx+x},${sy+y}`);checkedPixels++;
  }}
  if(record.regions)for(const [src,dst]of record.regions)compare(src[0],src[1],dst[0],dst[1],src[2],src[3]);
  else compare(record.crop[0],record.crop[1],0,0,record.crop[2],record.crop[3]);
  checkedAssets++;
 }
 const result={checkedAssets,checkedPixels,changedVisibleRGB:0,notes:'Header text regions are replaced with blank paper from the same source. Cutout alpha and repeated border layout are deliberate; remaining visible RGB is exact source data.'};
 const out=process.argv[3];if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
