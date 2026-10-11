from pathlib import Path
from PIL import Image
import numpy as np,cv2,json
from scipy.ndimage import binary_fill_holes,binary_dilation,label
O=Path('/workspace/actions193')
for n in range(2):
 old=np.array(Image.open(f'docs/art/chibi-refresh/sleep-set-v192/png/set-sleep-{n}.png').convert('RGBA')).astype(int)
 new=np.array(Image.open(O/f'registered{n}.png').convert('RGBA')).astype(int)
 def hair(a):
  r,g,b,al=a.transpose(2,0,1)
  return (al>0)&(r>g*1.23)&(b>g*1.05)&(r>b*1.03)
 oh=hair(old);nh=hair(new)
 protect=(old[:,:,3]>0)&~oh
 # Preserve features enclosed by the face, including burgundy eyebrows; do not bridge forelocks/ears.
 protect=binary_fill_holes(protect)
 # Eyebrows and lashes are face features, not hair. Protect their exact original pixels.
 for poly in [[(208,242),(251,237),(299,246),(309,264),(267,268),(210,258)],[(334,246),(381,238),(434,240),(434,261),(389,266),(333,264)]]:
  mm=np.zeros((720,620),dtype='uint8');cv2.fillPoly(mm,[np.array(poly)],1);protect|=mm.astype(bool)&(old[:,:,3]>0)
 # Hair filter includes newly rendered dark-plum outlines, excludes all generated skin, clothes and sandals.
 nh=binary_fill_holes(nh)&~((new[:,:,3]>0)&~hair(new))
 (O/f'protect{n}.mask').write_bytes(protect.astype('uint8').tobytes())
 (O/f'newhair{n}.mask').write_bytes(nh.astype('uint8').tobytes())
 rgb=np.zeros((720,620,4),dtype='uint8');rgb[protect]=[60,210,120,255];Image.fromarray(rgb).save(O/f'protected{n}.png')
 print(n,'protected',protect.sum(),'oldhair',oh.sum(),'newhair',nh.sum())
