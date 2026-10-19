from PIL import Image,ImageDraw,ImageFilter
import numpy as np
from pathlib import Path
p=Path('horus_front_walk');src=Image.open(p/'horus-front-armed-walk-0.png').convert('RGBA');dst=Image.open(p/'horus-front-armed-walk-2.png').convert('RGBA')
# Copy source eye regions only; align to destination face (+5,+4px), preserve eyebrow/marking.
mask=Image.new('L',src.size);d=ImageDraw.Draw(mask)
for pts in [[(88,82),(142,80),(202,101),(237,134),(215,163),(168,177),(124,160),(105,132)],[(302,135),(320,100),(378,80),(474,77),(458,124),(427,157),(380,173),(337,168)]]:
 d.polygon([(x+450,y+400) for x,y in pts],fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(1))
shift=Image.new('RGBA',src.size);shift.paste(src,(5,4));ms=Image.new('L',src.size);ms.paste(mask,(5,4));out=Image.composite(shift,dst,ms);out.save(p/'eye-copy/horus-front-armed-walk-2.png')
a=np.array(dst);b=np.array(out);print('changed pixels',np.any(a!=b,axis=2).sum())
fs=[]
for im in [Image.open(p/'horus-front-armed-walk-0.png'),Image.open(p/'horus-front-armed-walk-1.png'),out]:
 im=im.convert('RGBA');bg=Image.new('RGBA',im.size,'#f5ebda');bg.alpha_composite(im);bg.thumbnail((600,480));fs.append(bg.convert('RGB'))
fs[0].save(p/'eye-copy/preview.gif',save_all=True,append_images=[fs[1],fs[2],fs[1]],duration=180,loop=0)
out.crop((450,400,1000,660)).save('/tmp/copiedeyes.png')
