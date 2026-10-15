from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,hashlib,math
B=Path('/workspace/sand/docs/art/chibi-refresh'); O=Path('/workspace/horus-motion-diagrams')
# Manually observed image-space landmarks, not generated poses. Occluded joints are estimates.
D=[]
def add(id,title,path,face,axis,arms,legs,eyes,mouth,prop=None,note=''):
 D.append(dict(id=id,title=title,path=path,face=face,axis=axis,arms=arms,legs=legs,eyes=eyes,mouth=mouth,prop=prop or [],note=note))
add('01-walk','걷기 정면 0','final/horus/walk/horus-front-0.png',(75,147,270,235),[(174,237),(174,270),(174,305)], [[(145,250),(133,266),(124,281)],[(202,250),(218,271),(222,285)]],[[(156,303),(155,323),(155,335)],[(188,304),(185,335),(184,354)]], [[(112,181),(131,185),(149,188)],[(200,188),(218,184),(235,181)]],[(166,221),(178,221)],note='앞으로 내딛은 발과 반대 팔 / 기본 눈매')
add('02-pickup','줍기 정면 1','pickup-trio-v182/png/horus-front-1.png',(150,410,477,572),[(309,575),(307,600),(307,620)], [[(275,583),(286,613),(306,648)],[(358,582),(381,590),(352,592)]],[[(289,616),(255,612),(251,639)],[(333,615),(354,612),(370,639)]], [[(206,501),(239,510),(272,514)],[(346,513),(381,505),(410,496)]],[(297,558),(316,558)],note='한 손은 바닥 중앙 / 반대 손은 무릎 / 깊은 쪼그림')
add('03-kneel','바닥 앉기 왼쪽','sit-trio-v190/png/horus-left-floor-0.png',(131,250,397,443),[(277,448),(287,502),(296,574)], [[(254,466),(218,523),(187,579)],[(300,478),(267,531),(240,584)]],[[(276,576),(226,628),(354,640)],[(315,580),(272,637),(380,637)]], [[(143,345),(165,346),(189,348)]],[(143,409),(154,412)],note='왼쪽 얼굴 / 정좌 / 두 손을 무릎 위에')
add('04-sleep','잠자기 바로눕기 0','sleep-trio-v220/png/horus-sleep-0.png',(149,218,476,399),[(310,400),(310,444),(310,497)], [[(263,416),(240,446),(286,454)],[(360,416),(380,446),(331,454)]],[[(275,498),(273,543),(270,585)],[(346,498),(350,543),(357,583)]], [[(205,319),(242,328),(281,322)],[(341,322),(375,328),(412,319)]],[(301,366),(317,367)],note='등을 대고 누움 / 배 위 두 손 / 발바닥이 관객 쪽')
add('05-sleep-side','잠자기 옆눕기 0','sleep-trio-v220/png/horus-sleep-side-0.png',(279,261,477,420),[(318,405),(303,447),(293,498)], [[(307,419),(343,454),(395,407)],[(283,432),(331,468),(379,425)]],[[(301,495),(407,521),(365,606)],[(280,511),(377,550),(346,590)]], [[(383,343),(410,365),(443,375)]],[(445,410),(455,413)],note='오른쪽으로 모로 누움 / 손은 얼굴 앞 / 무릎 굽힘')
add('06-fish-wait','낚시 기다리기 0','fishing-fix/png/horus-front-fish-0.png',(365,433,718,611),[(542,614),(541,664),(541,718)], [[(487,633),(475,663),(492,678)],[(590,634),(578,661),(540,678)]],[[(514,716),(512,750),(513,789)],[(568,716),(570,750),(570,789)]], [[(430,520),(472,524),(506,536)],[(570,535),(610,524),(648,520)]],[(533,589),(549,589)], [[(478,686),(398,749),(310,819)]], '두 손은 몸 앞 / 두 발 나란히 / 낚싯대는 왼쪽 아래')
add('07-fish-pull','낚시 당기기 1','fishing-fix/png/horus-front-fish-1.png',(458,496,793,697),[(619,681),(565,706),(517,754)], [[(538,658),(467,628),(451,547)],[(611,689),(551,677),(478,632)]],[[(508,754),(474,790),(423,829)],[(558,770),(526,812),(478,846)]], [[(481,541),(516,559),(549,584)],[(602,606),(647,610),(681,603)]],[(573,659),(591,666)], [[(493,686),(492,600),(499,490),(501,371),(482,306),(422,286),(357,296),(300,325)]], '뒤로 기운 원본 각도 / 양손 높이차 / 발은 왼쪽 아래')
add('08-drink','마시기 오른쪽','life-v1/eat/png/horus-right-eat-0.png',(208,182,374,346),[(260,349),(265,393),(273,444)], [[(293,363),(328,379),(365,342)],[(240,373),(266,418),(293,450)]],[[(280,439),(323,485),(196,494)],[(249,445),(290,493),(164,495)]], [[(299,264),(319,256),(338,263)]],[(361,314),(369,311)], [[(351,312),(370,272),(402,299),(386,338),(351,312)]], '오른쪽을 보고 정좌 / 컵을 든 손 / 반대 손은 허벅지')
add('09-cook','요리 뒷모습','life-v1/cook/png/horus-back-cook-0.png',(152,220,466,395),[(309,397),(310,445),(310,514)], [[(245,421),(212,447),(229,427)],[(376,422),(401,449),(380,427)]],[[(269,513),(268,574),(262,622)],[(348,514),(348,575),(350,621)]], [],[],note='뒷모습 / 팔꿈치는 양옆 / 손은 앞쪽이라 가려짐')
add('10-read','읽기 정면','life-v1/read/png/horus-front-read-0.png',(128,242,478,404),[(307,404),(307,454),(307,503)], [[(251,420),(215,457),(210,451)],[(365,420),(400,457),(400,451)]],[[(270,503),(270,560),(266,596)],[(344,504),(345,559),(349,596)]], [[(198,330),(232,342),(267,345)],[(341,345),(376,334),(410,325)]],[(297,391),(314,391)], [[(212,406),(395,406),(395,478),(212,478),(212,406)]], '가슴 앞 두루마리 양끝을 잡음 / 내리깐 시선')
add('11-shy','쑥스러움','life-v1/shy/png/horus-front-shy-0.png',(135,229,478,414),[(308,416),(307,464),(306,521)], [[(253,437),(253,469),(350,471)],[(365,437),(365,479),(278,452)]],[[(272,520),(270,579),(265,619)],[(344,520),(346,579),(349,619)]], [[(183,324),(218,337),(254,341)],[(316,342),(357,337),(397,331)]],[(278,396),(295,398)],note='팔짱 / 얼굴과 시선은 화면 왼쪽 / 옅은 홍조')
add('12-alert','놀람·경계','life-v1/surprised/png/horus-front-surprised-0.png',(133,243,484,419),[(308,418),(309,468),(310,527)], [[(254,441),(223,478),(200,516)],[(369,440),(391,469),(430,455)]],[[(272,526),(263,579),(251,616)],[(349,526),(363,579),(378,616)]], [[(188,330),(224,340),(261,345)],[(326,345),(368,332),(402,329)]],[(282,400),(299,400)],note='한 손바닥을 듦 / 반대 팔 굽힘 / 눈썹과 눈은 경계')
fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
F=lambda n:ImageFont.truetype(fontpath,n)
blue='#1677ba';orange='#d56b22';gray='#78828c';purple='#7b45a1'
def line(d,pts,c=blue,w=4):
 if len(pts)>1:d.line(pts,fill=c,width=w,joint='curve')
