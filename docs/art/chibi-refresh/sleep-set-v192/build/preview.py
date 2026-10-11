from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib
from scipy.ndimage import label
B=Path('docs/art/chibi-refresh');P=B/'sleep-set-v192';O=P/'previews';O.mkdir(exist_ok=True)
F=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',18)
variants=['set-sleep','set-sleep-side']
def im(v,n):return Image.open(P/'png'/f'{v}-{n}.png').convert('RGBA')
def bg(im,c='#f5efe3'):
 o=Image.new('RGBA',im.size,c);o.alpha_composite(im);return o.convert('RGB')
def gif(frames,p):
 atlas=Image.new('RGB',(frames[0].width,frames[0].height*2));atlas.paste(frames[0]);atlas.paste(frames[1],(0,frames[0].height));pal=atlas.quantize(colors=256,method=Image.Quantize.MEDIANCUT);q=[a.quantize(palette=pal,dither=Image.Dither.NONE) for a in frames];q[0].save(p,save_all=True,append_images=q[1:],duration=[800,800],loop=0,disposal=2,optimize=False)
for tag,col in [('light','#f5efe3'),('dark','#263142')]:
 s=Image.new('RGB',(1240,400),col);d=ImageDraw.Draw(s)
 for j,v in enumerate(variants):
  for n in range(2):
   q=im(v,n).resize((310,360),Image.Resampling.NEAREST);s.paste(q,((j*2+n)*310,35),q);d.text(((j*2+n)*310+8,7),v+f' / {n}',font=F,fill='white' if tag=='dark' else '#222222')
 s.save(O/f'all-{tag}.png')
large=[];small=[];zoom=[]
for n in range(2):
 s=Image.new('RGB',(620,395),'#f5efe3');t=Image.new('RGB',(160,75),'#f5efe3');z=Image.new('RGB',(544,342),'#f5efe3')
 for j,v in enumerate(variants):
  q=im(v,n).resize((310,360),Image.Resampling.NEAREST);s.paste(q,(j*310,30),q);ImageDraw.Draw(s).text((j*310+8,5),v,font=F,fill='#222222')
  a=Image.open('/workspace/actions192/game-'+v+'-'+str(n)+'.png').convert('RGBA');t.paste(a,(j*80+23,25),a);a=a.resize((264,312),Image.Resampling.NEAREST);z.paste(a,(j*272+4,25),a)
 large.append(s);small.append(t);zoom.append(z)
gif(large,O/'sleep-192.gif');gif(small,O/'sleep-192-31px.gif');gif(zoom,O/'sleep-192-31px-8x.gif')
zz=Image.new('RGB',(544,684),'#f5efe3');zz.paste(zoom[0]);zz.paste(zoom[1],(0,342));zz.save(O/'31px-frame-pair.png')
report=[]
for v in variants:
 ims=[im(v,n) for n in range(2)];a,b=[np.array(x) for x in ims];ma,mb=a[:,:,3]>128,b[:,:,3]>128;xor=ma^mb
 r=a.copy();r[xor]=[235,35,50,255];red=bg(Image.fromarray(r));red.save(O/(v+'-outline-red.png'))
 r=a.copy();changed=np.any(a!=b,axis=2)&(ma|mb);r[changed]=[235,35,50,255];bg(Image.fromarray(r)).save(O/(v+'-all-pixel-diff-red.png'))
 for n,m in enumerate([ma,mb]):
  lab,num=label(m);sz=np.bincount(lab.ravel())[1:];assert sz.min()>10, (v,n,sz.tolist());assert not(m[0].any() or m[-1].any() or m[:,0].any() or m[:,-1].any()),(v,n,'edge')
 report.append({'variant':v,'silhouette':float(xor.sum()/(ma|mb).sum()),'bbox0':ims[0].getbbox(),'bbox1':ims[1].getbbox(),'outlinePixels':int(xor.sum()),'alphaComponents':[int(label(ma)[1]),int(label(mb)[1])]})
 # Same physical scale: idle, walk (576/330), frames0/1
 view='right' if 'side' in v else 'front';idle=Image.open(B/'final/set/idle'/f'set-{view}.png').convert('RGBA');walk=Image.open(B/'final/set/walk'/f'set-{view}-0.png').convert('RGBA');walk=walk.resize((628,698),Image.Resampling.NEAREST);wc=Image.new('RGBA',(620,720));wc.alpha_composite(walk,(-4,16))
 s=Image.new('RGB',(1240,395),'#f5efe3');d=ImageDraw.Draw(s)
 for j,x in enumerate([idle,wc,*ims]):
  q=x.resize((310,360),Image.Resampling.NEAREST);s.paste(q,(j*310,30),q);d.text((j*310+6,4),['정지','걷기','날숨 0','들숨 1'][j],font=F,fill='#222222')
 s.save(O/(v+'-idle-walk.png'))
 # Actual RGB anatomical comparison; no image part is reused in sprite PNG.
 h=Image.open(B/'sleep-trio-v191/png'/f'{v.replace("set","horus")}-0.png').convert('RGBA');hbg=bg(h);sbg=bg(ims[0]);mix=Image.blend(hbg,sbg,.5);s=Image.new('RGB',(1240,1080),'#f5efe3');d=ImageDraw.Draw(s)
 for j,x in enumerate([hbg,sbg,mix,bg(Image.fromarray(r))]):
  q=x.resize((310,360),Image.Resampling.NEAREST);s.paste(q,(j*310,30));crop=x.crop((170,335,480,680));s.paste(crop,(j*310,420));d.text((j*310+6,4),['호루스191','세트192','같은 좌표 50% 겹침','0↔1 픽셀 차이'][j],font=F,fill='#222222')
  if j<3:
   for yy in [390,420,515,540,656]:d.line((j*310,420+yy-335,j*310+309,420+yy-335),fill='#739a80')
 # neck/ear high magnification for border inspection
 for j,x in enumerate(ims):
  box=(130,270,440,410) if 'side' not in v else (220,250,530,390)
  q=bg(x.crop(box)).resize((620,280),Image.Resampling.NEAREST);s.paste(q,(j*620,790))
 s.save(O/(v+'-horus-body-detail.png'))
 if 'side' not in v:
  x=bg(ims[0]);d=ImageDraw.Draw(x);d.line((310,0,310,719),fill='red');d.ellipse((306,446,314,454),outline='red',width=2);x.save(O/'front-x310.png')
 # exact foot bounding boxes from lower brown sandal pixels (hair excludes B>G).
 def feet(x):
  a=np.array(x).astype(int);r,g,b,al=a.transpose(2,0,1);m=(al>128)&(r<155)&(r>g*1.2)&(g>b*1.2);m[:(565 if 'side' in v else 535)]=0;
  if 'side' in v:m[:,:260]=0
  yy,xx=np.where(m);return [int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
 report[-1]['sandalBrownBboxHorus']=feet(h);report[-1]['sandalBrownBboxSet']=feet(ims[0])
(P/'checks/geometry-breathing.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
old=json.loads((P/'checks/preserved-before.json').read_text());assert all(hashlib.sha256(Path(f).read_bytes()).hexdigest()==h for f,h in old.items());(P/'checks/preserved-after.json').write_text(json.dumps({'allUnchanged':True,'hashes':old},indent=2))
