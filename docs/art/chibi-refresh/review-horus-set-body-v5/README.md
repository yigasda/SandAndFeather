# 호루스 세트 몸 베이스 · 도트 명암 3안

2026-10-11. 사용자 요청: 선택된 호루스3안 머리/얼굴을 유지하면서 몸은 세트에 맞추고, 피부·옷은 호루스에서 스포이드로 추출한 색을 사용한다. 세트·소망 정도의 도트 깊이만 더하고 디자인은 바꾸지 않는다. 세 안 모두 사용자 검토 대기이며 게임 미적용.

## 실제 입력과 작업

- 머리: `../review-horus-v4/base-option3.png` (118번 원래3안 크롭). 반려된119번 머리 추가 수정은 사용하지 않았다.
- 몸: `../review-pocket-style-v2/front/set-front.png`에서 실제 몸 픽셀을 추출. 주변 자주색 머리 제거 마스크를 사용했다. 세트 몸은 축소/압축 없이 같은 크기로 사용하며 세 안 공통이다.
- 피부/흰 천/금속/샌들: 선택된 호루스3안의 실제 RGB와 좌표를 `eyedropper-palettes.json`에 저장하고 세트 몸 색에 대응시켰다. 세트의 금색 허리띠도 호루스의 흰 천 색으로 맞췄다.
- 이미지 편집 도구에서 몸/명암 시안을 만들었으나 결과의 몸이 여전히 길고 금색 허리띠가 남아 최종 베이스로 사용하지 않았다. 최종은 실제 세트 몸 픽셀과 호루스3안 머리로 구성하고, 기존 머리 명암을 도트 색 덩어리로 정리했다.
- 1안은 약한 단계화, 2안은 보통, 3안은 조금 더 단순하고 또렷한 명암. 머리 외곽/얼굴형/이목구비 위치와 몸 형상은 세 안 공통.

## 파일

- `122-horus-three-options.png`: 최종 3안 비교판. 생성 도구의 중간 비교판이 아닌 이 파일을 검토한다.
- `123-map-comparison.jpg`: 동일 실제 배경, 동일 발 위치, 65px 표시 높이의 정적 합성. 실행 서버 캡처가 아니다.
- `option-1.png`~`option-3.png`: 배경 포함 개별 정면.
- `horus-1-transparent.png`~`horus-3-transparent.png`: 비교판 합성용 투명 크롭. 아직 게임용 방향/걷기 에셋 아님.
- `set-body-geometry-source.png`: 색 보정 전 실제 세트 몸 마스크. 투명 픽셀 RGB에 머리 정보가 남아 있으니 알파를 적용해 본다.
- `validation.json`, `eyedropper-palettes.json`: 몸 배치·색상 출처 기록.

[3안 비교](https://drive.google.com/file/d/1xSXmv9fKDpGyLD8TojkeecFLvhqebUZs/view) · [맵 비교](https://drive.google.com/file/d/1eyanu8D0w4nNKS-GwBZuBOcVVwcmoQ_b/view)
