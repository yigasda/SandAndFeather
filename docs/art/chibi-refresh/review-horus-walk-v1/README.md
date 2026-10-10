> **걷기 반려 / 사용 금지:** 사용자가 인게임과 동작이 다르다고 지적했다. 후속 검토본은 `../review-horus-walk-v2/`이다. 이 폴더의 이마 정리 원본과 움직임 없는1번 셀만 후속 외형 입력으로 사용한다.

# 132번 — 최종 호루스 이마 정리·정면 걷기 GIF

2026-10-11. 정면 걷기 검토본, 게임 미적용.

사용자는131번에 “드디어…이거다”라고 최종 외형 채택 후 기존 걷기 시안을 참고한 GIF를 요청했다. 이어 아바타를 최종 시안과 최대한 동일하게 유지하고, 이마 명암 깨짐/머리 안 피부색 픽셀을 먼저 정리하라고 요청했다.

## 파일

- `horus-final-clean.png`:131번 원본에서 머리 안 피부색54px와 떨어진 작은 이마 명암48px만 정리한576×730 베이스. 마스크 밖 변경0. 해당 국소 수정 및 걷기는 아직 별도 채택 전.
- `forehead-cleanup-mask.png`: 위 정리 범위.
- `native/horus-front-{0,1,2}.png`: 원본 배율의 투명 걷기3포즈. 세 포즈의 y461 이전 머리는 정리한 원본과 픽셀 차이0.
- `frames/horus-front-{0,1,2}.png`:360×400 투명 PNG, 발 기준점180,370, 가시 높이330. 모든 포즈에 같은 배율/위치 변환을 한 번 적용.
- `horus-front-walk-sheet.png`:3포즈 가로 합본. `walk-poses-preview.png`:배경 포함 검토판.
- `132-horus-front-walk.gif`:360×400 정면 걷기.4프레임,180ms씩,720ms 무한 반복.
- `132-horus-front-walk-2x.gif`:동일 GIF의 nearest2배 확대720×800.
- `build.py`, `validation.json`: 재현/검증.

## 동작과 보존

기존 `approved/walk/horus-front-{0,1,2}.png`와 manifest의 짧은 교대 보폭/순서/리듬을 참고했다. 새 아트 생성 없이 **이번 채택 원본의 실제 픽셀을 부위별 변형**해 팔·다리·치마를 움직인다. 머리는 회전/변형/재작화하지 않는다. 세 native 포즈의 머리 차이0.

순서0→1→2→1,180ms. 기존 승인 오프셋(+1,0),(0,-1),(-1,0),(0,-1)을360×400 셀에서 전체 스프라이트에 한 번만 적용. 추가 head bob/회전/사인파 없음. PNG 포즈에 오프셋은 굽지 않았고 GIF 표시에서만 적용했다.

우선 정면(down) 검토이며 좌·우·뒤를 새 외형으로 만들었다고 해석하지 않는다. 기존 승인48장/게임 런타임은 변경하지 않았다. GIF는 공통256색 팔레트 검토용이며 게임용은 RGBA PNG다.

[걷기 GIF](https://drive.google.com/file/d/1QD3Mje7cSZmShHnwvQuFC3sf7kGnKXB6/view) · [이마 정리 정지본](https://drive.google.com/file/d/1KOsuoKYyqR_PRpGv_Xkxamo64OjbvbyZ/view)
