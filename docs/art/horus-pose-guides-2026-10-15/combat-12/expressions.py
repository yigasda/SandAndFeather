from PIL import Image,ImageDraw,ImageFont
import cv2,numpy as np,json
from pathlib import Path
out=Path('/workspace/horus-combat-pose-guide');root=Path('/workspace/horus-combat-publish/docs/art/horus-combat-final-18-2026-10-15')
entries=json.loads((root/'manifest.json').read_text())['sprites'][6:]
heads=[(48,50,300,245),(402,50,650,243),(758,50,1007,245),(1100,67,1370,259),(78,413,293,594),(451,447,654,622),(778,423,1012,604),(1152,415,1371,602),(70,785,260,964),(406,778,641,972),(786,778,1017,970),(1170,761,1407,963)]
labels=['우향 대기 0','우향 대기 1','우향 대기 2','우향 대각 돌진','우향 주문','우향 지침','좌향 대각 돌진','좌향 주문','좌향 지침','우향 공격 준비','우향 찌르기','우향 피격']
expressions=['차분한 경계','차분한 경계','차분한 경계','집중 · 입 조금 열림','차분한 집중','한쪽 눈 감음 · 지침','집중 · 입 조금 열림','차분한 집중','눈을 낮춤 · 지침','집중','집중','한쪽 눈 감음 · 입 벌림']
# Visible horizontal landmarks manually read from source poses: shoulder, waist, knee, sole.
levels=[(252,289,316,345),(251,287,315,346),(251,289,317,349),(246,275,296,344),(592,632,671,701),(626,656,675,707),(573,606,646,686),(604,641,680,717),(965,1001,1024,1068),(959,991,1019,1056),(957,990,1018,1056),(955,990,1029,1064)]
F=lambda n:ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',n)
board=Image.new('RGB',(2400,2410),'#faf9f5');d=ImageDraw.Draw(board)
d.text((35,20),'호루스 · 상세 동작 윤곽 도식 12장',font=F(38),fill='#293647')
d.text((35,75),'몸·손·발·옷·창: 기존 12장 픽셀에서 윤곽 추출 / 머리: 기준 전투 6장 비율의 외형 없는 범위 표시',font=F(24),fill='#495565')
d.text((35,115),'방향·각도는 2D 원본의 추정값 / 표정은 눈·눈썹·시선·입으로 구분 / 화면 좌우 기준',font=F(23),fill='#495565')
expression_notes=[['눈: 양쪽 반쯤 뜸 · 윗눈꺼풀 낮게', '눈썹: 안쪽이 조금 낮은 완만한 경사', '시선: 얼굴이 향한 우측 전방', '입: 아주 작게 다묾 · 미소 없음'], ['눈: 양쪽 반쯤 뜸 · 윗눈꺼풀 낮게', '눈썹: 안쪽이 조금 낮은 완만한 경사', '시선: 얼굴이 향한 우측 전방', '입: 아주 작게 다묾 · 미소 없음'], ['눈: 양쪽 반쯤 뜸 · 윗눈꺼풀 낮게', '눈썹: 안쪽이 조금 낮은 완만한 경사', '시선: 얼굴이 향한 우측 전방', '입: 아주 작게 다묾 · 미소 없음'], ['눈: 양쪽 뜸 · 힘주어 좁힌 눈매', '눈썹: 안쪽을 낮춰 강하게 모음', '시선: 우측 아래 돌진 목표', '입: 작은 가로 타원으로 살짝 벌림'], ['눈: 양쪽 반쯤 뜸 · 차분하게 집중', '눈썹: 안쪽이 조금 낮은 완만한 경사', '시선: 뻗은 손 너머 우측 전방', '입: 작게 다묾'], ['눈: 화면 왼쪽 눈 감음 · 반대 눈 가늘게 뜸', '눈썹: 안쪽이 들림 · 힘겨운 비대칭', '시선: 뜬 눈은 우측 아래', '입: 작게 다묾 · 입꼬리 조금 내려감'], ['눈: 양쪽 뜸 · 윗눈꺼풀에 힘을 줌', '눈썹: 안쪽 낮게 · 선명한 긴장', '시선: 좌측 아래 돌진 목표', '입: 작게 다묾 · 큰 외침 없음'], ['눈: 양쪽 뜸 · 약간 좁힌 집중 눈매', '눈썹: 안쪽 낮게 · 완만한 긴장', '시선: 뻗은 손 너머 좌측 전방', '입: 작고 둥글게 벌림 · 주문 중'], ['눈: 양쪽 가늘게 뜸 · 윗눈꺼풀 처짐', '눈썹: 약한 비대칭 · 지친 긴장', '시선: 좌측 아래 · 고개 숙임', '입: 작게 다묾 · 손·팔에 일부 가림'], ['눈: 양쪽 반쯤 뜸 · 좁힌 집중 눈매', '눈썹: 안쪽을 약간 낮춤', '시선: 우측 창끝 너머', '입: 작은 선으로 다묾'], ['눈: 양쪽 반쯤 뜸 · 준비와 같은 집중', '눈썹: 안쪽을 약간 낮춤', '시선: 우측 공격 목표', '입: 작은 선으로 다묾'], ['눈: 화면 왼쪽 눈 꽉 감음 · 반대 눈 뜸', '눈썹: 안쪽이 들린 비대칭 · 통증', '시선: 뜬 눈은 우측 전방', '입: 옆으로 벌어진 작은 입 · 흰 틈 표시']]
records=[]
for i,(e,h,lev) in enumerate(zip(entries,heads,levels)):
 im=Image.open(root/e['file']).convert('RGBA');a=np.array(im);rgb=a[:,:,:3];alpha=a[:,:,3]
 gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)
 edges=cv2.Canny(gray,95,190);edges[alpha<200]=0
 contours,_=cv2.findContours((alpha>180).astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 cv2.drawContours(edges,contours,-1,255,1)
 sx,sy,_,_=e['sourceBox'];x0,y0,x1,y1=[h[0]-sx+16,h[1]-sy+16,h[2]-sx+16,h[3]-sy+16]
 original_edges=edges.copy()
 # Remove appearance-bearing head area. Detailed body contours remain source-derived.
 edges[max(0,y0-4):min(im.height,y1+1),max(0,x0-4):min(im.width,x1+4)]=0
 # Restore intersecting prop/hand regions from source contours (manual global-coordinate windows).
 preserves=[[(17,236,387,350)],[(371,237,734,346)],[(729,238,1087,349)],[(1061,139,1148,207),(1120,240,1439,359)],[(69,351,95,701),(56,547,127,616),(251,548,310,626)],[(624,367,664,707),(592,561,655,649)],[(994,486,1096,707),(701,582,1096,707)],[(1338,371,1374,717),(1147,552,1211,628),(1308,558,1391,637)],[(67,728,89,1068),(66,925,111,994),(94,951,230,1001)],[(353,950,732,1056)],[(722,951,1130,1056)],[(1353,713,1394,1064),(1318,915,1407,1009),(1223,963,1388,1026)]]
 for bx0,by0,bx1,by1 in preserves[i]:
  ax0=max(0,bx0-sx+16);ay0=max(0,by0-sy+16);ax1=min(im.width,bx1-sx+16);ay1=min(im.height,by1-sy+16)
  edges[ay0:ay1,ax0:ax1]=original_edges[ay0:ay1,ax0:ax1]
 edges=cv2.dilate(edges,np.ones((2,2),np.uint8),iterations=1)
 line=Image.new('RGBA',im.size,(0,0,0,0));ink=np.zeros((im.height,im.width,4),dtype=np.uint8);ink[:,:,:3]=[58,65,72];ink[:,:,3]=edges;line=Image.fromarray(ink)
 # Use six-source standing ratio for head envelope, preserve pose chin attachment.
 body=lev[-1]-h[3];hh=body*.623/.377;hw=hh*.757/.623
 if i in [3,6]:hh=(y1-y0)*.94;hw=hh*.757/.623 # flight foreshortening: projected head matched to nearby standing frames
 cx=(x0+x1)/2;cy=y1-hh/2
 # Canvas large enough for full spear; no source pixels are stretched independently.
 col=i%4;row=i//4;ox=col*600+25;oy=170+row*740
 d.rounded_rectangle((ox-10,oy,ox+565,oy+726),radius=12,outline='#d8dde1',width=2)
 d.text((ox+8,oy+12),f'{i+1:02d} · {labels[i]}',font=F(26),fill='#293647')
 scale=min(440/im.width,450/im.height);px=ox+30+(440-im.width*scale)/2;py=oy+65+(450-im.height*scale)/2
 disp=line.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);board.paste(disp,(round(px),round(py)),disp)
 X=lambda v:px+v*scale;Y=lambda v:py+v*scale
 d.ellipse((X(cx-hw/2),Y(cy-hh/2),X(cx+hw/2),Y(y1)),outline='#69869f',width=3)
 # Facial construction axis only: no eye shape or facial appearance.
 facing=-1 if i in [6,7,8] else 1
 yaw=[45,45,45,45,40,50,50,40,45,45,45,45][i]
 pitch=[0,0,0,15,0,15,15,0,20,10,10,-10][i]
 tilt=[0,0,0,15,0,5,-15,0,-10,5,5,-10][i]
 import math
 arot=math.radians(tilt)
 def facept(u,v):
  return (X(cx+u*math.cos(arot)-v*math.sin(arot)),Y(cy+u*math.sin(arot)+v*math.cos(arot)))
 fc='#387e9b'
 curve=[facept(facing*(hw*(.12+yaw/450)+hw*.09*(1-(t/10)**2)),t*hh*.043) for t in range(-10,11)]
 d.line(curve,fill=fc,width=3)
 # Short nose-direction arrow lies in the face region; a separate axis specifies head tilt.
 start=facept(facing*hw*.29,hh*.16);end=facept(facing*hw*.49,hh*.16)
 d.line((start,end),fill=fc,width=3)
 vx,vy=end[0]-start[0],end[1]-start[1];nn=max(1,(vx*vx+vy*vy)**.5);ux,uy=vx/nn,vy/nn
 d.polygon([end,(end[0]-10*ux+5*uy,end[1]-10*uy-5*ux),(end[0]-10*ux-5*uy,end[1]-10*uy+5*ux)],fill=fc)
 d.text((ox+10,oy+493),f'좌우 회전: {"좌향" if facing<0 else "우향"} 약 {yaw}° (정면=0°)',font=F(18),fill=fc)
 d.text((ox+10,oy+520),f'{"숙임" if pitch>=0 else "젖힘"} 약 {abs(pitch)}° / 화면 {"시계" if tilt>=0 else "반시계"} 기울기 약 {abs(tilt)}°',font=F(18),fill=fc)
 # source-space pose landmarks, not uniform horizontal template lines
 for yy,label,color in [(cy-hh/2,'头顶','#69869f'),(y1,'턱','#69869f')]+[(v-sy+16,t,c) for v,t,c in zip(lev,['어깨','허리','무릎','발'],['#bb6b70','#b89050','#9278a6','#63927e'])]:
  yy=Y(yy);d.line((ox+10,yy,ox+485,yy),fill=color,width=1);d.text((ox+490,yy-9),label.replace('头顶','머리'),font=F(15),fill=color)
 d.text((ox+10,oy+551),'표정: '+expressions[i],font=F(20),fill='#293647')
 for j,note in enumerate(expression_notes[i]):d.text((ox+10,oy+581+j*27),note,font=F(18),fill='#364252')
 d.text((ox+10,oy+696),'눈 형태·색은 원본 가이드 / 위 문구는 표정 동작만',font=F(15),fill='#667483')
 records.append({'cell':i+1,'expressionDetails':expression_notes[i],'faceAngles':{'yawDirection':'left' if facing<0 else 'right','yawDegrees':yaw,'pitchDownDegrees':pitch,'screenClockwiseRollDegrees':tilt,'method':'approximate manual visual estimates from 2D pose reference, not measured 3D angles'},'source':e['file'],'headSourceBox':h,'visibleLandmarks':lev,'headEnvelopeRatio':{'height':.623,'width':.757},'note':'manual head region suppression; Canny and alpha contours from original PNG; projected approximation for flight'})
board.save(out/'horus-12-angle-expression-guide.png')
(out/'angle-expression-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
