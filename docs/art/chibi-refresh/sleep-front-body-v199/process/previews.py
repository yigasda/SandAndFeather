from PIL import Image,ImageDraw
from pathlib import Path
import numpy as np,json,hashlib
r=Path('/workspace/SandAndFeather-git/docs/art/chibi-refresh');p=r/'sleep-front-body-v199';bg=(245,239,227)
rows=[];tiles=[];stats=[]
for who in ['set','horus']:
 for f in [0,1]:
  paths=[r/f'sleep-selected-v198/png/{who}-sleep-{f}.png',r/f'sleep-set-horus-v195/png/horus-sleep-{f}.png',p/f'png/{who}-sleep-{f}.png']
  row=Image.new('RGB',(1860,752),bg);d=ImageDraw.Draw(row)
  for i,(file,label) in enumerate(zip(paths,['198 BASE','195 HORUS BODY REFERENCE','199 NEW BODY'])):
   im=Image.open(file).convert('RGBA');row.paste(im,(620*i,32),im);d.text((620*i+12,10),who+' '+str(f)+' / '+label,fill=(60,40,30))
  row.save(p/f'previews/{who}-{f}-comparison.png');rows.append(row.resize((930,376),Image.Resampling.LANCZOS))
  a=np.array(Image.open(paths[0]));b=np.array(Image.open(paths[2]));diff=np.any(a!=b,axis=2)
  mark=Image.new('RGB',(620,720),bg);m=np.array(mark);m[diff]=(225,30,40);Image.fromarray(m).save(p/f'previews/{who}-{f}-difference.png')
  stats.append({'file':paths[2].name,'headTop350ChangedPixels':int(diff[:350].sum()),'faceBoxChangedPixels':int(diff[235:390,220:397].sum()),'changedPixels':int(diff.sum())})
  # Onion of the newly painted body and the body underlay; faces excluded.
  ref=Image.open(paths[1]).convert('RGBA');new=Image.open(paths[2]).convert('RGBA');ref.alpha_composite(Image.new('RGBA',(620,390),(0,0,0,0))) if False else None
  ra=np.array(ref);na=np.array(new);ra[:390]=0;na[:390]=0
  ra[:,:,3]=(ra[:,:,3].astype(float)*.45).astype('uint8');na[:,:,3]=(na[:,:,3].astype(float)*.55).astype('uint8')
  onion=Image.new('RGBA',(620,720),bg+(255,));onion.alpha_composite(Image.fromarray(ra));onion.alpha_composite(Image.fromarray(na));onion.convert('RGB').save(p/f'previews/{who}-{f}-body-onion.png')
for background,label in [(bg,'light'),((32,40,55),'dark')]:
 sheet=Image.new('RGB',(1240,752),background);d=ImageDraw.Draw(sheet)
 for i,(who,f) in enumerate([(w,f) for w in ['set','horus'] for f in [0,1]]):
  im=Image.open(p/f'png/{who}-sleep-{f}.png').convert('RGBA');x=i%2*620;y=i//2*376;thumb=im.resize((310,360),Image.Resampling.LANCZOS)
  # each pair occupies a half-width tile, two characters side by side
  x=i*310; y=0
  sheet.paste(thumb,(x,28),thumb);d.text((x+8,8),who+' '+str(f),fill=(100,85,70))
 sheet.crop((0,0,1240,388)).save(p/f'previews/four-{label}.png')
comp=Image.new('RGB',(930,1504),bg)
for i,row in enumerate(rows):comp.paste(row,(0,i*376))
comp.save(p/'previews/comparison-all.png')
frames=[];small=[]
for f in [0,1]:
 sheet=Image.new('RGB',(1240,720),bg)
 for i,who in enumerate(['set','horus']):
  im=Image.open(p/f'png/{who}-sleep-{f}.png').convert('RGBA');sheet.paste(im,(620*i,0),im)
 frames.append(sheet.resize((620,360),Image.Resampling.LANCZOS));small.append(sheet.resize((68,39),Image.Resampling.LANCZOS))
frames[0].save(p/'previews/breathing.gif',save_all=True,append_images=frames[1:],duration=800,loop=0)
small[0].save(p/'previews/breathing-game.gif',save_all=True,append_images=small[1:],duration=800,loop=0)
(p/'checks/preserved-regions.json').write_text(json.dumps(stats,indent=2)+'\n')
files=[]
for file in sorted((p/'png').glob('*.png')):
 files.append({'path':'png/'+file.name,'character':file.name.split('-')[0],'direction':'front','frame':int(file.stem[-1]),'anchor':{'kind':'body-center','position':[310,450]},'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'status':'awaiting-user-review','artApproved':False,'baseRevision':198,'bodyReference':'195 Horus front; Set retains left-up/right-down arm gesture'})
(p/'manifest.json').write_text(json.dumps({'revision':199,'action':'sleep','status':'awaiting-user-review','artApproved':False,'runtimeEligible':False,'canvas':[620,720],'frameCount':4,'playback':{'durationMs':[800,800],'loop':True},'files':files},ensure_ascii=False,indent=2)+'\n')
print(stats)
