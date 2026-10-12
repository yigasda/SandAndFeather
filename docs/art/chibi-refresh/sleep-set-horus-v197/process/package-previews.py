from PIL import Image, ImageDraw
from pathlib import Path
import json, hashlib
root=Path('/workspace/SandAndFeather-git/docs/art/chibi-refresh')
p=root/'sleep-set-horus-v197'; bg=(245,239,226)
names=['set-sleep','set-sleep-side','horus-sleep','horus-sleep-side']
frames=[]; game=[]
for f in range(2):
    sheet=Image.new('RGB',(1240,390),bg); d=ImageDraw.Draw(sheet)
    small=Image.new('RGB',(136,49),bg)
    for i,n in enumerate(names):
        im=Image.open(p/f'png/{n}-{f}.png').convert('RGBA')
        sheet.paste(im.resize((310,360),Image.Resampling.LANCZOS),(310*i,25),im.resize((310,360),Image.Resampling.LANCZOS))
        d.text((310*i+8,6),n,fill=(60,50,40))
        thumb=im.resize((34,39),Image.Resampling.LANCZOS); small.paste(thumb,(34*i,5),thumb)
    frames.append(sheet);game.append(small)
frames[0].save(p/'previews/breathing-all.gif',save_all=True,append_images=frames[1:],duration=800,loop=0)
game[0].save(p/'previews/breathing-31px.gif',save_all=True,append_images=game[1:],duration=800,loop=0)
beds=Image.new('RGB',(960,1020),bg); draw=ImageDraw.Draw(beds)
s=160/576
for row,who in enumerate(['set','horus']):
    for col,paired in enumerate([False,True]):
        bed=Image.open(f'/workspace/actions197/{who}-bed.png').convert('RGBA')
        placements=[]
        if paired:
            placements=[(p/f'png/{who}-sleep-side-0.png',(390 if who=='set' else 350,238),(162,100)),(root/'sleep-somang-v180/png/somang-sleep-0.png',(263,248),(298,100))]
        else:placements=[(p/f'png/{who}-sleep-0.png',(310,232),(230,100))]
        for path,head,pillow in placements:
            im=Image.open(path).convert('RGBA'); im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
            bed.alpha_composite(im,(round(pillow[0]-head[0]*s),round(pillow[1]-head[1]*s)))
        beds.paste(bed.convert('RGB'),(col*480,row*510+30));draw.text((col*480+8,row*510+8),who+(' + Somang / composition only' if paired else ' / alone / composition only'),fill=(50,40,30))
beds.save(p/'previews/beds-alone-together.png')
manifest=json.loads((p/'manifest.json').read_text())
for item in manifest['files']:
    assert hashlib.sha256((p/item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
print('8 PNG hashes verified; previews written')
