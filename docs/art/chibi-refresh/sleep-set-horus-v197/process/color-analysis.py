from pathlib import Path
import importlib.util,json
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree
s=importlib.util.spec_from_file_location('r','tools/art/sprite-review.py');r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
B=Path('docs/art/chibi-refresh/sleep-set-horus-v197');O=Path('/workspace/actions197/lut');O.mkdir(exist_ok=True)
for p in sorted((B/'png').glob('*.png')):
 who=p.name.split('-')[0];side='side' in p.name;v='right' if side else 'front';ref=Path(f'docs/art/chibi-refresh/final/{who}/idle/{who}-{v}.png');a=np.array(Image.open(p).convert('RGBA')).astype(float);b=np.array(Image.open(ref).convert('RGBA')).astype(float)
 for kind in ['hair','skin']:
  if kind=='hair':
   m=r.skin.cs.parts(a,who)['hair']&(a[:,:,3]>128);bm=r.skin.cs.parts(b,who)['hair']&(b[:,:,3]>250);ct=r.hair_tones(str(p),who);rt=r.hair_tones(str(ref),who);pal=np.unique(b[:,:,:3][bm],axis=0)
  else:
   R,G,Bl=a[:,:,0],a[:,:,1],a[:,:,2];Y=np.indices(R.shape)[0];m=(a[:,:,3]>128)&(R>175)&(G>105)&(R-G>16)&(G-Bl<40)&(G-Bl>-6)&((Y<410)|(R-G>28));m&=~r.skin.cs.parts(a,who)['hair'];colors=a[:,:,:3][m];t=r.skin.tones(colors)
   rtone=r.skin.tones(r.skin.skin_pixels(str(ref),who)[2]);
   if who=='horus':rtone={'base':np.array([254,218,214 if side else 218]),'shadow':np.array([250,182,178]),'light':np.array([254,230,222])}
   keys=sorted(t,key=lambda k:r.skin.cs.lab(t[k][None])[0,0]);ct=r.skin.cs.lab(np.array([t[k] for k in keys]));rt=r.skin.cs.lab(np.array([rtone[k] for k in keys]));_,_,pal=r.skin.reference(who,v)
   print(p.name,kind,'before',t,'target',rtone,flush=True)
  cols=np.unique(a[:,:,:3][m],axis=0);lab=r.skin.cs.lab(cols);delta=rt-ct;shifts=np.stack([np.interp(lab[:,0],ct[:,0],delta[:,k]) for k in range(3)],axis=1);_,idx=cKDTree(r.skin.cs.lab(pal)).query(lab+shifts);mapped=pal[idx]
  lut={str(int(c[0])*65536+int(c[1])*256+int(c[2])):[int(x) for x in d] for c,d in zip(cols,mapped)};(O/(p.stem+'-'+kind+'.json')).write_text(json.dumps(lut));(O/(p.stem+'-'+kind+'.mask')).write_bytes(m.astype('uint8').tobytes())
