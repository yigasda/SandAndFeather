# python3 jawpaste.py <png> <user picture in source coords (register.py)> <out> [cx,cy]
# put the user's own jaw line in: along the lower half (about c), the outline band of the user's picture
# (from a few px inside its inner edge to its outer edge) replaces ours; our outline left outside the user's outer
# edge becomes what the user's picture has there (neck) or background. Inner face stays ours.
import sys, numpy as np
from PIL import Image
sys.path.insert(0, __file__.rsplit('/',1)[0])
from contour import flat, rays
base,user,out=sys.argv[1:4]
c=tuple(map(float,sys.argv[4].split(','))) if len(sys.argv)>4 else (308,345); A=np.arange(0,181,1.0)
B=np.asarray(Image.open(base).convert('RGBA')).astype(np.float32); H,W=B.shape[:2]
U=np.asarray(Image.open(user).convert('RGB')).astype(np.float32)
Ui=U.astype(int)
Rin=rays(Ui,c,A)
def outer_edge(img,Rin):
    res=[]
    for t,r0 in zip(A,Rin):
        dx,dy=np.cos(np.radians(t)),np.sin(np.radians(t)); r=r0
        while r<r0+25:
            x,y=int(round(c[0]+dx*r)),int(round(c[1]+dy*r))
            if img[y,x].sum()>=330: break
            r+=0.25
        res.append(r)
    return np.array(res)
Rout=outer_edge(Ui,Rin)
sm5=lambda v: np.convolve(np.pad(v,3,mode='edge'),np.ones(7)/7,'valid')
Rin,Rout=sm5(Rin),sm5(Rout)
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
dx,dy=xx-c[0],yy-c[1]; r=np.hypot(dx,dy); th=np.degrees(np.arctan2(dy,dx))
zone=(th>=14)&(th<=166)
ri=np.interp(th,A,Rin); ro=np.interp(th,A,Rout)
o=B.copy()
dark=lambda P: P[...,:3].sum(-1)<300
band=zone&(r>=ri-4)&(r<=ro)
o[band,:3]=U[band]; o[band,3]=255
# soft outer edge where the background shows: alpha from how dark the user pixel is
cream=np.array([245,239,227],np.float32); ink=np.array([25,18,22],np.float32)
f=np.clip(np.linalg.norm(U-cream,axis=-1)/np.linalg.norm(ink-cream),0,1)
edge=zone&(r>ro)&(r<=ro+2.5)&(B[...,3]<10)
o[edge,:3]=ink; o[edge,3]=np.where(f[edge]>0.35,255*np.clip(f[edge]*1.3,0,1),0)
# our thicker outline outside the user's line
extra=zone&(r>ro)&(r<=ro+12)&dark(B)&(B[...,3]>0)
isbg=np.linalg.norm(U-cream,axis=-1)<22
o[extra&isbg]=0
nb=extra&~isbg; o[nb,:3]=U[nb]; o[nb,3]=255
# the line's outer pixels over the background: ink with alpha from the user's shade, never cream
d2c=np.linalg.norm(U-cream,axis=-1)
bgside=zone&(r>ri+1)&(r<=ro+12)&((B[...,3]<10)|(dark(B)&(d2c<70)))&(U.sum(-1)>150)
o[bgside,:3]=ink; o[bgside,3]=np.where(f[bgside]>0.3,255*np.clip(f[bgside]*1.2,0,1),0)
# light leftovers touching the background along the jaw: ink
tr=o[...,3]<10; nbr=np.zeros_like(tr)
for ddy,ddx in ((1,0),(-1,0),(0,1),(0,-1)): nbr|=np.roll(np.roll(tr,ddy,0),ddx,1)
light=zone&(r>ri+1)&(r<=ro+14)&nbr&~tr&(o[...,:3].sum(-1)>330)&(yy>330)
o[light,:3]=ink; o[light,3]=np.minimum(o[light,3],160)
print('light fixed',int(light.sum()))
Image.fromarray(o.round().clip(0,255).astype(np.uint8),'RGBA').save(out)
print('band px',int(band.sum()),'extra px',int(extra.sum()),'to bg',int((extra&isbg).sum()))
