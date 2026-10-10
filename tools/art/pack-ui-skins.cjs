// Mechanical crops/9-slice packing from the five approved concepts. No painted replacements.
// Usage: node tools/art/pack-ui-skins.cjs /workspace/ui-concepts-20261010/manifest.json
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(process.argv[2]||'/workspace/ui-concepts-20261010/manifest.json'));
const recipes={
 classic:{frame:[735,87,770,370,25],panel:[1153,191,330,246,14],slot:[858,192,87,95,7],selected:[759,295,93,100,9],button:[1240,110,117,53,9],primary:[1117,110,118,53,9],hud:[45,98,224,64,15],party:[757,556,232,166,10],paper:[945,413,48,23],header:[938,109,150,42],bar:[47,895,652,88,9],icons:[[87,906,35,32],[217,905,31,34],[341,905,42,34],[471,905,36,34],[612,905,38,34]],bag:[770,110,48,48],talk:[766,773,43,37],sun:[64,108,34,39]},
 walnut:{frame:[701,77,797,410,25],panel:[1126,221,345,246,18],slot:[829,229,89,96,8],selected:[730,229,92,97,10],button:[1113,879,284,65,12],primary:[800,879,283,65,12],hud:[61,93,246,64,15],party:[727,580,238,179,14],paper:[936,446,64,24],header:[906,108,490,25],bar:[39,898,633,92,12],icons:[[82,912,38,34],[208,912,30,34],[327,912,39,34],[452,912,34,34],[575,912,41,34]],bag:[735,104,34,35],talk:[740,813,36,35],sun:[77,105,37,39]},
 journal:{frame:[708,75,799,473,35],panel:[1126,154,352,366,18],slot:[752,220,322,61,6],selected:[752,163,323,46,8],button:[1135,906,181,62,10],primary:[926,906,192,64,10],hud:[61,90,272,53,15],party:[749,691,718,64,10],paper:[1170,391,80,30],header:[1145,402,70,28],bar:[49,908,617,91,13],icons:[[98,919,36,36],[216,919,31,36],[330,919,42,36],[452,919,33,36],[566,919,39,36]],bag:[765,95,44,49],talk:[756,860,36,34],sun:[85,99,30,36]},
 temple:{frame:[756,80,756,438,30],panel:[1231,241,260,254,12],slot:[878,250,86,82,9],selected:[792,250,80,82,10],button:[1112,177,156,53,12],primary:[791,177,157,53,12],hud:[82,99,294,61,18],party:[868,613,205,163,10],paper:[1260,456,60,25],header:[1299,116,87,29],bar:[28,905,711,96,15],icons:[[96,919,34,32],[227,919,30,32],[358,919,42,32],[503,919,34,32],[636,919,37,32]],bag:[1386,182,30,25],talk:[932,861,46,41],sun:[109,113,33,38]},
 cozy:{frame:[705,94,804,369,24],panel:[1163,198,320,240,17],slot:[1075,337,79,94,9],selected:[990,240,81,94,9],button:[874,185,130,43,9],primary:[741,185,130,43,9],hud:[68,115,317,90,20],party:[742,548,235,222,18],paper:[880,431,90,15],header:[927,130,456,26],bar:[39,897,640,99,15],icons:[[93,913,35,33],[218,913,29,33],[330,913,44,33],[458,913,31,33],[575,913,36,33]],bag:[746,120,36,44],talk:[744,818,41,37],sun:[92,128,30,35]}
};
const output=path.join(root,'data/art/ui/skins');fs.mkdirSync(output,{recursive:true});const provenance=[];
(async()=>{
for(const [i,[id,r]]of Object.entries(recipes).entries()){
 const source=manifest.concepts[i].path, bytes=fs.readFileSync(source),hash=crypto.createHash('sha256').update(bytes).digest('hex');
 const dir=path.join(output,id);fs.mkdirSync(dir,{recursive:true});
 const crop=async(name,rect,cutout=false,alternate=null)=>{
  const input=alternate||bytes,sourceHash=alternate?crypto.createHash('sha256').update(alternate).digest('hex'):hash;
  const [left,top,width,height]=rect;let buffer=await sharp(input).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
  if(cutout){ // Flood only background connected to crop edges; retained RGB is never changed.
   const seeds=[0,width-1,(height-1)*width,width*height-1],bg=seeds.map(p=>[...buffer.subarray(p*4,p*4+3)]),seen=new Uint8Array(width*height),queue=[];
   const matches=p=>bg.some(c=>Math.max(...c.map((v,k)=>Math.abs(v-buffer[p*4+k])))<36);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if((!x||!y||x===width-1||y===height-1)&&matches(y*width+x)){queue.push(y*width+x);seen[y*width+x]=1;}
   for(let n=0;n<queue.length;n++){const p=queue[n];buffer[p*4+3]=0;const x=p%width,y=Math.floor(p/width);for(const q of [x?p-1:-1,x<width-1?p+1:-1,y?p-width:-1,y<height-1?p+width:-1])if(q>=0&&!seen[q]&&matches(q)){seen[q]=1;queue.push(q);}}
  }
  // Item crops must not retain a sample quantity or neighbouring slot stroke.
  // Keep the connected item silhouette, preserving its original RGB exactly.
  if(name.startsWith('item-')){
   const seen=new Uint8Array(width*height);let largest=[];
   for(let start=0;start<seen.length;start++)if(!seen[start]&&buffer[start*4+3]){
    const component=[start];seen[start]=1;
    for(let j=0;j<component.length;j++){
     const p=component[j],x=p%width,y=Math.floor(p/width);
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(x+dx<0||x+dx>=width||y+dy<0||y+dy>=height)continue;
      const q=(y+dy)*width+x+dx;if(!seen[q]&&buffer[q*4+3]){seen[q]=1;component.push(q);}
     }
    }
    if(component.length>largest.length)largest=component;
   }
   const keep=new Set(largest);for(let p=0;p<seen.length;p++)if(!keep.has(p))buffer[p*4+3]=0;
  }
  await sharp(buffer,{raw:{width,height,channels:4}}).png().toFile(path.join(dir,name+'.png'));
  provenance.push({theme:id,asset:name,sourceSha256:sourceHash,crop:rect,cutout,isolatedItem:name.startsWith('item-')});
 };
 const frame=async(name,rect)=>{
  const [x,y,w,h,c]=rect,t=8,n=2*c+t;
  const entries=[[[x,y,c,c],[0,0]],[[x+Math.floor(w/2),y,t,c],[c,0]],[[x+w-c,y,c,c],[c+t,0]],[[x,y+Math.floor(h/2),c,t],[0,c]],[[x+w-c,y+Math.floor(h/2),c,t],[c+t,c]],[[x,y+h-c,c,c],[0,c+t]],[[x+Math.floor(w/2),y+h-c,t,c],[c,c+t]],[[x+w-c,y+h-c,c,c],[c+t,c+t]]];
  // The classic selection arrow is an overlay, not part of a repeatable left edge.
  if(id==='classic'&&name==='selected')entries[3][0][1]=306;
  const raw=await sharp(bytes).extract({left:x,top:y,width:w,height:h}).ensureAlpha().raw().toBuffer();
  // Trace the exterior silhouette, rather than color-flooding: pale borders
  // share colors with their paper and must never be erased with the matte.
  const silhouettes={
   classic:{button:[2,6],primary:[1,6],selected:[1,4],slot:[1,3],panel:[1,6],hud:[1,7],chip:[1,7],minimap:[1,6]},
   walnut:{button:[2,6],primary:[2,6],selected:[1,5],slot:[1,5],panel:[1,9],hud:[1,7],chip:[1,7],minimap:[1,7]},
   journal:{button:[1,5],primary:[2,5],selected:[0,0],slot:[0,0],panel:[0,0],hud:[1,5],chip:[1,6],minimap:[1,9]},
   temple:{button:[1,5],primary:[1,5],selected:[0,5],slot:[1,5],panel:[0,3],hud:[0,0],chip:[0,5],minimap:[0,7]},
   cozy:{button:[1,6],primary:[1,6],selected:[1,6],slot:[1,6],panel:[0,9],hud:[1,15],chip:[1,11],minimap:[1,12]},
  };
  const [inset,bevel]=silhouettes[id][name]||[0,0];
  for(let py=0;py<h;py++)for(let px=0;px<w;px++){
   const dx=Math.min(px,w-1-px)-inset,dy=Math.min(py,h-1-py)-inset;
   if(dx<0||dy<0||dx+dy<bevel)raw[(py*w+px)*4+3]=0;
  }
  const cleaned=await sharp(raw,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
  const layers=[];for(const [a,b]of entries){const[left,top,width,height]=a;layers.push({input:await sharp(cleaned).extract({left:left-x,top:top-y,width,height}).png().toBuffer(),left:b[0],top:b[1]});}
  await sharp({create:{width:n,height:n,channels:4,background:'#0000'}}).composite(layers).png().toFile(path.join(dir,name+'.png'));
  provenance.push({theme:id,asset:name,sourceSha256:hash,nineSlice:rect,size:n,regions:entries,exteriorSilhouette:{inset,bevel}});
 };
 for(const name of ['frame','panel','slot','selected','button','primary','hud','party','bar'])await frame(name,r[name]);
 // The approved cream design has two separate inner frames, not a single card.
 if(id==='cozy'){await frame('detail-icon',[1184,215,93,98,9]);await frame('detail-description',[1184,326,279,93,10]);}
 if(id==='classic'){await frame('detail-icon',[1171,209,107,110,10]);await frame('detail-description',[1164,333,309,93,10]);}
 const heads={
 classic:{rect:[735,87,770,96],mask:[[760,106,160,60],[1115,107,369,62]],sample:[947,110,30,30]},
 walnut:{rect:[701,77,797,89],mask:[[728,100,133,45]],sample:[903,88,30,22]},
 journal:{rect:[708,75,799,84],mask:[[759,95,160,52],[1128,102,360,53]],sample:[953,98,30,27]},
 temple:{rect:[756,80,756,91],mask:[[1101,121,84,30]],sample:[1300,121,30,29]},
 cozy:{rect:[705,94,804,84],mask:[[737,118,147,46]],sample:[891,115,25,44]}
 };const head=heads[id],layers=[];
 for(const [mx,my,mw,mh]of head.mask){const [sx,sy,sw,sh]=head.sample;const tile=await sharp(bytes).extract({left:sx,top:sy,width:sw,height:sh}).png().toBuffer();
 const region=await sharp({create:{width:mw,height:mh,channels:4,background:'#0000'}}).composite([{input:tile,tile:true}]).png().toBuffer();layers.push({input:region,left:mx-head.rect[0],top:my-head.rect[1]});}
 const [hx,hy,hw,hh]=head.rect;await sharp(bytes).extract({left:hx,top:hy,width:hw,height:hh}).composite(layers).png().toFile(path.join(dir,'header-full.png'));
 provenance.push({theme:id,asset:'header-full',sourceSha256:hash,crop:head.rect,textReplacedWithSourcePaper:{regions:head.mask,sample:head.sample}});

 for(const name of ['paper','header'])await crop(name,r[name]);
 for(let j=0;j<5;j++)await crop('nav-'+['world','somang','party','quests','map'][j],r.icons[j],true);
 for(const name of ['bag','talk','sun'])await crop(name,r[name],true);
 if(id==='cozy'){await crop('flower',[1425,130,61,63],true);await crop('button-fill',[890,197,10,12]);await crop('primary-fill',[756,196,12,16]);}
 else {await crop('button-fill',[r.button[0]+r.button[4]+4,r.button[1]+r.button[4]+3,10,8]);await crop('primary-fill',[r.primary[0]+r.primary[4]+4,r.primary[1]+r.primary[4]+3,10,8]);}
 const hudParts={classic:{chip:[274,98,145,64,12],fill:[122,147,80,3],mini:[542,97,163,123,15]},walnut:{chip:[61,157,123,46,11],fill:[125,143,90,4],mini:[486,92,160,121,15]},journal:{chip:[61,149,118,46,11],fill:[299,104,15,26],mini:[475,82,188,120,15]},temple:{chip:[90,157,113,37,9],fill:[165,147,80,3],mini:[505,99,207,137,17]},cozy:{chip:[69,205,125,46,13],fill:[350,136,15,29],mini:[487,111,171,140,19]}};
 await frame('chip',hudParts[id].chip);await frame('minimap',hudParts[id].mini);await crop('hud-fill',hudParts[id].fill);
 const actions={classic:[[471,753,106,108],[582,750,112,112]],walnut:[[446,786,94,94],[541,779,109,110]],journal:[[445,785,105,106],[558,785,104,107]],temple:[[470,764,121,121],[598,764,123,124]],cozy:[[462,782,96,101],[567,777,98,109]]};
 await crop('action-bag',actions[id][0]);await crop('action-talk',actions[id][1]);
 const ownItems={classic:{lotus:[767,207,75,55],bread:[864,208,76,57],fish:[962,205,72,59],potion:[1053,203,76,64],scarab:[770,309,65,62],stone:[1067,312,62,61]},walnut:{lotus:[741,245,70,51],bread:[834,244,75,53],fish:[930,244,71,56],potion:[1031,243,56,56],scarab:[747,348,56,62]},journal:{lotus:[771,162,50,43],bread:[772,210,50,38],fish:[773,254,50,40],potion:[774,296,47,47],scarab:[775,345,41,44],stone:[774,389,48,39]},temple:{lotus:[798,262,67,56],bread:[886,266,67,48],fish:[973,264,58,56],potion:[1061,256,56,59],scarab:[1143,256,61,60],scroll:[976,353,54,57]},cozy:{}};
 const cozyBytes=fs.readFileSync(manifest.concepts[4].path),itemNames=['lotus','bread','fish','potion','scarab','flower','stone','scroll'];
 for(const [j,name]of itemNames.entries()){const own=ownItems[id][name],fallback=[Math.round(748+(j<5?j:j-5)*84.5),254+(j<5?0:1)*95,62,55];await crop('item-'+name,own||fallback,true,own?null:cozyBytes);}
 if(id==='journal')await crop('spine',[1083,300,40,74]);
 if(id==='journal'){await frame('nav-selected',[53,907,124,90,13]);await crop('nav-selected-fill',[78,925,10,10]);}
 if(id==='walnut')await frame('nav-selected',[40,899,119,88,12]);
 if(id==='temple'){await crop('wing-left',[984,105,80,44],true);await crop('wing-right',[1219,107,76,44],true);await crop('sun-disk',[1119,96,43,28],true);}
}
fs.writeFileSync(path.join(output,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');console.log(`Packed ${provenance.length} exact-source crops and nine-slice assets`);
})().catch(e=>{console.error(e);process.exitCode=1;});
