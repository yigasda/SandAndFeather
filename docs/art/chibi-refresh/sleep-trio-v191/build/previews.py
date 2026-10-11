from PIL import Image,ImageDraw,ImageFont,ImageOps
from pathlib import Path
import json,numpy as np
B=Path('docs/art/chibi-refresh');P=B/'sleep-trio-v191';font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
variants=['set-sleep','somang-sleep','horus-sleep','set-sleep-side','horus-sleep-side'];heads={'set-sleep':(310,180),'somang-sleep':(263,248),'horus-sleep':(310,190),'set-sleep-side':(320,225),'horus-sleep-side':(305,210)};anchors={'set-sleep':(310,450),'somang-sleep':(310,450),'horus-sleep':(310,450),'set-sleep-side':(310,450),'horus-sleep-side':(315,445)}
def f(v,n):return Image.open(B/'sleep-somang-v180/png/somang-sleep-0.png' if v=='somang-sleep' and n==0 else (P/'references'/f'{v}-{n}.png' if v=='somang-sleep' else P/'png'/f'{v}-{n}.png')).convert('RGBA')
def idle(v):
 w=v.split('-')[0];return Image.open(B/'final'/w/'idle'/f'{w}-front.png').convert('RGBA')
def gif(images,out):
 atlas=Image.new('RGB',(images[0].width,images[0].height*2));atlas.paste(images[0],(0,0));atlas.paste(images[1],(0,images[0].height));pal=atlas.quantize(colors=256,method=Image.Quantize.MEDIANCUT);a=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in images];a[0].save(out,save_all=True,append_images=a[1:],duration=[800,800],loop=0,disposal=2,optimize=False)
for tag,bg in [('light','#f5efe3'),('dark','#263142')]:
 ov=Image.new('RGB',(1550,780),bg);d=ImageDraw.Draw(ov)
 for j,v in enumerate(variants):
  comp=Image.new('RGB',(1240,400),bg);cd=ImageDraw.Draw(comp)
  for c,(im,label) in enumerate([(idle(v),'IDLE FRONT'),(f(v,0),'EXHALE 0'),(f(v,1),'INHALE 1'),(f('somang-sleep',0),'REF SOMANG180')]):
   q=im.resize((310,360),Image.Resampling.NEAREST);comp.paste(q,(310*c,30),q);cd.text((310*c+6,6),label,font=font,fill='white' if tag=='dark' else '#332c29')
  comp.save(P/'previews'/f'{v}-comparison-{tag}.png')
  for n in [0,1]:
   q=f(v,n).resize((310,360),Image.Resampling.NEAREST);ov.paste(q,(310*j,n*390+28),q);d.text((310*j+5,n*390+5),v+f' / {n}',font=font,fill='white' if tag=='dark' else '#332c29')
 ov.save(P/'previews'/f'sleep-191-all-{tag}.png')
large=[];native=[];zoom=[];game=[]
for n in [0,1]:
 a=Image.new('RGB',(1550,400),'#f5efe3');d=ImageDraw.Draw(a);b=Image.new('RGB',(400,78),'#f5efe3');bd=ImageDraw.Draw(b);z=Image.new('RGB',(5*272,342),'#f5efe3');zd=ImageDraw.Draw(z)
 for j,v in enumerate(variants):
  im=f(v,n);q=im.resize((310,360),Image.Resampling.NEAREST);a.paste(q,(j*310,30),q);d.text((j*310+5,5),v,font=font,fill='#332c29')
  sm=im.resize((33,39),Image.Resampling.NEAREST);b.paste(sm,(j*80+24,29),sm);bd.text((j*80+4,5),v.split('-')[0]+(' side' if 'side' in v else ''),fill='#332c29');en=sm.resize((264,312),Image.Resampling.NEAREST);z.paste(en,(j*272+4,25),en);zd.text((j*272+5,5),v,font=font,fill='#332c29')
 large.append(a);native.append(b);zoom.append(z)
for ims,name in [(large,'sleep-191-breathing.gif'),(native,'sleep-191-game-31px.gif'),(zoom,'sleep-191-game-31px-8x.gif')]:gif(ims,P/'previews'/name)
# Actual game-scale frame differences, shared palette GIF does not produce colour-only palette flicker.
for v in variants:
 aa=[]
 for n in [0,1]:
  sm=f(v,n).resize((33,39),Image.Resampling.NEAREST);bg=Image.new('RGBA',sm.size,'#f5efe3');bg.alpha_composite(sm);aa.append(np.array(bg)[:,:,:3].astype(int))
 diff=np.max(np.abs(aa[1]-aa[0]),axis=2);game.append({'variant':v,'scale':31/576,'cell':[33,39],'changedPixelsDelta5':int((diff>5).sum()),'changedPixelsDelta20':int((diff>20).sum()),'maxChannelDelta':int(diff.max())})
(P/'checks/game31-visibility.json').write_text(json.dumps(game,indent=2)+'\n')
# Rooms at the same scale as the approved180 bed preview (160/576 native art pixels).
settings=[('set','set-room-v6-single-window-day.png',(1100,130,1580,610),[(1266,233),(1410,233)]),('horus','horus-room-v2-wide-day.png',(135,145,615,625),[(290,248),(425,248)])];bedreports=[]
for together,name in [(False,'alone'),(True,'together')]:
 frames=[]
 for n in [0,1]:
  out=Image.new('RGB',(960,505),'#f5efe3');draw=ImageDraw.Draw(out)
  for j,(w,room,crop,pillows) in enumerate(settings):
   rm=Image.open('docs/art/map-expansion/'+room).convert('RGBA');k=160/576;vv=[(w+'-sleep-side',pillows[0]),('somang-sleep',pillows[1])] if together else [(w+'-sleep',pillows[0])];masks=[]
   for v,pos in vv:
    im=f(v,n).resize((round(620*k),round(720*k)),Image.Resampling.NEAREST);hx,hy=heads[v];x,y=round(pos[0]-hx*k),round(pos[1]-hy*k);rm.alpha_composite(im,(x,y));mask=Image.new('L',rm.size);mask.paste(im.getchannel('A'),(x,y));masks.append(np.array(mask)>128)
    if n==0:bedreports.append({'scene':name,'character':v,'room':room,'scale':k,'headAt':pos,'spriteOffset':[x,y],'bellyAnchor':anchors[v],'bellyOnRoom':[round(x+anchors[v][0]*k),round(y+anchors[v][1]*k)]})
   if together:overlap=int((masks[0]&masks[1]).sum());bedreports.append({'scene':name,'room':room,'frame':n,'opaqueOverlapPixels':overlap});assert overlap==0,(w,n,overlap)
   out.paste(rm.crop(crop).convert('RGB'),(j*480,25));draw.text((j*480+5,4),w+' / '+name+' / before quilt occlusion',font=font,fill='#332c29')
  frames.append(out)
 frames[0].save(P/'previews'/f'bed-{name}.png');gif(frames,P/'previews'/f'bed-{name}-breathing.gif')
(P/'checks/bed-placement.json').write_text(json.dumps(bedreports,indent=2)+'\n')
print('game31',game)
