# Horus on a stool from behind: waist lower by d px, kilt shorter (scale s), arms untouched.
#   python3 horus-kilt.py <in> <out> <d> <s>
# Only the body (back below the arm line, waist band, kilt: flooded from the back, with its outline) moves:
# rows 0-470 as drawn; 470-484 (lower back) stretched to 470-484+d; the waist line and band 484-505 moved down d;
# the kilt 505-hem squeezed to s of its length. Arms and everything else stay exactly as drawn.
import sys, numpy as np
from PIL import Image
from collections import deque
src,out,d,s=sys.argv[1],sys.argv[2],int(sys.argv[3]),float(sys.argv[4])
o=np.asarray(Image.open(src).convert('RGBA')); H,W=o.shape[:2]
L=o[...,:3].astype(int).mean(2); A=o[...,3]>0; dk=A&(L<90)
def flood(seeds,ok):
    m=np.zeros((H,W),bool); q=deque(seeds)
    for y,x in seeds: m[y,x]=True
    while q:
        y,x=q.popleft()
        for ny,nx in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
            if 0<=ny<H and 0<=nx<W and ok[ny,nx] and not m[ny,nx]: m[ny,nx]=True; q.append((ny,nx))
    return m
band=np.zeros((H,W),bool); band[468:600]=True
side=np.zeros((H,W),bool); side[:,:229]=True; side[:,392:]=True       # the arms hang outside the back
arm=flood([(507,213),(477,237),(510,397),(477,383),(470,215),(470,405)],A&~dk&band)
body=flood([(480,300),(498,300),(540,300)],A&~dk&band&~arm)
# also the waist line / outline pixels are dark: reach them from the light parts, 7 px into dark, never into arm side
def grow(m,stop):
    g=m.copy()
    for _ in range(7):
        n=g.copy(); n[1:]|=g[:-1]; n[:-1]|=g[1:]; n[:,1:]|=g[:,:-1]; n[:,:-1]|=g[:,1:]
        g|=n&dk&~stop
    return g
armg=grow(arm,body)
bodyg=grow(body,armg)&~armg
bodyg[:470]=False
HEM=int(np.where(bodyg.any(1))[0].max())
Lk=(HEM-505)*s
def srcy(y):
    if y<470: return float(y)
    if y<484+d: return 470+(y-470)*14/(14+d)
    if y<505+d: return float(y-d)
    if y<=505+d+Lk: return 505+(y-505-d)/s
    return None
res=o.copy()
low=np.zeros((H,W),bool); low[505+d:]=True
res[bodyg&low,3]=0          # above the kilt the moved body covers the old one; the original stays under any gap
lay=np.zeros_like(o)
for y in range(470,H):
    sy=srcy(y)
    if sy is None: continue
    yy=min(H-1,int(round(sy)))
    m=bodyg[yy]; lay[y,m]=o[yy,m]
put=(lay[...,3]>0)&~armg                     # arms stay on top
res[put]=lay[put]
# below the arm line, anything that is neither arm nor moved body (old kilt outline at the corners) goes
left=np.zeros((H,W),bool); left[545:]=True
res[left&~put,3]=0
# where the squeezed kilt pulled away from the arms: close the small gap with outline, as arm and kilt touch in the original
RA=res[...,3]>0
for y in range(495,548):
    xs=np.where(RA[y,200:420])[0]+200
    if len(xs)<2: continue
    for x0,x1 in zip(xs[:-1],xs[1:]):
        if 1<x1-x0<=14 and 225<x0<400: res[y,x0+1:x1,:3]=(2,2,3); res[y,x0+1:x1,3]=255
np.save(out+'.armg.npy',armg)
Image.fromarray(res,'RGBA').save(out)
print(f'hem {HEM} -> {505+d+Lk:.0f}, rises {HEM-(505+d+Lk):.0f} px')
