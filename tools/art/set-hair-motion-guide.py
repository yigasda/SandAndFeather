from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math,hashlib
R=Path(__file__).resolve().parents[2];O=R/'docs/art/chibi-refresh/set-hair-motion-guides';(O/'png').mkdir(exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',23);small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',18)
sources=[x for x in json.loads((R/'docs/ASTRA-COMBAT-POSE-SOURCES.json').read_text())['files'] if x['file'].startswith('set-')]
# Independent schematic curves, not traced contours or pixel extraction.
patterns={
'idle-0':([[(760,230),(710,330),(660,460),(690,550)],[(825,245),(860,350),(885,450),(940,515)],[(860,245),(885,310),(870,365),(890,395)]],'아래로 늘어짐 · 끝만 뒤로 약하게'),
'idle-1':([[(760,230),(704,328),(650,455),(678,544)],[(825,245),(860,345),(895,445),(950,506)],[(860,245),(885,307),(877,361),(900,390)]],'대기 0과 같은 흐름 · 끝의 작은 흔들림'),
'idle-2':([[(760,230),(720,335),(677,462),(702,556)],[(825,245),(850,355),(878,461),(929,523)],[(860,245),(883,313),(866,369),(883,400)]],'대기 0과 같은 흐름 · 끝이 되돌아옴'),
'anticipation-0':([[(760,230),(680,295),(540,350),(470,380)],[(825,245),(750,365),(650,435),(545,449)],[(860,245),(873,310),(854,360),(835,380)]],'뒤로 중간 정도 · 몸통 뒤에서 퍼짐'),
'attack-0':([[(760,230),(640,290),(485,285),(375,310)],[(825,245),(725,365),(530,425),(405,400)],[(860,245),(855,308),(808,352),(775,363)]],'뒤로 크게 · 준비보다 넓게 펼침'),
'skill-0':([[(760,230),(650,170),(620,100),(540,80)],[(825,245),(735,185),(775,90),(710,48)],[(860,245),(865,205),(850,167),(821,147)]],'내리꽂는 반동 · 위와 뒤로 솟음'),
'spell-0':([[(760,230),(710,340),(660,465),(696,552)],[(825,245),(850,360),(900,459),(955,511)],[(860,245),(885,309),(875,367),(894,396)]],'대체로 아래 · 끝의 약한 뒤쪽 흐름'),
'tired-0':([[(760,285),(724,385),(688,468),(708,520)],[(825,298),(854,394),(887,457),(925,493)],[(860,298),(881,343),(872,393),(885,420)]],'중력 방향으로 처짐 · 퍼짐 작게'),
'hit-0':([[(760,230),(805,302),(947,356),(1088,330)],[(825,245),(880,372),(1020,428),(1140,393)],[(860,245),(905,290),(971,319),(1038,301)]],'충격으로 앞쪽에 쏠림 · 뒤 다발도 앞으로')}
records=[];tiles=[]
def curve(draw,pts,col,dashed):
 samples=[]
 for i in range(121):
  t=i/120;u=1-t;samples.append(tuple(u**3*pts[0][j]+3*u*u*t*pts[1][j]+3*u*t*t*pts[2][j]+t**3*pts[3][j] for j in (0,1)))
 for i in range(120):
  if not dashed or (i//5)%2==0:draw.line([samples[i],samples[i+1]],fill=col,width=7)
 x,y=samples[-1];xx,yy=samples[-5];angle=math.atan2(y-yy,x-xx);draw.polygon([(x,y),(x-23*math.cos(angle-.46),y-23*math.sin(angle-.46)),(x-23*math.cos(angle+.46),y-23*math.sin(angle+.46))],fill=col)
for s in sources:
 filename=s['file'];side=filename.split('-')[1];slot=filename.split('combat-')[1].removesuffix('.png');curves,note=patterns[slot]
 if side=='left':curves=[[(1600-x,y) for x,y in points] for points in curves]
 im=Image.new('RGBA',(1600,720));d=ImageDraw.Draw(im)
 # Registration point only: not a face/body contour.
 cy=285 if slot=='tired-0' else 230
 d.line((786,cy,814,cy),fill=(100,100,100,160),width=2);d.line((800,cy-14,800,cy+14),fill=(100,100,100,160),width=2)
 for i,points in enumerate(curves):curve(d,points,(40,117,171,255) if i<2 else (216,112,36,255),i<2)
 name=filename.replace('.png','-hair-flow.png');im.save(O/'png'/name)
 rec={'file':'png/'+name,'direction':side,'motion':slot,'observation':note,'backBundles':'blue dashed; behind torso; forward swing does not change layering','frontSideLock':'orange solid; in front of shoulder, must not obscure face/hand','curves':curves,'sourceObserved':{'file':s['file'],'sha256':s['sha256']},'containsCombatPixels':False,'scaleMeaning':'Arrow extent is relative motion/spread, not hair length or physical proportion.','registration':[800,cy]};records.append(rec)
 tile=Image.new('RGB',(640,360),'#f3eee4');tile.paste(im.resize((640,288)),(0,43),im.resize((640,288)));td=ImageDraw.Draw(tile);td.text((12,5),side+' / '+slot,font=font,fill='#302d28');td.text((12,333),note,font=small,fill='#302d28');tiles.append(tile)
sheet=Image.new('RGB',(1920,2160),'white')
for i,tile in enumerate(tiles):sheet.paste(tile,(i%3*640,i//3*360))
sheet.save(O/'00_세트_머리흐름_18장.png')
(O/'manifest.json').write_text(json.dumps({'purpose':'Hair motion only; original Set idle/walk define appearance. Body pose and expressions use ASTRA-PLAN.','canvas':[1600,720],'count':18,'files':records},ensure_ascii=False,indent=2)+'\n')
print('18 transparent guides + overview + manifest created.')