def diagram(item,size,offset=(0,0),scale=1):
 layer=Image.new('RGBA',size);d=ImageDraw.Draw(layer)
 def p(x):return (round(x[0]*scale+offset[0]),round(x[1]*scale+offset[1]))
 # Ellipse means face orientation only, never hair silhouette or new anatomy.
 box=item['face'];d.ellipse([p(box[:2]),p(box[2:])],outline=gray,width=3)
 for chain in [item['axis']]+item['arms']+item['legs']:
  line(d,[p(x) for x in chain],blue,4)
  for x in chain:
   a,b=p(x);d.ellipse((a-4,b-4,a+4,b+4),fill='white',outline=blue,width=2)
 # shoulder / hip axes
 for chains in [item['arms'],item['legs']]:line(d,[p(chains[0][0]),p(chains[1][0])],blue,3)
 for e in item['eyes']:line(d,[p(x) for x in e],purple,4)
 line(d,[p(x) for x in item['mouth']],purple,3)
 for chain in item['prop']:line(d,[p(x) for x in chain],orange,4)
 return layer
panels=[]
for i in D:
 src=Image.open(B/i['path']).convert('RGBA'); w,h=src.size
 i['source_sha256']=hashlib.sha256((B/i['path']).read_bytes()).hexdigest();i['source_size']=[w,h]
 # fixed canvas within each comparison, never independent fit
 a=src.getchannel('A').point(lambda v:255 if v>100 else 0).getbbox()
 coords=[p for chain in [i['axis']]+i['arms']+i['legs']+i['prop'] for p in chain]
 x0=min(a[0],*(p[0] for p in coords))-20;y0=min(a[1],*(p[1] for p in coords))-20
 x1=max(a[2],*(p[0] for p in coords))+20;y1=max(a[3],*(p[1] for p in coords))+20
 box=tuple(map(int,(x0,y0,x1,y1))); crop=src.crop(box);dg=diagram(i,src.size).crop(box)
 factor=min(335/crop.width,410/crop.height); sz=(round(crop.width*factor),round(crop.height*factor))
 tile=Image.new('RGB',(1080,550),'#f7f6f2');t=ImageDraw.Draw(tile)
 t.text((18,8),i['id']+'  '+i['title'],font=F(22),fill='#202b37')
 overlay=src.copy();overlay.putalpha(src.getchannel('A').point(lambda v:int(v*.48)));overlay=Image.alpha_composite(overlay,diagram(i,src.size)).crop(box)
 for n,img in enumerate([crop,overlay,dg]):
  t.text((n*360+18,48),['원본','원본 위 좌표 검수','분리 도식'][n],font=F(18),fill='#52606e')
  im=img.resize(sz,Image.Resampling.LANCZOS);tile.paste(im,(n*360+(360-sz[0])//2,85+(410-sz[1])//2),im)
 t.text((18,507),i['note'],font=F(18),fill='#202b37')
 tile.save(O/(i['id']+'-compare.png'));diagram(i,src.size).save(O/(i['id']+'-diagram.png'))
 panels.append(tile)
# 2 columns x 6 rows, detailed sheet available separately
sheet=Image.new('RGB',(2160,3420),'white');s=ImageDraw.Draw(sheet)
s.text((25,10),'호루스 기존 모션 — 원본 좌표 기반 도식 12종',font=F(34),fill='#182c43')
s.text((25,58),'파랑: 관절·몸통 / 주황: 소품 / 보라: 눈꺼풀·입 방향 / 회색: 얼굴 범위',font=F(22),fill='#435469')
s.text((25,90),'기존 구도 추출용 · 가려진 관절은 추정 · 새 비율 적용 전 · 완성 스프라이트 아님',font=F(21),fill='#7c4b2b')
for n,t in enumerate(panels):sheet.paste(t,((n%2)*1080,120+(n//2)*550))
sheet.save(O/'00-original-overlay-diagrams.png')
(O/'landmarks.json').write_text(json.dumps({'status':'manual extraction draft; hidden joints estimated; source proportions retained, not new-body retarget','source_commit':__import__('subprocess').check_output(['git','rev-parse','HEAD'],cwd='/workspace/sand',text=True).strip(),'frames':D},ensure_ascii=False,indent=2))
(O/'README.txt').write_text('호루스 모션 도식 — 기존 PNG 직접 관찰 좌표\n\n12개 대표 프레임의 원본 / 원본+도식 / 도식을 같은 변환으로 나란히 배치.\n도식은 생성 모델을 사용하지 않고 Python/Pillow로 좌표를 그림.\n눈 선은 눈꺼풀 방향, 얼굴 타원은 구도 범위다. 원본 윤곽의 정밀 트레이싱이 아니다.\n가려진 어깨·골반·팔꿈치·무릎은 수동 추정. 좌표 JSON에 원본 경로·크기·해시 포함.\n현재 기존 구도를 검수하는 단계이며 새 외형 비율로 변환하지 않았다.\n다음 단계는 이 좌표의 방향·각도·소품 관계를 유지해 새 짧은 몸으로 관절 길이를 조정.\n비교 PNG에는 기존 외형이 있으므로 생성 참고에 첨부하지 않는다. 분리 도식과 새 외형 원본만 사용.\n전 프레임/전투/전체 방향 추출 완료로 간주하지 않는다.\n',encoding='utf-8')
print('Wrote',len(D),'individual diagrams and comparisons')
