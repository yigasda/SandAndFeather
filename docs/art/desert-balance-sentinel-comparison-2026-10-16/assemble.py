from PIL import Image
from pathlib import Path
import json,hashlib
import numpy as np
from scipy.ndimage import label, distance_transform_edt
root=Path('/workspace/SandAndFeather');d=root/'docs/art/desert-balance-sentinel-comparison-2026-10-16';d.mkdir(exist_ok=True)
a=root/'docs/art/desert-balance-sentinel-motion-2026-10-16/sheet.png';b=root/'docs/art/desert-balance-sentinel-idle-hit-redraw-2026-10-16/sheet.png'
old=Image.open(a).convert('RGBA');new=Image.open(b).convert('RGBA')
arr=np.array(old); labs,_=label(arr[:,:,3]>128)
seeds=np.zeros(labs.shape,dtype=np.int16)
for ident,slot in [(4,0),(3,1),(2,2),(5,3),(1,4),(6,5),(8,6),(9,7),(7,8),(25,9)]: seeds[labs==ident]=slot+1
_,indices=distance_transform_edt(seeds==0,return_indices=True)
owners=seeds[tuple(indices)]
canvas=Image.new('RGBA',(2500,1000));records=[]
for slot in range(10):
 if slot in [0,1,2,8]:
  n={0:0,1:1,2:2,8:3}[slot];box=(543*n,0,543*(n+1),724);im=new.crop(box);scale=.75;source=str(b.relative_to(root))
 else:
  part=arr.copy();part[:,:,3][owners!=slot+1]=0;im=Image.fromarray(part);box=(0,0,1983,793);scale=1;source=str(a.relative_to(root))
 bbox=im.getchannel('A').point(lambda v:255 if v>128 else 0).getbbox();l,t,r,bt=bbox
 crop=(max(0,l-8),max(0,t-8),min(im.width,r+8),min(im.height,bt+8));im=im.crop(crop)
 if scale!=1: im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
 x=slot%5*500+(500-im.width)//2;y=slot//5*500+(500-im.height)//2
 canvas.alpha_composite(im,(x,y));records.append({'slot':slot+1,'source':source,'sourceBox':box,'cropWithinCell':crop,'scale':scale,'resample':'nearest','position':[x,y]})
canvas.save(d/'sheet.png')
(d/'manifest.json').write_text(json.dumps({'status':'color-comparison-not-final-adoption','colorAdjustment':False,'generated':False,'layout':'2x5','frames':records,'note':'Uniform 0.75 preview scale for new four sprites; original six at 1.0. Opaque bbox plus 8 px margin excludes distant faint alpha residue. Runtime pivots not calibrated.','sha256':hashlib.sha256((d/'sheet.png').read_bytes()).hexdigest()},ensure_ascii=False,indent=2)+'\n')
print(d/'sheet.png')
