from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib
from scipy.ndimage import label,binary_dilation
from scipy.spatial import cKDTree
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent;P=O.parent
DIRS=['front','back','left','right'];CHARS=['set','somang','horus']
REFS={'set':P/'review-pocket-style-v2/front/set-front.png','somang':P/'review-somang-skin-v3/somang-front.png','horus':P/'review-horus-walk-v1/native/horus-front-1.png'}
NECK={'set':241,'somang':235,'horus':235}
def clean(im):
 a=np.array(im.convert('RGBA'));a[:,:,3]=np.where(a[:,:,3]>=128,255,0);a[a[:,:,3]==0,:3]=0
 l,n=label(a[:,:,3]>0);sz=np.bincount(l.ravel());bad=np.isin(l,np.where(sz<12)[0]);a[bad]=0
 return Image.fromarray(a)
def final_ref(who):
 im=Image.open(REFS[who]).convert('RGBA');b=im.getbbox();im=im.crop(b);scale=330/im.height;im=im.resize((round(im.width*scale),330),Image.Resampling.NEAREST)
 c=Image.new('RGBA',(360,400));c.alpha_composite(im,(180-im.width//2,40));return c
def head_center(im,top,cut):
 a=np.array(im);y,x=np.where(a[top:cut,:,3]>128);return (x.min()+x.max())/2
frames={};report={};refs={w:final_ref(w) for w in CHARS}
# Horus body uses the actual final body's color palette; this is a color-only
# operation and cannot change the toe direction, overlap, hem or alpha silhouette.
ha=np.array(refs['horus']);bodycolors=ha[245:,:,:3][ha[245:,:,3]>128]
pim=Image.fromarray(bodycolors.reshape(1,-1,3)).quantize(colors=64,method=Image.Quantize.MEDIANCUT)
hpal=np.unique(np.array(pim.convert('RGB')).reshape(-1,3),axis=0);htree=cKDTree(hpal.astype(float))
for who in CHARS:
 sheet=Image.open(O/f'sources/{who}-edited-sheet.png').convert('RGBA');frames[who]={};report[who]={}
 for row,d in enumerate(DIRS):
  cells=[clean(sheet.crop((round(i*sheet.width/3),round(row*sheet.height/4),round((i+1)*sheet.width/3),round((row+1)*sheet.height/4)))) for i in range(3)]
  boxes=[c.getbbox() for c in cells];top=int(np.median([b[1] for b in boxes]));bottom=int(max(b[3] for b in boxes));scale=330/(bottom-top)
  out=[]
  for i,c in enumerate(cells):
   cx=head_center(c,top,top+int((bottom-top)*.37));sz=(round(c.width*scale),round(c.height*scale));scaled=c.resize(sz,Image.Resampling.NEAREST)
   f=Image.new('RGBA',(360,400));f.alpha_composite(scaled,(round(180-cx*scale),round(40-top*scale)));out.append(f)
  if d=='front':
   # Locate face bottom in the middle pose, not the bottom of hair or body.
   a=np.array(out[1]);skin=(a[:,:,0]>185)&(a[:,:,1]>120)&(a[:,:,2]>95)&(a[:,:,0].astype(int)>a[:,:,1].astype(int)+5)&(a[:,:,3]>0);skin[260:]=False
   l,n=label(skin);sz=np.bincount(l.ravel());sz[0]=0;y,x=np.where(l==sz.argmax());cut=int(y.max()+2);target=NECK[who]
   for i,f in enumerate(out):
    # One common body fit for all three phases. No per-limb warping: silhouette,
    # perspective feet, overlap and lifted skirt are retained together.
    low=f.crop((0,cut,360,370)).resize((360,370-target),Image.Resampling.NEAREST)
    c=Image.new('RGBA',(360,400))
    if who=='set':
     c.alpha_composite(low,(0,target))
     # Preserve the actual approved long-hair pixels behind moving limbs. A hard
     # horizontal head crop alone makes an obvious seam through the long locks.
     fa=np.array(refs[who]);fr=fa[:,:,0].astype(float);fg=fa[:,:,1].astype(float);fb=fa[:,:,2].astype(float)
     hair=(fr>fg*1.35)&(fb>fg*1.07)&(fa[:,:,3]>0)
     hair|=binary_dilation(hair)&(fa[:,:,:3].max(axis=2)<75)&(fa[:,:,3]>0)
     body_exclude=Image.new('1',(360,400));ImageDraw.Draw(body_exclude).polygon([(149,target),(211,target),(253,271),(258,314),(245,378),(113,378),(104,314),(108,271)],fill=1)
     hair[np.array(body_exclude,dtype=bool)]=False
     hair[:target]=True;fa[~hair]=0;c.alpha_composite(Image.fromarray(fa))
     la=np.array(low);lr=la[:,:,0].astype(float);lg=la[:,:,1].astype(float);lb=la[:,:,2].astype(float)
     gh=(lr>lg*1.35)&(lb>lg*1.07)&(la[:,:,3]>0)
     gh|=binary_dilation(gh)&(la[:,:,:3].max(axis=2)<75)&(la[:,:,3]>0)
     la[gh]=0
     ll,nn=label(la[:,:,3]>0);sizes=np.bincount(ll.ravel());sizes[0]=0;la[ll!=sizes.argmax()]=0
     low=Image.fromarray(la)
    c.alpha_composite(low,(0,target))
    head=refs[who].crop((0,0,360,target));c.alpha_composite(head,(0,0));out[i]=c
   report[who]['front_original_head_pixels_reused']=True;report[who]['front_neck_source']=cut;report[who]['front_neck_target']=target
  # Keep upper head pixels identical within each direction, suppressing generator jitter.
  # Front comes from the actual final reference, never the newly edited head.
  lock=NECK[who] if d=='front' else (218 if who=='horus' else 205)
  fixed=np.array(out[1])[:lock].copy()
  for i,f in enumerate(out):
   a=np.array(f)
   if who=='horus':
    yy=np.indices(a.shape[:2])[0];navy=(a[:,:,2].astype(int)>a[:,:,0].astype(int)+12)&(a[:,:,0]<155)
    mask=(yy>=lock)&(a[:,:,3]>128)&~navy
    _,ix=htree.query(a[:,:,:3][mask].astype(float));a[:,:,:3][mask]=hpal[ix]
   a[:lock]=fixed;f=Image.fromarray(a);out[i]=f;f.save(O/f'walk/{who}-{d}-{i}.png')
  frames[who][d]=out;report[who][d]={'scale':scale,'bounds':[f.getbbox() for f in out],'head_lock_y':lock,'head_pixel_differences':[int(np.any(np.array(f)[:lock]!=fixed,axis=2).sum()) for f in out]}
 # Full-size approved front reference, same source pixels, not an invented idle pose.
 idle=Image.new('RGBA',(620,720));src=Image.open(REFS[who]).convert('RGBA');b=src.getbbox();src=src.crop(b);src=src.resize((round(src.width*628/src.height),628),Image.Resampling.NEAREST);idle.alpha_composite(src,(310-src.width//2,34));idle.save(O/f'idle-reference/{who}-front.png')
 s=Image.new('RGBA',(1080,1600))
 for row,d in enumerate(DIRS):
  for i,f in enumerate(frames[who][d]):s.alpha_composite(f,(360*i,400*row))
 s.save(O/f'sheets/{who}-walk.png')
# Reference manifest remains read-only; settings are copied verbatim.
man=json.loads((P/'approved/manifest.json').read_text());cy=man['walkCycle'];seq=cy['sequence'];ms=cy['previewFrameDurationMs'];bg=(248,243,231)
def savegif(fs,path):
 strip=Image.new('RGB',(fs[0].width*len(fs),fs[0].height))
 for i,f in enumerate(fs):strip.paste(f,(i*f.width,0))
 pal=strip.quantize(colors=256,method=Image.Quantize.MEDIANCUT);q=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in fs];q[0].save(path,save_all=True,append_images=q[1:],duration=[ms]*len(q),loop=0,disposal=2,optimize=False)
for who in CHARS:
 fs=[]
 for k,phase in enumerate(seq):
  c=Image.new('RGBA',(720,800),(*bg,255))
  for n,d in enumerate(DIRS):
   dx,dy=cy['horusDownOffsets'][k] if who=='horus' and d=='front' else (0,0);c.alpha_composite(frames[who][d][phase],((n%2)*360+dx,(n//2)*400+dy))
  fs.append(c.convert('RGB'))
 savegif(fs,O/f'previews/134-{who}-walk.gif')
fs=[]
for k,phase in enumerate(seq):
 c=Image.new('RGBA',(720,1100),(*bg,255));draw=ImageDraw.Draw(c)
 for col,who in enumerate(CHARS):
  draw.text((col*240+90,10),who.upper(),fill='#4b4035')
  for row,d in enumerate(DIRS):
   dx,dy=cy['horusDownOffsets'][k] if who=='horus' and d=='front' else (0,0)
   f=frames[who][d][phase];tmp=Image.new('RGBA',(360,400));tmp.alpha_composite(f,(dx,dy));tmp=tmp.resize((240,267),Image.Resampling.NEAREST);c.alpha_composite(tmp,(240*col,30+267*row))
 fs.append(c.convert('RGB'))
savegif(fs,O/'previews/134-trio-walk.gif')
# One static pose sheet for review, not a new generated montage.
preview=Image.new('RGB',(1080,1260),bg)
for row,who in enumerate(CHARS):
 for i,f in enumerate(frames[who]['front']):preview.paste(f,(i*360,row*420+20),f)
preview.save(O/'previews/134-front-three-poses.png')
(O/'validation.json').write_text(json.dumps({'status':'review-not-approved','runtime_modified':False,'method':'source-pose image edits; original final front head pixels restored; common per-direction scale and anchored cells','frame_size':[360,400],'pivot':[180,370],'cycle':cy,'characters':report},ensure_ascii=False,indent=2)+'\n')
print('Built 36 walk PNGs, 3 sheets, 4 GIFs. Review required.')
