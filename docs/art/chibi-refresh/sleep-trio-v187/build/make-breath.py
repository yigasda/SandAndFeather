from pathlib import Path
import json,subprocess
P=Path('docs/art/chibi-refresh/sleep-trio-v187');W=Path('/workspace/actions187');cfg=json.loads((W/'breath-configs.json').read_text())
for stem,c in cfg.items():
 src='docs/art/chibi-refresh/sleep-somang-v180/png/somang-sleep-0.png' if stem=='somang-sleep' else str(P/'png'/(stem+'-0.png'));conf=W/(stem+'-breath.json');conf.write_text(json.dumps(c))
 subprocess.run(['node',str(W/'breathe.cjs'),src,str(P/'png'/(stem+'-1.png')),str(conf),str(P/'checks'/(stem+'-breath.json'))],check=True)
