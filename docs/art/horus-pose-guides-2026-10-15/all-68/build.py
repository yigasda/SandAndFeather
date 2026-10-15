from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import runpy,json,hashlib,collections,math,cv2,numpy as np,html
R=Path('/workspace/sand');O=Path('/workspace/horus-all-frame-guides')
for x in ['diagrams','overlays','comparisons','sheets']: (O/x).mkdir(exist_ok=True)
p=runpy.run_path(str(R/'tools/art/pack-trio-motion.py'));extra,_=p['action_frames']()
base=json.loads((R/'docs/art/chibi-refresh/final/manifest.json').read_text())['frames']
frames=[dict(f) for f in base+extra if f['character']=='horus']
for f in frames:f['category']='daily';f['runtime']=True
cm=json.loads((R/'메인2/호루스/manifest.json').read_text())
for f in cm['files']:
 frames.append(dict(id='horus.combat.'+f['direction']+'.'+f['motion']+'.'+str(f['frame']),path='메인2/호루스/'+f['file'],state='combat-'+f['motion'],gameDirection=f['direction'],phase=f['frame'],category='combat',runtime=False,sha256=f['sha256']))
assert len(frames)==68 and len({f['id'] for f in frames})==68
# Reconcile base and daily identities against currently packed runtime tables.
s=json.loads((R/'data/sprites.json').read_text())['looks']['horus']['motion']
expected=set('horus.idle.'+d for d in s['idle'])
expected.update('horus.walk.'+d+'.'+str(n) for d,fs in s['walk'].items() for n in range(len(fs)))
expected.update('horus.'+a+'.'+d+'.'+str(n) for a,ds in s['acts'].items() for d,fs in ds.items() for n in range(len(fs)))
assert expected=={f['id'] for f in frames if f['runtime']}
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';F=lambda n:ImageFont.truetype(font,n)
records=[];panels=[]
for number,f in enumerate(frames,1):
 src=Image.open(R/f['path']).convert('RGBA'); arr=np.asarray(src);alpha=arr[:,:,3];rgb=arr[:,:,:3];h,w=alpha.shape
 digest=hashlib.sha256((R/f['path']).read_bytes()).hexdigest()
 if f.get('sha256'):assert digest==f['sha256'],f['path']
 # Original-coordinate contours and expression lines, no pose generation, no mirror, no geometric warp.
 mask=(alpha>100).astype(np.uint8)*255
 n,labels,stats,cent=cv2.connectedComponentsWithStats(mask,8)
 keep=np.zeros_like(mask)
 for k in range(1,n):
  if stats[k,cv2.CC_STAT_AREA]>=max(5,w*h*.000005):keep[labels==k]=255
 composite=(rgb.astype(float)*(alpha[:,:,None]/255)+255*(1-alpha[:,:,None]/255)).astype('uint8')
 smooth=cv2.bilateralFilter(composite,7,32,5)
 gray=cv2.cvtColor(smooth,cv2.COLOR_RGB2GRAY)
 edges=cv2.Canny(gray,65,130)
 edges[cv2.erode(keep,np.ones((3,3),np.uint8))==0]=0
 contours,_=cv2.findContours(keep,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 outer=np.zeros_like(mask);cv2.drawContours(outer,contours,-1,255,max(1,round(min(w,h)/600)))
 ink=np.maximum(edges,outer)
 ink=cv2.dilate(ink,np.ones((2 if max(w,h)<1100 else 3,)*2,np.uint8))
 # blue structural contours, facial and prop edges retain exact spatial positions.
 rgba=np.zeros_like(arr);rgba[:,:,:3]=[34,93,137];rgba[:,:,3]=ink
 diagram=Image.fromarray(rgba)
 faded=arr.copy();faded[:,:,3]=(alpha.astype(float)*.35).astype('uint8')
 overlay=Image.alpha_composite(Image.fromarray(faded),diagram)
 name=f'{number:02d}-{f["id"]}'
 diagram.save(O/'diagrams'/f'{name}.png');overlay.save(O/'overlays'/f'{name}.png')
 # Crop once per frame and use identical transform for all three columns.
 ys,xs=np.where(keep>0);box=(max(0,int(xs.min())-16),max(0,int(ys.min())-16),min(w,int(xs.max())+17),min(h,int(ys.max())+17))
 crop=src.crop(box);scale=min(365/crop.width,365/crop.height);sz=(round(crop.width*scale),round(crop.height*scale))
 tile=Image.new('RGB',(1200,470),'#f7f7f3');d=ImageDraw.Draw(tile)
 d.text((15,8),name,font=F(19),fill='#18344c')
 for j,img in enumerate([src,overlay,diagram]):
  d.text((j*400+15,37),['원본','원본 + 추출선','분리 도식'][j],font=F(18),fill='#486172')
  t=img.crop(box).resize(sz,Image.Resampling.LANCZOS);tile.paste(t,(400*j+(400-sz[0])//2,76+(365-sz[1])//2),t)
 d.text((15,441),f'원본 좌표 유지 | {w} × {h} | 자세·표정 참고용, 기존 머리·몸 비율은 새 외형 기준 아님',font=F(15),fill='#745c41')
 tile.save(O/'comparisons'/f'{name}.png');panels.append(tile)
 records.append(dict(number=number,id=f['id'],state=f['state'],direction=f['gameDirection'],frame=f.get('phase') or 0,source=f['path'],source_sha256=digest,canvas=[w,h],crop=list(box),runtime=f['runtime'],diagram='diagrams/'+name+'.png',overlay='overlays/'+name+'.png',comparison='comparisons/'+name+'.png',method='deterministic source-coordinate contour and expression-edge extraction; NOT joint landmarks or new-body retarget'))
# Six readable pages of 12 frames (last 8), each with originals for audit.
for start in range(0,len(panels),12):
 batch=panels[start:start+12];sheet=Image.new('RGB',(2400,100+math.ceil(len(batch)/2)*470),'white');d=ImageDraw.Draw(sheet)
 d.text((20,12),f'호루스 전체 프레임 도식 — {start+1:02d}~{start+len(batch):02d} / 68',font=F(32),fill='#163c59')
 d.text((20,57),'원본 위치에서 직접 선 추출 · 반전/포즈 재생성 없음 · 기존 외형을 복제하는 용도로 사용하지 않음',font=F(22),fill='#555555')
 for j,t in enumerate(batch):sheet.paste(t,((j%2)*1200,100+(j//2)*470))
 sheet.save(O/'sheets'/f'{start//12+1:02d}-frames-{start+1:02d}-{start+len(batch):02d}.png')
# Single all-frame visual index with exact filename numbers. No approval inference.
thumbw,thumbh=300,230
index=Image.new('RGB',(2400,100+math.ceil(68/8)*thumbh),'white');d=ImageDraw.Draw(index)
d.text((20,12),'호루스 68프레임 — 분리 도식 전체 목록',font=F(34),fill='#18344c')
d.text((20,58),'정지4 + 걷기12 + 상호작용8 + 줍기8 + 앉기6 + 잠자기4 + 생활8 + 전투18',font=F(22),fill='#555555')
for j,rec in enumerate(records):
 im=Image.open(O/rec['diagram']).crop(rec['crop']);im.thumbnail((280,180));x=(j%8)*thumbw;y=100+(j//8)*thumbh
 index.paste(im,(x+(thumbw-im.width)//2,y),im);d.text((x+8,y+183),f'{j+1:02d} '+rec['state'],font=F(16),fill='#18344c');d.text((x+8,y+205),rec['direction']+' / '+str(rec['frame']),font=F(14),fill='#555555')
index.save(O/'00-all-68-index.png')
manifest=dict(source_commit=__import__('subprocess').check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),total=68,runtime_daily=50,adopted_combat=18,coverage='runtime idle/walk/acts exhaustively reconciled plus 18 accepted combat source PNGs',counts=dict(collections.Counter(x['state'] for x in records)),frames=records)
(O/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(O/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>호루스 68프레임 도식</title><style>body{font:16px sans-serif;background:#eee;padding:20px}img{max-width:100%;background:white}section{margin:30px 0}a{margin-right:20px}</style><h1>호루스 전체 68프레임</h1><p>기존 원본의 동작·구도·표정 위치를 보존한 선 도식. 새 외형 비율 적용 전. 관절점 자동 추정 아님.</p>'+''.join('<section><h2>'+html.escape(str(r['number'])+' '+r['id'])+'</h2><a href="'+r['diagram']+'">분리 PNG</a><a href="'+r['overlay']+'">겹쳐 보기 PNG</a><img loading="lazy" src="'+r['comparison']+'"></section>' for r in records))
(O/'README.txt').write_text('호루스 전체 68프레임 선 도식\n\n범위: 게임 data/sprites.json에서 쓰는 50프레임 + 메인2/호루스 채택 전투 18프레임.\n전체 runtime id 집합 대조, 파일 SHA256 확인. 중복 수정본/반려본 포함 안 함.\n각 프레임 원본 크기·좌표 그대로 자세와 표정 선을 추출. 좌우 반전·포즈 생성·몸 비율 변형 없음.\n선 추출은 정확한 좌표 보존용이며 관절이나 얼굴의 의미를 판정하는 모델이 아님.\n기존 머리 외곽/디테일도 선으로 남으므로 새 외형을 정하는 기준으로 사용하면 안 됨.\n새 비율로 관절 길이를 재설계하는 단계는 아직 하지 않음. 생성용 최종 새 비율 가이드라고 부르지 않음.\n기존12개 수동 관절도와 달리 이번68장은 전체 윤곽·내부선 도식. 모든 프레임의 수동 관절점이 찍혔다고 주장하지 않음.\n원본 비교시트는 검수용. 신외형 생성 시 원본 컬러 비교시트를 첨부하지 않음.\n',encoding='utf8')
print(json.dumps({'total':len(records),'counts':manifest['counts'],'source_commit':manifest['source_commit']},ensure_ascii=False))
