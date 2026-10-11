"""Deterministic proportion-only edit. Run from repository root; no repainting."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib
P=Path(__file__).resolve().parent;F=P.parent/'final';dirs=['back','front','left','right'];font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
for d in ['horus/idle','horus/walk','previews','checks']:(P/d).mkdir(parents=True,exist_ok=True)
# Neck joint / hem in each original frame, no reuse of an idle head.
coords={'idle':{'front':[(307,417,570)],'back':[(303,391,562)],'left':[(286,398,565)],'right':[(317,396,563)]},'walk':{'front':[(179,229,319),(181,229,321),(182,229,320)],'back':[(180,214,315),(180,214,316),(180,214,316)],'left':[(167,218,310),(168,217,313),(168,218,311)],'right':[(186,218,310),(185,216,313),(186,217,310)]}}
records=[]
for state in ['idle','walk']:
 for d in dirs:
  for i,(cx,neck,hem) in enumerate(coords[state][d]):
   name=f'horus-{d}'+('' if state=='idle' else f'-{i}')+'.png';src=F/'horus'/state/name;im=Image.open(src).convert('RGBA');a=np.array(im);H,W=a.shape[:2];ys,xs=np.indices((H,W),dtype=float)
   newneck=hem-(hem-neck)*.94
   sy=np.where(ys<newneck,neck+(ys-newneck)/1.04,np.where(ys<hem,neck+(ys-newneck)/.94,ys))
   # Smooth width transition inside collar and skirt hem; continuous mapping has no pasted seams.
   band=14 if state=='idle' else 8
   smooth=lambda t:np.clip(t,0,1)**2*(3-2*np.clip(t,0,1))
   sxscale=1.04-.08*smooth((sy-neck)/band)
   sxscale+=.04*smooth((sy-(hem-band))/band)
   sx=cx+(xs-cx)/sxscale
   ix=np.floor(sx+.5).astype(int);iy=np.floor(sy+.5).astype(int);valid=(ix>=0)&(ix<W)&(iy>=0)&(iy<H)
   out=np.zeros_like(a);out[valid]=a[iy[valid],ix[valid]]
   # Canonicalize invisible RGB only. No palette interpolation or alpha blending.
   out[out[:,:,3]==0,:3]=0
   dst=P/'horus'/state/name;Image.fromarray(out).save(dst)
   mask=a[hem:,:,3]>0;assert np.array_equal(a[hem:][mask],out[hem:][mask])
   assert np.array_equal(a[hem:,:,3],out[hem:,:,3])
   records.append({'path':str(dst.relative_to(P)),'source':str(src.relative_to(Path.cwd())),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'neck':[cx,neck],'hemY':hem,'newNeckY':newneck,'headScale':1.04,'torsoWidthScale':.96,'torsoHeightScale':.94,'lowerBodyVisiblePixelsUnchanged':True,'size':[W,H]})
(P/'manifest.json').write_text(json.dumps({'status':'awaiting-user-review','artApproved':False,'runtimeEligible':False,'frameCount':16,'method':'continuous inverse nearest-neighbour coordinate mapping; no generation, no repaint','frames':records,'walkSequence':[0,1,2,1],'walkFrameDurationMs':180,'idleAnchor':[310,662],'walkAnchor':[180,370],'referenceVisibleHeight':{'idle':576,'walk':330},'horusFrontOffsets':[[1,0],[0,-1],[-1,0],[0,-1]]},ensure_ascii=False,indent=2)+'\n')
def sprite(root,who,d,phase=None,k=0):
 im=Image.open(root/who/('idle' if phase is None else 'walk')/(f'{who}-{d}'+('' if phase is None else f'-{phase}')+'.png')).convert('RGBA')
 if phase is None:
  s=576/330;im=im.transform((360,400),Image.Transform.AFFINE,(s,0,310-180*s,0,s,662-370*s),Image.Resampling.NEAREST)
 elif who=='horus' and d=='front':
  dx,dy=[(1,0),(0,-1),(-1,0),(0,-1)][k];cv=Image.new('RGBA',(360,400));cv.alpha_composite(im,(dx,dy));im=cv
 return im
for bg,key in [('#f5efe3','light'),('#253041','dark')]:
 out=Image.new('RGBA',(1440,1720),bg);draw=ImageDraw.Draw(out)
 for row,d in enumerate(dirs):
  for col,(root,who,label) in enumerate([(F,'set','SET'),(F,'horus','HORUS BEFORE'),(P,'horus','HORUS AFTER'),(F,'somang','SOMANG')]):
   x=360*col;y=430*row;out.alpha_composite(sprite(root,who,d),(x,y+30));draw.text((x+8,y+7),label+' / '+d,font=font,fill='white' if key=='dark' else '#342c29')
 out.convert('RGB').save(P/'previews'/f'trio-idle-comparison-{key}.png')
 out=Image.new('RGBA',(1440,1720),bg);draw=ImageDraw.Draw(out)
 for row,d in enumerate(dirs):
  for col,ph in enumerate([None,0,1,2]):
   x=360*col;y=430*row;out.alpha_composite(sprite(P,'horus',d,ph,0 if ph is None else ph),(x,y+30));draw.text((x+8,y+7),d+' / '+('IDLE' if ph is None else str(ph)),font=font,fill='white' if key=='dark' else '#342c29')
 out.convert('RGB').save(P/'previews'/f'horus-16-{key}.png')
pages=[]
for ph,k in [(None,0)]+[(p,k%4) for k,p in enumerate([0,1,2,1]*2)]:
 out=Image.new('RGBA',(1440,1720),'#f5efe3');draw=ImageDraw.Draw(out)
 for row,d in enumerate(dirs):
  for col,(root,who,label) in enumerate([(F,'set','SET'),(F,'horus','BEFORE'),(P,'horus','AFTER'),(F,'somang','SOMANG')]):
   x=360*col;y=430*row;out.alpha_composite(sprite(root,who,d,ph,k),(x,y+30));draw.text((x+8,y+7),label+' / '+d+' / '+('IDLE' if ph is None else str(ph)),font=font,fill='#342c29')
 pages.append(out.convert('RGB'))
atlas=Image.new('RGB',(1440,1720*len(pages)))
for i,im in enumerate(pages):atlas.paste(im,(0,i*1720))
pal=atlas.quantize(colors=256);pg=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in pages];pg[0].save(P/'previews/trio-before-after-idle-walk.gif',save_all=True,append_images=pg[1:],duration=[1200]+[180]*8,loop=0,disposal=2,optimize=False)
# Actual native-pixel joint crops, enlarged nearest-neighbour on dark backdrop.
out=Image.new('RGBA',(4*360,4*250),'#253041');draw=ImageDraw.Draw(out)
for j,r in enumerate(records):
 im=Image.open(P/r['path']);cx,neck=r['neck'];scale=1 if r['size'][0]==620 else 1.745
 box=(int(cx-85/scale),int(neck-35/scale),int(cx+85/scale),int(neck+65/scale));crop=im.crop(box).resize((340,200),Image.Resampling.NEAREST);x=j%4*360;y=j//4*250;out.alpha_composite(crop,(x+10,y+35));draw.text((x+8,y+8),Path(r['path']).stem,font=font,fill='white')
out.convert('RGB').save(P/'previews/joints-16-dark.png')
print('16 frames, palettes and lower-body pixels preserved; previews built')
