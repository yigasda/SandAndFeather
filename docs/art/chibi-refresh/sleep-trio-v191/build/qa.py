from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from scipy.ndimage import label
import numpy as np,json,hashlib
P=Path('docs/art/chibi-refresh/sleep-trio-v191');B=P.parent
V=['set-sleep','horus-sleep','set-sleep-side','horus-sleep-side'];F=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',17)
report=[];sheet=Image.new('RGB',(1240,4*440),'#f5efe3');d=ImageDraw.Draw(sheet)
for row,v in enumerate(V):
 ims=[Image.open(P/'png'/f'{v}-{n}.png').convert('RGBA') for n in [0,1]];a,b=[np.array(i) for i in ims];ma,mb=a[:,:,3]>128,b[:,:,3]>128;outer=ma^mb;changed=np.any(a!=b,axis=2)&(ma|mb);share=float(outer.sum()/(ma|mb).sum());red=a.copy();red[outer]=[240,40,50,255]
 for c,im in enumerate(ims+[Image.fromarray(red)]):
  q=im.resize((310,360),Image.Resampling.NEAREST);sheet.paste(q,(310*c,row*440+35),q)
 y=row*440+6;d.text((8,y),f'{v}: 날숨0 | 들숨1 | 바깥선 차이 빨강 · {share:.1%}',font=F,fill='#222222')
 # Head/neck/arm join at double scale
 crop=ims[1].crop((145,325,475,470)).resize((310,136),Image.Resampling.NEAREST);sheet.paste(crop,(930,row*440+75),crop)
 aa,bb=[np.array(i.resize((33,39),Image.Resampling.NEAREST)) for i in ims];small=(aa[:,:,3]>128)^(bb[:,:,3]>128)
 for n,im in enumerate(ims):
  ls,num=label(np.array(im)[:,:,3]>128,np.ones((3,3)));sizes=np.bincount(ls.ravel())[1:]
  assert not (np.array(im)[0,:,3].any() or np.array(im)[-1,:,3].any() or np.array(im)[:,0,3].any() or np.array(im)[:,-1,3].any()),(v,n,'clipped')
  assert not np.any(sizes<9),(v,n,'stray component')
 report.append({'variant':v,'silhouetteChange':round(share,5),'bbox0':ims[0].getbbox(),'bbox1':ims[1].getbbox(),'bboxChanged':ims[0].getbbox()!=ims[1].getbbox(),'exteriorPixels':int(outer.sum()),'game31ExteriorPixels':int(small.sum()),'changedPixels':int(changed.sum())})
 allred=a.copy();allred[changed]=[240,40,50,255];bg=Image.new('RGBA',(620,720),'#f5efe3');bg.alpha_composite(Image.fromarray(allred));bg.convert('RGB').save(P/'previews'/f'{v}-all-changes-red.png')
sheet.save(P/'previews/breathing-exterior-red.png');(P/'checks/breathing-differences.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
# Requested axis, and same-scale reference/user sketch comparison
s=Image.new('RGBA',(1240,750),'#f5efe3');d=ImageDraw.Draw(s)
for c,w in enumerate(['set','horus']):
 im=Image.open(P/'png'/f'{w}-sleep-0.png').convert('RGBA');s.alpha_composite(im,(620*c,30));x=620*c+310;d.line((x,30,x,749),fill='#dd3344',width=2);d.ellipse((x-5,475,x+5,485),fill='#dd3344');d.text((620*c+8,5),w+' / x=310 / body-center(310,450)',font=F,fill='#332c29')
s.convert('RGB').save(P/'previews/supine-x310.png')
ref=Image.open(B/'notes/sleep-front-pose-sketch.jpg').crop((120,570,880,1640));ref.thumbnail((430,670));s=Image.new('RGB',(1670,760),'#f5efe3');d=ImageDraw.Draw(s);s.paste(ref,(0,55));d.text((6,10),'사용자 자세 예시',font=F,fill='#222222')
for c,w in enumerate(['set','horus']):
 im=Image.open(P/'png'/f'{w}-sleep-0.png');s.paste(im,(430+c*620,35),im);d.text((435+c*620,10),w+' · 다리를 곧게, 밑창이 보이는 누운 발',font=F,fill='#222222')
s.save(P/'previews/user-sketch-comparison.png')
for v in V:
 who=v.split('-')[0];direction='right' if 'side' in v else 'front';s=Image.new('RGB',(1550,400),'#f5efe3');d=ImageDraw.Draw(s)
 fs=[B/f'final/{who}/idle/{who}-{direction}.png',B/f'final/{who}/walk/{who}-{direction}-0.png',P/f'png/{v}-0.png',P/f'png/{v}-1.png',P/'references/somang-sleep-0.png']
 for c,f in enumerate(fs):
  im=Image.open(f).convert('RGBA')
  if c==1:
   im=im.resize((628,698),Image.Resampling.NEAREST);base=Image.new('RGBA',(620,720));base.alpha_composite(im,(-4,16));im=base
  q=im.resize((310,360),Image.Resampling.NEAREST);s.paste(q,(c*310,30),q);d.text((c*310+5,5),['정지','걷기','날숨0','들숨1','소망180'][c],font=F,fill='#222222')
 s.save(P/'previews'/f'{v}-idle-walk-comparison.png')
for n in [0,1]:assert (P/f'references/somang-sleep-{n}.png').read_bytes()==(B/f'sleep-trio-v189/png/somang-sleep-{n}.png').read_bytes()
