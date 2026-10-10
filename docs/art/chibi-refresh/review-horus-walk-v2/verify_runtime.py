"""Read-only validation against both runtime atlases; reproduce phone draw placement."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,importlib.util,math,hashlib
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('packer',R/'tools/art/pack-trio-motion.py');packer=importlib.util.module_from_spec(spec);spec.loader.exec_module(packer)
m=json.loads((R/'data/sprites.json').read_text())['looks']['horus']['motion']
man=json.loads((R/'docs/art/chibi-refresh/approved/manifest.json').read_text())
checks=[]
for table in [m,m['small']]:
 atlas=Image.open(R/'data'/table['file']).convert('RGBA');k=table['visible']/330
 for i,rect in enumerate(table['walk']['down']):
  f=next(f for f in man['frames'] if f['id']==f'horus.walk.down.{i}')
  im=packer.scaled(R/f['path'],k);x0,y0,x1,y1=f['alphaBounds'];box=[max(0,int(x0*k)-2),max(0,int(y0*k)-2),min(im.width,int(x1*k+.999)+2),min(im.height,int(y1*k+.999)+2)]
  expected=im.crop(box);actual=atlas.crop((rect[0],rect[1],rect[0]+rect[2],rect[1]+rect[3]));diff=int(np.any(np.array(actual)!=np.array(expected),axis=2).sum());assert diff==0
  checks.append({'atlas':table['file'],'phase':i,'different_pixels':diff})
# Exact motionPerson phone zoom=4: source offsets scaled by height*zoom/330,
# nearly 1:1 small atlas, integer destination placement, source pivot retained.
atlas=Image.open(R/'data'/m['small']['file']).convert('RGBA');new=[]
for i in range(3):
 path=O/f'frames/horus-front-{i}.png';im=Image.open(path);k=125/330;x0,y0,x1,y1=im.getbbox();small=packer.scaled(path,k);box=[max(0,int(x0*k)-2),max(0,int(y0*k)-2),min(small.width,int(x1*k+.999)+2),min(small.height,int(y1*k+.999)+2)]
 new.append((small.crop(box),[round(180*k-box[0],2),round(370*k-box[1],2)]))
rnd=lambda x:math.floor(x+.5)
frames=[]
for phase,(ox,oy) in zip(m['sequence'],m['offsets']['down']):
 c=Image.new('RGBA',(400,220),(248,243,231,255));d=ImageDraw.Draw(c);d.text((45,18),'CURRENT IN GAME',fill='#493e36');d.text((245,18),'FINAL ART',fill='#493e36')
 for col in range(2):
  fx=100+col*200;fy=190
  if col==0:
   r=m['small']['walk']['down'][phase];piece=atlas.crop((r[0],r[1],r[0]+r[2],r[1]+r[3]));pivot=r[4:6]
  else:piece,pivot=new[phase]
  step=m['height']*4/m['offsetRef'];c.alpha_composite(piece,(rnd(fx+ox*step-pivot[0]),rnd(fy+oy*step-pivot[1])))
 frames.append(c.convert('RGB').resize((800,440),Image.Resampling.NEAREST))
strip=Image.new('RGB',(3200,440))
for i,f in enumerate(frames):strip.paste(f,(i*800,0))
pal=strip.quantize(colors=256);g=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
g[0].save(O/'133-runtime-motion-comparison.gif',save_all=True,append_images=g[1:],duration=[m['frameMs']]*4,loop=0,disposal=2,optimize=False)
r=json.loads((O/'validation.json').read_text());r['runtime_atlas_checks']=checks;r['runtime_preview']={'zoom':4,'visible_atlas_height':125,'renderer':'src/world/render.js motionPerson rounding and pivots reproduced','actual_game_atlas_used':True,'browser_test':False};(O/'validation.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print(checks)
