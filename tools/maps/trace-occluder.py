# python3 tools/maps/trace-occluder.py <scene id in data/scene-art.json> '<rough polygon json, art px>'  -> exact pixel outline polygon(s)
# object pixel = inside rough area and not background (light warm wall/floor: mean > 165 and R-B > 35); enclosed
# background (a jar mouth, a sign) counts as object. Outline follows pixel edges exactly.
import sys, json, numpy as np
from PIL import Image, ImageDraw
from collections import deque
import os
R=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '')
sc=json.load(open(R+'data/scene-art.json'))[sys.argv[1]]
rough=json.loads(sys.argv[2])
im=np.asarray(Image.open(R+'data/'+sc['file']).convert('RGB')).astype(int)
xs=[p[0] for p in rough]; ys=[p[1] for p in rough]
X0,Y0,X1,Y1=min(xs)-1,min(ys)-1,max(xs)+1,max(ys)+1
sub=im[Y0:Y1,X0:X1]; L=sub.mean(2); bg=(L>165)&(sub[...,0]-sub[...,2]>35)
area=Image.new('1',(X1-X0,Y1-Y0),0); ImageDraw.Draw(area).polygon([(x-X0,y-Y0) for x,y in rough],fill=1)
# pixel centres inside the rough polygon (PIL fills boundary pixels too: keep pixels whose centre is inside)
def inside(px,py):
    c=False; n=len(rough)
    for i in range(n):
        x1,y1=rough[i]; x2,y2=rough[(i+1)%n]
        if (y1>py)!=(y2>py) and px < x1+(py-y1)*(x2-x1)/(y2-y1): c=not c
    return c
H,W=bg.shape
inA=np.array([[inside(X0+c+0.5,Y0+r+0.5) for c in range(W)] for r in range(H)])
obj=inA & ~bg
# enclosed background -> object: flood background from outside the object
seen=np.zeros_like(obj); q=deque()
for r in range(H):
    for c in range(W):
        if (r in (0,H-1) or c in (0,W-1)) and not obj[r,c]: seen[r,c]=True; q.append((r,c))
while q:
    r,c=q.popleft()
    for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
        rr,cc=r+dr,c+dc
        if 0<=rr<H and 0<=cc<W and not seen[rr,cc] and not obj[rr,cc]: seen[rr,cc]=True; q.append((rr,cc))
obj=obj|(~seen)
# drop specks: keep the biggest 4-connected component(s) over 20 px
lab=np.zeros(obj.shape,int); k=0; sizes={}
for r in range(H):
    for c in range(W):
        if obj[r,c] and not lab[r,c]:
            k+=1; q=deque([(r,c)]); lab[r,c]=k; n=0
            while q:
                a,b=q.popleft(); n+=1
                for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
                    rr,cc=a+dr,b+dc
                    if 0<=rr<H and 0<=cc<W and obj[rr,cc] and not lab[rr,cc]: lab[rr,cc]=k; q.append((rr,cc))
            sizes[k]=n
polys=[]
for k,n in sizes.items():
    if n<20: continue
    m=lab==k
    # directed boundary edges, object on the right (clockwise in image coords)
    E={}
    for r in range(H):
        for c in range(W):
            if not m[r,c]: continue
            if r==0 or not m[r-1,c]: E.setdefault((c,r),[]).append((c+1,r))
            if c==W-1 or not m[r,c+1]: E.setdefault((c+1,r),[]).append((c+1,r+1))
            if r==H-1 or not m[r+1,c]: E.setdefault((c+1,r+1),[]).append((c,r+1))
            if c==0 or not m[r,c-1]: E.setdefault((c,r+1),[]).append((c,r))
    start=min(E); loop=[start]; cur=start; prev=None
    while True:
        nx=E[cur].pop(0)
        if nx==start: break
        loop.append(nx); cur=nx
    # drop collinear points
    pts=[]
    for i,p in enumerate(loop):
        a=loop[i-1]; b=loop[(i+1)%len(loop)]
        if (a[0]==p[0]==b[0]) or (a[1]==p[1]==b[1]): continue
        pts.append([p[0]+X0,p[1]+Y0])
    polys.append(pts)
print(json.dumps(polys))
