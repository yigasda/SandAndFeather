# 호루스 피부톤 수정 시안

> 후속 확인: 피부톤은 사용자 승인. 아래 걷기 12장은 머리 형태가 기본 시안과 다르다는 후속 수정 대상이다. 정지 4장은 기준으로 유지하며 [머리 전체 수정 v5](../../animations/walk-v5-horus-head-redraw/README.md)를 검토한다. 아래 내용은 제작 당시 기록이다.

사용자가 걷기까지 승인한 뒤 호루스 피부를 반 톤 밝히고 웜톤이 아닌 피부로 수정하도록 요청했다. 뉴트럴 쿨톤의 밝은 아이보리·은은한 분홍 기운을 목표로 정지 4장과 걷기 12장을 생성 편집했다. 이 파일들은 새 피부톤 검토본이며, 기존 승인본에 대한 픽셀 단위 색 보정은 아니다. 색 외 영역의 픽셀 동일성은 보장하지 않는다.

기존 승인 원본과 `approved-idle-walk-manifest.json`은 피부 수정 전 스냅샷으로 보존했다. 새 16장 경로·방향·크기·pivot·해시는 이 폴더의 [manifest.json](manifest.json)에 있다. 새 피부톤의 사용자 확인 결과를 기존 기본 자세·걷기 승인과 혼동하지 않는다. 게임 런타임 파일은 변경하지 않았다.

움직임은 0→1→2→1, 180ms, 호루스 정면의 원본 셀 오프셋 +1,0 / 0,-1 / -1,0 / 0,-1을 그대로 사용한다. 새 회전을 추가하지 않았다. 세트·소망은 기존 v1 PNG 그대로다. 머리 흔들림 v3는 다시 사용하지 않는다.

## 파일별 교체 대응

| 상태 | 게임 방향 | 포즈 | 새 PNG |
|---|---|---|---|
| idle | down | 정지 | [horus-idle-front.png](horus-idle-front.png) |
| idle | up | 정지 | [horus-idle-back.png](horus-idle-back.png) |
| idle | left | 정지 | [horus-idle-left.png](horus-idle-left.png) |
| idle | right | 정지 | [horus-idle-right.png](horus-idle-right.png) |
| walk | down | 0 | [horus-walk-front-0.png](horus-walk-front-0.png) |
| walk | down | 1 | [horus-walk-front-1.png](horus-walk-front-1.png) |
| walk | down | 2 | [horus-walk-front-2.png](horus-walk-front-2.png) |
| walk | up | 0 | [horus-walk-back-0.png](horus-walk-back-0.png) |
| walk | up | 1 | [horus-walk-back-1.png](horus-walk-back-1.png) |
| walk | up | 2 | [horus-walk-back-2.png](horus-walk-back-2.png) |
| walk | left | 0 | [horus-walk-left-0.png](horus-walk-left-0.png) |
| walk | left | 1 | [horus-walk-left-1.png](horus-walk-left-1.png) |
| walk | left | 2 | [horus-walk-left-2.png](horus-walk-left-2.png) |
| walk | right | 0 | [horus-walk-right-0.png](horus-walk-right-0.png) |
| walk | right | 1 | [horus-walk-right-1.png](horus-walk-right-1.png) |
| walk | right | 2 | [horus-walk-right-2.png](horus-walk-right-2.png) |

정지 PNG는 기존 `common-body-v2-dress-and-profile/horus-{view}.png`에 대응한다. 걷기는 기존 v1의 호루스 뒤·좌·우와 v2의 호루스 정면에 대응한다. 이 PNG에는 1픽셀 미세 오프셋을 구워 넣지 않았으므로 최종 렌더링 시 설정을 한 번만 적용한다.

## 보조 파일

- `idle-source.png`, `walk-source.png`: 생성 편집 원본, 다시 자를 필요 없음.
- `horus-idle-sheet.png`: 620×720 셀 4열, 앞·뒤·좌·우.
- `horus-walk-sheet.png`: 360×400 셀 3열×4행, 앞·뒤·좌·우 및 포즈 0·1·2.
- `skin-comparison.jpg`: 기존 정면과 피부 수정 정면의 비교.
- `horus-idle-preview.jpg`, `horus-walk-preview.jpg`: 밝은 배경 정지 미리보기.
- `horus-front-preview.gif`, `trio-walk-preview.gif`: 기존과 같은 주기·미세 배치 설정으로 재생한 검토본.
- 재현: 저장소 루트에서 `python scripts/art/compose-horus-cool-skin.py`.

## Drive

- [92번 피부 전후 비교](https://drive.google.com/file/d/1CUdTJGXsHL1woJJTOmHMIh8ZdYbYKyfY/view)
- [93번 정지 4방향](https://drive.google.com/file/d/1bh0PelXY4FYpI-xuWmxeLMtlLmgw3M-M/view)
- [94번 걷기 합본](https://drive.google.com/file/d/1yqPrBBQxTrrquGneo5UKcWn7JgCuudzR/view)
