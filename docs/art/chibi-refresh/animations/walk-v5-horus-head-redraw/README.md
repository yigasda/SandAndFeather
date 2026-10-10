# 호루스 걷기 — 머리통 전체 재작화 v5

사용자 요청: “얼굴형태랑 이목구비 머리 다 다시… 머리통 전체”. 승인된 피부 수정 정지 시안을 방향별 기준으로 삼아 얼굴 윤곽, 이마, 눈·눈썹·코·입, 귀, 두상과 머리카락 전체를 다시 생성 편집했다. 각 방향별 원본 스트립을 보존하고 균일 배율로 분리했다. 기존 머리를 세로로 압축한 버전이 아니다. 생성 편집이므로 몸 등 다른 영역의 픽셀 동일성을 뜻하지 않는다.

**상태:** 피부톤은 사용자 승인. 이 폴더의 걷기 머리 수정본은 새 검토본이며 아직 승인/게임 적용 완료로 기록하지 않는다. 정지 기준은 `../../skin-tone/horus-v1/horus-idle-{front,back,left,right}.png` 네 장이다. 이전 피부 폴더의 걷기 머리는 사용자가 기본 시안과 다르다고 지적한 버전이다.

## 파일 하나씩

모두 투명 RGBA 360×400, pivot (180,370), 기준 높이 330. 오프셋은 PNG에 구워 넣지 않았다.

| 게임 방향 | 포즈 | PNG |
|---|---|---|
| down | 0 | [horus-front-0.png](horus-front-0.png) |
| down | 1 | [horus-front-1.png](horus-front-1.png) |
| down | 2 | [horus-front-2.png](horus-front-2.png) |
| up | 0 | [horus-back-0.png](horus-back-0.png) |
| up | 1 | [horus-back-1.png](horus-back-1.png) |
| up | 2 | [horus-back-2.png](horus-back-2.png) |
| left | 0 | [horus-left-0.png](horus-left-0.png) |
| left | 1 | [horus-left-1.png](horus-left-1.png) |
| left | 2 | [horus-left-2.png](horus-left-2.png) |
| right | 0 | [horus-right-0.png](horus-right-0.png) |
| right | 1 | [horus-right-1.png](horus-right-1.png) |
| right | 2 | [horus-right-2.png](horus-right-2.png) |

## 재생과 보조 파일

- 순서 0 → 1 → 2 → 1, 각 180ms. 정면에만 원본 셀 기준 (+1,0), (0,-1), (-1,0), (0,-1) 적용. 추가 회전 없음. 실제 그림 사이의 차이와 이 배치 오프셋은 별개다.
- `horus-walk-sheet.png`: 1080×1600. 행 앞·뒤·좌·우, 열 0·1·2. 런타임에는 개별 PNG 또는 이 시트를 사용.
- `front-source.png`, `back-source.png`, `left-source.png`, `right-source.png`: 방향별 생성 편집 원본.
- `idle-walk-comparison.jpg`: 각 행의 첫 열은 승인된 정지 시안, 나머지는 새 걷기 3포즈.
- `horus-four-directions.gif`: 네 방향 재생 검토용.
- `trio-walk-preview.gif`: 세트·소망은 기존 `walk-v1` PNG 그대로, 호루스만 이 폴더의 새 프레임.
- `manifest.json`: 12개 경로·방향·포즈·크기·pivot·SHA-256 및 승인 상태.
- 재현: `python scripts/art/compose-horus-walk-head-v5.py`. 이미지 페인팅 없이 생성된 스트립의 자르기·균일 확대축소·합성과 GIF 패키징만 수행.

검증: 12장 RGBA/크기/알파 경계, 시트 구성 확인. 기본 시안과 네 방향 비교표 육안 검토. 기존 정지/걷기 PNG 변경 없음. 게임 런타임은 이번 작업 범위 밖이며 게임 적용 테스트를 뜻하지 않는다.

## Drive

- [95번 기본 시안과 걷기 비교](https://drive.google.com/file/d/1WX526JmajXWjk-yWGH4fLUuHVcZSb4VS/view)
- [96번 호루스 4방향 걷기](https://drive.google.com/file/d/1Urr0N_jJd4emRz7zjmtRL4wu-JTW3XjB/view)
- [97번 셋소호 걷기 합본](https://drive.google.com/file/d/1GYwmhowSwGQgh1RMbkhGKCD1DqQvjTQe/view)
