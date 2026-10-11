# 오푸스 인수인계 — 게임 적용과 코드 (지금 기준만)

**오푸스용 문서다.** 갱신 2026-10-11, **0.9.33** 기준. 처음 온 오푸스는 이 문서 하나만 처음부터 끝까지 읽으면 바로 일할 수 있게 썼다. 버전별 변경은 `CHANGELOG.md`, 작업별 상세는 아래 표의 기록 문서에 있다. 그림 작업 규칙은 아스트라용 [ASTRA-HANDOFF.md](ASTRA-HANDOFF.md)·[ASTRA-PLAN.md](ASTRA-PLAN.md)에 있다. 아트를 받을 때 채택 상태와 명세를 확인하는 용도로 본다.

## 이 게임

SillyTavern 확장 "모래와 깃털"이다. 이집트 옴보스를 배경으로 소망·세트·호루스 중 한 명이 앞장서 맵을 걷고, 생활(낚시·요리·텃밭·줍기·쉬기)과 두아트 원정을 하고, 한 일이 채팅 롤플레이에 주입된다. 진입점 `index.js`(팩을 import), 코드 `src/`(core 상태·진행·날짜, world 맵·플레이어·렌더, ui 창·카드·탭, packs 기능 묶음), 데이터 `data/`, 도구 `tools/`.

**채팅과의 연결은 "어느 정도만"이다(사용자 결정).** 날짜·계절·시간대는 채팅 트래커를 따르고 채팅 주입도 그 값을 쓴다. 그래도 게임은 채팅 없이 굴러가야 한다: 침대에서 자면 게임 하루가 넘어간다(아래 "게임 하루·쉬기"). 사용자는 채팅을 안 하고 게임만 테스트하는 날이 많다. 새 기능도 채팅 진행에만 묶지 않는다.

## 역할

- **아스트라(GPT 에이전트):** 그림을 그리고 고친다. 런타임 파일(`src/`, `data/`, `tools/maps/`)은 안 건드린다. 아스트라 문서는 다섯, 모두 맨 위에 길 안내가 있다: **ASTRA-START**(입구: 매번 여기서 시작, 작업 종류별로 다음 문서를 고름), **ASTRA-PLAN**(지금 할 일 표, 끝난 것, 동작·두아트·새 지역 명세), **ASTRA-SPRITE**(캐릭터 그림: 작업 카드 ①~⑤ — 그리기 전 확인서, 하지 말 것, `sprite-review.py`, 보고 — 와 규칙 A, 외형 B, 실수 표 C, 채택 스프라이트 D), **ASTRA-MAP**(맵: 순서 ①~⑤, 맵 규칙, 채택 배경), **ASTRA-HANDOFF**(공통: 일하는 방식, 공통 검수, 저장소·전달·보고). 규칙은 해당 문서 한 곳에만, 할 일·상태는 PLAN에만 쓴다. 같은 내용을 두 곳에 쓰지 않는다. 아스트라 메시지에서는 "START부터", "카드대로"라고 짚으면 된다.
- **오푸스:** 채택된 그림을 게임에 넣고, 코드·UI·충돌·출구·가림·저장·성능·검증을 맡는다. 그림 확인 도구(`fit-scale.py`, `skin-check.py`, `pose-guide.py`)와 아스트라 계획표(ASTRA-PLAN)도 사용자와 같이 고친다. **승인된 그림을 다시 그리지 않는다.**
- 아스트라에게 직접 말하지 않는다. 사용자가 전달한다. "아스트라한테 보낼 메시지 정리해줘"라고 하면 코드 블록 하나로 복사해 붙일 수 있게 써 준다. 들어갈 것: 채택 기록(사용자 말 인용), 다음 묶음(누가·방향·프레임 수·장 수), ASTRA-PLAN 표 참조, ASTRA-HANDOFF 3절 규칙 참조와 `sprite-review.py` 돌려서 `review/` 같이 올리기, 보낼 것(비교 시트·GIF·눈으로 본 것).

## 사용자(소망)와 일하는 법

