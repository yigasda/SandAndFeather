import importlib.util,numpy as np,json
from PIL import Image
from scipy.ndimage import label
s=importlib.util.spec_from_file_location('cs','tools/art/check-sprite.py');cs=importlib.util.module_from_spec(s);s.loader.exec_module(cs)
def features(path,who):
 a=np.array(Image.open(path).convert('RGBA')).astype(float);p=cs.parts(a,who);m=p['skin'].copy();m[np.arange(len(m))>p['top']+p['H']*.65,:]=False;l,n=label(m);cnt=np.bincount(l.ravel());cnt[0]=0;ys,xs=np.where(l==cnt.argmax());cov=np.cov(np.stack([xs,ys]));va=np.linalg.eigvalsh(cov);hy,hx=np.where(p['hair']);ay,ax=np.where(a[:,:,3]>128)
 return {'faceBox':[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)],'faceArea':len(xs),'faceAxes':(np.sqrt(va)*4).tolist(),'hairBox':[int(hx.min()),int(hy.min()),int(hx.max()+1),int(hy.max()+1)],'alphaBox':[int(ax.min()),int(ay.min()),int(ax.max()+1),int(ay.max()+1)]}
sources={'set-sleep-0':'exec-2a958132-1bac-4457-a757-50639e2fb038.png','horus-sleep-0':'exec-5e337517-f7b4-4c7d-94c3-25d9aa30a553.png','set-sleep-side-0':'exec-1b094daf-b931-46ff-937a-940c57d03f91.png','horus-sleep-side-0':'exec-d516d21a-5e67-43e7-87d1-f410de88eeec.png'}
if __name__=='__main__':
 for k,f in sources.items():print(k,features('/workspace/generated_images/'+f,k.split('-')[0]))
 for w in ['set','horus','somang']:
  for d in ['front','right']:
   print(w,d,features(f'docs/art/chibi-refresh/final/{w}/idle/{w}-{d}.png',w))
 print('somang180',features('docs/art/chibi-refresh/sleep-somang-v180/png/somang-sleep-0.png','somang'))
 open('/workspace/actions187/sources.json','w').write(json.dumps(sources,indent=2))
