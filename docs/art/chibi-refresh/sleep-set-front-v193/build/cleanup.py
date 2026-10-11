from pathlib import Path
from PIL import Image
import numpy as np,json
from scipy.ndimage import binary_fill_holes,label,distance_transform_edt
O=Path('/workspace/actions193');P=Path('docs/art/chibi-refresh/sleep-set-front-v193/png')
for n in range(2):
 a=np.array(Image.open(P/f'set-sleep-{n}.png').convert('RGBA')).astype(int);old=np.array(Image.open(f'docs/art/chibi-refresh/sleep-set-v192/png/set-sleep-{n}.png').convert('RGBA'))
 m=a[:,:,3]>0;holes=binary_fill_holes(m)&~m;l,c=label(holes);fix=np.zeros(m.shape,bool)
 for i in range(1,c+1):
  region=l==i;sz=region.sum()
  if sz<=25 or ((old[:,:,3][region]>0).mean()>.6):fix|=region
 r,g,b,al=a.transpose(2,0,1);h=(al>0)&(r>g*1.23)&(b>g*1.05)&(r>b*1.03)
 d,ix=distance_transform_edt(~h,return_indices=True);yy,xx=np.where(fix)
 replacements=[[int(y*620+x),int(ix[0,y,x]*620+ix[1,y,x])] for y,x in zip(yy,xx)]
 lab,nc=label(m);remove=[]
 for i in range(1,nc+1):
  region=lab==i
  if region.sum()<9:remove.extend(np.flatnonzero(region).tolist())
 (O/f'cleanup{n}.json').write_text(json.dumps({'newHairEdgeGapPixels':len(replacements),'copies':replacements,'remove':remove}))
 print(n,len(replacements),len(remove))
