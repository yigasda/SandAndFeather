# 세트·호루스 잠들기 197 — 8장 재작화

정면 날숨·들숨, 화면 오른쪽을 보는 옆면 날숨·들숨: 캐릭터별4장, 총8장. 투명 PNG620×720. 사용자 검토 대기이며 게임에 적용하지 않는다.

- [8장 시트](previews/all-light.png) · [어두운 배경](previews/all-dark.png)
- [최종 정지와 같은 배율 비교](previews/idle-comparison.png)
- 숨쉬기800ms: [세트 정면](previews/set-sleep.gif) · [세트 옆](previews/set-sleep-side.gif) · [호루스 정면](previews/horus-sleep.gif) · [호루스 옆](previews/horus-sleep-side.gif)
- 걷기→정지→잠들기: [세트 정면](review/set-sleep-chain.gif) · [세트 옆](previews/set-sleep-side-chain.gif) · [호루스 정면](review/horus-sleep-chain.gif) · [호루스 옆](previews/horus-sleep-side-chain.gif)
- [검사](review/report.md) · [직접 확인](review/visual-notes.md) · [PNG·기준점·해시](manifest.json)

## 이번 기준

사용자 최신 지시: 8장 전체 재작화, 라인 가이드 사용 취소, 몸 비율만195 참고. 얼굴·머리 기준은 `final/set/idle/set-front.png`, `set-right.png`, `final/horus/idle/horus-front.png`, `horus-right.png`와 같은 방향 걷기0·1·2다. 195의 정면 얼굴은 기준으로 사용하지 않았다.

새 전체 그림을 4개의 두 프레임 원화로 그리고, 개별 PNG로 분리하여 원본 머리 크기와195 몸 길이에 맞게 전체 그림의 배치를 정리했다. 정지 머리·얼굴·몸 조각을 복사하지 않았다. 색은 방향별 정지 팔레트에 맞추었으며, 머리 하이라이트와 큰 명암 면을 유지했다. 숨쉬기 마감은 새로 그린 들숨 그림의 어깨·팔·걸친 머리카락을 함께 움직였다. 빨간 선 가이드는 입력이나 PNG에 사용하지 않았다. `review/`의 도구가 만드는 겹침 그림은 검토자료이며 게임용 그림이 아니다.

몸 기준점은 정면(310,450), 옆(350,450). 소망과 최종 정지·걷기 PNG는 변경하지 않았다.

## 몸 길이 기준

195의 수직 투영 길이로 등록했다. 아래 숫자는 정합에 사용한 턱·치마단·발끝 좌표이며, 굴곡 있는 외곽선을 수동으로 짚는 오차는 약2~3px이다. 들숨은 어깨·가슴을 올리는 자세 변화가 포함된다.

|그림|턱→치마단|치마단→발끝|195대비|
|---|---:|---:|---|
|세트 정면0 / 1|144 / 145px|87px|각 프레임100%|
|호루스 정면0 / 1|148 / 149px|87px|각 프레임100%|
|세트 옆0 / 1|159 / 160px|91px|각 프레임100%|
|호루스 옆0 / 1|159 / 160px|91px|각 프레임100%|

[등록 기록](checks/body-registration.json) · [외곽선 변화](checks/breathing.json). 수치 일치는 얼굴이나 그림체가 같다는 증거로 쓰지 않는다.

## 추가 비교

- [8장 숨쉬기 한눈에](previews/breathing-all.gif) · [31px](previews/breathing-31px.gif)
- [실제 방 침대 위 배치](previews/beds-alone-together.png): 이불 가림 없이 크기·자리만 보는 합성이다. 게임 적용 화면이 아니다.
- 머리 시트의 자동 맞춤값(0): 세트 정면 ×0.92, 옆 ×0.92, 호루스 정면 ×0.99, 옆 ×1.01. 세트는 긴 머리가 퍼진 누운 윤곽까지 측정하므로 얼굴 크기가 정확히 같다는 근거로 삼지 않았다. 수치와 별개로 같은 배율 정지 비교 시트를 함께 제공한다.
