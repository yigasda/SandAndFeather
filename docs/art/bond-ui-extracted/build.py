from PIL import Image,ImageDraw,ImageFont
import cv2,numpy as np,json
from pathlib import Path
D=Path(__file__).parent; P=D/'png'; V=D/'previews'
src=Image.open(D.parents[1]/'bond-ui/reference/mobile-b.jpg').convert('RGB')
a=np.array(src); mask=np.zeros(a.shape[:2],np.uint8)
texts=[]
def t(x,y,w,h,s,size=22,color='#29140e',bold=False):
 texts.append((x,y,w,h,s,size,color,bold));mask[y:y+h,x:x+w]=255
# Exact source text regions; text is rendered by code, not kept in PNGs.
t(315,201,237,55,'인연과 유대',44,'#fff1cf',True)
t(217,258,432,30,'함께한 시간이, 더 특별한 내일을 만듭니다.',22,'#f6e3bd')
t(298,339,76,43,'세트',32,'#fff1d5',True);t(659,341,94,43,'호루스',31,'#80634d',True)
t(137,428,157,39,'인연의 기록',29,bold=True);t(485,438,306,30,'함께한 순간들이, 소중한 이야기가 됩니다.',17,'#66513a')
for y,date,desc,quote in [(495,'Hathyr 5 · 해질녘','붉은 홍옥수를 팔찌에 꿰어 주었다.','네가 건넨 마음이\n따스했다.'),(598,'Hathyr 3 · 낮','직접 구운 빵을 건넸다.','맛있다며 환하게\n웃어주었다.')]:
 t(214,y,360,29,date,20,'#65513f');t(214,y+33,367,34,desc,21,bold=True);t(624,y+9,145,65,quote,18,'#65513f')
t(135,715,223,39,'오늘부터 쌓는 유대',28,bold=True);t(515,721,275,32,'작은 마음도, 언젠가 큰 인연이 됩니다.',17,'#65513f')
t(425,772,112,30,'12 / 100',23,bold=True)
for x,s in [(184,'20'),(321,'40'),(459,'60'),(598,'80'),(729,'100')]:t(x-15 if s=='100' else x-5,867,55,29,s,20,bold=True)
t(135,922,130,38,'선물하기',29,bold=True);t(488,933,300,30,'마음을 담은 선물은 유대를 깊게 합니다.',17,'#65513f')
for x in [164,274,380,489]:t(x-7,1045,20,29,'1',19,bold=True)
t(634,1001,131,46,'선물하기',29,'#fff1d5',True)
t(134,1102,166,38,'함께하는 활동',27,bold=True);t(508,1113,280,31,'함께하는 시간을 더 많이 만들어 보세요.',16,'#65513f')
for x,title,sub in [(155,'낚시','강가에서 여유를'),(333,'요리','맛있는 걸 함께'),(510,'공부','새로운 걸 배워요'),(710,'탐험','낯선 곳을 함께')]:
 t(x,1175,55,31,title,23,bold=True);t(x-4,1208,84,26,sub,13,'#66513f')
