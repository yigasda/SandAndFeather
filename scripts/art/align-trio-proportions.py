"""Geometric edits/composition only, as requested; no image regeneration."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import json

ROOT=Path('docs/art/chibi-refresh/directions')
OUT=ROOT/'aligned-trio-v1'
OUT.mkdir(exist_ok=True)
cfg={
 'horus': dict(file='horus-idle-v5-small-hands.png', label='호루스 · 기준', seams=[0,453,1003,1543,2160], top=[19]*4, chin=[399,394,397,397], shoe=[625,621,625,625], bottom=[682,678,682,682], hands=[[],[],[],[]]),
 'set': dict(file='set-idle-v4-horus-body.png', label='세트', seams=[0,551,1062,1612,2172], top=[20,18,15,15], chin=[384,382,377,377], shoe=[638,636,638,640], bottom=[691,689,691,693], hands=[[(228,540),(392,540)],[],[(1382,542)],[(1846,542)]]),
 'somang': dict(file='somang-idle-v2-new-reference.png',label='소망',seams=[0,561,1065,1590,2172],top=[14,11,13,13],chin=[371,369,368,368],shoe=[650,648,650,650],bottom=[709,707,709,709],hands=[[(177,536),(431,536)],[(692,535),(945,535)],[(1364,540)],[(1857,540)]])
}

def sample_rgba(a,x,y):
    """Bilinear sampling with premultiplied alpha, avoiding edge color fringes."""
    h,w=a.shape[:2]
    valid=(x>=0)&(x<w-1)&(y>=0)&(y<h-1)
    x=np.clip(x,0,w-1.001);y=np.clip(y,0,h-1.001)
    ix=x.astype(int);iy=y.astype(int);fx=(x-ix)[...,None];fy=(y-iy)[...,None]
    b=a.astype(float)/255;b[:,:,:3]*=b[:,:,3:4]
    v=(b[iy,ix]*(1-fx)+b[iy,ix+1]*fx)*(1-fy)+(b[iy+1,ix]*(1-fx)+b[iy+1,ix+1]*fx)*fy
    v*=valid[...,None]
    v[:,:,:3]/=np.maximum(v[:,:,3:4],1e-9)
    return np.clip(np.rint(v*255),0,255).astype('uint8')

def local_scale(im,cx,cy,sx,sy,rx,ry):
    a=np.array(im);yy,xx=np.mgrid[0:a.shape[0],0:a.shape[1]].astype(float)
    dist=np.sqrt(((xx-cx)/rx)**2+((yy-cy)/ry)**2)
    t=np.clip((dist-0.65)/0.95,0,1);weight=1-t*t*(3-2*t)
    mx=cx+(xx-cx)/(1+(sx-1)*weight)
    my=cy+(yy-cy)/(1+(sy-1)*weight)
    return Image.fromarray(sample_rgba(a,mx,my))

CELL_W,CELL_H=620,720
HEAD_H=360
# Reference Horus front: chin-to-sole / crown-to-chin = 283/380.
BODY_H=HEAD_H*283/380
DEST_TOP=34;DEST_CHIN=DEST_TOP+HEAD_H;DEST_BOTTOM=DEST_CHIN+BODY_H
DEST_SHOE=DEST_BOTTOM-54
report={'method':'existing art only: geometric resampling and composition; no generation', 'headHeight':HEAD_H,'bodyHeight':BODY_H,'characters':{}}
rows={}
for who,c in cfg.items():
    source=Image.open(ROOT/c['file']).convert('RGBA');views=[];stats=[]
    for i in range(4):
        x0,x1=c['seams'][i:i+2];tile=source.crop((x0,0,x1,source.height))
        a=np.array(tile);yy,xx=np.mgrid[0:CELL_H,0:CELL_W].astype(float)
        scale=HEAD_H/(c['chin'][i]-c['top'][i])
        opaque=np.where(a[:,:,3]>128);center=(opaque[1].min()+opaque[1].max())/2
        sy=np.interp(yy,[0,DEST_TOP,DEST_CHIN,DEST_SHOE,DEST_BOTTOM,CELL_H],[c['top'][i]-DEST_TOP/scale,c['top'][i],c['chin'][i],c['shoe'][i],c['bottom'][i],c['bottom'][i]+(CELL_H-DEST_BOTTOM)/scale])
        sx=(xx-CELL_W/2)/scale+center
        result=Image.fromarray(sample_rgba(a,sx,sy))
        body_scale=(DEST_SHOE-DEST_CHIN)/(c['shoe'][i]-c['chin'][i])
        if who!='horus':
            # Small bounded warps adjust existing hand artwork without drawing new hands.
            for hx,hy in c['hands'][i]:
                dx=(hx-x0-center)*scale+CELL_W/2
                dy=DEST_CHIN+(hy-c['chin'][i])*body_scale
                fx=1.08 if who=='set' else 1.20
                fy=1.16 if who=='set' else 1.26
                result=local_scale(result,dx,dy,fx,fy,26,24)
            # Match shoe width to Horus; retain sandals, toes, and heel designs.
            foot_factor=.90 if who=='set' else .94
            if i<2:
                centers = ([272,365] if who=='set' and i==0 else
                           [775,854] if who=='set' else
                           [273,371] if i==0 else [796,880])
                for fx in centers:
                    dx=(fx-x0-center)*scale+CELL_W/2
                    result=local_scale(result,dx,DEST_SHOE+28,foot_factor,1.0,43,37)
            else:
                # Side footwear centered on the low alpha silhouette.
                ra=np.array(result);ylo=int(DEST_SHOE)+15;yhi=int(DEST_BOTTOM)
                fy,fx=np.where(ra[ylo:yhi,:,3]>128)
                if len(fx): result=local_scale(result,(fx.min()+fx.max())/2,DEST_SHOE+28,foot_factor,1.0,70,37)
        result.save(OUT/f'{who}-{["front","back","left","right"][i]}.png')
        views.append(result)
        stats.append(dict(headScale=scale,torsoVerticalScale=body_scale,sourceChin=c['chin'][i],sourceSole=c['bottom'][i],targetChin=DEST_CHIN,targetSole=DEST_BOTTOM))
    row=Image.new('RGBA',(CELL_W*4,CELL_H));
    for i,im in enumerate(views):row.alpha_composite(im,(i*CELL_W,0))
    row.save(OUT/f'{who}-aligned.png');rows[who]=views;report['characters'][who]=stats

fontfile='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font=ImageFont.truetype(fontfile,32);small=ImageFont.truetype(fontfile,25)
board=Image.new('RGB',(CELL_W*4+100,3*(CELL_H+65)+110),'#f3f0eb');d=ImageDraw.Draw(board)
for i,label in enumerate(['앞','뒤','왼쪽','오른쪽']):d.text((100+i*CELL_W+CELL_W/2,26),label,font=font,fill='#4e4842',anchor='mt')
for r,who in enumerate(['set','somang','horus']):
    y=95+r*(CELL_H+65)
    d.text((36,y+14),cfg[who]['label'],font=font,fill='#4e4842')
    for i,im in enumerate(rows[who]):
        x=100+i*CELL_W
        d.line((x+55,y+DEST_BOTTOM+48,x+CELL_W-55,y+DEST_BOTTOM+48),fill='#d4cbc1',width=2)
        board.paste(im,(x,y+48),im)
board.save(OUT/'trio-4directions-comparison.jpg',quality=96)
front=Image.new('RGB',(CELL_W*3,CELL_H+100),'#f3f0eb');fd=ImageDraw.Draw(front)
for i,who in enumerate(['set','somang','horus']):
    fd.text((i*CELL_W+CELL_W/2,20),cfg[who]['label'],font=font,fill='#4e4842',anchor='mt');front.paste(rows[who][0],(i*CELL_W,70),rows[who][0])
front.save(OUT/'trio-front-comparison.jpg',quality=96)
(OUT/'geometry.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(OUT/'trio-4directions-comparison.jpg')
