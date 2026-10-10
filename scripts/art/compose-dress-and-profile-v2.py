from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np, shutil, json
D=Path('docs/art/chibi-refresh/directions'); B=D/'common-body-v1'; O=D/'common-body-v2-dress-and-profile'; O.mkdir(exist_ok=True)
for name,src in [('somang-source.png','/workspace/generated_images/exec-3d0f6901-a5e3-4de7-8a3b-0d3d62410810.png'),('set-sides-source.png','/workspace/generated_images/exec-14359844-fd49-409a-b40d-c10ef63d2ba4.png')]:
 if not (O/name).exists():shutil.copyfile(src,O/name)
W,H=620,720; dirs=['front','back','left','right'];views={who:[Image.open(B/f'{who}-{d}.png').convert('RGBA') for d in dirs] for who in ['set','somang','horus']}
def normalize(src,seams,tops,chins,shoes,bottoms):
 im=Image.open(O/src).convert('RGBA');out=[]
 for i in range(len(seams)-1):
  tile=im.crop((seams[i],0,seams[i+1],im.height)); a=np.array(tile);yy,xx=np.where(a[:,:,3]>128); l,r=int(xx.min()),int(xx.max())+1
  width=round((r-l)*360/(chins[i]-tops[i]));cv=Image.new('RGBA',(W,H));y=34
  for lo,hi,h in [(tops[i],chins[i],360),(chins[i],shoes[i],214),(shoes[i],bottoms[i],54)]:
   p=tile.crop((l,lo,r,hi)).resize((width,h),Image.Resampling.LANCZOS);cv.alpha_composite(p,((W-width)//2,y));y+=h
  out.append(cv)
 return out
views['set'][2:]=normalize('set-sides-source.png',[0,887,1774],[48,58],[470,470],[750,750],[831,831])
views['somang']=normalize('somang-source.png',[0,543,1086,1629,2172],[72,74,73,73],[389,389,389,389],[636,636,636,636],[690,690,690,690])
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',32);bg='#f3f0eb'
for who,vs in views.items():
 row=Image.new('RGBA',(W*4,H))
 for i,v in enumerate(vs):v.save(O/f'{who}-{dirs[i]}.png');row.alpha_composite(v,(W*i,0))
 row.save(O/f'{who}-4directions.png');jpg=Image.new('RGB',row.size,bg);jpg.paste(row,(0,0),row);jpg.save(O/f'{who}-4directions.jpg',quality=96)
board=Image.new('RGB',(2580,2465),bg);draw=ImageDraw.Draw(board)
for i,t in enumerate(['앞','뒤','왼쪽','오른쪽']):draw.text((100+i*W+W/2,26),t,font=font,fill='#4e4842',anchor='mt')
for r,who in enumerate(['set','somang','horus']):
 y=95+r*785;draw.text((36,y+14),{'set':'세트','somang':'소망','horus':'호루스 · 기준'}[who],font=font,fill='#4e4842')
 for i,v in enumerate(views[who]):board.paste(v,(100+i*W,y+48),v)
board.save(O/'trio-4directions.jpg',quality=96)
comp=Image.new('RGB',(W*4,H+80),bg);draw=ImageDraw.Draw(comp)
for i,(who,d) in enumerate([('set',2),('horus',2),('set',3),('horus',3)]):
 draw.text((i*W+W/2,15),'세트' if who=='set' else '호루스 · 기준',font=font,fill='#4e4842',anchor='mt');comp.paste(views[who][d],(i*W,70),views[who][d])
comp.save(O/'set-horus-profile-comparison.jpg',quality=96)
print(O)
