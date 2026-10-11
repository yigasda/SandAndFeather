from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import numpy as np,cv2,importlib.util,json
O=Path(__file__).resolve().parent;P=O.parent;R=P.parents[2]
s=importlib.util.spec_from_file_location('ch',R/'tools/art/check-hair.py');ch=importlib.util.module_from_spec(s);s.loader.exec_module(ch)
a=np.array(Image.open(P/'review-horus-idle-v159/horus-idle-front.png').convert('RGBA'));H,W=a.shape[:2];Y,X=np.indices((H,W));base=a[:,:,:3];e,_,_=ch.eyes(base/255.,a[:,:,3]>128)
source=Image.open(O/'painted-options-source.png').convert('RGB');crops=[(30,75,510,515),(530,75,1010,515),(1020,75,1510,515),(275,565,745,1000),(785,565,1265,1000)]
results=[]
for i,box in enumerate(crops,1):
 gen=np.array((Image.open(O/'painted-option4-source.png').convert('RGB') if i==4 else source).crop(box));bg=np.median(gen[:10],axis=(0,1));raw=(np.max(abs(gen.astype(float)-bg),2)>27).astype('uint8')
 contours,_=cv2.findContours(raw,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);body=np.zeros(raw.shape,np.uint8);cv2.drawContours(body,[max(contours,key=cv2.contourArea)],-1,1,-1)
 ge,_,_=ch.eyes(gen/255.,body>0);sv=np.subtract(ge[1],ge[0]);dv=np.subtract(e[1],e[0]);k=np.linalg.norm(dv)/np.linalg.norm(sv);ang=np.arctan2(dv[1],dv[0])-np.arctan2(sv[1],sv[0]);A=np.array([[np.cos(ang)*k,-np.sin(ang)*k],[np.sin(ang)*k,np.cos(ang)*k]]);t=np.mean(e,axis=0)-A@np.mean(ge,axis=0);M=np.column_stack((A,t));rgb=cv2.warpAffine(gen,M,(W,H),flags=cv2.INTER_AREA,borderValue=(245,239,227));alpha=cv2.warpAffine(body.astype(float),M,(W,H),flags=cv2.INTER_LINEAR)
 gh,gb=ch.hair_mask(rgb/255.,alpha>.5,e)
 # Set only the average forehead level, never the user's rough forehead shape.
 cols=range(148,205);bottom=[np.where(gb[:175,x])[0].max() for x in cols if np.any(gb[:175,x])];delta=132.5-np.mean(bottom)
 F=np.array([[1,0,0],[0,1,delta]],float);frgb=cv2.warpAffine(rgb,F,(W,H),flags=cv2.INTER_LINEAR,borderValue=(245,239,227));fblue=cv2.warpAffine(gb.astype('uint8'),F,(W,H),flags=cv2.INTER_NEAREST)>0
 # Original eyes, eyebrows, jaw, neck and body remain literal base pixels.
 d=a.copy();zone=(X>=112)&(X<=241)&(Y>=112)&(Y<=164)
 native_skin=(base[:,:,0]>230)&(base[:,:,0].astype(int)-base[:,:,2]>20)&(Y>=136)&(Y<=165)&(X>115)&(X<240)
 _,lab=cv2.distanceTransformWithLabels((~native_skin).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL);sy,sx=np.where(native_skin);near=np.column_stack([sy,sx])[np.clip(lab-1,0,len(sy)-1)]
 skin=base.copy();ny,nx=near[zone].T;skin[zone]=base[ny,nx]
 # Preserve already-clear original skin. Only the newly exposed forehead needs repainting.
 light=(base[:,:,0]>220)&(base[:,:,0].astype(int)-base[:,:,2]>20);skin[light]=base[light]
 # Match the generated root palette to the original hair midtones.
 bh=(base[:,:,2]>base[:,:,0]*1.2)&(Y>105)&(Y<128)&(X>120)&(X<238)
 ph=fblue&(Y>105)&(Y<128)&(X>120)&(X<238)
 off=np.median(base[bh].astype(float),0)-np.median(frgb[ph].astype(float),0)
 painted=np.clip(frgb.astype(float)+off*.7,0,255).astype('uint8')
 # Fade into preserved hair above the newly painted locks; retain drawn line and shading below.
 w=np.clip((Y-112)/12,0,1);hm=zone&fblue
 d[hm,:3]=np.rint(base[hm]*(1-w[hm,None])+painted[hm]*w[hm,None]).astype('uint8');d[zone&~fblue,:3]=skin[zone&~fblue];d[zone,3]=255
 # Ears and temple junctions use the finished painted contours, not the old white paper slit.
 earzone=(Y>=178)&(Y<226)&(((X>=80)&(X<112))|((X>=242)&(X<275)))
 # Keep outer hair pixels; fill only existing background slits and ear skin/ink below roots.
 keepblue=(base[:,:,2]>base[:,:,0]*1.2)&(base[:,:,2]>base[:,:,1]*1.1)&(a[:,:,3]>128)
 # Include the painted temple root so the ear joins its own continuous line.
 d[earzone,:3]=rgb[earzone];d[earzone,3]=np.rint(alpha[earzone]*255).astype('uint8')
 # Blend only the upper hair-to-hair join; the actual ear contour stays painted as one piece.
 upper=earzone&(Y<185)&(a[:,:,3]>128)&(alpha>.5)&keepblue
 w2=np.clip((Y-177)/7,0,1)
 hairrgb=np.clip(rgb.astype(float)+off*.7,0,255)
 d[upper,:3]=np.rint(base[upper]*(1-w2[upper,None])+hairrgb[upper]*w2[upper,None]).astype('uint8')
 allowed=zone|earzone
 assert np.all(d[~allowed]==a[~allowed]);assert np.all(d[226:]==a[226:])
 Image.fromarray(d).save(O/f'horus-front-option-{i}.png')
 cv=Image.new('RGBA',(W,H),'#f5efe3');cv.alpha_composite(Image.fromarray(d));cv.resize((720,800),Image.Resampling.NEAREST).save(O/f'160-option-{i}.png')
 crop=cv.crop((72,47,282,245)).resize((630,594),Image.Resampling.NEAREST);crop.save(O/f'160-head-{i}.png');results.append(crop)
 # Corresponding dark background preview is for visual review only.
 dark=Image.new('RGBA',(W,H),'#253041');dark.alpha_composite(Image.fromarray(d));dark.resize((720,800),Image.Resampling.NEAREST).save(O/f'160-option-{i}-dark.png')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',32)
sheet=Image.new('RGB',(1920,1320),'#f5efe3');dr=ImageDraw.Draw(sheet)
for i,im in enumerate(results):
 x=(i%3)*640 if i<3 else (i-3)*640+320;y=0 if i<3 else 660
 sheet.paste(im,(x,y+52));dr.text((x+300,y+10),str(i+1),font=font,fill='#201f29')
sheet.save(O/'160-five-options.png')
(O/'validation.json').write_text(json.dumps({'unchanged':'Eyes, eyebrows, central/lower face, chin, neck, torso, kilt, legs and shoes are the unchanged 159 pixels.','base':'review-horus-idle-v159/horus-idle-front.png','options':5,'walkFilesModified':False},indent=2))
