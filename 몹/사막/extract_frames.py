from pathlib import Path
import json,hashlib
import numpy as np
from scipy.ndimage import label,find_objects,distance_transform_edt
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'몹/사막';OUT.mkdir(parents=True,exist_ok=True)
REVIEW=ROOT/'work/mob-extract';REVIEW.mkdir(parents=True,exist_ok=True)
paths=json.loads((OUT/'sources.json').read_text())
names=['01_봉인항아리','02_가죽방패병','03_봉인방패병','04_걸음비석','05_태양거울','06_천칭파수꾼','07_빈가면사제_장막형','08_빈가면사제_수의형','09_왕면수문장','10_신전수문장','11_왕좌수문장','12_파릉수문장']
attacks=['attack','charge','charge','slam','light_attack','slam','seal_cast','seal_cast','punch_slam','crush','earth_press','grasp']
summary=[]
for index,(path,name,attack) in enumerate(zip(paths,names,attacks)):
 src=ROOT/'docs'/path;arr=np.array(Image.open(src).convert('RGBA'));h,w=arr.shape[:2]
 labs,n=label(arr[:,:,3]>128);sizes=np.bincount(labs.ravel());ids=np.argsort(sizes[1:])[-10:]+1;boxes=find_objects(labs)
 # Ten large connected bodies. Sort row then horizontal center; do not cut their silhouettes at a grid boundary.
 top=[];bottom=[]
 for ident in ids:
  sl=boxes[ident-1];cx=(sl[1].start+sl[1].stop)/2;cy=(sl[0].start+sl[0].stop)/2
  (top if cy<h/2 else bottom).append((cx,int(ident)))
 assert len(top)==len(bottom)==5,(name,top,bottom)
 ids=[i for _,i in sorted(top)+sorted(bottom)]
 seeds=np.zeros((h,w),np.uint8)
 for k,ident in enumerate(ids):seeds[labs==ident]=k+1
 _,inds=distance_transform_edt(seeds==0,return_indices=True);owners=seeds[tuple(inds)]
 # Keep disconnected opaque pieces intact; associate them by nearest body (majority of pixel-nearest labels).
 for ident,sl in enumerate(boxes,1):
  if sl is None or ident in ids:continue
  mask=labs[sl]==ident;votes=np.bincount(owners[sl][mask],minlength=11);owner=votes.argmax()
  owners[sl][mask]=owner
 # Each nonzero source-alpha pixel is assigned exactly once. Never recolor/resample or threshold output alpha.
 specs=[]
 for k in range(10):
  yy,xx=np.where((owners==k+1)&(arr[:,:,3]>0));bbox=(int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1));origin=(round((k%5)*w/5),round((k//5)*h/2))
  specs.append((bbox,origin))
 minx=min(b[0]-o[0] for b,o in specs)-16;miny=min(b[1]-o[1] for b,o in specs)-16
 maxx=max(b[2]-o[0] for b,o in specs)+16;maxy=max(b[3]-o[1] for b,o in specs)+16
 canvas=(maxx-minx,maxy-miny);dest=OUT/name;dest.mkdir(exist_ok=True)
 states=['idle_0','idle_1','idle_2','dormant' if index==0 else 'guard','prepare_0','prepare_1',attack+'_0',attack+'_1','hit','defeat']
 records=[];recon=np.zeros_like(arr)
 preview=Image.new('RGB',(1600,720),(78,83,88));draw=ImageDraw.Draw(preview)
 for k,((l,t,r,b),(ox,oy)) in enumerate(specs):
  crop=arr[t:b,l:r].copy();crop[owners[t:b,l:r]!=k+1]=0
  px=l-ox-minx;py=t-oy-miny;frame=Image.new('RGBA',canvas);frame.paste(Image.fromarray(crop),(px,py))
  filename=f'{k:02d}_{states[k]}.png';frame.save(dest/filename)
  select=(owners[t:b,l:r]==k+1)&(crop[:,:,3]>0);recon[t:b,l:r][select]=crop[select]
  records.append({'file':filename,'state':states[k],'sourceBBox':[l,t,r,b],'pasteOffset':[px,py],'nominalSourceCellOrigin':[ox,oy],'sha256':hashlib.sha256((dest/filename).read_bytes()).hexdigest()})
  # Review only: same thumbnail scale for every pose in a monster.
  scale=min(300/canvas[0],320/canvas[1]);thumb=frame.resize((round(canvas[0]*scale),round(canvas[1]*scale)),Image.Resampling.NEAREST)
  x=(k%5)*320+(320-thumb.width)//2;y=(k//5)*360+25;preview.paste(thumb,(x,y),thumb);draw.text(((k%5)*320+8,(k//5)*360+7),f'{k:02d} {states[k]}',fill='white')
 visible=arr[:,:,3]>0;assert np.array_equal(recon[visible],arr[visible]),name
 manifest={'source':str(src.relative_to(ROOT)),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'method':'connected bodies plus nearest-body ownership for detached pieces; source RGBA copied without resampling/recoloring','canvas':canvas,'sharedNominalCellOffset':[-minx,-miny],'runtimePivot':None,'runtimeApplied':False,'verification':{'visiblePixelReconstructionExact':True,'frameCount':10,'sourceNonzeroAlphaPixels':int(visible.sum())},'frames':records}
 (dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');preview.save(ROOT/'work/mob-extract'/f'{index+1:02d}.png')
 summary.append({'name':name,'canvas':canvas,'source':manifest['source'],'frames':10});print(name,canvas,'exact RGBA verified')
(OUT/'manifest.json').write_text(json.dumps({'monsters':summary,'count':120,'runtimeApplied':False},ensure_ascii=False,indent=2)+'\n')
