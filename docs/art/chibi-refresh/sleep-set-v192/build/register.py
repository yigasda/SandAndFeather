import cv2,numpy as np,json,sys
from pathlib import Path
ref,src,out,mode=sys.argv[1:5];a=cv2.imread(ref,-1);b=cv2.imread(src,-1)
sift=cv2.SIFT_create(nfeatures=5000,contrastThreshold=.015)
ma=(a[:,:,3]>128).astype('uint8')*255
if mode=='body':
 ma[:360]=0;ma[:,:195]=0;ma[:,475:]=0
else:
 ma[320:530]=0
ka,da=sift.detectAndCompute(cv2.cvtColor(a[:,:,:3],cv2.COLOR_BGR2GRAY),ma);kb,db=sift.detectAndCompute(cv2.cvtColor(b[:,:,:3],cv2.COLOR_BGR2GRAY),None)
good=sorted(cv2.BFMatcher(crossCheck=True).match(db,da),key=lambda x:x.distance)[:120]
M,ins=cv2.estimateAffinePartial2D(np.array([kb[x.queryIdx].pt for x in good]),np.array([ka[x.trainIdx].pt for x in good]),method=cv2.RANSAC,ransacReprojThreshold=3,maxIters=20000,confidence=.999)
assert .35<np.linalg.norm(M[:,0])<.7,M
print(len(good),int(ins.sum()),M.tolist());Path(out).write_text(json.dumps({'source':src,'ref':ref,'matrix':M.tolist(),'inliers':int(ins.sum()),'good':len(good),'wholeFrameOnly':True,'featureRegions':mode},indent=2))
