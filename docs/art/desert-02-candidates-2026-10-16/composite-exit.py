from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parent
import numpy as np
base=Image.open(ROOT/'approved-before-exit.png').convert('RGB')
patch=Image.open(ROOT/'exit-weathering-source.png').convert('RGB')
assert base.size==patch.size
mask=Image.new('L',base.size)
ImageDraw.Draw(mask).polygon([(1426,491),(1544,486),(1596,527),(1599,581),(1630,631),(1697,685),(1726,739),(1681,782),(1535,798),(1420,769),(1351,747),(1271,715),(1275,659),(1335,628),(1386,587),(1420,555)],fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(7))
out=Image.composite(patch,base,mask)
out.save(ROOT/'reproduced-composite.png')
a,b,m=np.asarray(base),np.asarray(out),np.asarray(mask)
assert np.array_equal(a[m==0],b[m==0])
print('Saved PNG',base.size,'; outside blend mask verified pixel-identical.')
