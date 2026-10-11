# 오푸스 인수인계 — 게임 적용과 코드 (지금 기준만)

**오푸스용 문서다.** 갱신 2026-10-11. 게임의 지금 상태와 이어서 할 일만 적는다. 버전별 변경은 `CHANGELOG.md`와 작업별 기록 문서에 있다. 그림 작업 규칙은 아스트라용 [ASTRA-HANDOFF.md](ASTRA-HANDOFF.md)에 있다. 아트를 받을 때 채택 상태를 확인하는 용도로만 본다.

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
- 버전은 `manifest.json`의 `version`과 `src/core/settings.js`의 `VERSION`을 같이 올린다. 지금은 **0.9.27**이다. 올릴 때 `CHANGELOG.md` 맨 위에 한 줄을 추가하고, README의 "현재 버전" 줄도 고친다. README에는 버전 내역을 쌓지 않는다.
- 검증 스크립트는 `tools/art/`에 있다.
  - `verify-full-map.cjs`: 옴보스 전체맵 낮밤 픽셀 일치와 이동
  - `verify-cozy-ui.cjs`: 포근한 테마 UI
  - `verify-ui-themes.cjs`: 테마 다섯 개
  - 이 스크립트들은 `/usr/bin/chromium` 경로를 쓴다. 환경이 다르면 그 경로만 빼고 돌린다.
- `verify-browser.cjs`는 main에서도 원래 두 곳이 실패한다. 하나는 부엌 말 걸기 좌표(30,18 → 지금 28,18), 다른 하나는 두아트 문 조건이다. 알려진 문제다.
- 실제 SillyTavern에서 확인할 때는 확장 폴더에 현재 체크아웃을 복사한다. 폰 크기는 412×900으로 본다.

## 게임 지금 상태 — 0.9.23

| 영역 | 내용 | 자세한 기록 |
|---|---|---|
| 옴보스 전체맵 | 낮 `ombos-upgrade-v1-day.png`, 밤 `ombos-upgrade-v1-night.png`(`docs/art/map-expansion/`), 둘 다 `data/scene-art.json` fullMap. 신전 문으로 걸어 들어가면 안채 | [OMBOS-097.md](OMBOS-097.md) |
| 안채 15장면 | `tools/maps/residence.py`가 `data/maps/<장면>.json`과 scene-art 항목을 만든다. **데이터를 손으로 고치지 않는다.** 우물 마당은 3안(`well-option3-night-v1/`, 27×11칸, 새로 깐 충돌). 긴 회랑 5장은 넓힌 그림(`corridors-remaining-v1/`, `corridor-expand-v4/`, 31×11칸): 옛 27×9 좌표를 `widen()`이 옮기고 양끝 통로는 `WIDE_END_*`. 연못 회랑은 24×14칸 | [RESIDENCE-096.md](RESIDENCE-096.md) |
| 깊은 입구 | 아치, 통로, 회랑 끝, 성소 문, 계단 통로는 안으로 걸어 들어가 깊이 절반쯤에서 넘어간다. 도착은 입구 안쪽이다. 생성기의 `open`이 벽 충돌에서 입구 바닥을 잘라 낸다 | RESIDENCE-096 0.9.20·0.9.21 절 |
| 가림 | 생성기 `front`가 scene-art `occluders`가 된다. 문틀, 기둥, 우물이 소망 위에 다시 그려진다 | 같은 곳 |
| 출구 표지 | 출구 근처 2.2칸 안에서만 뜬다. 소망과 겹치면 발밑으로 내려간다 | 같은 곳 |
| 일행·앞장 | `state.party = { with, lead }`. `lead`는 `'somang'` 또는 `with`와 같을 때만 그 동행(`tabs.js leadOf`). 맵에서 움직이는 사람은 `player.look = leadOf(s)`, 뒤따르는 사람은 나머지(`window.js draw`). 소망 담당 장소(`window.js HERS`: dock, kitchen, garden, scriptorium, training)는 소망이 앞장이 아니면 넘김 카드. 채팅 주입은 바뀌지 않았다(사용자는 늘 소망). 상호작용 동작은 소망만 있어 세트·호루스가 앞장이면 정지 그림으로 말을 건다 | |
| 셋소호 스프라이트 | 최종 48장(`docs/art/chibi-refresh/final/`, 일행·소망 카드 전신 `data/art/portraits/*-idle-full.png`도 같은 정면 정지에서 잘라 씀: 정지 12장 620×720 기준 키 576, 걷기 36장 360×400 기준 키 330)을 `tools/art/pack-trio-motion.py`로 패킹한다. `final/manifest.json`의 `runtimeEligible`이 true여야 패킹된다(0.9.24에 검토 후 켬). 0.9.25에 호루스 173 비율 수정본으로 다시 패킹했다. 최종 정지가 바뀌면 `tools/art/pose-guide.py`도 다시 돌린다(`fit-scale.py`가 낡은 가이드를 알려 준다). 결과는 `data/art/characters/trio-motion.png`(256px)와 `-small.png`(폰용 125px), 연결은 `sprites.json`의 `looks.*.motion`. 표시 높이 31.2 논리 px, 걷기 0-1-2-1 180ms | [TRIO-MOTION-098.md](TRIO-MOTION-098.md) |
| 인물 그림 | 일행과 소망 카드의 전신은 정지 스프라이트 `data/art/portraits/*-idle-full.png`. `인물 보기`는 세트·호루스 일러스트 세 장씩. 대화 카드 상반신과 미소 버튼은 뺐다(다시 넣지 않는다) | TRIO-MOTION-098 |
| 카드(팝업) | `src/ui/popups.js`의 `showCard`. 테두리(`.sf_pop::before`)와 제목은 고정이고, 안쪽 `.sf_pop_scroll`만 스크롤된다. 카드 자체를 스크롤 상자로 되돌리면 테두리가 내용과 같이 밀려 올라간다(0.9.22에서 고침) | CHANGELOG 0.9.22 |
| 성능 | 지도는 보이는 부분만 그린다. 이동은 실제 시간 기준 0.05초 단위. 지도 그림은 그 지도에 있을 때만 풀어 둔다(`lazy`) | [PERF-0917.md](PERF-0917.md) |
| 상인 | 옛 `pocket-chibi.png`(townsman) 그대로. `pack-pocket-sprites.cjs`는 돌리지 않는다 | |

## 적용 대기 — 사용자가 파일을 넘기면

| 무엇 | 아트 상태 | 게임에 넣을 때 할 일 |
|---|---|---|
| 다음 동작(줍기, 텃밭…) | 상호작용(소망 172)은 0.9.26에 적용했다 | 채택된 동작 manifest를 `pack-trio-motion.py`의 `ACTIONS`에 더하면 `looks.<who>.motion.acts[동작][방향][프레임]`과 `actPlay`(프레임 시간)로 같은 아틀라스에 묶인다. 재생은 `player.playAct(name, x, y)`(대상 쪽으로 돌아서 한 번, 마지막 장 220ms 머문 뒤 정지), 그리는 쪽은 `render.js motionPerson`의 `anim.act`. 동작마다 어디서 부를지 정해 연결한다 |

**적용할 때마다:** 출구 31곳 걷기, 깊은 입구 실제 동선, 낮밤, 폰 화면 확인을 다시 하고, 검증 스크립트 세 개를 돌린다. 기록은 해당 기록 문서에 쓰고, 이 문서의 표를 고친다.

## 이 문서 관리

새로 끝난 일은 "게임 지금 상태" 표에 반영하고, 끝난 대기 항목은 표에서 지운다. 버전별 상세는 기록 문서에 쓰고 여기에는 쌓지 않는다.
