from pathlib import Path
from PIL import Image
import hashlib,json
root=Path('docs/art');out=root/'desert-sandstone-stela-approved-2026-10-16';(out/'frames').mkdir(exist_ok=True)
base=root/'desert-sandstone-stela-motion-2026-10-16/sheet.png';guard=root/'desert-sandstone-stela-charge-2026-10-16/sheet.png';impact=root/'desert-stela-impact-rotate-2026-10-16/impact.png'
a=Image.open(base).convert('RGBA');b=Image.open(guard).convert('RGBA')
names=['idle0','idle1','idle2','guard','prepare0','prepare1','slam0','slam1','hit','defeat']
# Boundaries are in transparent gaps, not automatic equal-cell cuts.
xs=[0,400,800,1215,1540,1983]; items=[]
for i,name in enumerate(names):
 row,col=divmod(i,5);box=(xs[col],0 if row==0 else 398,xs[col+1],398 if row==0 else 793);source=base
 if i==3: source=guard;box=(1064,0,1419,450);im=b.crop(box)
 elif i==7:source=impact;box=None;im=Image.open(impact).convert('RGBA')
 else:im=a.crop(box)
 bb=im.getchannel('A').getbbox();im=im.crop(bb)
 assert im.width<=480 and im.height<=480,(name,im.size)
 frame=Image.new('RGBA',(520,520));offset=((520-im.width)//2,490-im.height);frame.paste(im,offset)
 fp=out/'frames'/f'{i:02d}-{name}.png';frame.save(fp)
 # Exact pixel-copy assertion: no interpolation, resizing, or repainting.
 assert frame.crop((offset[0],offset[1],offset[0]+im.width,offset[1]+im.height)).tobytes()==im.tobytes()
 items.append({'index':i,'state':name,'source':str(source),'sourceCrop':box,'alphaTrim':bb,'placement':offset,'sha256':hashlib.sha256(fp.read_bytes()).hexdigest()})
sheet=Image.new('RGBA',(2600,1040))
for i,name in enumerate(names):sheet.paste(Image.open(out/'frames'/f'{i:02d}-{name}.png'),((i%5)*520,(i//5)*520))
sheet.save(out/'sheet.png')
manifest={'status':'adopted','userEvidence':'굿 채택. 두번째 시안의 방어만 떼와서 10장 최종 채택하자','method':'lossless crop and paste only; no regeneration or resizing','frameSize':[520,520],'frameOrder':names,'frames':items,'sheetSha256':hashlib.sha256((out/'sheet.png').read_bytes()).hexdigest(),'runtimeApplied':False,'alignment':'visual bottom alignment for review; runtime pivots/timing not validated','defeat':'original first sheet broken-stone defeat retained; only guard and impact replaced'}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('10 frames verified; RGBA 2600x1040')
