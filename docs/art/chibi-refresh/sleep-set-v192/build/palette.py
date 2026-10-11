from pathlib import Path
import importlib.util,json,sys
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree
spec=importlib.util.spec_from_file_location('skin','tools/art/skin-check.py');sk=importlib.util.module_from_spec(spec);spec.loader.exec_module(sk)
folder=Path(sys.argv[1]);out=Path('/workspace/actions192/palette');out.mkdir(exist_ok=True)
for f in sorted(folder.glob('*.png')):
 who=f.name.split('-')[0]
 if who=='somang':continue
 d='right' if 'side' in f.name else 'front';a,m,rgb=sk.skin_pixels(f,who);m &= (a[:,:,1]-a[:,:,2]<55)
 rgb=a[:,:,:3][m];_,rt,pal=sk.reference(who,d);ct=sk.tones(rgb)
 targets={k:min((r[k] for r in rt),key=lambda v:np.linalg.norm(sk.cs.lab(v[None])-sk.cs.lab(ct[k][None]))) for k in ct}
 anchors=sorted([(float(sk.cs.lab(ct[k][None])[0,0]),sk.cs.lab(targets[k][None])[0]-sk.cs.lab(ct[k][None])[0]) for k in ct],key=lambda v:v[0]);cols=np.unique(rgb.astype('uint8'),axis=0);cl=sk.cs.lab(cols.astype(float));delta=np.stack([np.interp(cl[:,0],[t[0] for t in anchors],[t[1][c] for t in anchors]) for c in range(3)],axis=1)
 tree=cKDTree(sk.cs.lab(pal));_,ix=tree.query(cl+delta);mapped=pal[ix].astype('uint8');lut={str(int(c[0])*65536+int(c[1])*256+int(c[2])):v.tolist() for c,v in zip(cols,mapped)}
 (out/(f.stem+'.json')).write_text(json.dumps(lut));(out/(f.stem+'.mask')).write_bytes(m.astype('uint8').tobytes());print(f.name,'tones', {k:targets[k].tolist() for k in ct},'pixels',int(m.sum()))
