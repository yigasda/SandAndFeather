from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np,json,hashlib
from scipy.ndimage import label,binary_fill_holes,convolve,distance_transform_edt,map_coordinates
r=Path(__file__).resolve().parents[4];o=r/'docs/art/chibi-refresh/review-horus-walk-v1'
source=r/'docs/art/chibi-refresh/review-horus-v13/horus-front.png'
a=np.array(Image.open(source).convert('RGB'));h,w=a.shape[:2];yy,xx=np.mgrid[:h,:w]
# Repair only skin specks inside the existing hair. Use neighbouring approved hair pixels.
navy=(a[:,:,2].astype(int)>a[:,:,0].astype(int)+12)&(a[:,:,0]<155);navy[295:]=False
labs,_=label(navy);sizes=np.bincount(labs.ravel());sizes[0]=0;hair=labs==sizes.argmax()
bright=(a[:,:,0]>155)&(a[:,:,1]>130)
holes=binary_fill_holes(hair)&~hair
neighbors=convolve(hair.astype(int),np.ones((3,3),int),mode='constant')
repair=(holes|((neighbors>=6)&bright))&(yy>=208)&(yy<295)&(xx>110)&(xx<400)
_,indices=distance_transform_edt(~hair,return_indices=True)
clean=a.copy();clean[repair]=a[indices[0][repair],indices[1][repair]]
# Remove detached tiny forehead-shadow specks, retaining connected dot shading at the hairline.
palette=np.array([[254,229,215],[253,224,209],[251,219,204],[252,213,191],[252,206,182]])
shade=np.stack([np.all(clean==v,axis=2) for v in palette]).any(axis=0)&(yy>=232)&(yy<302)&(xx>=118)&(xx<392)
lab,n=label(shade);noise=np.zeros((h,w),bool)
for k in range(1,n+1):
 m=lab==k
 if m.sum()<12:noise|=m
clean[noise]=[254,233,220]
Image.fromarray(clean).save(o/'horus-final-clean.png');Image.fromarray(((repair|noise)*255).astype('uint8')).save(o/'forehead-cleanup-mask.png')
# Background removal by edge-connected ivory only: no erasing white clothes enclosed by outlines.
candidate=(clean[:,:,0]>220)&(clean[:,:,1]>210)&(clean[:,:,2]>185)&((clean[:,:,0].astype(int)-clean[:,:,1].astype(int))<16)
lab,n=label(candidate);edge_ids=np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]]));edge_ids=edge_ids[edge_ids!=0];bg=np.isin(lab,edge_ids)
alpha=(~bg*255).astype('uint8');rgba=np.dstack([clean,alpha]);sprite=Image.fromarray(rgba)
bbox=sprite.getbbox();print('bbox',bbox)
# No generated walk artwork. Deform approved lower-body pixels for short alternating steps;
# head/collar/torso are held in place, and head geometry is rigid in all native poses.
poses=[]
for phase,s in enumerate([1,0,-1]):
 sx=xx.astype(float);sy=yy.astype(float)
 leg=np.clip((yy-632)/42,0,1)
 left=xx<255
 backleft=(s<0);backright=(s>0)
 lift=np.where(left, -14 if backleft else 0, -14 if backright else 0) if s else np.zeros_like(xx)
 sy-=leg*lift
 sx-=leg*np.where(left, -2*s, -2*s)
 # Arms counter-swing around fixed shoulder attachments.
 armprogress=np.clip((yy-486)/88,0,1)*np.clip((619-yy)/20,0,1)
 wl=np.clip((213-xx)/14,0,1)*armprogress
 wr=np.clip((xx-301)/14,0,1)*armprogress
 sx-=s*(-2.0*wl-2.0*wr)
 sy-=s*(4.0*wl-4.0*wr)
 # Tiny skirt deformation, zero at waistband and limited to two source pixels.
 cloth=np.clip((yy-552)/76,0,1)*((yy>=552)&(yy<634))
 sx-=1.5*s*cloth
 sy-=1.5*s*cloth*np.clip((xx-255)/80,-1,1)
 # Enforce exact upper-body and head pixels, including the newly corrected hairline.
 lock=yy<482;sx[lock]=xx[lock];sy[lock]=yy[lock]
 warped=np.stack([map_coordinates(rgba[:,:,c],[sy,sx],order=0,mode='constant',cval=0) for c in range(4)],axis=2).astype('uint8')
 native=Image.fromarray(warped);native.save(o/'native'/f'horus-front-{phase}.png');poses.append(native)
# Single shared transform to the existing walk specification; no frame-by-frame fit.
visible_height=bbox[3]-bbox[1];scale=330/visible_height
newsize=(round(w*scale),round(h*scale));px=round(180-255*scale);py=round(370-bbox[3]*scale)
frames=[]
for phase,p in enumerate(poses):
 frame=Image.new('RGBA',(360,400));frame.alpha_composite(p.resize(newsize,Image.Resampling.NEAREST),(px,py));frame.save(o/'frames'/f'horus-front-{phase}.png');frames.append(frame)
# Old approved cycle and micro offset: whole sprite ±1px, no head rotation/stretch.
seq=[0,1,2,1];offsets=[(1,0),(0,-1),(-1,0),(0,-1)]
rendered=[]
for idx,(dx,dy) in zip(seq,offsets):
 canvas=Image.new('RGBA',(360,400),(248,243,231,255))
 canvas.alpha_composite(frames[idx],(dx,dy));rendered.append(canvas.convert('RGB'))
# One palette for the entire GIF prevents shade/color flicker.
strip=Image.new('RGB',(1440,400))
for i,im in enumerate(rendered):strip.paste(im,(360*i,0))
pal=strip.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
gifs=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in rendered]
gifs[0].save(o/'132-horus-front-walk.gif',save_all=True,append_images=gifs[1:],duration=[180]*4,loop=0,disposal=2,optimize=False)
big=[im.resize((720,800),Image.Resampling.NEAREST) for im in gifs];big[0].save(o/'132-horus-front-walk-2x.gif',save_all=True,append_images=big[1:],duration=[180]*4,loop=0,disposal=2,optimize=False)
# Static poses and native head identity checks.
sheet=Image.new('RGBA',(1080,400))
for i,f in enumerate(frames):sheet.alpha_composite(f,(360*i,0))
sheet.save(o/'horus-front-walk-sheet.png')
preview=Image.new('RGB',(1080,430),(248,243,231));preview.paste(sheet,(0,30),sheet);ImageDraw.Draw(preview).text((20,10),'131 approved art / original walk rhythm / no head redraw',fill=(55,45,35));preview.save(o/'walk-poses-preview.png')
head_diff=[]
for p in poses:head_diff.append(int(np.any(np.array(p)[:461]!=rgba[:461],axis=2).sum()))
validation={'status':'review-not-approved','direction':'front/down','approved_art':str(source.relative_to(r)),'approved_art_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'forehead_repaired_hair_pixels':int(repair.sum()),'forehead_removed_isolated_shadow_pixels':int(noise.sum()),'cleanup_changed_pixels_outside_mask':int((np.any(a!=clean,axis=2)&~(repair|noise)).sum()),'head_changed_pixels_per_native_pose':head_diff,'motion_source':'../approved/walk/horus-front-{0,1,2}.png and approved manifest','frame_size':[360,400],'pivot':[180,370],'reference_height':330,'sequence':seq,'offsets':offsets,'duration_ms':180,'loop_ms':720,'head_rotation_degrees':0,'head_deformation':False,'creation':'rigged approved original pixels, no generated character or walk frames','scale':scale,'runtime_changed':False}
(o/'validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n');print(validation)