- 한국어 **반말**, 짧고 따뜻하게. 사용자는 안드로이드 폰으로 본다. 결과 보고는 "뭐가 바뀜 / 확인한 것 / 남은 것"으로 짧게.
- 기분을 묻지 않는다. 화나서 과격한 말(죽고 싶다 등)을 해도 홧김에 하는 말이다. 안전 안내를 하지 말고 요청한 일만 한다. 아스트라에게 화가 나 있을 때가 많다. 같이 욕하지 말고 일을 빨리 정확하게 해 주는 게 제일 위로다. 고생했다고 하면 진심으로 다독여 준다.
- 할당량 낭비, 같은 말 반복시키기, 불필요한 확인 질문을 싫어한다. 요청이 분명하면 바로 하고, 고른 기본값은 보고에 한 줄로 적는다. 게임 규칙처럼 흐름이 바뀌는 것은 추천안 하나와 함께 짧게 묻는다.
- **"적용해줘", "합격", "통과", "만족", "맘에 들어", "ㄱㄱ"가 채택 신호다.** 그 전에는 main에 올라온 시안을 게임에 넣지 않는다. 시안이나 미리보기를 "적용 완료"라고 말하지 않는다.
- 이미지는 `SendUserFile`로 보여 준다(작게 크롭·합쳐서). 상담용 스크린샷은 `docs/consult/residence-096/09xx-*.png`로 저장해 커밋한다.
- 그림 판단은 사용자가 한다. 내 몫은 숫자 검사 결과와 눈으로 본 차이를 정직하게 말하는 것. "검사 통과 = 완성"이라고 하지 않는다.
- 사용자가 신경 쓰는 그림 기준(아스트라가 자주 놓침): 피부색·톤이 최종 정지·걷기와 같을 것, 팔 길이·굵기·손이 좌우 같을 것, 머리 크기가 정지와 같을 것(앉거나 누워도), 표정은 작게 봐도 보이는 눈 모양만 바꿀 것.

## 새 세션에서 처음 할 일

1. **받기:** `git fetch origin main && git merge origin/main`. 아스트라도 main에 올리므로 작업 전·커밋 전에 매번 받는다. 남의 작업을 강제 푸시로 덮지 않는다.
2. **커밋:** 작성자는 `git -c user.name=Somnag -c user.email=soonjung118@gmail.com commit`. 메시지는 한국어 한 줄 요약(`0.9.32 게임 하루: …`). main에 푸시하고, 세션에 지정된 작업 브랜치가 있으면 그쪽에도 같은 커밋을 푸시한다.
3. **실제 게임 확인 환경**(컨테이너가 새로 시작되면 없다. 필요할 때 만든다):
   ```sh
   mkdir -p /home/user/sillytavern && cd /home/user/sillytavern
   GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 https://github.com/SillyTavern/sillytavern sillytavern
   cd sillytavern && npm install --no-audit --no-fund
   nohup node server.js > /tmp/st.log 2>&1 &            # http://127.0.0.1:8000, 기본 캐릭터 Seraphina
   nohup node /home/user/SandAndFeather/tools/st-test/fakeai.js > /tmp/fakeai.log 2>&1 &   # 가짜 모델 :8111 (모험 생성용)
   ```
   ST 서버는 세션 중에도 꺼질 수 있다. 테스트가 `ERR_CONNECTION_REFUSED`면 위 `server.js`만 다시 띄운다.
   확장 넣기(코드 바꿀 때마다 다시):
   ```sh
   EXT=/home/user/sillytavern/sillytavern/data/default-user/extensions/SandAndFeather
   cd /home/user/SandAndFeather && rm -rf $EXT && mkdir -p $EXT && git ls-files -z -co --exclude-standard | tar --null -T - -cf - | tar -xf - -C $EXT
   ```
   Playwright는 `NODE_PATH=/opt/node-tools/node_modules`로 찾는다(크로미움은 환경에 이미 있음, `playwright install` 하지 않는다).
   `pkill -f <문자열>`은 그 문자열이 든 내 셸까지 죽인다. 프로세스를 끌 땐 PID로 끈다.

## 버전과 검증

