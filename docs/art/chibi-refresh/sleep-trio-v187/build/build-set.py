from pathlib import Path
import subprocess,json
P=Path('docs/art/chibi-refresh/sleep-trio-v187');W=Path('/workspace/actions187');rows=[]
for stem,f,s,ox,oy,pivot,factor in [('set-sleep-0','exec-c97227e8-f23b-43ce-85b9-391b88340458.png',.663,-52,-47,405,.71),('set-sleep-side-0','exec-c8f0af8b-b03b-49f8-86a9-29a5b7b0874a.png',.60,-98,-10,408,.80)]:
 raw='/workspace/generated_images/'+f;scaled=W/(stem+'-scaled.png');tall=W/(stem+'-tall.png');fit=W/(stem+'-fit.png')
 subprocess.run(['magick',raw,'-filter','Lanczos','-resize',f'{s*100}%','-channel','A','-threshold','50%','+channel',str(scaled)],check=True)
 subprocess.run(['magick','-size','620x900','xc:none',str(scaled),'-geometry',f'{ox:+d}{oy:+d}','-compose','over','-composite',str(tall)],check=True)
 subprocess.run(['node','/workspace/actions187/foreshorten.cjs',str(tall),str(fit),str(pivot),str(factor)],check=True)
 subprocess.run(['magick',str(fit),'-crop','620x720+0+0','+repage',str(P/'png'/(stem+'.png'))],check=True)
 subprocess.run(['cp',raw,str(P/'sources'/(stem+'.png'))],check=True)
 rows.append({'file':stem+'.png','scale':s,'offset':[ox,oy],'headPreservedAboveY':pivot,'bodyPerspectiveFactor':factor})
(P/'checks/set-placement.json').write_text(json.dumps(rows,indent=2)+'\n')
