"""Pixel collision helpers. Work in original image pixels, never resize source art."""
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from collections import deque

def mask_from_geometry(floor, image):
    mask=Image.new('1',image.size);d=ImageDraw.Draw(mask)
    for p in floor.geoms if hasattr(floor,'geoms') else [floor]:
        d.polygon(list(p.exterior.coords),fill=1)
        for hole in p.interiors:d.polygon(list(hole.coords),fill=0)
    return np.asarray(mask,dtype=bool).copy()

def runs(mask):
    out=[]
    for row in mask:
        changes=np.flatnonzero(np.diff(np.r_[False,row,False])).tolist()
        out.append(changes)
    return out

def safe_centres(mask,px):
    # Conservative full foot rectangle, including every source pixel (not just four corners).
    left=int(np.ceil(.28*px)); right=left
    top=int(np.ceil(.18*px)); bottom=int(np.ceil(.16*px))
    return nd.minimum_filter(mask.astype('uint8'),size=(top+bottom+1,left+right+1),mode='constant',cval=0).astype(bool)

def path(safe,start,goal):
    sx,sy=map(round,start);gx,gy=map(round,goal);h,w=safe.shape
    assert safe[sy,sx] and safe[gy,gx],('blocked endpoint',start,goal)
    prev=np.full((h,w),-1,np.int32);prev[sy,sx]=sy*w+sx
    q=deque([sy*w+sx]);end=gy*w+gx
    while q:
        p=q.popleft()
        if p==end:break
        y,x=divmod(p,w)
        for dx,dy in ((0,-1),(1,0),(0,1),(-1,0)):
            xx,yy=x+dx,y+dy
            if 0<=xx<w and 0<=yy<h and safe[yy,xx] and prev[yy,xx]<0:
                prev[yy,xx]=p;q.append(yy*w+xx)
    assert prev[gy,gx]>=0,('unreachable',start,goal)
    pts=[];p=end
    while True:
        y,x=divmod(p,w);pts.append([x,y])
        if p==sy*w+sx:break
        p=int(prev[y,x])
    pts.reverse()
    # Retain every turn; runtime test also samples the segment between successive points.
    compact=[pts[0]]
    for i in range(1,len(pts)-1):
        if (pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]) != (pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]):compact.append(pts[i])
    compact.append(pts[-1]);return compact,len(pts)

def review(image,mask,route,out,index):
    a=np.asarray(image.convert('RGBA')).copy()
    a[mask,:3]=(a[mask,:3]*.65+np.array([25,220,85])*.35).astype('uint8')
    edge=mask ^ nd.binary_erosion(mask)
    a[edge,:3]=[0,255,70]
    im=Image.fromarray(a);d=ImageDraw.Draw(im);d.line([tuple(p) for p in route],fill=(255,45,100),width=2)
    im.save(out/f'{index:02}-collision.png')
    # Every quadrant at nearest-neighbor x2; no smooth resizing hides the pixel edge.
    for y in range(3):
        for x in range(2):
            box=(x*512,y*512,(x+1)*512,(y+1)*512)
            im.crop(box).resize((1024,1024),Image.Resampling.NEAREST).save(out/f'{index:02}-detail-{y}-{x}.png')