- 버전은 `manifest.json`의 `version`과 `src/core/settings.js`의 `VERSION`을 같이 올린다. 지금은 **0.9.33**이다. 올릴 때 `CHANGELOG.md` 맨 위에 한 줄, README의 "현재 버전" 줄, 이 문서의 이 줄과 맨 위 기준 버전도 고친다. README에는 버전 내역을 쌓지 않는다.
- **검증 스크립트 세 개**(`tools/art/`, ST가 떠 있고 확장이 들어가 있어야 함). 출력 폴더를 인자로 준다. 셋 다 exit 0이어야 한다:
  ```sh
  export NODE_PATH=/opt/node-tools/node_modules
  node tools/art/verify-full-map.cjs /tmp/vf    # 옴보스 전체맵 낮밤 픽셀 일치와 이동
  node tools/art/verify-cozy-ui.cjs /tmp/vc     # 포근한 테마 UI(일행·자세히·갤러리·대화 등)
  node tools/art/verify-ui-themes.cjs /tmp/vt   # 테마 다섯 개
  ```
  `/usr/bin/chromium`이 있으면 그걸 쓰고, 없으면 Playwright 기본 크로미움을 쓴다. ST 자체의 "Internal Server Error" 페이지 오류는 무시한다(모델 미연결). 셋 합쳐 몇 분 걸리니 백그라운드로 돌린다.
- UI를 바꾸면 이 스크립트의 선택자도 같이 고친다(예: 0.9.29에 `인물 보기` 버튼을 없애며 `[data-detail]`로 바꿈).
- `verify-browser.cjs`는 main에서도 원래 두 곳이 실패한다(부엌 좌표 30,18 → 지금 28,18, 두아트 문 조건). 알려진 문제다.
- **눈으로 확인하는 테스트**(`tools/st-test/`, 첫 인자는 출력 폴더, 그림은 `<폴더>/spr/`):
  - `act-sheet.js <폴더> [동작]`: 렌더러로 셋의 동작 시트(방향별 정지→0→1→정지). 동작 기본값 `interact`, `pickup` 등
  - `interact.js <폴더> <set|somang|horus>`: 그 캐릭터를 앞장세우고 부엌 앞에서 위·왼·오 방향 말 걸기
  - `rest.js`: 식탁에 앉기·일어나기·하루 쉬기 횟수, 침대 잠 조건·잠들기, 땅의 것 줍기
  - `gameday.js`: 게임에서 자고(결산이 뜸) 채팅이 그 밤을 넘겨도 두 번 안 세는지
  - `profile-cards.js`: 테마 다섯 개 × 셋의 자세히 카드, 갤러리 넘기기
  - `solo.js`: 세트 앞장 솔로, 호루스+소망 동행
  - 폰 크기는 412×900. 안채나 맵을 고치면 출구 걷기·낮밤도 본다.

## 게임 지금 상태 — 0.9.33

