"""Package selected idle art; nearest-neighbor canvas export only, no repaint."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import hashlib, json, shutil, zipfile

O = Path(__file__).resolve().parent
P = O.parent
CHARS = ['set', 'somang', 'horus']
DIRS = ['back', 'front', 'left', 'right']
for folder in ['idle', 'native', 'sheets', 'checks']:
    (O / folder).mkdir(exist_ok=True)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
frames = []
for who in CHARS:
    for direction in DIRS:
        name = f'{who}-{direction}.png'
        source = P / 'review-trio-idle-v1/native' / name
        revision = 148
        if who == 'somang':
            revision = 151
            if direction in ['front', 'back']:
                source = P / 'review-somang-back-v151/native' / name
        if who == 'horus' and direction in ['front', 'back']:
            revision = 161 if direction == 'front' else 162
            source = P / 'final-trio-v163/idle' / name
        native = O / 'native' / name
        shutil.copyfile(source, native)
        assert sha(native) == sha(source)
        im = Image.open(native).convert('RGBA')
        assert im.size == (360, 400)
        # Identical export transform to the selected148 canvas. Shared pivot/scale.
        a = np.array(im)
        scale = 576 / 330
        yy, xx = np.indices((720, 620))
        sx = np.floor((xx + .5 - 310) / scale + 180).astype(int)
        sy = np.floor((yy + .5 - 662) / scale + 370).astype(int)
        valid = (sx >= 0) & (sx < 360) & (sy >= 0) & (sy < 400)
        dst = np.zeros((720, 620, 4), dtype=np.uint8)
        dst[valid] = a[sy[valid], sx[valid]]
        export = Image.fromarray(dst)
        target = O / 'idle' / name
        export.save(target)
        bounds = export.getbbox()
        assert bounds and bounds[0] > 0 and bounds[1] > 0 and bounds[2] < 620 and bounds[3] < 720
        assert np.all(dst[0, :, 3] == 0) and np.all(dst[-1, :, 3] == 0)
        assert np.any(dst[:, :, 3] == 255)
        frames.append(dict(id=f'{who}.idle.{dict(back="up",front="down",left="left",right="right")[direction]}',
            character=who, state='idle', sourceView=direction,
            gameDirection=dict(back='up',front='down',left='left',right='right')[direction],
            path='idle/'+name, size=[620,720], rect=[0,0,620,720], pivot=[310,662],
            referenceVisibleHeight=576, alphaBounds=list(bounds), sha256=sha(target),
            selectedRevision=revision, source=str(source.relative_to(P)), sourceSha256=sha(source),
            nativePath='native/'+name, nativeSize=[360,400], nativePivot=[180,370],
            nativeReferenceVisibleHeight=330, nativeCopiedUnchanged=True,
            approvalStatus='user-selected-existing-art', exportMethod='nearest-neighbor, uniform scale 576/330; no drawing edits'))

font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
labels = ['UP / BACK','DOWN / FRONT','LEFT','RIGHT']
for bg, suffix in [('#f5efe3','light'),('#253041','dark')]:
    cv = Image.new('RGBA',(1440,1290),bg)
    dr = ImageDraw.Draw(cv)
    for r,who in enumerate(CHARS):
        for c,d in enumerate(DIRS):
            dr.text((c*360+12,r*430+7),f'{who.upper()} / {labels[c]}',font=font,fill='#45392f' if suffix=='light' else '#ffffff')
            cv.alpha_composite(Image.open(O/'native'/f'{who}-{d}.png').convert('RGBA'),(c*360,r*430+30))
    cv.convert('RGB').save(O/(f'164-trio-idle-{suffix}.png'))

for who in CHARS:
    sheet = Image.new('RGBA',(2480,720),(0,0,0,0))
    joints = Image.new('RGBA',(1640,360),'#253041')
    for c,d in enumerate(DIRS):
        sheet.alpha_composite(Image.open(O/'idle'/f'{who}-{d}.png'),(620*c,0))
        im=Image.open(O/'native'/f'{who}-{d}.png').convert('RGBA')
        joints.alpha_composite(im.crop((75,205,280,385)).resize((410,360),Image.Resampling.NEAREST),(410*c,0))
    sheet.save(O/'sheets'/f'{who}-idle.png')
    joints.convert('RGB').save(O/'checks'/f'{who}-joints-dark.png')

combined = Image.new('RGBA',(2480,2160),(0,0,0,0))
for r,who in enumerate(CHARS):
    combined.alpha_composite(Image.open(O/'sheets'/f'{who}-idle.png'),(0,r*720))
combined.save(O/'164-trio-idle-transparent.png')

manifest = dict(revision=164,status='user-selected-art-packaged-for-integration',runtimeModified=False,
    idleFrameCount=12,directionOrder=DIRS, gameDirectionOrder=['up','down','left','right'],
    size=[620,720],pivot=[310,662],referenceVisibleHeight=576,
    nativeSize=[360,400],nativePivot=[180,370],nativeReferenceVisibleHeight=330,
    drawingEdits=False,frames=frames,
    approval='User explicitly selected Set148 four directions, Somang151 four directions, latest approved Horus including front161/back162; canceled side redraw and retained existing148 sides.',
    integrationNote='Use idle/ at referenceVisibleHeight576 and pivot(310,662), or native/ at330 and(180,370). Do not use legacy reference628 for these normalized620 exports. Walk remains final-trio-v163.')
(O/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(O/'checks/validation.json').write_text(json.dumps(dict(count=12,rgba=True,allNativeSourceBytesUnchanged=True,noCanvasClipping=True,commonExportPivot=[310,662],commonExportReferenceHeight=576,runtimeModified=False),indent=2)+'\n')
with zipfile.ZipFile(O/'164-trio-idle-12-png.zip','w',zipfile.ZIP_DEFLATED) as z:
    for folder in ['idle','native','sheets','checks']:
        for f in sorted((O/folder).glob('*')): z.write(f,f.relative_to(O))
    for name in ['manifest.json','README.md','164-trio-idle-light.png','164-trio-idle-dark.png','164-trio-idle-transparent.png']:
        if (O/name).exists():z.write(O/name,name)
print('Packaged12 selected originals;12 uniform transparent620x720 exports;native sources byte-identical.')
