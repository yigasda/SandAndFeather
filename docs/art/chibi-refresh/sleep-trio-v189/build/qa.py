from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib,shutil,subprocess
P=Path('docs/art/chibi-refresh/sleep-trio-v189');B=P.parent
variants=['set-sleep','somang-sleep','horus-sleep','set-sleep-side','horus-sleep-side'];font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
eyes={'set-sleep':[195,319,425,365],'somang-sleep':[169,264,309,341],'horus-sleep':[192,316,428,367],'set-sleep-side':[304,312,442,375],'horus-sleep-side':[311,305,413,369]}
leg={'set-sleep':[220,519,422,720],'somang-sleep':[0,474,620,720],'horus-sleep':[0,503,620,720],'set-sleep-side':[145,511,342,720],'horus-sleep-side':[0,502,620,720]}
report=[];sheet=Image.new('RGB',(1860,5*360),'#f5efe3');d=ImageDraw.Draw(sheet)
for j,v in enumerate(variants):
 a=np.array(Image.open(P/'png'/f'{v}-0.png'));b=np.array(Image.open(P/'png'/f'{v}-1.png'));changed=np.any(a!=b,axis=2);outer=(a[:,:,3]>128)^(b[:,:,3]>128)
 im=Image.fromarray(a);allred=Image.new('RGBA',(620,720));ar=np.array(allred);ar[changed]=[255,35,35,255];allred=Image.fromarray(ar);xor=np.zeros_like(a);xor[outer]=[255,35,35,255]
 for c,(layer,label) in enumerate([(Image.fromarray(a),'EXHALE 0'),(Image.fromarray(b),'INHALE 1'),(Image.alpha_composite(im,Image.fromarray(xor)),'EXTERIOR alpha XOR RED')]):
  q=layer.resize((240,279),Image.Resampling.NEAREST);sheet.paste(q,(c*320,j*360),q);d.text((c*320+2,j*360+2),v+' '+label,font=font,fill='#333333')
 zoom=Image.alpha_composite(im,Image.fromarray(xor)).crop((120,330,510,550)).resize((585,330),Image.Resampling.NEAREST);sheet.paste(zoom,(970,j*360),zoom)
 diff=Image.new('RGBA',im.size,'#f5efe3');diff.alpha_composite(im);diff.alpha_composite(allred);diff.convert('RGB').save(P/'previews'/f'{v}-changed-red.png')
 yy=eyes[v];lg=leg[v];es=int(changed[yy[1]:yy[3],yy[0]:yy[2]].sum());ls=int(changed[lg[1]:lg[3],lg[0]:lg[2]].sum());aa=np.array(Image.fromarray(a).resize((33,39),Image.Resampling.NEAREST));bb=np.array(Image.fromarray(b).resize((33,39),Image.Resampling.NEAREST));smallXor=(aa[:,:,3]>128)^(bb[:,:,3]>128)
 report.append({'variant':v,'changedPixels':int(changed.sum()),'exteriorChangedPixels':int(outer.sum()),'game31ExteriorPixels':int(smallXor.sum()),'closedEyeROI':yy,'closedEyeChangedPixels':es,'pillowAboveY300ChangedPixels':int(changed[:300].sum()),'legsROI':lg,'legsChangedPixels':ls})
(P/'checks/breathing-differences.json').write_text(json.dumps(report,indent=2)+'\n');sheet.save(P/'previews/breathing-exterior-red.png');print(json.dumps(report,indent=2))
# Requested vertical axis.
s=Image.new('RGBA',(1240,720),'#f5efe3');d=ImageDraw.Draw(s)
for c,w in enumerate(['set','horus']):
 im=Image.open(P/'png'/f'{w}-sleep-0.png');s.alpha_composite(im,(620*c,0));x=620*c+310;d.line((x,0,x,719),fill='#ee3344',width=2);d.ellipse((x-5,445,x+5,455),fill='#ee3344');d.text((620*c+8,8),w+' / x=310 / anchor(310,450)',font=font,fill='#332c29')
s.convert('RGB').save(P/'previews/supine-x310.png')
# Decode actual supplied nearest-neighbour31px GIF.
g=Image.open(P/'previews/sleep-189-game-31px.gif');s=Image.new('RGB',(1600,624),'#f5efe3')
for n in [0,1]:g.seek(n);s.paste(g.convert('RGB').resize((1600,312),Image.Resampling.NEAREST),(0,n*312))
s.save(P/'previews/game31-decoded-frames.png')
# Canonical head contour comparison: true translated pixels, no resizing.
s=Image.new('RGBA',(1240,920),'#f5efe3')
for c,v in enumerate(['front','right']):
 dx,dy=(7,-12) if v=='front' else (-40,-13);f=B/f'final/horus/idle/horus-{v}.png';src=Image.open(f).convert('RGBA');im=Image.open(P/'png'/('horus-sleep-0.png' if v=='front' else 'horus-sleep-side-0.png')).convert('RGBA');ref=Image.new('RGBA',im.size);ref.alpha_composite(src,(dx,dy));r=np.array(ref);a=np.array(im);y,x=np.indices(r.shape[:2]);mask=(r[:,:,3]>128)&(r[:,:,2].astype(float)>r[:,:,0]*1.08)&(r[:,:,0]<160)&(y<400);mask &= ~((y>300)&(x>155)&(x<442));eq=np.all(a[mask]==r[mask],axis=1);print('actual crown',v,len(eq),int(eq.sum()))
 for n,q in enumerate([ref,im]):q=q.crop((20,40,570,440)).resize((550,400));s.alpha_composite(q,(c*620,n*450))
s.convert('RGB').save(P/'previews/horus-canonical-head-same-scale.png')
assert (P/'png/somang-sleep-0.png').read_bytes()==(B/'sleep-somang-v180/png/somang-sleep-0.png').read_bytes()
