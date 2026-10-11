from pathlib import Path
import subprocess,json
P=Path('docs/art/chibi-refresh/sleep-trio-v189');W=Path('/workspace/actions189')
rows=[]
for name,source,s,ox,oy,pivot,factor in [('set-sleep-0','exec-7a5ab412-5a71-4d05-91f4-14ea7075fd44.png',.65,-82,23,418,.53),('horus-sleep-0','exec-d975f289-634f-4225-ab4f-546d73fbbc2e.png',.58,-27,9,417,.63)]:
 src=Path('/workspace/generated_images')/source;sc=W/(name+'-scaled.png');tall=W/(name+'-tall.png');fit=W/(name+'-fit.png')
 subprocess.run(['magick',str(src),'-filter','Point','-resize',f'{s*100}%','-channel','A','-threshold','65%','+channel',str(sc)],check=True)
 subprocess.run(['magick','-size','620x1000','xc:none',str(sc),'-geometry',f'{ox:+d}{oy:+d}','-compose','over','-composite',str(tall)],check=True)
 subprocess.run(['node','/workspace/actions187/foreshorten.cjs',str(tall),str(fit),str(pivot),str(factor)],check=True)
 subprocess.run(['magick',str(fit),'-crop','620x720+0+0','+repage',str(P/'png'/(name+'.png'))],check=True)
 subprocess.run(['cp',str(src),str(P/'sources'/(name+'.png'))],check=True)
 rows.append({'file':name,'scale':s,'offset':[ox,oy],'bodyBelowY':pivot,'foreshortening':factor})
(P/'checks/placement.json').write_text(json.dumps(rows,indent=2)+'\n')
