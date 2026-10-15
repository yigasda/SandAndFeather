from pathlib import Path
import json
out=Path('/workspace/horus-combat-pose-guide')
neutral=['눈: 양쪽 반쯤 뜸 · 윗눈꺼풀 낮게','눈썹: 안쪽이 조금 낮은 완만한 경사','시선: 얼굴이 향한 우측 전방','입: 아주 작게 다묾 · 미소 없음']
notes=[neutral.copy(),neutral.copy(),neutral.copy(),
['눈: 양쪽 뜸 · 힘주어 좁힌 눈매','눈썹: 안쪽을 낮춰 강하게 모음','시선: 우측 아래 돌진 목표','입: 작은 가로 타원으로 살짝 벌림'],
['눈: 양쪽 반쯤 뜸 · 차분하게 집중','눈썹: 안쪽이 조금 낮은 완만한 경사','시선: 뻗은 손 너머 우측 전방','입: 작게 다묾'],
['눈: 화면 왼쪽 눈 감음 · 반대 눈 가늘게 뜸','눈썹: 안쪽이 들림 · 힘겨운 비대칭','시선: 뜬 눈은 우측 아래','입: 작게 다묾 · 입꼬리 조금 내려감'],
['눈: 양쪽 뜸 · 윗눈꺼풀에 힘을 줌','눈썹: 안쪽 낮게 · 선명한 긴장','시선: 좌측 아래 돌진 목표','입: 작게 다묾 · 큰 외침 없음'],
['눈: 양쪽 뜸 · 약간 좁힌 집중 눈매','눈썹: 안쪽 낮게 · 완만한 긴장','시선: 뻗은 손 너머 좌측 전방','입: 작고 둥글게 벌림 · 주문 중'],
['눈: 양쪽 가늘게 뜸 · 윗눈꺼풀 처짐','눈썹: 약한 비대칭 · 지친 긴장','시선: 좌측 아래 · 고개 숙임','입: 작게 다묾 · 손·팔에 일부 가림'],
['눈: 양쪽 반쯤 뜸 · 좁힌 집중 눈매','눈썹: 안쪽을 약간 낮춤','시선: 우측 창끝 너머','입: 작은 선으로 다묾'],
['눈: 양쪽 반쯤 뜸 · 준비와 같은 집중','눈썹: 안쪽을 약간 낮춤','시선: 우측 공격 목표','입: 작은 선으로 다묾'],
['눈: 화면 왼쪽 눈 꽉 감음 · 반대 눈 뜸','눈썹: 안쪽이 들린 비대칭 · 통증','시선: 뜬 눈은 우측 전방','입: 옆으로 벌어진 작은 입 · 흰 틈 표시']]
(out/'expression-notes.json').write_text(json.dumps({'method':'Visual reading of twelve original pose PNGs; image-left/right refer to viewer coordinates. Occluded details not reconstructed. Eye design must come from original appearance guide, not pose sheet.','cells':[{'cell':i+1,'instructions':n} for i,n in enumerate(notes)]},ensure_ascii=False,indent=2))
s=(out/'angles.py').read_text()
s=s.replace("WONTMATCH","")
s=s.replace("(2400,2050)","(2400,2410)").replace("row*620","row*740").replace("oy+606","oy+726")
s=s.replace("records=[]","expression_notes="+repr(notes)+"\nrecords=[]")
s=s.replace("d.text((ox+10,oy+551),'표정: '+expressions[i],font=F(20),fill='#293647')", "d.text((ox+10,oy+551),'표정: '+expressions[i],font=F(20),fill='#293647')\n for j,note in enumerate(expression_notes[i]):d.text((ox+10,oy+581+j*27),note,font=F(18),fill='#364252')")
s=s.replace("oy+582","oy+696")
s=s.replace("'각도는 2D 원본의 시각적 추정값 · 외형은 별도 가이드'","'눈 형태·색은 원본 가이드 / 위 문구는 표정 동작만'")
s=s.replace("'cell':i+1,'faceAngles'","'cell':i+1,'expressionDetails':expression_notes[i],'faceAngles'")
s=s.replace('horus-12-face-angle-guide.png','horus-12-angle-expression-guide.png').replace('face-angle-manifest.json','angle-expression-manifest.json')
s=s.replace("'파랑 머리·턱 | 빨강 어깨 | 주황 허리 | 보라 무릎 | 초록 발 · 자세별 기준선은 수동 근사치'","'방향·각도는 2D 원본의 추정값 / 표정은 눈·눈썹·시선·입으로 구분 / 화면 좌우 기준'")
(out/'expressions.py').write_text(s)
