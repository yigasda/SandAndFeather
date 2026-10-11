from PIL import Image,ImageDraw,ImageFont,ImageOps
from pathlib import Path
import json
B=Path('docs/art/chibi-refresh');P=B/'sit-trio-v183';font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17);placements=json.loads((P/'checks/placement.json').read_text())
def ref(w,d,typ):
 f=B/'final'/w/typ/(f'{w}-{d}'+('-0' if typ=='walk' else '')+'.png');im=Image.open(f).convert('RGBA')
 if typ=='walk':
  im=im.resize((628,698),Image.Resampling.NEAREST);out=Image.new('RGBA',(620,720));out.alpha_composite(im,(-4,16));return out
 return im
for bg,tag in [('#f5efe3','light'),('#263142','dark')]:
 overview=Image.new('RGB',(930,5*384),bg);dr=ImageDraw.Draw(overview)
 for c,w in enumerate(['set','somang','horus']):
  poses=[('left','floor'),('right','floor'),('back','floor'),('back','stool'),('right','bench')];sheet=Image.new('RGB',(930,5*384),bg);sd=ImageDraw.Draw(sheet)
  for row,(d,pose) in enumerate(poses):
   p=B/'sit-somang-v179/png/somang-left-0.png' if w=='somang' and d=='left' else P/'png'/f'{w}-{d}-{pose}-0.png';im=Image.open(p).convert('RGBA');label=f'{w} {d} {pose}'+(' REF179' if w=='somang' and d=='left' else '')
   small=im.resize((310,im.height//2),Image.Resampling.NEAREST);overview.paste(small,(c*310,row*384+24-(12 if im.height==744 else 0)),small);dr.text((c*310+5,row*384+3),label,font=font,fill='white' if tag=='dark' else '#332c29')
   for col,(img,lab) in enumerate([(ref(w,d,'idle'),'IDLE'),(Image.open(p).convert('RGBA'),pose.upper()),(ref(w,d,'walk'),'WALK')]):
    pad=12 if img.height==744 else 0;img=img.resize((310,img.height//2),Image.Resampling.NEAREST);sheet.paste(img,(col*310,row*384+24-pad),img);sd.text((col*310+5,row*384+3),f'{d} {lab}',font=font,fill='white' if tag=='dark' else '#332c29')
  sheet.save(P/'previews'/f'{w}-comparison-{tag}.png')
 overview.save(P/'previews'/f'sitting-14-and-ref179-{tag}.png')
# Comparison only left mirrored over separately drawn right floor pose.
s=Image.new('RGB',(930,600),'#263142');dr=ImageDraw.Draw(s)
for c,w in enumerate(['set','somang','horus']):
 lf=B/'sit-somang-v179/png/somang-left-0.png' if w=='somang' else P/'png'/f'{w}-left-floor-0.png';l=ImageOps.mirror(Image.open(lf).convert('RGBA'));r=Image.open(P/'png'/f'{w}-right-floor-0.png').convert('RGBA');ov=Image.blend(l,r,.5).resize((310,360));s.paste(ov,(310*c,30),ov);dr.text((310*c+5,5),f'{w} mirrored L + R',font=font,fill='white')
 for off,img in [(395,l),(495,r)]:im=img.crop((80,420,560,700)).resize((170,100));s.paste(im,(310*c+70,off),im)
s.save(P/'previews/arms-mirror-comparison.png')
