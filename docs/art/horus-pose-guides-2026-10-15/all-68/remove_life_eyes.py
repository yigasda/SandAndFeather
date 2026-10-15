from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json, zipfile, shutil
root=Path('/workspace/horus-all-frame-guides')
out=root/'life-no-eyes';out.mkdir(exist_ok=True)
m=json.loads((root/'manifest.json').read_text())
# Coordinates are measured on the white previews; scaled to each original.
boxes={43:[(201,253,330,290)],44:[(247,276,280,300),(299,294,347,322)],46:[(137,259,355,307)],47:[(69,241,326,299)],48:[(150,256,343,315)],49:[(145,256,340,316)],50:[(260,249,333,285)]}
frames=m['frames'][42:50]
sheet=Image.new('RGB',(1200,1000),'white')
for i,f in enumerate(frames):
 n=f['number'];im=Image.open(root/f['clean_diagram']).convert('RGBA');preview=Image.open(f'/workspace/eye-{n}.png')
 sx,sy=im.width/preview.width,im.height/preview.height
 alpha=im.getchannel('A');d=ImageDraw.Draw(alpha)
 for b in boxes.get(n,[]):d.rectangle(tuple(round(v*(sx if j%2==0 else sy)) for j,v in enumerate(b)),fill=0)
 im.putalpha(alpha);im.save(out/Path(f['clean_diagram']).name)
 bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im);bg=bg.convert('RGB');bg.thumbnail((290,460))
 x=(i%4)*300+(300-bg.width)//2;y=(i//4)*500
 sheet.paste(bg,(x,y));ImageDraw.Draw(sheet).text(((i%4)*300+12,y+475),f"{n} {f['id']}",fill='black')
 # Generation references use white-backed diagrams for clear visibility.
 bgfull=Image.new('RGBA',im.size,'white');bgfull.alpha_composite(im)
 bgfull.convert('RGB').save(out/(Path(f['clean_diagram']).stem+'-white.png'))
sheet.save(out/'life-no-eyes-sheet.png')
guide=Path('/workspace/horus-redraw-68/08-life-input-guide.png')
if guide.exists():
 backup=guide.with_name('08-life-input-guide-with-eyes.png')
 if not backup.exists():shutil.copy2(guide,backup)
 shutil.copy2(out/'life-no-eyes-sheet.png',guide)
(out/'README.txt').write_text('Life pose guides: eye outlines, eyelids, lashes and pupils removed. Body, hands, props, brows and mouth retained. Use original character image for appearance. Preserve diagram body poses. Surprise: do not use its pose diagram. Emotion prompts only: shy = slightly shy; surprise = slightly surprised.\n')
with zipfile.ZipFile(root/'life-no-eyes.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in out.iterdir():z.write(p,p.name)
print(out/'life-no-eyes-sheet.png')
