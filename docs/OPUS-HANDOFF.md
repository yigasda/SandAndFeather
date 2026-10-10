# 오푸스 인수인계 — 게임 적용과 코드 (지금 기준만)

**오푸스용 문서다.** 갱신 2026-10-11. 게임의 지금 상태와 이어서 할 일만 적는다. 지난 버전별 경과는 `archive/SESSION-HANDOFF-LOG-2026-10-11.md`와 각 기록 문서에 있다. 그림 작업 규칙은 아스트라용 [ASTRA-HANDOFF.md](ASTRA-HANDOFF.md)에 있다. 아트를 받을 때 채택 상태를 확인하는 용도로만 본다.

## 역할

- **아스트라:** 그림을 그리고 고친다. 기준은 [ASTRA-HANDOFF.md](ASTRA-HANDOFF.md), [ASTRA-PLAN.md](ASTRA-PLAN.md).
- **오푸스:** 채택된 그림을 게임에 넣는다. 충돌, 출구, 가림, 밤 전환, 저장, 성능, UI, 검증을 맡는다. 승인된 그림을 다시 그리지 않는다.
- 사용자가 아스트라와 정리한 파일을 한꺼번에 넘기면 그때 적용한다. 검토본이나 main에 올라온 시안을 먼저 넣지 않는다.

## 사용자와 일하는 법

- 한국어 반말로 짧고 따뜻하게 쓴다. 사용자는 안드로이드 폰에서 본다.
- 이미지는 Google Drive 링크나 작은 크롭으로 보여 준다. 큰 이미지를 여러 장 한꺼번에 다시 읽지 않는다.
- 할당량 낭비, 반복 재생성, 불필요한 확인 질문을 싫어한다.
- 시안이나 미리보기를 "적용 완료"라고 말하지 않는다.

## 저장소, 버전, 검증

- 저장소 https://github.com/yigasda/SandAndFeather, 작업 브랜치 `main`. 아스트라도 main에 올리므로 커밋 전에 받아서 합친다. 남의 작업을 강제 푸시로 덮지 않는다.
- 버전은 `manifest.json`의 `version`과 `src/core/settings.js`의 `VERSION`을 같이 올린다. 지금은 **0.9.21**이다.
- 검증 스크립트는 `tools/art/`에 있다.
  - `verify-full-map.cjs`: 옴보스 전체맵 낮밤 픽셀 일치와 이동
  - `verify-cozy-ui.cjs`: 포근한 테마 UI
  - `verify-ui-themes.cjs`: 테마 다섯 개
  - 이 스크립트들은 `/usr/bin/chromium` 경로를 쓴다. 환경이 다르면 그 경로만 빼고 돌린다.
- `verify-browser.cjs`는 main에서도 원래 두 곳이 실패한다. 하나는 부엌 말 걸기 좌표(30,18 → 지금 28,18), 다른 하나는 두아트 문 조건이다. 알려진 문제다.
- 실제 SillyTavern에서 확인할 때는 확장 폴더에 현재 체크아웃을 복사한다. 폰 크기는 412×900으로 본다.

## 게임 지금 상태 — 0.9.21

| 영역 | 내용 | 자세한 기록 |
|---|---|---|
| 옴보스 전체맵 | 낮 `ombos-upgrade-v1-day.png`, 밤 `ombos-upgrade-v1-night.png`(`docs/art/map-expansion/`), 둘 다 `data/scene-art.json` fullMap. 신전 문으로 걸어 들어가면 안채 | [OMBOS-097.md](OMBOS-097.md) |
| 안채 15장면 | `tools/maps/residence.py`가 `data/maps/<장면>.json`과 scene-art 항목을 만든다. **데이터를 손으로 고치지 않는다.** 마당과 회랑 9장은 출구 v2 그림(`exits-v2/`). 연못 회랑은 24×14칸 | [RESIDENCE-096.md](RESIDENCE-096.md) |
| 깊은 입구 | 아치, 통로, 회랑 끝, 성소 문, 계단 통로는 안으로 걸어 들어가 깊이 절반쯤에서 넘어간다. 도착은 입구 안쪽이다. 생성기의 `open`이 벽 충돌에서 입구 바닥을 잘라 낸다 | RESIDENCE-096 0.9.20·0.9.21 절 |
| 가림 | 생성기 `front`가 scene-art `occluders`가 된다. 문틀, 기둥, 우물이 소망 위에 다시 그려진다 | 같은 곳 |
| 출구 표지 | 출구 근처 2.2칸 안에서만 뜬다. 소망과 겹치면 발밑으로 내려간다 | 같은 곳 |
| 셋소호 스프라이트 | 이전 승인 48장(`docs/art/chibi-refresh/approved/`)을 `tools/art/pack-trio-motion.py`로 패킹한다. 결과는 `data/art/characters/trio-motion.png`(256px)와 `-small.png`(폰용 125px), 연결은 `sprites.json`의 `looks.*.motion`. 표시 높이 31.2 논리 px, 걷기 0-1-2-1 180ms | [TRIO-MOTION-098.md](TRIO-MOTION-098.md) |
| 인물 그림 | 파티와 소망 카드의 전신은 정지 스프라이트 `data/art/portraits/*-idle-full.png`. `인물 보기`는 세트·호루스 일러스트 세 장씩. 대화 카드 상반신과 미소 버튼은 뺐다(다시 넣지 않는다) | TRIO-MOTION-098 |
| 성능 | 지도는 보이는 부분만 그린다. 이동은 실제 시간 기준 0.05초 단위. 지도 그림은 그 지도에 있을 때만 풀어 둔다(`lazy`) | [PERF-0917.md](PERF-0917.md) |
| 상인 | 옛 `pocket-chibi.png`(townsman) 그대로. `pack-pocket-sprites.cjs`는 돌리지 않는다 | |

## 적용 대기 — 사용자가 파일을 넘기면

| 무엇 | 아트 상태 | 게임에 넣을 때 할 일 |
|---|---|---|
| 셋소호 새 걷기 36장 `review-trio-walk-v5/` | 채택 | 새 정지 12장이 함께 와야 한다. 정지와 걷기 높이를 맞춰 `pack-trio-motion.py` 입력을 바꾸고 다시 패킹한다. 전신 보기 그림도 새 정지로 바꾼다 |
| 우물 마당 3안 2160×887 | 낮 확정, 밤 검토 중 | 22×11 → 27×11칸. `residence.py`의 우물 장면 충돌, 출구, 도착점, 가림, 표지를 다시 맞춘다 |
| 긴 회랑 5장 확장(887px, 11칸) | 다시 그리는 중 | 회랑 5장의 크기, 충돌, 깊은 입구(`OPEN_ENDS`, `FRONT_ENDS`, 각 문 좌표)를 다시 맞춘다 |

**적용할 때마다:** 출구 31곳 걷기, 깊은 입구 실제 동선, 낮밤, 폰 화면 확인을 다시 하고, 검증 스크립트 세 개를 돌린다. 기록은 해당 기록 문서에 쓰고, 이 문서의 표를 고친다.

## 이 문서 관리

새로 끝난 일은 "게임 지금 상태" 표에 반영하고, 끝난 대기 항목은 표에서 지운다. 버전별 상세는 기록 문서에 쓰고 여기에는 쌓지 않는다.
