from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json
P=Path('docs/art/chibi-refresh/sleep-trio-v189');B=P.parent;F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
V=['set-sleep','somang-sleep','horus-sleep','set-sleep-side','horus-sleep-side']
for v in V:
 w=v.split('-')[0];d='right' if 'side' in v else 'front';out=Image.new('RGBA',(1550,390),'#f5efe3');dr=ImageDraw.Draw(out)
 ims=[Image.open(B/f'final/{w}/idle/{w}-{d}.png').convert('RGBA')];walk=Image.open(B/f'final/{w}/walk/{w}-{d}-0.png').convert('RGBA').resize((628,698),Image.Resampling.NEAREST);wa=Image.new('RGBA',(620,720));wa.alpha_composite(walk,(-4,16));ims+=[wa,Image.open(P/'png'/f'{v}-0.png').convert('RGBA'),Image.open(P/'png'/f'{v}-1.png').convert('RGBA'),Image.open(B/'sleep-somang-v180/png/somang-sleep-0.png').convert('RGBA')]
 for c,(im,t) in enumerate(zip(ims,['IDLE '+d,'WALK '+d,'EXHALE 0','INHALE 1','SOMANG180 REFERENCE'])):
  out.alpha_composite(im.resize((310,360),Image.Resampling.NEAREST),(c*310,28));dr.text((c*310+5,5),t,font=F,fill='#332c29')
 out.convert('RGB').save(P/'previews'/f'{v}-idle-walk-comparison.png')
# Same-scale right head overlay, no resize or morph, original translation only.
ref=Image.new('RGBA',(620,720));ref.alpha_composite(Image.open(B/'final/horus/idle/horus-right.png').convert('RGBA'),(-40,-13));cand=Image.open(P/'png/horus-sleep-side-0.png').convert('RGBA');a=np.array(ref);b=np.array(cand);yy,xx=np.indices(a.shape[:2]);mask=(a[:,:,3]>128)&(a[:,:,2].astype(float)>a[:,:,0]*1.08)&(a[:,:,0]<160)&(yy<400)&~((yy>300)&(xx>155)&(xx<442));report={'source':'final/horus/idle/horus-right.png','offset':[-40,-13],'scale':1.0,'crownAndOuterHairPixels':int(mask.sum()),'changedCrownPixels':int(np.any(a[mask]!=b[mask],axis=1).sum()),'excludes':'eye/eyebrow ROI and collar; comparison is actual approved crown/outer hair'}
(P/'checks/canonical-hair.json').write_text(json.dumps(report,indent=2)+'\n');ov=Image.blend(ref,cand,.5);out=Image.new('RGBA',(1860,465),'#f5efe3');dr=ImageDraw.Draw(out)
for i,(im,t) in enumerate([(ref,'IDLE RIGHT / translated only'),(cand,'SLEEP SIDE / same size'),(ov,'OVERLAY 50% / crown coincides')]):out.alpha_composite(im.crop((0,40,620,470)),(i*620,30));dr.text((i*620+8,8),t,font=F,fill='#332c29')
out.convert('RGB').save(P/'previews/horus-right-head-overlay.png')
# Bed pair/solo in one review page.
o=Image.new('RGB',(960,1010),'#f5efe3');o.paste(Image.open(P/'previews/bed-alone.png'),(0,0));o.paste(Image.open(P/'previews/bed-together.png'),(0,505));o.save(P/'previews/bed-alone-and-together.png')
# Arm size, no independent resizing of arm crops.
o=Image.new('RGBA',(1240,740),'#f5efe3');dr=ImageDraw.Draw(o)
for i,(im,t) in enumerate([(Image.open(B/'final/set/idle/set-front.png').convert('RGBA'),'SET IDLE / same scale'),(Image.open(P/'png/set-sleep-0.png').convert('RGBA'),'SLEEP / short tucked raised arm')]):o.alpha_composite(im,(i*620,20));dr.text((i*620+8,3),t,font=F,fill='#332c29')
o.convert('RGB').save(P/'previews/set-arm-idle-comparison.png')
