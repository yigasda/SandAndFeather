from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib
from scipy.ndimage import label
B=Path('docs/art/chibi-refresh');P=B/'sleep-set-front-v193';O=P/'previews';O.mkdir(exist_ok=True);F=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',19)
def load(p):return Image.open(p).convert('RGBA')
old=[load(B/'sleep-set-v192/png'/f'set-sleep-{n}.png') for n in range(2)];new=[load(P/'png'/f'set-sleep-{n}.png') for n in range(2)];idle=load(B/'final/set/idle/set-front.png');walk=load(B/'final/set/walk/set-front-0.png').resize((628,698),Image.Resampling.NEAREST);w=Image.new('RGBA',(620,720));w.alpha_composite(walk,(-4,16))
def sheet(ims,names,path,color='#f5efe3'):
 s=Image.new('RGB',(310*len(ims),396),color);d=ImageDraw.Draw(s)
 for j,im in enumerate(ims):
  q=im.resize((310,360),Image.Resampling.NEAREST);s.paste(q,(j*310,32),q);d.text((j*310+8,5),names[j],font=F,fill='white' if color=='#263142' else '#242020')
 s.save(path)
sheet([idle,w,*new],['최종 정지','최종 걷기','정면 수정 0','정면 수정 1'],O/'comparison.png')
sheet([old[0],new[0],old[1],new[1]],['192 이전 0','193 수정 0','192 이전 1','193 수정 1'],O/'before-after.png')
sheet(new,['날숨 0','들숨 1'],O/'front-dark.png','#263142');sheet(new,['날숨 0','들숨 1'],O/'front-light.png')
frames=[]
for im in new:
 s=Image.new('RGBA',(620,720),'#f5efe3');s.alpha_composite(im);frames.append(s.convert('RGB'))
frames[0].save(O/'front-breathing.gif',save_all=True,append_images=frames[1:],duration=[800,800],loop=0,disposal=2)
small=[im.resize((33,39),Image.Resampling.LANCZOS) for im in frames];small[0].save(O/'front-31px.gif',save_all=True,append_images=small[1:],duration=800,loop=0,disposal=2)
large=[im.resize((264,312),Image.Resampling.NEAREST) for im in small];large[0].save(O/'front-31px-enlarged.gif',save_all=True,append_images=large[1:],duration=800,loop=0,disposal=2)
checks=[]
for n in range(2):
 a,b=np.array(old[n]),np.array(new[n]);m=np.frombuffer(Path(f'/workspace/actions193/protect{n}.mask').read_bytes(),dtype='uint8').reshape(720,620).astype(bool)
 diff=np.any(a!=b,axis=2);assert not diff[m].any();l,num=label(b[:,:,3]>128);sz=np.bincount(l.ravel())[1:];assert sz.min()>20,sz
 checks.append({'frame':n,'protectedPixels':int(m.sum()),'changedProtectedPixels':int(diff[m].sum()),'changedTotal':int(diff.sum()),'alphaComponents':int(num),'bbox':new[n].getbbox()})
 # face, ear, collar local comparison, each crop at 2x.
 s=Image.new('RGB',(1240,410),'#f5efe3')
 for j,im in enumerate([old[n],new[n]]):
  q=im.crop((155,215,465,405)).resize((620,380),Image.Resampling.NEAREST);s.paste(q,(j*620,30),q)
 ImageDraw.Draw(s).text((10,3),'이전 얼굴·몸 / 머리 수정 후',font=F,fill='#222222');s.save(O/f'boundary-{n}.png')
(P/'checks/protected-pixels.json').write_text(json.dumps(checks,indent=2)+'\n');print(checks)
