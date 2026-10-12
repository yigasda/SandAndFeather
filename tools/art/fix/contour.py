import numpy as np
from PIL import Image
def flat(p):
    im=Image.open(p).convert('RGBA');t=Image.new('RGBA',im.size,(245,239,227,255));t.alpha_composite(im);return np.asarray(t.convert('RGB')).astype(int)
def rays(img,c,angles,dark=250,start=20):
    cx,cy=c;out=[]
    for t in angles:
        dx,dy=np.cos(np.radians(t)),np.sin(np.radians(t))
        r=start
        while r<200:
            x,y=int(round(cx+dx*r)),int(round(cy+dy*r))
            if img[y,x].sum()<dark: break
            r+=0.25
        out.append(r)
    return np.array(out)
