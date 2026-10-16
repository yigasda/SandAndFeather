from PIL import Image,ImageDraw
from pathlib import Path
import random,math,json,hashlib
folder=Path('docs/art/desert-stela-impact-rotate-2026-10-16')
src=Image.open('docs/art/desert-stela-impact-revisions-2026-10-16/wide.png').convert('RGBA')
box=(790,530,1215,780)
part=src.crop(box)
rot=part.rotate(30,resample=Image.Resampling.NEAREST,expand=True)
canvas=Image.new('RGBA',(660,570)); ox=(660-rot.width)//2+28;oy=(570-rot.height)//2-22
# Transform original local contact point with the same center rotation.
x,y=40,180;cx,cy=part.width/2,part.height/2;t=math.radians(30)
px=ox+rot.width/2+(x-cx)*math.cos(t)+(y-cy)*math.sin(t)
py=oy+rot.height/2-(x-cx)*math.sin(t)+(y-cy)*math.cos(t)
dust=Image.new('RGBA',canvas.size);d=ImageDraw.Draw(dust);rng=random.Random(34)
# A fan of chunky sand clusters projected outward from the rounded impact tip.
for i in range(65):
 angle=math.radians(rng.uniform(135,280));distance=rng.uniform(17,105)
 x=round((px+math.cos(angle)*distance)/2)*2;y=round((py+math.sin(angle)*distance*.65)/2)*2
 r=rng.choice([2,2,3,4,5,7]) if distance>55 else rng.choice([4,6,8,10])
 color=rng.choice([(206,154,91,255),(226,178,111,255),(241,199,137,255),(249,217,164,255)])
 d.polygon([(x-r,y-r//2),(x-r//2,y-r),(x+r//2,y-r),(x+r,y),(x+r//2,y+r),(x-r//2,y+r)],fill=color)
 if r>=5:d.rectangle((x-r//2,y-r+1,x+1,y-r//2+1),fill=(251,222,174,255))
canvas.alpha_composite(dust);canvas.alpha_composite(rot,(ox,oy))
p=folder/'impact.png';canvas.save(p)
part.save(folder/'source-frame.png')
m={'status':'review-pending','source':'docs/art/desert-stela-impact-revisions-2026-10-16/wide.png','sourceCrop':box,'rotationDegrees':30,'method':'Pillow nearest-neighbor rigid 2D rotation, no image generation, no resizing/repainting body; added sand fan on separate layer','output':'standalone replacement for cell8; original sheet unmodified','size':list(canvas.size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'runtimeApplied':False}
(folder/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
