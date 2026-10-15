from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,math,statistics
out=Path('/workspace/horus-combat-pose-guide')
source=Path('/workspace/horus-redraw-68/source-combat-guide/landmarks.json')
lm=json.loads(source.read_text())['frames']
ratios={k:statistics.median([(m[b]-m[a])/(m['sole']-m['top']) for m in lm]) for k,a,b in [('headHeight','top','chin'),('headWidth','left','right'),('shoulderWidth','sl','sr')]}
H=210;hw=ratios['headWidth']*H;hh=ratios['headHeight']*H;sw=ratios['shoulderWidth']*H
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc';F=lambda n:ImageFont.truetype(font,n)
W=1920;CH=500;im=Image.new('RGB',(W,CH*3+200),'#faf9f5');d=ImageDraw.Draw(im)
d.text((30,20),'호루스 · 12동작 선 도식 / 기준 전투 6장 비율 적용',font=F(32),fill='#242c39')
d.text((30,68),'외형은 별도 원본·눈·색 가이드만 사용. 이 도식은 비율·관절·방향·창 각도·표정 의도 전용.',font=F(23),fill='#343d4b')
d.text((30,108),f'6장 수동 기준선 중앙값: 머리 폭 {ratios["headWidth"]:.1%} · 머리 높이 {ratios["headHeight"]:.1%} · 어깨 폭 {ratios["shoulderWidth"]:.1%} (머리끝~발=100%)',font=F(20),fill='#566472')
d.text((30,145),'타원 = 머리카락 포함 전체 머리 범위 / 얼굴·머리카락·문양·채색 생략 / 파랑: 머리, 빨강: 어깨, 초록: 허리·발',font=F(19),fill='#566472')
labels=['우향 대기 0','우향 대기 1','우향 대기 2','우향 대각 돌진','우향 주문','우향 지침','좌향 대각 돌진','좌향 주문','좌향 지침','우향 공격 준비','우향 찌르기','우향 피격']
expr=['차분한 경계','차분한 경계','차분한 경계','집중 · 입 조금 열림','차분한 집중','한쪽 눈 감음 · 지침','집중 · 입 조금 열림','차분한 집중','눈을 낮춤 · 지침','집중','집중','한쪽 눈 감음 · 입 벌림']
records=[]
for i in range(12):
 x=(i%4)*480;y=200+(i//4)*CH;cx=x+235;cy=y+185;s=1.45
 d.rounded_rectangle((x+10,y+5,x+470,y+490),radius=12,outline='#d9dfe1',width=2)
 d.text((x+25,y+20),f'{i+1:02d}  {labels[i]}',font=F(23),fill='#26313e')
 mirror=-1 if i in [6,7,8] else 1
 # Canonical proportions from six approved combat sprites. Pose joints manually abstracted from the twelve-pose reference.
 p={'neck':(0,hh/2+3),'ls':(-sw/2,hh/2+9),'rs':(sw/2,hh/2+9),'hip':(0,hh/2+33),'lk':(-38,hh/2+52),'rk':(38,hh/2+52),'lf':(-51,145),'rf':(51,145),'le':(-40,90),'re':(25,87),'lh':(-22,87),'rh':(49,80)}
 spear=((-98,103),(134,69));angle=0
 if i in [0,1,2]:
  delta=[0,2,-2][i];p['lh']=(-22,87+delta);p['rh']=(49,80+delta);spear=((-98,103+delta),(134,69+delta))
 if i in [3,6]:
  angle=48;cx+=45*mirror;s=1.25;p['le']=(-45,85);p['lh']=(-65,75);p['re']=(49,88);p['rh']=(65,100)
  p['lk']=(-33,112);p['lf']=(-58,123);p['rk']=(24,116);p['rf']=(6,134);spear=((-92,66),(129,117))
 if i in [4,7]:
  p.update(le=(-55,78),lh=(-72,68),re=(53,73),rh=(70,60));spear=((-72,-99),(-72,145))
 if i in [5,8]:
  p.update(ls=(-sw/2,hh/2+9),rs=(sw/2,hh/2+9),hip=(-5,109),lk=(-38,135),rk=(40,107),lf=(-55,144),rf=(52,145),le=(-36,111),lh=(-30,139),re=(48,91),rh=(66,67))
  spear=((66,-73),(66,145))
  if i==8:p.update(le=(-4,87),lh=(65,76),re=(54,77),rh=(66,57));spear=((66,-88),(66,145))
 if i in [9,10]:
  p.update(hip=(-7,99),lk=(-47,124),rk=(43,119),lf=(-68,145),rf=(62,145),le=(-46,87),lh=(-35,85),re=(32,82),rh=(65 if i==10 else 45,83));spear=((-110,87),(142,83))
 if i==11:
  p.update(le=(-14,105),lh=(30,111),re=(45,87),rh=(43,66));spear=((60,-102),(9,151))
 if i in [4,5,7,8,11]:spear=(spear[1],spear[0])
 a=math.radians(angle)
 def tr(v):
  xx,yy=v;xx,yy=xx*math.cos(a)-yy*math.sin(a),xx*math.sin(a)+yy*math.cos(a)
  return (cx+xx*mirror*s,cy+yy*s)
 def line(points,col='#58616a',width=6):d.line([tr(v) for v in points],fill=col,width=width,joint='curve')
 # All hair volume is represented by an unadorned envelope, not a hairstyle.
 ellipse=[tr((hw/2*math.cos(t*math.pi/90),hh/2*math.sin(t*math.pi/90))) for t in range(181)]
 d.line(ellipse,fill='#718caa',width=3)
 line([(-hw/2,0),(hw/2,0)],'#d5dfe7',1)
 line([p['neck'],p['hip']],'#77818b',5)
 line([p['ls'],p['rs']],'#bc7272',4)
 for arm in [('ls','le','lh'),('rs','re','rh')]:line([p[k] for k in arm])
 for leg in [('hip','lk','lf'),('hip','rk','rf')]:line([p[k] for k in leg])
 for key in ['ls','rs','le','re','lh','rh','hip','lk','rk']:
  xx,yy=tr(p[key]);d.ellipse((xx-4,yy-4,xx+4,yy+4),fill='#faf9f5',outline='#59636e',width=2)
 for key in ['lf','rf']:
  xx,yy=p[key];line([(xx-12,yy),(xx+12,yy)],'#648a7b',5)
 line(spear,'#343a45',4)
 # Spear head as plain arrow, with no appearance information.
 st,en=spear;dx,dy=en[0]-st[0],en[1]-st[1];n=math.hypot(dx,dy);u,v=dx/n,dy/n
 d.polygon([tr(en),tr((en[0]-17*u+6*v,en[1]-17*v-6*u)),tr((en[0]-17*u-6*v,en[1]-17*v+6*u))],fill='#343a45')
 xx,yy=tr((hw/2+8,25));d.text((xx-12,yy),'◀' if mirror<0 else '▶',font=F(17),fill='#718caa')
 d.text((x+25,y+435),'표정: '+expr[i],font=F(21),fill='#303b48')
 d.text((x+25,y+466),'머리·눈·피부 외형은 원본 가이드 적용',font=F(16),fill='#697380')
 records.append({'cell':i+1,'pose':labels[i],'expression':expr[i],'joints':p,'spear':spear,'rotationDegrees':angle,'mirror':mirror})
im.save(out/'horus-12-pose-guide.png')
(out/'manifest.json').write_text(json.dumps({'method':'Manual pose abstraction; proportions from median of six approved-source manual landmarks, not anatomical measurements','proportions':ratios,'referenceLandmarks':str(source),'poseReference':'exec-433d7d90-0bdb-42bf-a2eb-a19c64cc61ca.png','cells':records},ensure_ascii=False,indent=2))
print(out/'horus-12-pose-guide.png')
