# 147 — 셋소호 정지 수정 검토본

상태: **사용자 검토 대기. 게임 미적용.** 146의 지적된 부분을 수정한 현재 정지12장 묶음이다. 채택 걷기36장과 이전 그림체 참고12장은 변경하지 않았다.

## 이번 수정

- 세트 정면: 실제 최종 정면 참고 PNG의 다리를 사용하고 간격을 조정했다. 뒷모습은 기존 다리를 좌우3px씩 옮겨 작은 간격을 만들었다.
- 소망 정면: 세트 실제 종아리 픽셀을 이용해 곧고 좁은 형태로 수정하고, 소망 샌들은 유지했다. 발 사이 간격을 줄였다.
- 소망 뒤·좌·우: 머리와 몸 사이 잘린 투명 접합부를 인접 머리색으로 메웠다.
- 호루스 정면: **146 얼굴을 유지**했다. 눈·눈썹·얼굴형·피부 픽셀을 재작화하거나 리사이즈하지 않았다. 몸 접합을 위해 얼굴 전체 위치만 아래7px 이동했으며,14374개 보존 픽셀 차이0을 확인했다.
- 호루스 정면 헤어와 몸: `../review-trio-walk-v4/idle-reference/horus-front.png`의 채택 정면 실제 픽셀을 사용했다. 이 몸은 이전에 세트 기반으로 채택된 몸이다. 짧은 비율·흰 옷·금 장식·기존 도트 명암을 복원하고 바깥 밝은 매트 테두리를 정리했다. 뒷모습은 발 사이 간격을 수정했다.
- 세트·호루스의 좌우 방향4장은 변경하지 않았다. 전 방향 새 디자인을 승인받았다는 뜻은 아니다.

## 사용할 파일

- `idle/`:620×720 투명 PNG12장. 전달용 원본.
- `manifest.json`: 발 기준점(310,662), **referenceVisibleHeight576**, 실제 해시. 구버전 기준 키628을 하드코딩하지 않는다.
- `native/`: 같은 그림의360×400 작업본. 발 기준점(180,370),기준 키330.
- `previews/147-trio-idle-12-review.png`: 전체 보기.
- `previews/147-trio-idle-walk-check.gif`: 수정 정지와 변경하지 않은 채택 걷기 비교.
- `validation.json`: 보존영역, 호루스 얼굴 픽셀 검사, 걷기36장 해시 검사.

12장 공통 배율576/330은 세트 긴 머리 끝을620×720 안에 보존하기 위한 규격이다. 런타임은 manifest를 따른다. 아직 `runtimeEligible:false`다.

## 재현

저장소의146 기준 커밋5c0987c에서 작업본을 읽는다. 기존 작업 이미지를 덮어 반복 보정하지 않는다.

```sh
node repair-147/run.cjs
```

기존 `build-sample.cjs`, `build-remaining.cjs`, `finish.cjs`는146 제작 경과다. 현재 수정본 재현에는 위 명령을 사용한다. 원본 얼굴 검사 결과는 validation에 기록했다.

## 링크

[수정12장 전체 보기](https://drive.google.com/file/d/1w8F9vUSgw_uZEyKRx14ldtB5Z5_FdMOV/view)

[PNG12장 ZIP](https://drive.google.com/file/d/1d2DYbqpbxfiYhQbE7acBJ6gG98DnY5T-/view) · [걷기 비교GIF](https://drive.google.com/file/d/1HA4jVrkh1aE74X7ya-T3xe-M8B9JCZT0/view)
