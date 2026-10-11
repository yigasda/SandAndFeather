from pathlib import Path
import numpy as np,json,subprocess
from PIL import Image
P=Path('docs/art/chibi-refresh/sleep-trio-v187');W=Path('/workspace/actions187');[ (P/q).mkdir(parents=True,exist_ok=True) for q in ['png','sources','previews','checks'] ]
# Hair widths are measured in crown/head region, excluding gold/cloth/shoe colours.
settings=[('horus-sleep-0','exec-5e337517-f7b4-4c7d-94c3-25d9aa30a553.png',.612,(450,466),(265,250)),('horus-sleep-side-0','exec-d516d21a-5e67-43e7-87d1-f410de88eeec.png',.583,(611,380),(285,245))]
rows=[]
for stem,src,s,center,target in settings:
 path='/workspace/generated_images/'+src;ox=round(target[0]-center[0]*s);oy=round(target[1]-center[1]*s);scaled=W/(stem+'-scaled.png');subprocess.run(['magick',path,'-filter','Lanczos','-resize',f'{s*100}%','-channel','A','-threshold','50%','+channel',str(scaled)],check=True)
 subprocess.run(['magick','-size','620x720','xc:none',str(scaled),'-geometry',f'{ox:+d}{oy:+d}','-compose','over','-composite',str(P/'png'/(stem+'.png'))],check=True)
 subprocess.run(['cp',path,str(P/'sources'/(stem+'.png'))],check=True)
 rows.append({'file':stem+'.png','scale':s,'offset':[ox,oy],'targetHeadCenter':target,'referenceHeadWidth':367 if 'side' not in stem else 394})
(P/'checks/placement-initial.json').write_text(json.dumps(rows,indent=2)+'\n')
