import cv2,numpy as np,json,sys
from pathlib import Path
ref,src,out=sys.argv[1:4]
a=cv2.imread(ref,cv2.IMREAD_UNCHANGED);b=cv2.imread(src,cv2.IMREAD_UNCHANGED)
sift=cv2.SIFT_create(nfeatures=6000)
ma=(a[:,:,3]>128).astype('uint8')*255;ma[330:]=0
ka,da=sift.detectAndCompute(cv2.cvtColor(a[:,:,:3],cv2.COLOR_BGR2GRAY),ma)
kb,db=sift.detectAndCompute(cv2.cvtColor(b[:,:,:3],cv2.COLOR_BGR2GRAY),None)
m=cv2.BFMatcher().knnMatch(db,da,k=2);good=[x for x,y in m if x.distance<.72*y.distance]
M,ins=cv2.estimateAffinePartial2D(np.array([kb[x.queryIdx].pt for x in good]),np.array([ka[x.trainIdx].pt for x in good]),method=cv2.RANSAC,ransacReprojThreshold=3)
print(len(good),int(ins.sum()),M.tolist());Path(out).write_text(json.dumps({'source':src,'ref':ref,'matrix':M.tolist(),'inliers':int(ins.sum()),'good':len(good)},indent=2))
