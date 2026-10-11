"""Measure color deltas at immutable boundary; JSON output only."""
import numpy as np,json
from PIL import Image
from pathlib import Path
from scipy.ndimage import median_filter,gaussian_filter1d
O=Path(__file__).parent
for n in ['central','east','west','rooms']:
 a=np.asarray(Image.open(O/(n+'-expanded.png')).convert('RGB')).astype(float)
 D={}
 for k,inside,outside in [('left',a[64:788,160:163].mean(1),a[64:788,157:160].mean(1)),('right',a[64:788,2329:2332].mean(1),a[64:788,2332:2335].mean(1))]:
  d=np.clip(inside-outside,-28,28);d=gaussian_filter1d(median_filter(d,size=(7,1)),3,axis=0);D[k]=d.round(3).tolist()
 (O/'sources'/f'{n}-tone.json').write_text(json.dumps(D))
