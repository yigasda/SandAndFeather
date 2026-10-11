from pathlib import Path
import importlib.util,json,numpy as np
from PIL import Image
s=importlib.util.spec_from_file_location('rv','tools/art/sprite-review.py');rv=importlib.util.module_from_spec(s);s.loader.exec_module(rv)
P=Path('docs/art/chibi-refresh/sleep-set-horus-v194');palette=json.loads((P/'checks/hair-palette.json').read_text());O=Path('/workspace/actions194/hair-lut');O.mkdir(exist_ok=True)
for f in sorted((P/'png').glob('*.png')):
 who=f.name.split('-')[0];view='right' if 'side' in f.name else 'front';a=np.array(Image.open(f).convert('RGBA')).astype(float);m=rv.skin.cs.parts(a,who)['hair']&(a[:,:,3]>0);rgb=a[:,:,:3][m];cols=np.unique(rgb.astype('uint8'),axis=0);lab=rv.skin.cs.lab(cols.astype(float));L=rv.skin.cs.lab(rgb)[:,0];cut=np.percentile(L,[32,68]);ix=np.digitize(lab[:,0],cut);pal=np.array([p['rgb'] for p in palette[who+'-'+view]]);lut={str(int(c[0])*65536+int(c[1])*256+int(c[2])):v.tolist() for c,v in zip(cols,pal[ix])};(O/(f.stem+'.json')).write_text(json.dumps(lut));(O/(f.stem+'.mask')).write_bytes(m.astype('uint8').tobytes());print(f.name,cut.tolist())
