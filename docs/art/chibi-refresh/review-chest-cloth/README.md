# 호루스 2차 기본 시안 — 흰 가슴천

기존 승인 기본 시안에 참고 이미지의 흰 가슴천을 추가해 달라는 후속 요청. 캐릭터 오른쪽 어깨에서 금목걸이 아래를 지나 허리로 내려오는 드레이프를 정지 4방향과 걷기 12장에 반영했다. 생성 편집 후 프레임 분리·균일 배율·GIF 합성으로 제작했다. 천 밖의 픽셀까지 원본과 동일한 편집은 아니다.

이 폴더는 **가슴천 추가 2차 검토본**이다. 기존 `../approved/`와 그 48장 명세는 변경하지 않았다. 게임 적용 전이며, 이 시안의 사용자 확인 후 호루스 정지·걷기 16장만 교체할 수 있다. 세트·소망 변경 없음.

## 파일별 대응

| 상태 | 방향 | 포즈 | 파일 |
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

정지 620×720/pivot310,662/기준높이628. 걷기360×400/pivot180,370/기준높이330. 걷기 0→1→2→1, 각180ms. 호루스 정면 원본 셀 기준 (+1,0),(0,-1),(-1,0),(0,-1), 추가회전 없음. PNG에는 배치 오프셋을 구워 넣지 않았다.

- `horus-idle-sheet.png`: 앞·뒤·좌·우 4열.
- `horus-walk-sheet.png`: 앞·뒤·좌·우 4행, 0·1·2 3열.
- `horus-walk.gif`: 4방향 동시 재생.
- `front-comparison.jpg`: 기존 기본과 가슴천 추가 정면 비교.
- `*-source.png`: 최종 편집 원본. 중간 수정 시안은 포함하지 않았다.
- `manifest.json`: 16개 경로·크기·방향·기준점·해시 및 검토 상태.
- `python scripts/art/package-horus-chest-cloth.py`: 최종 원본에서 분리·합성 재현.

16장 RGBA, 크기, 투명 여백과 프레임 구성 검증. 기존 승인 48장 해시 불변 확인. 실제 게임 적용은 하지 않았다.

## 보기

- [98번 2차 기본 4방향](https://drive.google.com/file/d/1lOQJxMCPqWvr5LZm9XxsC0mCxxLI1aFM/view)
- [99번 걷기 GIF](https://drive.google.com/file/d/1fDWArAvuHcTnqfcbE6ffvsliy0USd8TF/view)
- [100번 전후 비교](https://drive.google.com/file/d/1OUA0nGYDT_kK44JCJUR_edDPwYkZpwQc/view)