| 영역 | 내용 | 자세한 기록 |
|---|---|---|
| 옴보스 전체맵 | 낮 `ombos-upgrade-v1-day.png`, 밤 `ombos-upgrade-v1-night.png`(`docs/art/map-expansion/`), 둘 다 `data/scene-art.json` fullMap. 신전 문으로 걸어 들어가면 안채 | [OMBOS-097.md](OMBOS-097.md) |
| 안채 15장면 | `tools/maps/residence.py`가 `data/maps/<장면>.json`과 scene-art 항목을 만든다. **데이터를 손으로 고치지 않는다.** 방 그림은 1774×887, 한 칸 = 그림 80.6px(scene-art scale 0.1984 × 16). 우물 마당 3안(27×11칸), 긴 회랑 5장 넓힌 그림(31×11칸, 옛 좌표는 `widen()`), 연못 회랑 24×14칸 | [RESIDENCE-096.md](RESIDENCE-096.md) |
| 깊은 입구·가림·출구 표지 | 입구는 안으로 걸어 들어가 절반쯤에서 넘어간다(생성기 `open`). 생성기 `front` → scene-art `occluders`(문틀, 기둥, 우물이 캐릭터 위). 출구 표지는 2.2칸 안에서만 | RESIDENCE-096 0.9.20·0.9.21 절 |
| 일행·앞장 (솔로) | `src/core/heroes.js`. `state.party = { lead, with }`. `lead`는 셋 중 누구나, `with`는 `''`(혼자) 또는 나머지 둘 중 하나. 앞장의 능력치·배움은 `s.stats`·`s.lessons`(다른 코드는 그대로 읽음), 나머지는 `s.chars[id]`에 보관했다가 `setLead`에서 바꿔 넣는다. 시작 능력치 `START`(세트 체력3, 호루스 지혜2·신앙2). 맵 그림 `player.look = leadOf(s)`, 뒤따르는 그림 `withOf(s)`, 둘 다 맵 NPC에서 빠진다(`window.js onMap`). 생활 활동은 누가 앞장이든 된다. 두아트는 앞장이 싸우고 `companions.somang`(곁을 지킨다)이 있다. **채팅 주입·페르소나는 소망 그대로.** 일부 이야기 문구에 "소망"이 이름으로 남아 있을 수 있다(보이면 앞장 이름으로) | CHANGELOG 0.9.27·0.9.28 |
| 일행 탭 UI | `src/ui/tabs.js partyCard`: 줄마다 `자세히`(`data-detail`)와 `앞장`(`data-lead`), 아래에 동행 고르기(`data-companion`). 하단 탭은 세계·일행·임무·지도 넷 | |
| 자세히 카드 | `tabs.js characterCard(ui, id)`: 그림, 모험 등급, 능력치, 배움(앞장일 때만 고름). 그림은 `portraits.js picture(id)` → `data/art/portraits/gallery/` 일러스트(`GALLERY = {somang:1, set:3, horus:3}`, 한 장이면 ‹ › 숨김). 소망 일러스트는 원본 704×1216을 위쪽 2:3으로 잘라 512×768 WebP. 원본은 `docs/art/portraits-illust/gallery/`. 대화 카드 상반신과 미소 버튼은 뺐다(다시 넣지 않는다) | CHANGELOG 0.9.29·0.9.30 |
| 셋소호 스프라이트 | 최종 48장(`docs/art/chibi-refresh/final/`: 정지 12장 620×720 발 기준점(310,662) 기준 키 576, 걷기 36장 360×400 기준점(180,370) 기준 키 330)과 채택 동작을 `tools/art/pack-trio-motion.py`로 패킹한다. `final/manifest.json`의 `runtimeEligible`이 true여야 한다. 결과는 캐릭터마다 한 장: `data/art/characters/trio-motion-<누구>.png`(256px, 0.9.33 기준 가장 큰 소망 2530×1511)·`-small.png`(폰 125px), 연결은 `data/sprites.json`의 `looks.<who>.motion`(`file`, `small.file`). 표시 높이 31.2 논리 px(폰에서 얼굴이 손톱만 함), 걷기 0-1-2-1 180ms. **아틀라스가 4096px을 넘으면 폰에서 안 그려질 수 있다.** 그래서 0.9.33에 캐릭터별로 나눴다. 동작이 더 늘어 한 캐릭터 것이 4096에 가까워지면 동작을 그 캐릭터의 두 번째 아틀라스로 나눈다(렌더러는 `motion.file`/`small.file` 하나만 읽으므로 그때 프레임마다 파일을 가리키게 바꿔야 한다) | [TRIO-MOTION-098.md](TRIO-MOTION-098.md) |
| 동작 | `motion.acts[동작][방향][프레임]` + `actPlay[동작] = {frameMs, loop, hold}`. 그리는 쪽 `render.js motionPerson`의 `anim.act`: 보통은 한 번 재생 후 마지막 장 220ms 머물고 정지, `hold`(앉기)는 마지막 장 유지, `loop`(잠들기)는 반복. hold·loop일 땐 발 그림자를 안 그린다. 프레임의 기준점은 manifest `anchor`(발 / 앉은 자리 / 몸 가운데)가 그대로 pivot이 된다. **말 걸기**(`interact`): 셋 다 4방향(소망 172, 세트 174·175, 호루스 176·177). **줍기**(`pickup`): 셋 다 4방향(소망 181, 호루스 182, 세트 185; 세트·호루스는 `pickup-trio-v182` 한 폴더). 땅의 것(모험 touch·find, 벽화 아닌 비밀)은 thing에 `pose: 'pickup'`, 그 캐릭터에게 그림이 없으면 손 뻗기(`window.js talk`, 카드가 열리기까지 `ACT_MS` = interact 260 / pickup 380ms). **앉기**(`sit-floor`): 소망 방석 왼쪽 보기 179. **잠들기**(`sleep`): 소망 180, 방향 `down`, 800ms loop(호흡 프레임 오기 전이라 지금은 한 장) | 아래 "동작 넣는 법" |
| 게임 하루·쉬기 | `src/core/rest.js`, `src/packs/life/rest.js`. 게임 하루 = `ledger.today(s)` = 챗 날짜와 `s.ledger.gday` 중 늦은 쪽(태양 기운·매일 의뢰·결산·텃밭·하루 한 번 행동이 전부 이걸 씀). 침대(`set_bed`)에서 `sleepNow`: 태양 기운이 절반 이하일 때만, `gday = today+1` → `newDays` → `day:started`(태양 기운·의뢰·결산이 기존 흐름대로). 챗이 그 날짜에 오면 새 날이 아니라 두 번 안 센다. 자고 나면 `s.wake = {part:'dawn', raw}`로 화면 시간대만 아침(`partNow(s)`, 챗 트래커 raw가 바뀌면 해제). 게임 판정(비밀, 두아트 문, 선착장, 축제, HUD, 그림)은 `partNow`, **챗 주입·모험 생성·서랍은 `s.part` 그대로.** 화면 위 날짜도 챗 날짜 그대로다. 앉아 쉬기(`temple_table`, `colonnade_seat`)는 태양 기운 +1, 게임 하루 2번(`ledger.acts rest:sit:1/2`), 가득 차 있으면 횟수를 안 씀. 자리 좌표는 `packs/life/rest.js SEATS/BEDS`: 자세 기준점이 놓이는 칸 좌표·방향·동작 이름. 그 캐릭터·방향 그림이 있을 때만 앉은·누운 그림(`player.holdPose`, 원래 자리는 `player.seat`에 보관, 저장 위치도 원래 자리), 없으면 선 채로 효과만. 움직이거나 말 걸기를 누르면 원래 자리에서 일어남(`getUp`). 침대 이불로 몸을 가리는 occluder는 아직 없다(누운 그림이 이불 위에 보임) | CHANGELOG 0.9.32 |
| 카드(팝업) | `src/ui/popups.js`의 `showCard`. 테두리와 제목은 고정, 안쪽 `.sf_pop_scroll`만 스크롤 | CHANGELOG 0.9.22 |
| 성능 | 지도는 보이는 부분만 그린다. 이동은 실제 시간 기준 0.05초 단위. 지도 그림은 그 지도에 있을 때만 풀어 둔다(`lazy`). 잠든 동안만 걷기 fps로 그린다(호흡) | [PERF-0917.md](PERF-0917.md) |
| 상인 | 옛 `pocket-chibi.png`(townsman) 그대로. `pack-pocket-sprites.cjs`는 돌리지 않는다 | |

