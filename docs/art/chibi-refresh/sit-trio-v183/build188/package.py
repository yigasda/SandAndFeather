from pathlib import Path
import shutil,json,zipfile,hashlib
P=Path('docs/art/chibi-refresh/sit-trio-v183');(P/'build188').mkdir(exist_ok=True)
for f in ['resize.cjs','check.py','previews.py','package.py']:shutil.copy('/workspace/actions188/'+f,P/'build188'/f)
m=json.loads((P/'manifest.json').read_text());m['canvasExceptions']={'png/somang-back-stool-0.png':{'canvas':[620,744],'paddingTop':24,'anchor':[310,553],'reason':'12% uniform enlargement about original seat-bottom would crop crown; transparent top extension preserves complete head and identical world registration'}}
(P/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
(P/'README.md').write_text('''# 앉기188 —183/186 크기 수정\n\n상태: 사용자 검토 대기. 채택·게임 적용 아님. 소망179 원본은 별도 채택본으로 보존.\n\n14장 중 호루스5장과 소망 뒷모습2장만 사용자 지정 배율로 seat-bottom 중심 균등 확대했다. 자세·색은 그대로다. 세트5장, 소망 방석 오른쪽·긴 의자 오른쪽7장은 이전 PNG와 바이트까지 동일하다.\n\n- 호루스: 방석 오른쪽1.07, 왼쪽1.06, 뒤1.03, 걸상 뒤1.04, 긴 의자 오른쪽1.08.\n- 소망: 방석 뒤1.17, 걸상 뒤1.12.\n- 소망 걸상 뒤는 꼭대기가 잘리지 않도록 위쪽 투명 여백24px를 추가했다. 이 파일만620×744, seat-bottom(310,553). 원래 세계상의 앉은 위치는 같다. 나머지620×720.\n- nearest sampling으로 원래 RGBA 색만 사용했다. 확대된 선과 머리 끝을 밝고 어두운 배경 및 정지·걷기 옆에서 확인했다.\n- 같은 자리별 소망·세트·호루스 정지 비교: `previews/188-same-seat-idle-comparison.png`. 캐릭터별 정지·걷기 비교 시트도 제공한다.\n- 피부색14장 모두 `같음` (`checks/skin188`). 자동 머리 매칭은 호루스 걸상 뒤에서 잘못된 부위를 잡아1.705로 나왔다. 확대 배율은 지시한1.04 그대로이고, 같은 배율 시트에서 실제 머리 폭을 직접 비교했다. 측정값을 맞추려고 더 확대하지 않았다.\n\n게임 적용은 오푸스 담당.\n''')
with zipfile.ZipFile(P/'188-sitting-14-transparent.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted((P/'png').glob('*.png')):z.write(f,'png/'+f.name)
 for f in ['manifest.json','README.md']:z.write(P/f,f)
print('packaged sitting188')
