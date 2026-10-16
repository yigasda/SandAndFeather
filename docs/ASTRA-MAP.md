# 아스트라 맵·배경 — 순서와 규칙

> **압축 후 사막 작업은 [01~04 통합 인수인계](ASTRA-DESERT-HANDOFF.md)부터 읽는다.** 01~04 최종 채택 완료. 정확한 최종 PNG·생성문·참고 원본·실패 교훈·다음 작업 순서는 이 문서가 최신이다. main 전달 대상은 01 최종본, 02 출구 국소 합성본, 03 외곽선 보강본, 04 마지막 시안 채택본이다. 게임 런타임 적용은 미실행.

입구 [START](ASTRA-START.md) · 명세 [PLAN](ASTRA-PLAN.md) · 공통 규칙과 승인 [HANDOFF](ASTRA-HANDOFF.md). 이미 승인된 범위는 반복 승인받지 않는다.

**맵·배경 작업(새 세부맵, 장면 수정, 두아트, 새 지역)은 이 순서대로 한다.**

현재 두아트 채택본: [7개 맵 원본](../세부맵1/두아트/) · [맵별 최종 수정·반려 기준](ASTRA-DUAT-HANDOFF.md). 초기 시안 대신 이 채택본을 우선한다.

## ① 연다

- 아래 D의 **채택 배경** 중 같은 건물·비슷한 장소 2~3장(시점·도트·색 기준).
- 고칠 장면이면 그 장면의 **채택 원본**과 `coordinates.json`.
- [PLAN](ASTRA-PLAN.md)의 해당 명세(두아트 3단계, 새 지역 4단계).

## ② 계획을 보내 OK 받는다

베이스 파일, 바꿀 것, 지킬 것(시점·크기·화풍), 그림 크기(px·칸), 낮/밤, 대표 시안 1장부터인지. 크기를 바꾸면 원본 위치(오프셋)도.

## ③ 맵 규칙

**새 세부맵은 기존 세부맵과 같은 화풍과 퀄리티로 그린다.** 시작 전에 아래 D의 기준 파일 2~3장을 열고 맞출 점을 계획에 적는다.
- **시점:** 같은 3/4 내려다보는 각도와 원근.
- **크기:** 신전 안채 세부맵은 세로 887px(11칸), 1칸 약 80px, 가로는 80px 배수. 두아트는 세로형. 그 밖은 장소에 맞게. 문·기둥·가구는 셋소호(약 2칸 키)가 드나들고 앉을 만한 크기.
- **도트·선·색:** 해상도감, 외곽선 굵기, 디더링을 기존과 같게. 바닥·벽·그림자·하이라이트 색은 기준 파일에서 뽑아 쓴다. 같은 건물 안은 밝기·색이 튀지 않게(안채 그림자는 따뜻한 갈색). 다른 장소는 그 장소답게.
- **입구:** 원래 그 건물에 있던 것처럼 같은 투시·크기로. 문 너머도 같은 시점으로 이어진다.
- **세계관:** 고대 이집트. 현대 소품·다른 문화권 양식 없음. 주인이 있는 장소는 그 사람다운 물건으로.
- **밤:** 건물·문·가구 위치는 낮과 같게(게임이 같은 충돌을 쓴다).
- **앞에 오는 물건:** 캐릭터를 가리는 기둥·가구는 윤곽을 바닥과 또렷이 분리한다(가림 처리용).
- **기존 장면을 고칠 때:** 크기는 그대로가 기본. 넓히려면 제안하고 확인받는다. 크기를 바꾸면 원본 위치(오프셋)와 새 기준 좌표를 함께 주고, 문턱·통로 바닥·출구·도착점을 구분해 적는다.

## ④ 보내기 전 검수

**맵에서 볼 것.** 셋소호를 게임 크기로 올려 문·통로·가구 크기를 본다(통로는 여유 있게). 폰 화면(가로 약 12칸)으로 잘라도 장소와 갈 길이 읽히는지. 낮밤을 겹쳐 위치가 같은지. 이웃 장면과 바닥·벽·문틀이 이어지는지.

모든 그림 공통 검수(비교 시트, 이중선, 투시, 접합, AI 흔적, 파일 크기)는 [HANDOFF](ASTRA-HANDOFF.md) 2절.

## ⑤ 보고

PNG 경로, 크기, 낮/밤, 출구·문턱·통로 바닥·도착점 좌표(px), 원본 위치(오프셋), 눈으로 확인한 것과 못 한 것. 이미지는 Drive 링크로.

## D. 채택 배경 — 사용자가 선택한 파일만

경로는 `docs/art/map-expansion/` 기준. 낮밤은 한 쌍으로 유지한다.

| 대상 | 파일 |
|---|---|
| 옴보스 | `ombos-upgrade-v1-day.png`, `ombos-upgrade-v1-night.png` |
| 세트 방 | `set-room-v6-single-window-day.png`, `…-night.png` |
| 호루스 방 | `horus-room-v2-wide-day.png`, `…-night.png` |
| 소망 방 | `somang-room-v3-center.png`, `somang-room-v3-center-night.png` |
| 부엌 | `temple-kitchen-v2-open-day.png`, `…-night.png` |
| 식사 공간 | `temple-dining-v2-garden-day.png`, `…-night.png` |
| 성소 | `set-sanctuary-v6-neutral.png` |
| 열주 계단 | `colonnade-stairs-v1.png`, `colonnade-stairs-v1-night.png` |
| 지붕 | `temple-roof-v1-day.png`, `temple-roof-v1-night.png` |
| 안쪽 복도 | `corridor-expand-v4/inner-corridor-expanded-v4.png` (2492×887) |
| 중앙·동쪽·서쪽·방문 회랑 | `corridors-remaining-v1/{central,east,west,rooms}-expanded.png` (각 2492×887, 원본 위치 (160,64)) |
| 연못 회랑 | `exits-v2/courtyard-colonnade-v1.png`, `…-night.png` (1932×1086) |
| 우물 마당 | `well-option3-night-v1/well-courtyard-option3-day.png`, `…-night.png` (2160×887) |

좌표는 각 폴더의 `coordinates.json`을 따른다. 이전 작은 회랑과 반려본으로 되돌리지 않는다. 제작 참고 자료(walk-analysis, [RESIDENCE-EXITS-V2.md](RESIDENCE-EXITS-V2.md))는 최종 목록이 아니다.

> **다음:** 보고까지 끝났으면 [STATE](ASTRA-DRAW-STATE.md)를 갱신한다.
