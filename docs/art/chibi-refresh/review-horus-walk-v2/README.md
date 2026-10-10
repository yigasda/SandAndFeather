> **사용자 반려 / 사용 금지.** 발 방향·원근·크기·다리 겹침·치마 들림을 충분히 반영하지 못했다. 후속은 `../review-trio-walk-v4/`134번 검토본이다.

# 133 호루스 정면 걷기 — 실제 인게임 포즈 기준 재수정

검토본, 미채택, 게임 미적용. 132번 걷기는 사용자 반려: 기존 인게임 걷기와 동작이 다르다. 132번에서 이마를 정리한 원본 픽셀은 계승하되 임의로 만든 걷기 변형은 사용하지 않는다.

## 기준

- 외형: 최종 채택131번의 이마 정리본. `../review-horus-walk-v1/frames/horus-front-1.png`는 움직임 없는 원본 축소 셀이므로 이것만 사용한다.
- 동작: `../approved/walk/horus-front-{0,1,2}.png`의 실제 포즈. 승인 합본 GIF만 보며 비슷한 모션을 만들지 않는다.
- 런타임: `data/sprites.json` 호루스 `motion`, `src/world/render.js`의 `motionPerson`, `data/art/characters/trio-motion(-small).png`.
- 실제 두 런타임 아틀라스의 정면3포즈를 추출해 패커와 같은 축소를 한 승인 PNG와 비교: **6개 모두 차이0**. 런타임 파일은 읽기만 했다.

## 수정 방법과 범위

132번은 발만 위로 들었지만 기존 걷기는 발을 앞으로 내밀고, 앞발이 커지며 반대 발과 겹친다. 기존3포즈의 허벅지·발목·신발·발바닥 위치, 팔 위치, 치마 밑단을 기록하여 최종 외형 원본 픽셀에 삼각 메시 변형으로 옮겼다. 발의 앞뒤 합성 순서도 기존 포즈를 따른다. 그림을 새로 생성하지 않았다.

외형의 몸 비율이 이전 아트와 다르므로 기준 좌표를 하나의 공통 배율로 변환한다. 동작 좌표는 `validation.json`과 `build.py`에 있다. 이는 기존 포즈를 새 외형에 옮긴 **검토본**이며, 다른 외형의 이미지 전체가 픽셀까지 동일하다는 뜻이 아니다. 머리/얼굴 영역은 세 포즈 모두 원본과 차이0. 눈·헤어·얼굴형 재작화 없음.

## 전달 파일

| 파일 | 용도 |
|---|---|
| `133-runtime-motion-comparison.gif` | 왼쪽 실제 휴대폰용 게임 아틀라스 / 오른쪽 새 외형. 게임의 zoom4, pivot, 정수 배치, 오프셋 환산을 재현하고 표시만2배 확대 |
| `133-horus-front-walk-2x.gif` | 새 정면 걷기720×800 확인용 |
| `133-horus-front-walk.gif` | 새 정면 걷기360×400 |
| `133-approved-motion-comparison.gif` | 원본 크기에서 기존 승인 포즈와 새 외형 동시 비교 |
| `frames/horus-front-0.png` | 화면 오른발을 앞으로 내민 포즈 |
| `frames/horus-front-1.png` | 승인된 중간 전환 포즈 |
| `frames/horus-front-2.png` | 화면 왼발을 앞으로 내민 포즈 |
| `horus-front-walk-sheet.png` | 1080×400, 위3장 순서 |
| `pose-comparison.png` | 위 승인 원본 / 아래 수정본 세 포즈 |
| `build.py` | 원본 픽셀 포즈 변환 및 GIF 작성 |
| `verify_runtime.py` | 런타임 아틀라스 대조·게임 배치 규칙 비교 GIF 작성 |
| `validation.json` | 포즈 좌표·재생 규칙·픽셀 검증 |

재생은 실제 런타임 설정에서 읽은 `0→1→2→1`, 각180ms, 총720ms. 오프셋 `(1,0),(0,-1),(-1,0),(0,-1)`은360×400 셀 기준. PNG에는 오프셋을 굽지 않았다. 옆/뒤 신규 포즈는 이 작업에 포함하지 않았다. 브라우저에서 게임을 실행한 검증은 하지 않았으며, 비교 GIF는 게임 코드의 배치 계산을 재현한 것이다.

- [실제 인게임 ↔ 수정본 비교](https://drive.google.com/file/d/14XBYxc5IGBgr_3PdyCLnUranxvElQGMe/view)
- [수정 정면 걷기](https://drive.google.com/file/d/1jx32s_jdmwRw3WrUMXr8hEYxdWAyyvLE/view)
