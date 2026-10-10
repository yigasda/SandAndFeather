"""Index approved idle/walk sources for Opus. Does not modify art or runtime assets."""
from pathlib import Path
from PIL import Image
import hashlib,json
ROOT=Path(__file__).resolve().parents[2]
D=Path('docs/art/chibi-refresh');I=D/'directions/common-body-v2-dress-and-profile';A=D/'animations';OUT=A/'approved-idle-walk-manifest.json'
chars=['set','somang','horus'];dirs={'front':'down','back':'up','left':'left','right':'right'};frames=[]
for who in chars:
 for view,game in dirs.items():
  for state,phase in [('idle',None)]+[('walk',p) for p in range(3)]:
   path=I/f'{who}-{view}.png' if state=='idle' else A/('walk-v2-horus-front' if who=='horus' and view=='front' else 'walk-v1')/f'{who}-{view}-{phase}.png'
   im=Image.open(ROOT/path);expected=(620,720) if state=='idle' else (360,400)
   assert im.mode=='RGBA' and im.size==expected,(path,im.mode,im.size)
   b=im.getbbox();assert b and b[0]>0 and b[1]>0 and b[2]<im.width and b[3]<im.height,(path,b)
   frames.append({'id':f'{who}.{state}.{game}'+('' if phase is None else f'.{phase}'),'character':who,'state':state,'sourceView':view,'gameDirection':game,'phase':phase,'path':str(path),'size':list(im.size),'rect':[0,0,*im.size],'pivot':[310,662] if state=='idle' else [180,370],'referenceVisibleHeight':628 if state=='idle' else 330,'alphaBounds':list(b),'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest()})
manifest={'schemaVersion':1,'status':'user-approved-art-awaiting-runtime-integration','artBaselineCommit':'afbf12b','baseReviewNumber':81,'walkReviewNumber':91,'pathRoot':'repository root','directionMap':dirs,'characters':chars,'idleFrameCount':12,'walkFrameCount':36,'frameCount':48,'walkCycle':{'sequence':[0,1,2,1],'previewFrameDurationMs':180,'previewCycleDurationMs':720,'offsetSpace':'source 360x400 cell pixels before render scaling','defaultOffsets':[[0,0]]*4,'horusDownOffsets':[[1,0],[0,-1],[-1,0],[0,-1]],'headRotationDegreesAdded':0,'note':'Offsets translate the full rendered sprite, not head alone. Do not combine with old renderer bob.'},'runtimeApplied':False,'frames':frames}
(ROOT/OUT).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
# Exhaustive Markdown index, no filename wildcard inference required by integrator.
lines=['# 승인 프레임 파일별 목록','', '정지 12장 + 걷기 36장, 총 48장. 경로는 저장소 루트 기준이다. 파일 ID와 해시는 [JSON 명세](art/chibi-refresh/animations/approved-idle-walk-manifest.json)에 있다. 모든 파일은 투명 RGBA PNG다.','', '정지 셀은 620×720, 기준점 310,662, 기준 캐릭터 높이 628이다. 걷기 셀은 360×400, 기준점 180,370, 기준 캐릭터 높이 330이다. 크기와 기준점은 원본 픽셀 단위이며 실제 게임 표시 크기가 아니다.','']
for who in chars:
 lines += ['## '+{'set':'세트','somang':'소망','horus':'호루스'}[who],'','| 상태 | 게임 방향 | 포즈 | 정확한 원본 파일 |','|---|---|---|---|']
 for f in [f for f in frames if f['character']==who]:
  phase='정지' if f['phase'] is None else ['0 · 발 A','1 · 가운데','2 · 발 B'][f['phase']]
  lines.append(f"| {f['state']} | {f['gameDirection']} | {phase} | [{f['path']}]({f['path'][5:]}) |")
 lines+=['']
(ROOT/'docs/APPROVED-IDLE-WALK-FILES.md').write_text('\n'.join(lines)+'\n')
print(f'Validated and indexed {len(frames)} approved RGBA files: 12 idle + 36 walk.')