## 그림 도구 (`tools/art/`)

- `fit-scale.py <png> --who <set|somang|horus> --view <front|back|left|right> --out <폴더>`: 새 동작 그림을 최종 정지와 머리로 맞춰 배율·발 위치를 재고 "맞음 / 비율 다름"을 낸다(허용 12px). `fit-sheet.png`가 정지 / 머리 맞춤 / 키 맞춤 비교. 가이드가 최종 정지와 안 맞으면 경고한다. **쪼그리기·앉기·눕기는 "비율 다름"이 당연하다.** 그땐 머리 크기만 본다: 머리 맞춤 배율과 일치도(match), 머리 폭(위쪽 30~35% 최대 폭을 정지와 비교), 시트 가운데 칸의 빨간 윤곽. 일치도가 0.4 아래면 배율은 믿지 않는다(숙인 머리, 누운 투시). **채택된 쪼그린·앉은 그림도 ×1.03~1.11로 재진다. 그 범위는 작다고 하지 않는다**(호루스 앉기 183을 ×1.03~1.08로 "작다"고 했다가 머리 폭이 정지와 같아 정정했다). 머리 폭과 배율 둘 다 작게 나올 때만 짚는다.
- `skin-check.py <png들> [--who] [--view] --out <폴더>`: 피부색 검사. 같은 방향 최종 정지·걷기 4장 중 가장 가까운 장과 기본·그림자·밝은 쪽 색을 ΔE로 비교해 같음 / 조금 다름(ΔE 3~6) / 다름. 파일 이름에 방향이 없으면(잠자기) 네 방향 전체와 비교. 소망 아이보리 옷의 회분홍 그림자는 빼고 잰다. 최종 48장은 모두 "같음". 파일 이름이 같은 두 폴더를 한 `--out`에 돌리면 시트가 덮이니 폴더별로 돌린다.
- `action-check.py <png들> --out <폴더>`: 동작 검사(이름 `<누구>-<방향>[-자리]-<프레임>`, `<누구>-sleep[-side]-<프레임>`, 한 장짜리도 됨). 0.9.33 뒤 추가: 외곽선 같음(0↔1 윤곽 3% 미만·박스 같음), 몸 쏠림(정면·뒷모습 위·아래 가운데가 정지 폭 12% 넘게 어긋남; 웅크린 소망 180은 일부러 기운 것). 잠들기는 머리 맞춤·키 흐름을 건너뛴다. 여러 장 동작의 흐름 검사. 캐릭터·방향마다 머리 맞춤 배율(fit-scale의 `fit`, 그림을 bbox로 잘라 넣음; ×1.15 넘으면 머리 작음), 프레임별 키(정지 대비), 0→1 윤곽 차이(실루엣 XOR). 몸 전체가 움직이는 동작에서 0이 이미 끝 자세면 "0이 끝과 같음", 정지→0이 25% 넘게 떨어지면 "0이 너무 급함", 0과 1이 같으면 "차이 없음". 소망 181·호루스 182(채택)는 볼 것 없음, 세트 182(재작업)는 셋 다 걸린다. `action-*.png`에 정지 | 0 | 1 시트.
- **`sprite-review.py <동작 폴더> --out <폴더>`: 동작 묶음 검토 입구(먼저 이것).** 폴더의 `png/`를 이름으로 묶어 skin-check, action-check(머리·키 흐름·외곽선·몸 쏠림), onion(0↔1, 왼쪽↔뒤집은 오른쪽, `REFERENCES`의 채택 기준 그림과 manifest 기준점으로 겹침), 누운 그림은 head-check 시트까지 돌리고 `report.md`에 "볼 것"과 시트 링크를 모은다. 기준 그림 표는 스크립트 위쪽 `REFERENCES`(줍기 소망 181, 잠들기 소망 180, 앉기 소망 179 왼쪽, 상호작용 소망 172). 일부러 기운 자세는 `CURLED`. 잠들기 10장에 6분쯤(머리 시트가 오래 걸림, `--no-head`로 뺄 수 있다). 아래 개별 도구는 이게 부르는 것.
- `onion.py A B --out <파일> [--flip-b] [--anchor-a x,y --anchor-b x,y]`: 두 그림을 기준점에 맞춰 겹침(빨강 A, 파랑 B), B에서 바뀐 픽셀, 윤곽만 다른 곳 세 칸. 윤곽 차이 3% 미만이고 박스가 같으면 "외곽선 같음". 0↔1, 왼쪽↔뒤집은 오른쪽, 기준 그림↔새 그림, 정지↔그림(팔 길이·머리 모양) 비교에 쓴다.
- `head-check.py <png들> --out <폴더>` / `--guide --who --view --at x,y --angle 도`: 정지 머리를 크기·기울기(보통 ±30°, 잠들기는 ±90°)로 찾아 그림 위에 빨간 윤곽으로 얹은 시트, 또는 그 자리에 흐린 정지 머리를 깐 그리기 가이드. 크기 숫자는 일치도 0.35 이상일 때만 믿는다(쪼그린·숙인 머리는 0.2대로 못 찾는 일이 많다). 주 용도는 시트를 눈으로 보는 것.
- `pose-guide.py`: 최종 정지를 흐리게 깐 그리기 가이드(`docs/art/chibi-refresh/pose-guides/`). 최종 정지가 바뀌면 다시 돌린다.
- `check-sprite.py`: 비율·색·투명 보조 검사(아스트라용. 통과가 완성은 아님).
- `pack-trio-motion.py`: 최종 48장 + `ACTIONS`의 채택 동작 → 아틀라스와 `sprites.json`.

