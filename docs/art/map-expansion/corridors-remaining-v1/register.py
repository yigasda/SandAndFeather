"""Analyze boundary displacement; emits JSON only, never edits images."""
import cv2,numpy as np,json,sys
from pathlib import Path
from scipy.ndimage import gaussian_filter1d,median_filter
O=Path(__file__).parent; name=sys.argv[1]; src=cv2.imread(str(O/'sources'/f'{name}-{sys.argv[2] if len(sys.argv)>2 else "outpaint"}.png'));src=cv2.resize(src,(2492,887));old=cv2.imread(str(O/'../exits-v2'/f'{name}-gallery-v1.png')) if name!='rooms' else cv2.imread(str(O/'../exits-v2/room-entrances-wide-v1.png'))
f=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM).calc(cv2.cvtColor(old,cv2.COLOR_BGR2GRAY),cv2.cvtColor(src[64:788,160:2332],cv2.COLOR_BGR2GRAY),None)
E={'left':np.median(f[:,:10],axis=1),'right':np.median(f[:,-10:],axis=1),'top':np.median(f[:10],axis=0),'bottom':np.median(f[-10:],axis=0)}
for k,v in E.items():
 v=gaussian_filter1d(median_filter(v,size=(5,1)),1,axis=0);print(name,k,'range',v.min(0),v.max(0));E[k]=v.round(4).tolist()
(O/'sources'/f'{name}-{sys.argv[2]+"-" if len(sys.argv)>2 else ""}registration.json').write_text(json.dumps(E))
