from PIL import Image,ImageDraw
from pathlib import Path
import hashlib,json
r=Path('/workspace/SandAndFeather-git/docs/art/chibi-refresh');p=r/'sleep-selected-v198';bg=(245,239,226)
for f in [0,1]:
    s=Image.new('RGB',(1860,756),bg);d=ImageDraw.Draw(s)
    files=[r/'final/horus/idle/horus-right.png',r/f'sleep-set-horus-v195/png/horus-sleep-side-{f}.png',p/f'png/horus-sleep-side-{f}.png']
    for i,(file,label) in enumerate(zip(files,['IDLE reference','195 BEFORE','198 AFTER / outer contour only'])):
        im=Image.open(file).convert('RGBA');s.paste(im,(620*i,36),im);d.text((620*i+12,12),label,fill=(45,35,30))
    s.save(p/f'previews/horus-side-{f}-before-after.png')
    s.crop((620,245,1860,625)).resize((1240,380)).save(p/f'previews/horus-side-{f}-detail.png')
    a=Image.open(files[1]).convert('RGBA');b=Image.open(files[2]).convert('RGBA');diff=Image.new('RGB',a.size,bg)
    for y in range(a.height):
      for x in range(a.width):
        if a.getpixel((x,y))!=b.getpixel((x,y)):diff.putpixel((x,y),(230,20,35))
    diff.save(p/f'previews/horus-side-{f}-difference.png')
frames=[]
for f in [0,1]:
    s=Image.new('RGB',(620,720),bg);im=Image.open(p/f'png/horus-sleep-side-{f}.png');s.paste(im,(0,0),im);frames.append(s)
frames[0].save(p/'previews/horus-side.gif',save_all=True,append_images=frames[1:],duration=800,loop=0)
thumbs=[im.resize((34,39),Image.Resampling.LANCZOS) for im in frames]
thumbs[0].save(p/'previews/horus-side-game.gif',save_all=True,append_images=thumbs[1:],duration=800,loop=0)
m=json.loads((p/'manifest.json').read_text());checks=[]
for a in m['files']:
    assert hashlib.sha256((p/a['path']).read_bytes()).hexdigest()==a['sha256']
    if a['artApproved']:
        src=r/a['sourcePath'];assert src.read_bytes()==(p/a['path']).read_bytes();checks.append(a['path'])
(p/'checks/approved-preserved.json').write_text(json.dumps({'unchangedApprovedFiles':checks,'count':len(checks)},indent=2)+'\n')
print('6 approved PNGs unchanged; before/after/difference/GIF ready')
# Added Set arm edit: each frame shown before and after at identical scale.
rows=[]
for f in [0,1]:
    row=Image.new('RGB',(1240,756),bg);d=ImageDraw.Draw(row)
    for col,(folder,label) in enumerate([('sleep-set-horus-v197','197 BEFORE'),('sleep-selected-v198','198 AFTER / shorter raised arm')]):
        im=Image.open(r/folder/f'png/set-sleep-{f}.png').convert('RGBA');row.paste(im,(620*col,36),im);d.text((620*col+10,12),label+' '+str(f),fill=(45,35,30))
    row.save(p/f'previews/set-front-{f}-before-after.png');rows.append(row.resize((620,378)))
sheet=Image.new('RGB',(1240,756),bg)
for f in [0,1]:
    sheet.paste(rows[f],(0,f*378))
    h=Image.open(p/f'previews/horus-side-{f}-before-after.png').crop((620,0,1860,756)).resize((620,378));sheet.paste(h,(620,f*378))
sheet.save(p/'previews/four-edits-before-after.png')
frames=[]
for f in [0,1]:
    s=Image.new('RGB',(1240,378),bg);d=ImageDraw.Draw(s)
    for i,stem in enumerate(['set-sleep','set-sleep-side','horus-sleep','horus-sleep-side']):
        im=Image.open(p/f'png/{stem}-{f}.png').convert('RGBA').resize((310,360),Image.Resampling.LANCZOS);s.paste(im,(310*i,18),im);d.text((310*i+6,2),stem,fill=(50,40,30))
    frames.append(s)
frames[0].save(p/'previews/selected-eight.gif',save_all=True,append_images=frames[1:],duration=800,loop=0)
