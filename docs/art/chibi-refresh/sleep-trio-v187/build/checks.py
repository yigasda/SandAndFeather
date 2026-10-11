from pathlib import Path
import json,subprocess,hashlib,shutil
P=Path('docs/art/chibi-refresh/sleep-trio-v187');W=Path('/workspace/actions187');S=Path('docs/art/chibi-refresh/sleep-somang-v180/png/somang-sleep-0.png');aliases=W/'action-input';aliases.mkdir(exist_ok=True);mapping=[]
for f in sorted((P/'png').glob('*.png'))+[S]:
 w=f.stem.split('-')[0];view='right' if '-side-' in f.stem else 'front';n=f.stem.split('-')[-1];dest=aliases/f'{w}-{view}-{n}.png';shutil.copy(f,dest);assert hashlib.sha256(f.read_bytes()).digest()==hashlib.sha256(dest.read_bytes()).digest();mapping.append({'source':str(f),'alias':str(dest),'identicalBytes':True,'reason':'action-check.py recognizes only front/back/left/right filename views; geometry and pixels unchanged'})
(P/'checks/action-input-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n')
subprocess.run(['python3','tools/art/action-check.py',*[str(f) for f in sorted(aliases.glob('*.png'))],'--out',str(P/'checks/action')],check=True)
