from pathlib import Path
import json,hashlib,importlib.util
from PIL import Image,ImageDraw,ImageFont
P=Path('docs/art/chibi-refresh/sit-trio-v183');B=P.parent
m=json.loads((P/'manifest.json').read_text());changes={r['file']:r for r in json.loads((P/'checks/188-resize.json').read_text())}
spec=importlib.util.spec_from_file_location('ac','tools/art/action-check.py');ac=importlib.util.module_from_spec(spec);spec.loader.exec_module(ac)
rows=[]
for f in m['files']:
 p=P/f['path'];old=Path('/workspace/actions188/before')/p.name
 if f['path'] not in changes:assert old.read_bytes()==p.read_bytes()
 else:
  im=Image.open(p);assert not im.getchannel('A').crop((0,0,620,1)).getbbox(),p
  scale=ac.head(p,f['character'],f['direction']);rows.append({'file':f['path'],'headMatch':round(scale,3),'requestedUniformScale':changes[f['path']]['factor'],'anchor':f['anchor']['position']})
 f['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
 if f['path'] in changes:f['correctionRevision']=188;f['uniformScaleFrom183_186']=changes[f['path']]['factor'];f['anchor']['position']=changes[f['path']]['anchor'];f['canvas']=changes[f['path']]['canvas']
m['correctionRevision']=188;m['status']='awaiting-user-review';m['artApproved']=False;m['runtimeEligible']=False
(P/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
(P/'checks/188-head-sizes.json').write_text(json.dumps(rows,indent=2)+'\n');print(rows)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
sheet=Image.new('RGB',(1860,1920),'#f5efe3');d=ImageDraw.Draw(sheet)
for row,(v,seat) in enumerate([('left','floor'),('right','floor'),('back','floor'),('back','stool'),('right','bench')]):
 for c,w in enumerate(['somang','set','horus']):
  idle=B/'final'/w/'idle'/f'{w}-{v}.png';sit=B/'sit-somang-v179/png/somang-left-0.png' if w=='somang' and v=='left' else P/'png'/f'{w}-{v}-{seat}-0.png'
  for n,(p,label) in enumerate([(idle,'IDLE'),(sit,seat.upper())]):
   src=Image.open(p).convert('RGBA');im=src.resize((src.width//2,src.height//2),Image.Resampling.NEAREST);x=c*620+n*310;y=row*384;sheet.paste(im,(x,y+24-(12 if p.name=='somang-back-stool-0.png' else 0)),im);d.text((x+4,y+3),w+' '+v+' '+label,font=font,fill='#332c29')
sheet.save(P/'previews/188-same-seat-idle-comparison.png')
