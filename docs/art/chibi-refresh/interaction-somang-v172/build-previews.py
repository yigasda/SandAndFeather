from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import subprocess,json
from concurrent.futures import ThreadPoolExecutor
P=Path('docs/art/chibi-refresh/interaction-somang-v172');F=Path('docs/art/chibi-refresh/final/somang');V=P/'previews';V.mkdir(exist_ok=True)
dirs=['front','back','left','right'];font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
def sprite(path):return Image.open(path).convert('RGBA')
def walk(d,i):
 im=sprite(F/'walk'/f'somang-{d}-{i}.png').resize((628,698),Image.Resampling.NEAREST);out=Image.new('RGBA',(620,720));out.alpha_composite(im,(-4,16));return out
for name,bg,fg in [('light','#f5efe3','#342c29'),('dark','#253041','#ffffff')]:
 sheet=Image.new('RGB',(1860,1576),bg);draw=ImageDraw.Draw(sheet)
 for row,d in enumerate(dirs):
  imgs=[sprite(F/'idle'/f'somang-{d}.png')]+[sprite(P/'png'/f'somang-{d}-{i}.png') for i in range(2)]+[walk(d,i) for i in range(3)]
  for col,(im,label) in enumerate(zip(imgs,['IDLE','REACH 0','CONTACT 1','WALK 0','WALK 1','WALK 2'])):
   im=im.resize((310,360),Image.Resampling.NEAREST);x=col*310;y=row*394
   draw.text((x+12,y+8),d.upper()+' / '+label,font=font,fill=fg);sheet.paste(im,(x,y+32),im)
 sheet.save(V/f'idle-interaction-walk-{name}.png')
# Native-resolution seam previews: neck / sleeves / hands and lower body for all frames.
for part,box in [('connections',(80,325,560,535)),('feet',(150,545,470,680))]:
 w,h=box[2]-box[0],box[3]-box[1];sheet=Image.new('RGB',(w*2,(h+32)*4),'#253041');draw=ImageDraw.Draw(sheet)
 for row,d in enumerate(dirs):
  for i in range(2):
   im=sprite(P/'png'/f'somang-{d}-{i}.png').crop(box);x=i*w;y=row*(h+32);draw.text((x+10,y+7),f'{d} {i}',font=font,fill='white');sheet.paste(im,(x,y+32),im)
 sheet.save(V/f'{part}-dark.png')
frames=[]
for phase in ['idle',0,1]:
 out=Image.new('RGB',(620,788),'#f5efe3');draw=ImageDraw.Draw(out)
 for n,d in enumerate(dirs):
  path=F/'idle'/f'somang-{d}.png' if phase=='idle' else P/'png'/f'somang-{d}-{phase}.png'
  im=sprite(path).resize((310,360),Image.Resampling.NEAREST);x=(n%2)*310;y=(n//2)*394
  draw.text((x+12,y+8),d.upper()+' / '+str(phase).upper(),font=font,fill='#342c29');out.paste(im,(x,y+32),im)
 frames.append(out)
frames[0].save(V/'somang-interaction-four-directions.gif',save_all=True,append_images=frames[1:],duration=[1200,150,150],loop=0,disposal=2)
for i,f in enumerate(frames):f.save(V/f'playback-{i}.png')
