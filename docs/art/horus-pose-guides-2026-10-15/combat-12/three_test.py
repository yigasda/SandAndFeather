from PIL import Image,ImageDraw,ImageFont
im=Image.new('RGB',(1800,720),'#faf9f5');d=ImageDraw.Draw(im)
F=lambda n:ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',n)
d.text((25,18),'방향·공중 자세 검증 / 우향 대기 · 우향 돌진 · 좌향 돌진',font=F(32),fill='#273345')
d.text((25,66),'얼굴은 코·턱·귀 위치로 방향 표시. 눈·머리카락·색은 외형 가이드 사용. 공중 몸통은 압축하지 않음.',font=F(23),fill='#536475')
for i in range(3):
 ox=i*600;mirror=i==2
 def pt(p):return (ox+(600-p[0] if mirror else p[0]),p[1])
 def poly(p,fill='#f6f4ee',outline='#3e4a59',width=3):d.polygon([pt(v) for v in p],fill=fill);d.line([pt(v) for v in p+[p[0]]],fill=outline,width=width,joint='curve')
 def line(p,c='#3e4a59',w=3):d.line([pt(v) for v in p],fill=c,width=w,joint='curve')
 def ellipse(box,fill='#faf9f5',outline='#3e4a59',w=3):
  a,b=pt(box[:2]),pt(box[2:]);d.ellipse((min(a[0],b[0]),min(a[1],b[1]),max(a[0],b[0]),max(a[1],b[1])),fill=fill,outline=outline,width=w)
 def limb(p,w=25):line(p,'#3e4a59',w+5);line(p,'#faf9f5',w)
 if i==0:
  # feet/legs, compact torso, two gripping hands
  limb([(256,390),(225,435),(210,465)],29);limb([(313,390),(340,435),(360,465)],29)
  ellipse((182,451,240,478));ellipse((330,451,389,478))
  poly([(254,306),(305,306),(326,365),(328,398),(237,398),(243,357)])
  limb([(251,318),(220,350),(237,368)],22);limb([(305,320),(326,347),(335,350)],22)
  line([(100,397),(475,329)],'#4b5662',9);poly([(475,329),(510,315),(480,340)],'#e5e9ec')
  ellipse((222,352,252,381));ellipse((321,334,351,364))
  hx,hy=280,245
 else:
  # Extended body trails behind head; separated knees and feet, diagonal trajectory.
  limb([(224,365),(156,352),(115,376)],29);limb([(227,385),(170,416),(141,439)],29)
  ellipse((87,364,136,393));ellipse((113,427,161,454))
  poly([(278,286),(307,312),(267,379),(232,403),(192,365),(230,325)])
  limb([(274,303),(229,280),(190,262)],23)
  limb([(306,324),(343,353),(384,380)],23)
  line([(125,225),(477,441)],'#4b5662',9);poly([(477,441),(520,474),(469,456)],'#e5e9ec')
  ellipse((175,247,205,277));ellipse((369,365,399,395))
  hx,hy=335,244
 # Structural head volume + true facing contour, no drawn eyes.
 ellipse((hx-91,hy-91,hx+87,hy+66),fill='#f1f5f6',outline='#7592a8',w=2)
 poly([(hx-40,hy-15),(hx+34,hy-27),(hx+65,hy-8),(hx+74,hy+7),(hx+94,hy+18),(hx+78,hy+27),(hx+77,hy+42),(hx+50,hy+61),(hx+8,hy+68),(hx-40,hy+43)],fill='#faf9f5',outline='#3e4a59')
 ellipse((hx-59,hy+2,hx-26,hy+34))
 line([(hx-43,hy+13),(hx-35,hy+20)],'#8393a3',2)
 d.text((ox+25,115),['01 우향 대기','02 우향 공중 돌진','03 좌향 공중 돌진'][i],font=F(28),fill='#273345')
 d.text((ox+25,526),['코 → 오른쪽 / 귀 → 왼쪽','코 → 오른쪽 아래 / 몸통 → 왼쪽 뒤','코 → 왼쪽 아래 / 몸통 → 오른쪽 뒤'][i],font=F(22),fill='#285f7a')
 d.text((ox+25,566),['우향 약 45° · 고개 수평','우향 약 45° · 고개 숙임 약 15°','좌향 약 45° · 고개 숙임 약 15°'][i],font=F(21),fill='#285f7a')
 d.text((ox+25,605),['반쯤 뜬 눈 · 작은 닫힌 입','집중한 눈 · 작은 열린 입','집중한 눈 · 작은 닫힌 입'][i],font=F(21),fill='#465464')
 d.text((ox+25,646),'자세 구조용 수동 도식 · 외형을 복사하지 말 것',font=F(18),fill='#687785')
im.save('/workspace/horus-combat-pose-guide/three-direction-flight-test.png')
