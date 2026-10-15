from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math
p=Path('/workspace/horus-all-frame-guides');m=json.loads((p/'manifest.json').read_text());font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
o=Image.new('RGB',(2400,2170),'white');d=ImageDraw.Draw(o);d.text((20,15),'68프레임 — 기존 머리카락·얼굴 외곽 제거',font=ImageFont.truetype(font,34),fill='black')
for j,f in enumerate(m['frames']):
 im=Image.open(p/f['clean_diagram']).crop(f['crop']);im.thumbnail((280,180));x=j%8*300;y=100+j//8*230;o.paste(im,(x+(300-im.width)//2,y),im);d.text((x+8,y+185),str(j+1)+' '+f['state'],font=ImageFont.truetype(font,16),fill='black');d.text((x+8,y+208),f['direction']+' '+str(f['frame']),font=ImageFont.truetype(font,14),fill='black')
o.save(p/'00-clean-68-index.png')
