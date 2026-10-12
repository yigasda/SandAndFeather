from PIL import Image,ImageDraw
from pathlib import Path
import numpy as np,json,hashlib
r=Path('/workspace/SandAndFeather-git/docs/art/chibi-refresh');p=r/'sleep-side-inhale-v200';bg=(245,239,227)
for col,label in [(bg,'light'),((28,35,47),'dark')]:
 s=Image.new('RGB',(1240,748),col);d=ImageDraw.Draw(s)
 for i,(w,f) in enumerate([(w,f) for w in ['set','horus'] for f in [0,1]]):
  im=Image.open(p/f'png/{w}-sleep-side-{f}.png').convert('RGBA');s.paste(im,(i%2*620,28+i//2*0),im) if False else None
  im=im.resize((310,360),Image.Resampling.NEAREST);s.paste(im,(i*310,28),im);d.text((i*310+8,8),f'{w} / {f}',fill=(155,125,105))
 s.crop((0,0,1240,392)).save(p/f'previews/four-{label}.png')
frames=[];stats=[]
for f in [0,1]:
 s=Image.new('RGB',(1240,720),bg)
 for i,w in enumerate(['set','horus']):
  im=Image.open(p/f'png/{w}-sleep-side-{f}.png').convert('RGBA');s.paste(im,(i*620,0),im)
 frames.append(s.resize((620,360),Image.Resampling.LANCZOS))
frames[0].save(p/'previews/breathing.gif',save_all=True,append_images=frames[1:],duration=800,loop=0)
game=[f.resize((68,39),Image.Resampling.LANCZOS) for f in frames];game[0].save(p/'previews/breathing-game.gif',save_all=True,append_images=game[1:],duration=800,loop=0)
for w in ['set','horus']:
 a=Image.open(p/f'png/{w}-sleep-side-0.png').convert('RGBA');b=Image.open(p/f'png/{w}-sleep-side-1.png').convert('RGBA');aa=np.array(a);bb=np.array(b)
 changed=np.any(aa!=bb,axis=2);m0=aa[:,:,3]>128;m1=bb[:,:,3]>128
 view=Image.new('RGBA',a.size,bg+(255,));view.alpha_composite(a);v=np.array(view);v[changed& (m0|m1),:3]=(230,55,60);Image.fromarray(v).save(p/f'previews/{w}-pixel-difference.png')
 v=np.array(Image.new('RGBA',a.size,bg+(255,)));v[m0&m1]=(160,150,140,255);v[m0&~m1]=(40,160,225,255);v[m1&~m0]=(235,55,65,255);Image.fromarray(v).save(p/f'previews/{w}-silhouette-difference.png')
 onion=Image.new('RGBA',a.size,bg+(255,));a.putalpha(a.getchannel('A').point(lambda x:int(x*.5)));b.putalpha(b.getchannel('A').point(lambda x:int(x*.5)));onion.alpha_composite(a);onion.alpha_composite(b);onion.save(p/f'previews/{w}-onion.png')
 src=r/f'sleep-selected-v198/png/{w}-sleep-side-0.png';out=p/f'png/{w}-sleep-side-0.png'
 stats.append({'character':w,'frame0ByteIdentical':src.read_bytes()==out.read_bytes(),'frame0sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'silhouetteChangedPixels':int((m0^m1).sum()),'changedPixels':int(changed.sum())})
(p/'checks/frame0-preserved.json').write_text(json.dumps(stats,indent=2)+'\n')
# Combined current eight-frame set, current front redraw plus side.
s=Image.new('RGB',(1240,776),bg);d=ImageDraw.Draw(s)
for j,w in enumerate(['set','horus']):
 for i,(pose,f) in enumerate([('sleep',0),('sleep',1),('sleep-side',0),('sleep-side',1)]):
  source=r/'sleep-front-body-v199' if pose=='sleep' else p
  im=Image.open(source/f'png/{w}-{pose}-{f}.png').convert('RGBA').resize((310,360),Image.Resampling.LANCZOS);s.paste(im,(i*310,j*388+25),im);d.text((i*310+6,j*388+6),f'{w} / {pose} / {f}',fill=(65,50,40))
s.save(p/'previews/current-eight.png')
print(stats)
