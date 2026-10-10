# 135번 제작 전 원본 확인 기록

2026-10-11. `approved/walk/` 개별36장과 `approved/idle/` 개별12장을 실제 이미지로 직접 열어 확인했다. 기존 시트6장도 별도로 열었다. GIF나 시트에서 원본 프레임을 추출하지 않았다. 아래 목록은 manifest 각 항목을 실제 PNG 크기/해시와 대조한 결과다. 해시 일치는 원본 식별 근거이며 모션 품질 검증이 아니다.

## 관찰 및 제작 범위

- 세트: 정면에서 얼굴/귀와 긴 머리 끝의 위치 관계가 달라지며, 좌우 포즈에서 팔이 앞머리와 몸에 겹치는 방식과 뒤쪽 긴 머리 끝 형태가 달라진다. 뒤 포즈는 머리가 몸을 가리지만 끝머리와 발의 변화가 함께 보인다. 얼굴/목/몸 중심은 머리 외접 상자 중심으로 대신할 수 없다.
- 소망: 정면 곱슬 끝 폭과 실루엣, 드레스 가장자리/안감이 다르다. 측면에서도 머리 끝과 소매/팔의 겹침, 치맛단이 변화한다. 뒷모습에서 하단 곱슬 실루엣도 포즈별로 다르다.
- 호루스: 정면과 옆면 머리 변화는 작다. 얼굴과 귀/헤어 윤곽을 무조건 같은 그림으로 덮지 않되 크게 고개를 돌리거나 그네처럼 흔들지 않는다. 정면0/2는 내민 발과 올라간 치맛단이 반대이며, 측면은 벌어진 다리/지나는 다리가 구분된다. 뒤에서는 짧은 머리 실루엣/귀와 어깨 연결을 확인한다.
- 이번 제작 범위는 사용자 최신 요청대로 셋소호 4방향×3포즈=36장과 GIF. 호루스 정면부터 비교한 뒤 나머지 방향/캐릭터로 진행했다. 134번 몸 동작을 베이스로, 원본 포즈별 머리/얼굴 변화를 반영한다.
- 소스 역할: approved는 동작 기준, 131번 이마 정리본은 호루스 외형 기준, 134번은 유지할 현재 몸통. 예전 외형 전체로 돌아가지 않는다.

## 원본 파일별 확인

| 파일 | 크기 | 발 기준점 | 크기/해시 | 이미지 직접 열기 |
|---|---|---|---|---|
| `docs/art/chibi-refresh/approved/idle/set-front.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-front-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-front-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-front-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/set-back.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-back-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-back-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-back-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/set-left.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-left-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-left-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-left-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/set-right.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-right-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-right-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/set-right-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/somang-front.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-front-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-front-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-front-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/somang-back.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-back-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-back-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-back-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/somang-left.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-left-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-left-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-left-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/somang-right.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-right-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-right-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/somang-right-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/horus-front.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-front-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-front-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-front-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/horus-back.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-back-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-back-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-back-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/horus-left.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-left-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-left-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-left-2.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/idle/horus-right.png` | 620×720 | (310, 662) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-right-0.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-right-1.png` | 360×400 | (180, 370) | 일치 | 확인 |
| `docs/art/chibi-refresh/approved/walk/horus-right-2.png` | 360×400 | (180, 370) | 일치 | 확인 |

시트6장: `approved/sheets/set-idle.png`, `approved/sheets/set-walk.png`, `approved/sheets/somang-idle.png`, `approved/sheets/somang-walk.png`, `approved/sheets/horus-idle.png`, `approved/sheets/horus-walk.png`

재생: 0→1→2→1, 180ms. 호루스 정면 전체 셀 오프셋 (+1,0)/(0,-1)/(-1,0)/(0,-1), 별도 머리 회전 없음. 명세의 과거 runtimeApplied:false는 현재 게임 상태를 나타내지 않는다. 실제 적용 여부는 TRIO-MOTION-098.md와 런타임 파일 기준.
