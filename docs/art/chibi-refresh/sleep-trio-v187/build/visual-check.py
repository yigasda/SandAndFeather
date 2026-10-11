from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,sys
sys.path.insert(0,'/workspace/actions187');from previews import f,variants,P
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
# Decode the delivered shared-palette GIF, then magnify actual game pixels for comparison.
g=Image.open(P/'previews/sleep-187-game-31px.gif');s=Image.new('RGB',(1200,468),'#f5efe3')
for n in [0,1]:g.seek(n);q=g.convert('RGB').resize((1200,234),Image.Resampling.NEAREST);s.paste(q,(0,n*234))
s.save(P/'previews/game31-decoded-frames-3x.png')
# Enlarge torso/hair transition in both frames on both backgrounds.
for bg,tag in [('#263142','dark'),('#f5efe3','light')]:
 out=Image.new('RGB',(1500,2*360),bg);d=ImageDraw.Draw(out)
 for j,v in enumerate(variants):
  x0={'set-sleep':180,'somang-sleep':160,'horus-sleep':235,'set-sleep-side':170,'horus-sleep-side':165}[v]
  for n in [0,1]:
   im=f(v,n).crop((x0,345,x0+250,610)).resize((300,318),Image.Resampling.NEAREST);out.paste(im,(j*300,n*360+30),im);d.text((j*300+2,n*360+5),v+f' {n}',font=font,fill='white' if tag=='dark' else '#332c29')
 out.save(P/'previews'/f'breath-torso-detail-{tag}.png')
eyes={'somang-sleep':[172,266,300,337],'set-sleep':[187,280,379,368],'horus-sleep':[188,264,373,367],'set-sleep-side':[310,310,433,377],'horus-sleep-side':[325,312,395,367]};report=[]
for v in variants:
 a=np.array(f(v,0));b=np.array(f(v,1));x,y,x2,y2=eyes[v];old=a[y:y2,x:x2];new=b[y-1:y2-1,x:x2];eyeChanged=int(np.any(old!=new,axis=2).sum());report.append({'variant':v,'eyePatternBoxFrame0':eyes[v],'frame1Offset':[0,-1],'eyeRegionChangedPixelsAfterOffset':eyeChanged})
 print(v,'eye area changed',eyeChanged)
(P/'checks/eyes.json').write_text(json.dumps(report,indent=2)+'\n')
