from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
B=Path('docs/art/chibi-refresh');P=B/'pickup-somang-v178';F=B/'final/somang';font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
def rgba(p):return Image.open(p).convert('RGBA')
def walk(d,n):
 im=rgba(F/'walk'/f'somang-{d}-{n}.png').resize((628,698),Image.Resampling.NEAREST);out=Image.new('RGBA',(620,720));out.alpha_composite(im,(-4,16));return out
D=['front','back','left','right']
for mode,bg,fg in [('light','#f5efe3','#342c29'),('dark','#253041','white')]:
 sheet=Image.new('RGB',(1860,1576),bg);dr=ImageDraw.Draw(sheet)
 for row,d in enumerate(D):
  ims=[rgba(F/'idle'/f'somang-{d}.png')]+[rgba(P/'png'/f'somang-{d}-{n}.png') for n in range(2)]+[walk(d,n) for n in range(3)]
  for col,(im,label) in enumerate(zip(ims,['IDLE','LOWER 0','TOUCH 1','WALK 0','WALK 1','WALK 2'])):
   x=310*col;y=394*row;dr.text((x+10,y+7),d.upper()+' / '+label,font=font,fill=fg);im=im.resize((310,360),Image.Resampling.NEAREST);sheet.paste(im,(x,y+32),im)
 sheet.save(P/'previews'/f'idle-pickup-walk-{mode}.png')
frames=[]
for phase in ['idle',0,1,'idle']:
 s=Image.new('RGB',(620,788),'#f5efe3');dr=ImageDraw.Draw(s)
 for i,d in enumerate(D):
  im=rgba(F/'idle'/f'somang-{d}.png') if phase=='idle' else rgba(P/'png'/f'somang-{d}-{phase}.png');im=im.resize((310,360),Image.Resampling.NEAREST);x=i%2*310;y=i//2*394;dr.text((x+10,y+7),d.upper()+' / '+str(phase).upper(),font=font,fill='#342c29');s.paste(im,(x,y+32),im)
 frames.append(s)
frames[0].save(P/'previews/pickup-four-directions.gif',save_all=True,append_images=frames[1:],duration=[1000,200,200,800],loop=0,disposal=2)
# Details on contrasting background, maintaining actual pixels.
s=Image.new('RGB',(840,1220),'#253041');dr=ImageDraw.Draw(s)
for row,d in enumerate(D):
 for n in range(2):
  im=rgba(P/'png'/f'somang-{d}-{n}.png').crop((100,400,520,680));x=n*420;y=row*305;dr.text((x+10,y+2),f'{d.upper()} {n}',font=font,fill='white');s.paste(im,(x,y+25),im)
s.save(P/'previews/connections-dark.png')
# Each representative: original idle, new pose, original walk at equal logical scale.
for folder,name,d in [('sit-somang-v179','somang-left','left'),('sleep-somang-v180','somang-sleep','front')]:
 p=B/folder;pose=rgba(p/'png'/f'{name}-0.png')
 for mode,bg,fg in [('light','#f5efe3','#342c29'),('dark','#253041','white')]:
  s=Image.new('RGB',(1860,760),bg);dr=ImageDraw.Draw(s)
  for n,(im,label) in enumerate([(rgba(F/'idle'/f'somang-{d}.png'),'APPROVED IDLE'),(pose,'SIT LEFT / SAMPLE' if d=='left' else 'SLEEP / SAMPLE'),(walk(d,0),'APPROVED WALK')]):
   dr.text((620*n+15,10),label,font=font,fill=fg);s.paste(im,(620*n,35),im)
  s.save(p/'previews'/f'comparison-{mode}.png')
 # Standalone light preview.
 s=Image.new('RGB',(620,760),'#f5efe3');s.paste(pose,(0,35),pose);ImageDraw.Draw(s).text((20,10),'SOMANG / SIT LEFT' if d=='left' else 'SOMANG / SLEEP',font=font,fill='#342c29');s.save(p/'previews/representative.png')
# Actual furniture placement at an indicative game scale, with no changes to map art.
scale=160/576
sleep=rgba(B/'sleep-somang-v180/png/somang-sleep-0.png').resize((round(620*scale),round(720*scale)),Image.Resampling.NEAREST)
examples=[]
for file,anchor,crop in [('set-room-v6-single-window-day.png',(1268,284),(1100,130,1580,610)),('horus-room-v2-wide-day.png',(287,300),(135,145,615,625))]:
 room=rgba(Path('docs/art/map-expansion')/file);pos=(round(anchor[0]-310*scale),round(anchor[1]-450*scale));room.alpha_composite(sleep,pos);examples.append(room.crop(crop).convert('RGB'))
s=Image.new('RGB',(960,520),'#f5efe3');dr=ImageDraw.Draw(s)
for i,im in enumerate(examples):s.paste(im,(480*i,40));dr.text((480*i+12,10),['SET BED / SIZE PREVIEW','HORUS BED / SIZE PREVIEW'][i],font=font,fill='#342c29')
s.save(B/'sleep-somang-v180/previews/bed-placement.png')
seat=rgba(B/'sit-somang-v179/png/somang-left-0.png').resize((round(620*scale),round(720*scale)),Image.Resampling.NEAREST);room=rgba('docs/art/map-expansion/set-room-v6-single-window-day.png');room.alpha_composite(seat,(round(966-330*scale),round(446-642*scale)));room.crop((580,280,1060,600)).save(B/'sit-somang-v179/previews/cushion-placement.png')
