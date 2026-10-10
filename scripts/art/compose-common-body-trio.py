"""Compose newly body-redesigned sheets; retain original source renders."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import shutil,json
D=Path('docs/art/chibi-refresh/directions'); O=D/'common-body-v1'; O.mkdir(exist_ok=True)
cfg={
 'set':{'source':'/workspace/generated_images/exec-d4eca445-1ed7-476c-bb63-273ecba0e173.png','seams':[0,534,1045,1608,2159],'top':[26,23,21,17],'chin':[389,389,378,378],'shoe':[633,630,633,633],'bottom':[692,687,693,693]},
 'somang':{'source':'/workspace/generated_images/exec-2e57d116-fe2e-4859-b6ec-0a4a03e3746b.png','seams':[0,529,1060,1591,2159],'top':[13,13,8,8],'chin':[368,368,370,370],'shoe':[648,646,648,648],'bottom':[712,709,711,711]},
 'horus':{'source':str(D/'horus-idle-v5-small-hands.png'),'seams':[0,453,1003,1543,2160],'top':[19]*4,'chin':[399,394,397,397],'shoe':[625,621,625,625],'bottom':[682,678,682,682]}}
W,H=620,720; views={};labels={'set':'세트','somang':'소망','horus':'호루스 · 기준'}
for who,c in cfg.items():
 path=O/f'{who}-source.png'
 if not path.exists():shutil.copyfile(c['source'],path)
 im=Image.open(path).convert('RGBA');views[who]=[]
 for i in range(4):
  x0,x1=c['seams'][i:i+2];tile=im.crop((x0,0,x1,im.height));a=np.array(tile)
  yy,xx=np.where(a[:,:,3]>128);left,right=int(xx.min()),int(xx.max())+1
  scale=360/(c['chin'][i]-c['top'][i]);width=round((right-left)*scale)
  canvas=Image.new('RGBA',(W,H));dy=34
  for y0,y1,dh in [(c['top'][i],c['chin'][i],360),(c['chin'][i],c['shoe'][i],214),(c['shoe'][i],c['bottom'][i],54)]:
   part=tile.crop((left,y0,right,y1)).resize((width,dh),Image.Resampling.LANCZOS)
   canvas.alpha_composite(part,((W-width)//2,dy));dy+=dh
  canvas.save(O/f'{who}-{["front","back","left","right"][i]}.png');views[who].append(canvas)
 row=Image.new('RGBA',(W*4,H))
 for i,v in enumerate(views[who]):row.alpha_composite(v,(W*i,0))
 row.save(O/f'{who}-4directions.png')
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',32)
board=Image.new('RGB',(2580,2465),'#f3f0eb');draw=ImageDraw.Draw(board)
for i,t in enumerate(['앞','뒤','왼쪽','오른쪽']):draw.text((100+i*W+W/2,26),t,font=font,fill='#4e4842',anchor='mt')
for r,who in enumerate(['set','somang','horus']):
 y=95+r*785;draw.text((36,y+14),labels[who],font=font,fill='#4e4842')
 for i,v in enumerate(views[who]):
  x=100+i*W;draw.line((x+55,y+710,x+W-55,y+710),fill='#d4cbc1',width=2);board.paste(v,(x,y+48),v)
board.save(O/'trio-4directions.jpg',quality=96)
front=Image.new('RGB',(W*3,H+100),'#f3f0eb');draw=ImageDraw.Draw(front)
for i,who in enumerate(['set','somang','horus']):
 draw.text((W*i+W/2,20),labels[who],font=font,fill='#4e4842',anchor='mt');front.paste(views[who][0],(W*i,70),views[who][0])
front.save(O/'trio-front.jpg',quality=96)
(O/'composition.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n')
print(O/'trio-4directions.jpg')
