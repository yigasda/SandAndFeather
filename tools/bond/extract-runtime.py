"""Runtime pieces from the user-selected mobile B screenshot. No new illustration."""
from pathlib import Path
import cv2,numpy as np,json,hashlib
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[2]; D=R/'data/art/ui/bond/exact';D.mkdir(exist_ok=True)
s=Image.open(R/'docs/bond-ui/reference/mobile-b.jpg').convert('RGBA'); manifest=[]
def save(n,im,rect,method='original crop'):
 im.save(D/(n+'.png'));manifest.append(dict(file=n+'.png',source='docs/bond-ui/reference/mobile-b.jpg',rect=rect,method=method,sha256=hashlib.sha256((D/(n+'.png')).read_bytes()).hexdigest()))
def crop(n,r):save(n,s.crop(r),r)
for name,r,points in [
 ('set-symbol',(102,307,214,401),[(3,94),(9,80),(13,70),(18,60),(18,38),(27,22),(29,3),(33,0),(40,15),(50,21),(62,18),(72,1),(77,0),(82,18),(81,34),(90,48),(89,65),(96,78),(111,86),(112,94)]),
 ('horus-symbol',(449,322,580,401),[(0,79),(7,67),(26,63),(33,53),(42,30),(49,12),(61,2),(82,0),(98,7),(111,24),(112,33),(105,42),(92,47),(98,57),(125,67),(131,79)])]:
 im=s.crop(r);alpha=Image.new('L',im.size);ImageDraw.Draw(alpha).polygon(points,fill=255);im.putalpha(alpha);save(name,im,r,'original RGB; hand-traced silhouette alpha only')
# Borders carry original corners; centers are transparent and filled separately.
for n,r,cuts in [('window',(35,172,830,1374),(34,34)),('record',(69,480,795,577),(19,17)),('activity',(71,1152,245,1248),(12,12)),('slot',(78,972,188,1077),(13,13)),('slot-selected',(190,973,290,1074),(13,13)),('give',(525,975,783,1071),(17,15)),('memory',(519,1261,794,1342),(16,16)),('tab-on',(67,315,429,402),(17,15)),('tab-off',(438,322,794,402),(15,14))]:
 im=s.crop(r);x,y=cuts
 if n in ['tab-on','tab-off','record']:
  xx=300 if n in ['tab-on','record'] else 670
  im.paste(s.crop((xx,r[1],xx+1,r[1]+y)).resize((im.width-2*x,y)),(x,0))
  im.paste(s.crop((xx,r[3]-y,xx+1,r[3])).resize((im.width-2*x,y)),(x,im.height-y))
 a=np.array(im);a[y:-y,x:-x,3]=0;save(n+'-border',Image.fromarray(a),r,'original border; transparent center')
crop('paper',(250,554,550,566));crop('wood',(164,205,215,250));crop('tab-on-fill',(380,335,411,385));crop('tab-off-fill',(762,336,778,389));crop('give-fill',(546,997,554,1039));crop('memory-fill',(540,1287,549,1320));crop('slot-fill',(91,983,101,991))
crop('rail',(120,840,160,848));crop('header-line',(168,173,689,191));crop('tab-line',(80,400,780,424))
# Clear the gauge's old number and fill; runtime renders actual points.
im=s.crop((145,770,768,804));a=np.array(im);a[4:-4,7:-7]=a[4:-4,400:401]
save('gauge',Image.fromarray(a),(145,770,768,804),'original frame; blank center repeated from unfilled original')
(D/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
# inspect character cutouts on paper
sheet=Image.new('RGBA',(450,180),'#f4dfbc')
for i,n in enumerate(['set-symbol','horus-symbol']):sheet.alpha_composite(Image.open(D/(n+'.png')),(i*200+20,20))
sheet.save('/tmp/bond-symbols.png')

f=Image.new('RGBA',(128,128));tl=s.crop((35,1332,78,1374)).transpose(Image.Transpose.ROTATE_270);bl=s.crop((35,1332,78,1374));br=s.crop((787,1332,830,1374));tr=br.transpose(Image.Transpose.ROTATE_90)
for im,xy in [(tl,(0,0)),(tr,(85,0)),(bl,(0,86)),(br,(85,86))]:f.alpha_composite(im,xy)
f.paste(s.crop((40,460,62,500)).resize((22,44)),(0,42));f.paste(s.crop((805,460,827,500)).resize((22,44)),(106,42))
f.paste(s.crop((300,173,344,191)),(42,0));f.paste(s.crop((300,1355,344,1373)),(42,110));f.save(D/'window-border.png')

for a in manifest: a['sha256']=hashlib.sha256((D/a['file']).read_bytes()).hexdigest()
(D/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
