// Local compositing of imagegen-produced exit edits; approved pixels outside declared regions are copied exactly.
const fs=require('fs'),path=require('path'),sharp=require('sharp'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'docs/art/map-expansion'),out=path.join(base,'exits-v2');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const spec=JSON.parse(fs.readFileSync(process.argv[2]||path.join(out,'regions.json'),'utf8'));const records=[];
 for(const job of spec){
  const src=path.join(base,job.name),editFile=path.join(out,'sources',job.id+'.png');
  if(!fs.existsSync(editFile))fs.copyFileSync(path.join('/workspace/generated_images',job.generated),editFile);
  const original=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:ow,height:oh}=original.info;const [w,h]=job.outputSize||[ow,oh];const edited=await sharp(editFile).metadata();
  if(edited.width!==w||edited.height!==h)throw Error('Generated source dimensions differ: '+job.id);
  if(job.mode==='extend-right'){
   if(w<=ow||h!==oh)throw Error('Right expansion must keep original height and increase width');
   const result=await sharp(editFile).ensureAlpha().raw().toBuffer();
   for(let y=0;y<oh;y++)original.data.copy(result,y*w*4,y*ow*4,(y+1)*ow*4);
   for(let y=0;y<oh;y++)if(!result.subarray(y*w*4,y*w*4+ow*4).equals(original.data.subarray(y*ow*4,(y+1)*ow*4)))throw Error('Original pixels changed during expansion');
   const target=path.join(out,job.name);await sharp(result,{raw:{width:w,height:h,channels:4}}).png().toFile(target);
   records.push({id:job.id,mode:job.mode,source:path.relative(root,src),output:path.relative(root,target),sourceSize:[ow,oh],size:[w,h],protectedOriginalRect:[0,0,ow,oh],editRegions:job.regions,revision:job.revision,generatedSize:job.generatedSize,sourceAlignment:job.sourceAlignment,changedOriginalPixelCount:0,extensionPixelCount:(w-ow)*h,unchangedOutsideRegions:true,sourceSha256:hash(fs.readFileSync(src)),outputSha256:hash(fs.readFileSync(target))});
   continue;
  }
  if(w!==ow||h!==oh)throw Error('Local edits must preserve canvas size');
  const pixels=await sharp(editFile).ensureAlpha().raw().toBuffer();const result=Buffer.from(original.data);let changed=0,outside=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   let opacity=0;
   for(const [l,t,r,b] of job.regions){if(x<l||x>=r||y<t||y>=b)continue;
    const dist=Math.min(l===0?8:x-l,t===0?8:y-t,r===w?8:r-1-x,b===h?8:b-1-y);opacity=Math.max(opacity,Math.min(1,dist/8));}
   if(!opacity)continue;
   const k=(y*w+x)*4;for(let c=0;c<3;c++)result[k+c]=Math.round(original.data[k+c]*(1-opacity)+pixels[k+c]*opacity);
   if(!result.subarray(k,k+4).equals(original.data.subarray(k,k+4)))changed++;
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4;if(!job.regions.some(([l,t,r,b])=>x>=l&&x<r&&y>=t&&y<b)&&!result.subarray(k,k+4).equals(original.data.subarray(k,k+4)))outside++;}
  if(outside)throw Error('Pixels changed outside allowed regions');
  const target=path.join(out,job.name);await sharp(result,{raw:{width:w,height:h,channels:4}}).png().toFile(target);
  records.push({id:job.id,source:path.relative(root,src),output:path.relative(root,target),size:[w,h],editRegions:job.regions,revision:job.revision||"2026-10-10",generatedSize:job.generatedSize||[w,h],sourceAlignment:job.sourceAlignment||"No size normalization required.",changedPixelCount:changed,unchangedOutsideRegions:true,sourceSha256:hash(fs.readFileSync(src)),outputSha256:hash(fs.readFileSync(target))});
 }
 fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(records,null,2)+'\n');console.log('Packaged '+records.length+' maps at declared dimensions. Protected original pixels unchanged.');
})().catch(e=>{console.error(e);process.exit(1)});