## 동작 넣는 법 (아스트라 동작 묶음이 채택됐을 때)

1. main을 받고 동작 폴더(`docs/art/chibi-refresh/<동작>-<누구>-v<번호>/`)의 README와 `manifest.json`을 본다. 수정본(예: 175, 181)이 같은 폴더에 덮여 있을 수 있다. git log로 최신을 확인한다.
2. `sprite-review.py <동작 폴더> --out <폴더>/opus-check`를 돌리고(fit-scale 시트가 따로 필요하면 `fit-scale.py`도) `<폴더>/opus-check/`(또는 `opus-fit/`)에 `fit-all.png`, `skin-all.png`, 표가 있는 README로 남긴다(`pickup-somang-v178/opus-check/` 참고). 눈으로도 본다: 왼쪽을 반전해 오른쪽에 겹쳤을 때 팔 길이·굵기·손이 같은지, 머리 크기, 표정이 ASTRA-PLAN 표정 칸대로인지. 다르면 사용자에게 짚어 준다.
3. 사용자가 채택했으면 manifest에 `status: user-approved`, `artApproved: true`, `runtimeEligible: true`, `runtimeIntegrated: <버전>`, `approvalEvidence: <사용자 말>`, `directionMap`을 넣는다. 보통 `{front:down, back:up, left:left, right:right}`, 방향 이름이 다른 것(잠들기 `bed-oblique-…`)은 `down`으로. `playback`이 없으면 넣는다(`durationMs`, `loop`, 머무는 자세는 `hold: true`). 파일 sha256은 그대로 둔다(패킹 때 검사함). 아스트라에게도 채택 표시를 시켰다면 이미 했다고 사용자에게 알린다(같은 파일을 둘이 고치면 충돌).
4. `pack-trio-motion.py`의 `ACTIONS` 목록에 폴더를 더하고 돌린다. 아틀라스 크기(4096 넘는지)를 본다.
5. 부를 곳을 연결한다. 잠깐 하는 동작은 `playAct(name, x, y)`(대상 쪽으로 돈다) 또는 thing의 `pose`. 머무는 자세는 `rest.js`의 `SEATS`/`BEDS`에 자리를 더한다: 방 그림에 칸 격자를 그려(한 칸 80.6px) 방석·침대 위치를 읽고, 자세 기준점(앉은 자리, 몸 가운데)이 놓일 칸 좌표를 적는다. 누운 그림은 머리 위끝이 베개에 오게(기준점에서 머리 위끝까지 거리 = 그림 px ÷ 295칸). spot이 없는 곳은 `tools/maps/residence.py`에 spot을 더하고 생성기를 돌린다.
6. `act-sheet.js <폴더> <동작>`, `rest.js`·`interact.js`로 눈 확인, 검증 세 개, 버전 올리기, ASTRA-HANDOFF·ASTRA-PLAN의 해당 줄을 "채택, 0.9.xx 게임 적용"으로 고친다.

