from PIL import Image, ImageDraw
import numpy as np, json, hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[4]; out=root/'docs/art/chibi-refresh/review-horus-v8'
src=root/'docs/art/chibi-refresh/review-horus-set-body-v5/option-2.png'
im=Image.open(src).convert('RGB'); a=np.array(im); b=a.copy(); allowed=np.zeros(a.shape[:2],bool)
# Inverse piecewise mapping: central feature is scaled exactly 0.9 around its original center;
# narrow surrounding skin band connects back to the unchanged source coordinates.
def axis_map(v,lo,hi,outerlo,outerhi,scale):
 c=(lo+hi)/2; d0=c+(lo-c)*scale; d1=c+(hi-c)*scale
 return np.interp(v,[outerlo,d0,d1,outerhi],[outerlo,lo,hi,outerhi])
def eye(inner,outer):
 x0,y0,x1,y1=outer; l,t,r,bt=inner
 yy,xx=np.mgrid[y0:y1+1,x0:x1+1]
 sx=axis_map(xx,l,r,x0,x1,.9);sy=axis_map(yy,t,bt,y0,y1,.9)
 mapped=a[np.rint(sy).astype(int),np.rint(sx).astype(int)]
 mask=np.ones(xx.shape,bool)
 # Protect the existing gold curl and descending gray facial mark.
 if x0>250: mask &= ~((xx>=334)&(xx<=371)&(yy>=398))
 b[y0:y1+1,x0:x1+1][mask]=mapped[mask]
 allowed[y0:y1+1,x0:x1+1]|=mask
spec=[([130,333,231,402],[125,329,237,410]),([278,333,384,397],[272,329,390,405])]
for i,o in spec:eye(i,o)
# Local ear transforms anchored at their inner attachment; hair and facial contour excluded.
polys=[[(54,332),(110,332),(116,347),(120,365),(124,385),(130,402),(138,421),(141,432),(99,437),(58,407)],[(398,332),(451,332),(463,359),(460,413),(421,438),(372,432),(377,418),(384,395),(389,370),(394,348)]]
ear_specs=[(140,382),(374,382)]
for idx,poly in enumerate(polys):
 m=Image.new('1',im.size);ImageDraw.Draw(m).polygon(poly,fill=1); mask=np.array(m).astype(bool)
 yy,xx=np.nonzero(mask)
 # Width-only 6% reduction; keep the original vertical shape and attachment.
 if idx==0:
  anchor=np.interp(yy,[332,347,365,385,402,421,432],[110,116,120,124,130,138,141])
 else:
  anchor=np.interp(yy,[332,348,370,395,418,432],[398,394,389,384,377,372])
 sx=np.clip(np.rint(anchor+(xx-anchor)/.94).astype(int),0,a.shape[1]-1)
 # Existing navy hair is protected explicitly, as are the innermost seam pixels.
 navy=(a[yy,xx,2].astype(int)>a[yy,xx,0].astype(int)+12)&(a[yy,xx,0]<110)
 valid=(~navy)&(abs(xx-anchor)>2)
 yy=yy[valid];xx=xx[valid];sx=sx[valid]
 b[yy,xx]=a[yy,sx];allowed[yy,xx]=True
res=Image.fromarray(b);res.save(out/'horus-front.png')
Image.fromarray((allowed*255).astype('uint8')).save(out/'edit-mask.png')
changed=np.any(a!=b,axis=2)
validation={'source':str(src.relative_to(root)),'source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'image_generation_used':False,'canvas':[576,730],'eye_scale_xy':[.9,.9],'eye_regions':spec,'ear_scale_xy':[.94,1.0],'ear_anchors':ear_specs,'resampling':'nearest, original pixels only','changed_pixels':int(changed.sum()),'changed_pixels_outside_edit_mask':int((changed&~allowed).sum()),'body_changed_pixels_y460_onward':int(changed[460:].sum()),'status':'review, not approved, not applied'}
(out/'validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
canvas=Image.new('RGB',(1152,780),(250,245,232));canvas.paste(im,(0,35));canvas.paste(res,(576,35));d=ImageDraw.Draw(canvas);d.text((230,12),'ORIGINAL',fill=(45,35,30));d.text((750,12),'EYES 90% / EARS 94%',fill=(45,35,30));canvas.save(out/'126-horus-original-preserved.png')
res.crop((45,290,465,465)).resize((1260,525),Image.Resampling.NEAREST).save('/workspace/edited-detail.png')
print(json.dumps(validation))
