# python3 tools/maps/trace-occluder.py <scene id in data/scene-art.json> '<range polygon json, art px>' '<background rgb>' [dist]
#   -> exact pixel outline polygon(s) of the object inside the range the user gave
# background pixel = within `dist` (default 60; 130 for the Ombos stall, so the light tan halo round the dark outline is background) of the background colour (sample the wall next to the object); every
# other pixel inside the range is the object, and background closed in by the object (a jar mouth, a sign) too.
# [keep polygon] [drop pixels]: pixels inside keep are always the object; drop pixels never are.
# keep: (a lit face that looks like the wall but stands in front).
# The outline follows pixel edges exactly. Check it at 12-18x by pixel CENTRE (PIL polygon fill also paints the pixels
# right of and below an edge, so it shows one column too many); only the dark outline and what it holds may be in.
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
sub=im[Y0:Y1,X0:X1]; BG=np.array(json.loads(sys.argv[3])); DIST=float(sys.argv[4]) if len(sys.argv)>4 else 60
bg=np.sqrt(((sub-BG)**2).sum(2))<DIST
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
if len(sys.argv)>5:
    keep=json.loads(sys.argv[5])
    def inK(px,py):
        c=False; n=len(keep)
        for i in range(n):
            x1,y1=keep[i]; x2,y2=keep[(i+1)%n]
            if (y1>py)!=(y2>py) and px < x1+(py-y1)*(x2-x1)/(y2-y1): c=not c
        return c
    obj|=np.array([[inK(X0+c+0.5,Y0+r+0.5) for c in range(W)] for r in range(H)])
# a background pixel with object on three or four sides (a notch, a one-pixel gap between two tips) is object: else
# the wall shows through there
while True:
    n=np.zeros(obj.shape,int)
    n[1:]+=obj[:-1]; n[:-1]+=obj[1:]; n[:,1:]+=obj[:,:-1]; n[:,:-1]+=obj[:,1:]
    add=~obj & inA & (n>=3)
    if not add.any(): break
    obj|=add
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
# [drop pixels]: [[x, y], ...] art pixels that are never the object (halo pixels the user circled)
if len(sys.argv)>6:
    for x,y in json.loads(sys.argv[6]):
        if 0<=y-Y0<H and 0<=x-X0<W: obj[y-Y0,x-X0]=False
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
