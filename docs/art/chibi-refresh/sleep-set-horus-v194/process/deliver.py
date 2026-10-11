from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib,shutil,importlib.util
from scipy.ndimage import label,binary_fill_holes
B=Path('docs/art/chibi-refresh');P=B/'sleep-set-horus-v194';O=P/'previews';O.mkdir(exist_ok=True);C=P/'checks';C.mkdir(exist_ok=True)
F=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',17)
names=['set-sleep','horus-sleep','set-sleep-side','horus-sleep-side']
def im(p):return Image.open(p).convert('RGBA')
def flat(a,bg='#f5efe3'):
 s=Image.new('RGBA',a.size,bg);s.alpha_composite(a);return s.convert('RGB')
def sheet(pics,labels,path,cols=4,bg='#f5efe3'):
 s=Image.new('RGB',(310*cols,390*((len(pics)+cols-1)//cols)),bg);d=ImageDraw.Draw(s)
 for k,(a,t) in enumerate(zip(pics,labels)):
  x=k%cols*310;y=k//cols*390;a=a.resize((310,360),Image.Resampling.NEAREST);s.paste(a,(x,y+28),a);d.text((x+5,y+3),t,font=F,fill='#ffffff' if bg=='#263142' else '#27211c')
 s.save(path)
pics=[im(P/'png'/f'{n}-{k}.png') for n in names for k in range(2)]
labels=[n+(' / 날숨 0' if k==0 else ' / 들숨 1') for n in names for k in range(2)]
sheet(pics,labels,O/'all-light.png');sheet(pics,labels,O/'all-dark.png',bg='#263142')
refs={'set-front':[434,578,662],'set-right':[407,577,662],'horus-front':[426,574,657],'horus-right':[411,570,662]}
marks={'set-sleep':[394,538,625],'horus-sleep':[389,538,625],'set-sleep-side':[391,552,645],'horus-sleep-side':[395,553,644]}
rows=[];measurementpics=[];measurementlabels=[]
def annotated(a,ys,name):
 a=flat(a);d=ImageDraw.Draw(a)
 for y,c,t in zip(ys,['#d13838','#25893e','#275baa'],['턱','치마단','발끝']):
  d.line((145,y,530,y),fill=c,width=2);d.text((5,y-18),f'{t} y={y}',font=F,fill=c)
 d.line((310,15,310,700),fill='#b3b1ad',width=1)
 return a.convert('RGBA')
for name in names:
 who=name.split('-')[0];v='right' if 'side' in name else 'front';base=refs[who+'-'+v];href=refs['horus-'+v]
 ref=im(B/f'final/{who}/idle/{who}-{v}.png');h=im(B/f'final/horus/idle/horus-{v}.png')
 pp=[annotated(ref,base,who),annotated(h,href,'horus')]
 ll=[who+' 정지','호루스 정지 비율 기준']
 for k in range(2):
  ys=marks[name].copy();ys[0]-=k
  a=im(P/'png'/f'{name}-{k}.png');seg=np.diff(ys);own=np.diff(base);hr=np.diff(href)
  row={'file':f'{name}-{k}.png','landmarksY':ys,'projectedPx':seg.tolist(),'idleLandmarksY':base,'vsOwnIdlePercent':np.round(seg/own*100,1).tolist(),'vsHorusIdlePercent':np.round(seg/hr*100,1).tolist(),'method':'Manual outline landmarks at native 620x720 scale; projected vertical lengths, uncertainty ±2px. Foot is exclusive bottom bound.'};rows.append(row)
  pp.append(annotated(a,ys,name));ll.append(f'{k}: '+ '/'.join(f'{x:.0f}%' for x in row['vsHorusIdlePercent'])+' 호루스 대비')
 sheet(pp,ll,O/(name+'-body-measured.png'))
 measurementpics+=pp;measurementlabels+=ll
sheet(measurementpics,measurementlabels,O/'body-measured-all.png')
(C/'body-measurements.json').write_text(json.dumps({'references':refs,'frames':rows},ensure_ascii=False,indent=2)+'\n')
md=['# 몸 길이 직접 측정','', '620×720 원본의 투영된 세로 길이. 턱 외곽선 아래 / 치마단 아래 / 발끝 아래에 선을 그어 측정했다. 곡선 경계 선택 오차 약 ±2px. 옆 자세의 접힌 다리를 폈을 때의 해부학적 길이가 아니다.','', '| PNG | 턱→치마단 px | 치마단→발끝 px | 자기 정지 대비 % | 호루스 같은 방향 정지 대비 % |','|---|---:|---:|---|---|']
for r in rows:md.append('| '+r['file']+' | '+str(r['projectedPx'][0])+' | '+str(r['projectedPx'][1])+' | '+' / '.join(f'{x:.1f}' for x in r['vsOwnIdlePercent'])+' | '+' / '.join(f'{x:.1f}' for x in r['vsHorusIdlePercent'])+' |')
(C/'body-measurements.md').write_text('\n'.join(md)+'\n')
frames=[];games=[];stats=[]
for k in range(2):
 s=Image.new('RGB',(1240,390),'#f5efe3');g=Image.new('RGBA',(33*4,39),'#f5efe3');d=ImageDraw.Draw(s)
 for j,n in enumerate(names):
  a=im(P/'png'/f'{n}-{k}.png');q=a.resize((310,360),Image.Resampling.NEAREST);s.paste(q,(j*310,28),q);d.text((j*310+6,3),n+f' / {k}',font=F,fill='#27211c')
  ga=im('/workspace/actions194/game-'+n+f'-{k}.png');g.alpha_composite(ga,(j*33,0))
 frames.append(s);games.append(g.convert('RGB'))
for fn,fs in [('breathing-all.gif',frames),('breathing-31px.gif',games),('breathing-31px-8x.gif',[g.resize((1056,312),Image.Resampling.NEAREST) for g in games])]:
 fs[0].save(O/fn,save_all=True,append_images=fs[1:],duration=800,loop=0,disposal=2)
sheet([im('/workspace/actions194/game-'+n+f'-{k}.png').resize((620,720),Image.Resampling.NEAREST) for n in names for k in range(2)],labels,O/'game-two-phases.png')
for n in names:
 a=np.array(im(P/'png'/f'{n}-0.png'));b=np.array(im(P/'png'/f'{n}-1.png'));ma=a[:,:,3]>128;mb=b[:,:,3]>128
 df=np.any(a!=b,axis=2);mark=b.copy();mark[df]=(235,35,35,255)
 sheet([Image.fromarray(a),Image.fromarray(b),Image.fromarray(mark)],['날숨 0','들숨 1','달라진 픽셀 = 빨강'],O/(n+'-difference.png'),cols=3)
 parts=[]
 for z in [a,b]:
  l,num=label(z[:,:,3]>128);counts=np.bincount(l.ravel())[1:];parts.append({'connectedParts':int(num),'smallestPartPx':int(counts.min())})
 stats.append({'pose':n,'outlineChangedPercent':round(float((ma^mb).sum()/(ma|mb).sum()*100),2),'bbox0':Image.fromarray(a).getbbox(),'bbox1':Image.fromarray(b).getbbox(),'changedPixels':int(df.sum()),'legsBelowY580ChangedPixels':int(df[580:,220:455].sum()),'components':parts})
(C/'breathing.json').write_text(json.dumps(stats,indent=2)+'\n')
files=[]
for n in names:
 for k in range(2):
  f=P/'png'/f'{n}-{k}.png';files.append({'path':'png/'+f.name,'character':n.split('-')[0],'direction':'right' if 'side' in n else 'front','frame':k,'anchor':{'kind':'body-center','position':[315,445] if 'side' in n else [310,450]},'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
manifest={'revision':194,'action':'sleep','status':'awaiting-user-review','artApproved':False,'runtimeEligible':False,'runtimeOwner':'opus','canvas':[620,720],'frameCount':8,'baseRevisions':{'setFront':193,'setSide':192,'horusFrontAndSide':191},'playback':{'sequence':[0,1],'durationMs':[800,800],'loop':True},'files':files}
(P/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(stats,indent=2));print('\n'.join(md))