t(137,1285,346,38,'인연은 이어지고, 유대는 오늘부터 쌓입니다.',20,'#56351e')
t(620,1276,126,49,'추억 수첩',29,'#fff1d5',True)
# Inpaint only printed glyphs within known text rectangles, preserving paper grain.
gray=cv2.cvtColor(a,cv2.COLOR_RGB2GRAY)
# Full text rectangles required for bright header lettering as well as dark body lettering.
b=cv2.inpaint(a,mask,5,cv2.INPAINT_TELEA)
clean=Image.fromarray(b).convert('RGBA')
# Gauge uses a clean original unfilled strip, avoiding inpaint shadows.
strip=src.crop((550,774,580,800))
clean.paste(strip.resize((120,26)),(420,774))
sections=[('title',(35,154,841,308)),('tabs',(35,308,830,420)),('records',(35,420,830,702)),('bond',(35,702,830,910)),('gifts',(35,910,830,1090)),('activities',(35,1090,830,1255)),('footer',(35,1255,830,1375))]
# Independently extracted art objects, including their original backing where needed.
objects={
'close':(777,154,841,220),'ankh-left':(93,201,153,282),'ankh-right':(710,201,765,282),'lotus-left':(234,201,301,254),'lotus-right':(558,201,623,254),
'set-symbol':(102,308,213,400),'horus-symbol':(452,323,578,400),'paw':(249,343,294,382),'falcon-symbol':(601,343,650,384),
'book':(79,428,130,469),'sprout':(77,710,125,755),'gift-symbol':(80,925,127,964),'branch':(78,1098,129,1143),'heart':(90,769,140,813),
'record-bracelet':(95,489,204,570),'record-bread':(95,592,204,669),
'gauge':(146,767,771,808),'reward-20':(172,817,223,870),'reward-40':(310,817,363,870),'reward-60':(449,817,501,870),'reward-80':(586,817,640,870),'reward-100':(707,807,766,870),
'gift-flowers':(82,974,186,1073),'gift-pie-selected':(190,974,293,1073),'gift-book':(296,974,402,1073),'gift-lotus':(403,974,509,1073),'gift-button':(525,973,784,1074),
'activity-fishing':(76,1150,244,1249),'activity-cooking':(250,1150,422,1249),'activity-study':(425,1150,608,1249),'activity-explore':(612,1150,789,1249),
'feather':(86,1268,132,1331),'memory-button':(519,1259,794,1343),
'corner-tl':(35,173,90,218),'corner-tr':(778,269,830,310),'corner-bl':(35,1332,87,1375),'corner-br':(782,1332,830,1375)
}
manifest={'source':'../../bond-ui/reference/mobile-b.jpg','status':'extraction and code-text assembly proposal; not deployed','assets':[],'text':texts}
for n,r in objects.items():
 clean.crop(r).save(P/(n+'.png'));manifest['assets'].append({'name':n,'rect':r,'backing':'original backing preserved'})
# Section plates retain exact original framing and paper; object regions are transparent holes.
canvas=Image.new('RGBA',(864,1221))
for n,r in sections:
 piece=clean.crop(r)
 for on,rr in objects.items():
  if rr[0]>=r[0] and rr[1]>=r[1] and rr[2]<=r[2] and rr[3]<=r[3]:
   piece.paste((0,0,0,0),(rr[0]-r[0],rr[1]-r[1],rr[2]-r[0],rr[3]-r[1]))
 piece.save(P/(n+'-plate.png'));canvas.alpha_composite(piece,(r[0],r[1]-154))
 manifest['assets'].append({'name':n+'-plate','rect':r,'backing':'paper/wood opaque; extracted objects removed with alpha'})
for n,r in objects.items():canvas.alpha_composite(Image.open(P/(n+'.png')),(r[0],r[1]-154))
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';boldfont='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
def render(base,scale=1):
 out=base.copy();d=ImageDraw.Draw(out)
 for x,y,w,h,s,size,col,bold in texts:
  f=ImageFont.truetype(boldfont if bold else font,size)
  d.multiline_text((x,y-154-3),s,font=f,fill=col,spacing=3)
 return out
out=render(canvas)
# Remove the surrounding map above the frame, keeping the raised close button.
out.paste((0,0,0,0),(0,0,776,18))
out=out.crop((35,0,841,1221))
out.save(V/'assembled-original.png')
for w in [412,320]:out.resize((w,round(out.height*w/out.width)),Image.Resampling.LANCZOS).save(V/f'assembled-{w}.png')
# Comparison at identical scale, no screenshots substituted for the reconstructed output.
comp=Image.new('RGB',(1728,1221),'#e6dcc6');comp.paste(src.crop((0,154,864,1375)),(0,0));comp.paste(out,(899,0),out);comp.resize((1152,814)).save(V/'comparison.png')
files=list(P.glob('*.png'));sheet=Image.new('RGBA',(1200,((len(files)+5)//6)*230))
for i,p in enumerate(files):
 im=Image.open(p);im.thumbnail((188,208));sheet.alpha_composite(im,((i%6)*200,(i//6)*230))
sheet.save(V/'parts-transparent.png')
(D/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(len(files),'assets')