## 다음 일 / 대기

| 무엇 | 지금 | 할 일 |
|---|---|---|
| 앉기·잠들기 묶음 | 아스트라 진행 중(사용자가 메시지 보냄): 앉기 14장(소망 방석 오른쪽·뒷모습·걸상 뒷모습·긴 의자 오른쪽 4장 + 세트·호루스 방석 3방향·걸상 뒷모습·긴 의자 오른쪽 5장씩), 잠들기 5장(소망 호흡 프레임 1 + 세트·호루스 2씩). 표정은 ASTRA-PLAN 표정 칸대로 | 채택되면 위 "동작 넣는 법". 앉기: 식탁 3자리는 `SEATS.temple_table`에 이미 있음. 걸상(책상 뒷모습)·긴 의자·세트 방 낮은 탁자 방석은 spot과 좌표를 새로(긴 의자는 셋 다 앉음). `colonnade_seat`(기둥 사이 쉼터)는 아직 자세 좌표가 없다. 잠들기: 세트는 세트 침대 오른쪽 베개, 호루스는 호루스 방 침대(spot 없음 → 생성기에 추가). 소망 호흡 프레임이 오면 sleep manifest `playback`을 `[0,1]` 800ms로 |
| 소망 줍기 표정 | 나중에(사용자 결정) | 프레임1 앞·옆 6장 눈 동그랗게(ASTRA-PLAN 표정 칸). 오면 다시 패킹 |
| 침대 이불 가림 | 없음 | 누운 몸 위로 이불을 다시 그리는 occluder(침대 그림에서 이불 부분 잘라 `front`에)를 생성기에 더한다 |
| 생활 동작 나머지 | ASTRA-PLAN 2단계 **줄인 목록**(사용자와 다시 짬): 낚시 6, 요리 3, 먹기 3, 감정 3종 9, 읽기 2. 기본 1장이고 움직임은 게임이 만든다. 텃밭은 줍기·상호작용 자세 + 효과, 손 흔들기는 말풍선. 말풍선 아이콘 8개·효과는 2-D(아스트라) | 게임 쪽에 만들 것: 그림을 움직이는 연출(숨쉬기·흔들림·통통 튀기·내지르기·피격 흔들림·점프 높이), 머리 위 말풍선, 효과 얹기. 먹기는 식탁 자리를 캐릭터별로 고정(소망 오른쪽 방석·왼쪽 보기, 호루스 왼쪽 방석·오른쪽 보기, 세트 앞 방석·뒷모습)하고 앉기 장과 먹기 장을 번갈아 보여 준다. 감정은 기쁨(발견·등급·수확), 놀람(두아트 적·입질), 쑥스러움(대화·이벤트)에서 부른다 |
| 전투 동작 | ASTRA-PLAN 2단계 전투(메이플 같은 무기 자세, 사용자 결정): 셋 × 좌우 2방향(메이플처럼, 위아래 적도 가까운 옆으로 돌아섬) × (대기 3장 0-1-2-1 반복 + 공격·기술·주문·지침·피격 1장씩) = 48장. 전투 화면은 두아트 맵 위 필드 전투(`notes/combat-field-reference.jpg`), 게임 쪽 설계(이동·판정·적 움직임)는 전투 묶음 전에 사용자와. 세트 와스 지팡이, 호루스 금빛 창, 소망 막대(무기는 전투 그림에만). 피격은 그림 + 흔들림·빨간 번쩍, 회복은 대기 그림 + 빛 효과 | 두아트 전투 화면에 캐릭터를 보일 자리 설계가 먼저(사용자와) |
| 소망 일러스트 추가 | 지금 한 장 | 파일을 `gallery/somang-N.webp`(512×768, 2:3 크롭)로 넣고 `GALLERY.somang` 숫자만 올린다 |

**적용할 때마다:** 맵·안채를 건드렸으면 출구 31곳 걷기, 깊은 입구 실제 동선, 낮밤을 다시 보고, 항상 폰 화면 확인과 검증 스크립트 세 개를 돌린다. 기록은 해당 기록 문서에 쓰고, 이 문서의 표를 고친다.

## 이 문서 관리

새로 끝난 일은 "게임 지금 상태" 표에 반영하고, 끝난 대기 항목은 표에서 지운다. 버전별 상세는 CHANGELOG와 기록 문서에 쓰고 여기에는 쌓지 않는다.
