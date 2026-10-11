# 오푸스 인수인계 — 게임 적용과 코드 (지금 기준만)

**오푸스용 문서다.** 갱신 2026-10-11, 0.9.31 기준. 처음 온 오푸스는 이 문서 하나만 처음부터 끝까지 읽으면 바로 일할 수 있게 썼다. 버전별 변경은 `CHANGELOG.md`, 작업별 상세는 아래 표의 기록 문서에 있다. 그림 작업 규칙은 아스트라용 [ASTRA-HANDOFF.md](ASTRA-HANDOFF.md)에 있다. 아트를 받을 때 채택 상태를 확인하는 용도로만 본다.

## 이 게임

SillyTavern 확장 "모래와 깃털"이다. 이집트 옴보스를 배경으로 소망·세트·호루스가 맵을 걷고, 생활(낚시·요리·텃밭)과 두아트 원정을 하고, 그 일이 채팅 롤플레이에 주입된다. 진입점 `index.js`, 코드 `src/`(core 상태·진행, world 맵·플레이어·렌더, ui 창·카드·탭, packs 기능 묶음), 데이터 `data/`, 도구 `tools/`.

## 역할

- **아스트라(GPT 에이전트):** 그림을 그리고 고친다. 기준은 [ASTRA-HANDOFF.md](ASTRA-HANDOFF.md), [ASTRA-PLAN.md](ASTRA-PLAN.md). 런타임 파일(`src/`, `data/`, `tools/maps/`)은 안 건드린다.
- **오푸스:** 채택된 그림을 게임에 넣고, 코드·UI·충돌·출구·가림·저장·성능·검증을 맡는다. 그림 확인용 도구(`fit-scale.py`, `pose-guide.py`)와 아스트라에게 줄 계획표(ASTRA-PLAN)도 사용자와 같이 고친다. **승인된 그림을 다시 그리지 않는다.**
- 아스트라에게 직접 말하지 않는다. 사용자가 전달한다. "아스트라한테 보낼 메시지 정리해줘"라고 하면 복사해 붙일 수 있는 짧은 메시지를 써 준다.

## 사용자(소망)와 일하는 법

- 한국어 **반말**, 짧고 따뜻하게. 사용자는 안드로이드 폰으로 본다. 결과 보고는 "뭐가 바뀜 / 확인한 것 / 남은 것" 정도로 짧게.
- 기분을 묻지 않는다. 사용자가 화나서 과격한 말(죽고 싶다 등)을 해도 홧김에 하는 말이다. 안전 안내를 하지 말고 요청한 일만 한다. 아스트라에게 화가 나 있을 때가 많다. 같이 욕하지 말고, 일을 빨리 정확하게 해 주는 게 제일 위로다. 고생했다고 하면 진심으로 다독여 준다.
- 할당량 낭비, 같은 말 반복시키기, 불필요한 확인 질문을 싫어한다. 요청이 분명하면 바로 하고, 고른 기본값은 보고에 한 줄로 적는다.
- **"적용해줘", "합격", "통과", "ㄱㄱ"가 채택 신호다.** 그 전에는 main에 올라온 시안을 게임에 넣지 않는다. 시안이나 미리보기를 "적용 완료"라고 말하지 않는다.
- 이미지는 `SendUserFile`로 보여 준다(작게 크롭·합쳐서). 상담용 스크린샷은 `docs/consult/residence-096/09xx-*.png`로 저장해 커밋한다.
- 그림 판단은 사용자가 한다. 내가 할 일은 숫자 검사(fit-scale 등) 결과와 눈으로 본 차이를 정직하게 말하는 것. "검사 통과 = 완성"이라고 하지 않는다.

## 새 세션에서 처음 할 일

1. **받기:** `git fetch origin main && git merge origin/main`. 아스트라도 main에 올리므로 작업 전·커밋 전에 매번 받는다. 남의 작업을 강제 푸시로 덮지 않는다.
2. **커밋:** 지금까지 커밋 작성자는 `git -c user.name=Somnag -c user.email=soonjung118@gmail.com commit`. 메시지는 한국어 한 줄 요약(`0.9.30 세트 상호작용 174/175 적용, …`). main에 푸시하고, 세션에 지정된 작업 브랜치가 있으면 그쪽에도 같은 커밋을 푸시한다.
3. **실제 게임 확인 환경**(컨테이너가 새로 시작되면 없다. 필요할 때 만든다):
   ```sh
   mkdir -p /home/user/sillytavern && cd /home/user/sillytavern
   GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 https://github.com/SillyTavern/sillytavern sillytavern
   cd sillytavern && npm install --no-audit --no-fund
   nohup node server.js > /tmp/st.log 2>&1 &            # http://127.0.0.1:8000, 기본 캐릭터 Seraphina
   nohup node /home/user/SandAndFeather/tools/st-test/fakeai.js > /tmp/fakeai.log 2>&1 &   # 가짜 모델 :8111 (모험 생성용)
   ```
   확장 넣기(코드 바꿀 때마다 다시):
   ```sh
   EXT=/home/user/sillytavern/sillytavern/data/default-user/extensions/SandAndFeather
   cd /home/user/SandAndFeather && rm -rf $EXT && mkdir -p $EXT && git ls-files -z -co --exclude-standard | tar --null -T - -cf - | tar -xf - -C $EXT
   ```
   Playwright는 `NODE_PATH=/opt/node-tools/node_modules`로 찾는다(크로미움은 환경에 이미 있음, `playwright install` 하지 않는다).

## 버전과 검증

- 버전은 `manifest.json`의 `version`과 `src/core/settings.js`의 `VERSION`을 같이 올린다. 지금은 **0.9.31**이다. 올릴 때 `CHANGELOG.md` 맨 위에 한 줄, README의 "현재 버전" 줄, 이 문서의 이 줄도 고친다. README에는 버전 내역을 쌓지 않는다.
- **검증 스크립트 세 개**(`tools/art/`, ST가 떠 있고 확장이 들어가 있어야 함). 출력 폴더를 인자로 준다. 셋 다 exit 0이어야 한다:
  ```sh
  export NODE_PATH=/opt/node-tools/node_modules
  node tools/art/verify-full-map.cjs /tmp/vf    # 옴보스 전체맵 낮밤 픽셀 일치와 이동
  node tools/art/verify-cozy-ui.cjs /tmp/vc     # 포근한 테마 UI(일행·자세히·갤러리·대화 등)
  node tools/art/verify-ui-themes.cjs /tmp/vt   # 테마 다섯 개
  ```
  `/usr/bin/chromium`이 있으면 그걸 쓰고, 없으면 Playwright 기본 크로미움을 쓴다. ST 자체의 "Internal Server Error" 페이지 오류는 무시한다(모델 미연결).
- UI를 바꾸면 이 스크립트의 선택자도 같이 고친다(예: 0.9.29에 `인물 보기` 버튼을 없애며 `[data-detail]`로 바꿈).
- `verify-browser.cjs`는 main에서도 원래 두 곳이 실패한다(부엌 좌표 30,18 → 지금 28,18, 두아트 문 조건). 알려진 문제다.
- **눈으로 확인하는 테스트**(`tools/st-test/`, 첫 인자는 출력 폴더, 그림은 `<폴더>/spr/`):
  - `act-sheet.js`: 렌더러로 셋의 동작 시트(방향별 정지→동작0→동작1→정지)를 그린다
  - `interact.js <폴더> <set|somang|horus>`: 그 캐릭터를 앞장세우고 부엌 앞에서 위·왼·오 방향 말 걸기
  - `profile-cards.js`: 테마 다섯 개 × 셋의 자세히 카드, 갤러리 넘기기
  - `solo.js`: 세트 앞장 솔로, 호루스+소망 동행
  - 폰 크기는 412×900. 안채나 맵을 고치면 출구 걷기·낮밤도 본다.

## 게임 지금 상태 — 0.9.31

| 영역 | 내용 | 자세한 기록 |
|---|---|---|
| 옴보스 전체맵 | 낮 `ombos-upgrade-v1-day.png`, 밤 `ombos-upgrade-v1-night.png`(`docs/art/map-expansion/`), 둘 다 `data/scene-art.json` fullMap. 신전 문으로 걸어 들어가면 안채 | [OMBOS-097.md](OMBOS-097.md) |
| 안채 15장면 | `tools/maps/residence.py`가 `data/maps/<장면>.json`과 scene-art 항목을 만든다. **데이터를 손으로 고치지 않는다.** 우물 마당은 3안(`well-option3-night-v1/`, 27×11칸). 긴 회랑 5장은 넓힌 그림(31×11칸): 옛 27×9 좌표를 `widen()`이 옮기고 양끝 통로는 `WIDE_END_*`. 연못 회랑은 24×14칸 | [RESIDENCE-096.md](RESIDENCE-096.md) |
| 깊은 입구 | 아치, 통로, 회랑 끝, 성소 문, 계단 통로는 안으로 걸어 들어가 깊이 절반쯤에서 넘어간다. 생성기의 `open`이 벽 충돌에서 입구 바닥을 잘라 낸다 | RESIDENCE-096 0.9.20·0.9.21 절 |
| 가림 | 생성기 `front`가 scene-art `occluders`가 된다. 문틀, 기둥, 우물이 캐릭터 위에 다시 그려진다 | 같은 곳 |
| 출구 표지 | 출구 근처 2.2칸 안에서만 뜬다. 캐릭터와 겹치면 발밑으로 내려간다 | 같은 곳 |
| 일행·앞장 (솔로) | `src/core/heroes.js`. `state.party = { lead, with }`. `lead`는 셋 중 누구나, `with`는 `''`(혼자) 또는 나머지 둘 중 하나. 앞장선 사람의 능력치·배움은 `s.stats`·`s.lessons`(다른 코드는 그대로 읽음), 나머지는 `s.chars[id]`에 보관했다가 `setLead`에서 바꿔 넣는다. 시작 능력치 `START`(세트 체력3, 호루스 지혜2·신앙2). 맵에서 움직이는 그림 `player.look = leadOf(s)`, 뒤따르는 그림 `withOf(s)`, 둘 다 맵 NPC에서 빠진다(`window.js onMap`). 생활 활동은 누가 앞장이든 된다. 두아트는 앞장이 싸우고 `companions.somang`(곁을 지킨다)이 있다. **채팅 주입·페르소나는 소망 그대로.** 일부 이야기 문구에 "소망"이 이름으로 남아 있을 수 있다(보이면 앞장 이름으로) | CHANGELOG 0.9.27·0.9.28 |
| 일행 탭 UI | `src/ui/tabs.js partyCard`: 줄마다 `자세히`(`data-detail`)와 `앞장`(`data-lead`), 아래에 동행 고르기(`data-companion`). 하단 탭은 세계·일행·임무·지도 넷 | |
| 자세히 카드 | `tabs.js characterCard(ui, id)`: 그림, 모험 등급, 능력치, 배움(앞장일 때만 고름). 그림은 `portraits.js picture(id)` → `data/art/portraits/gallery/` 일러스트(`GALLERY = {somang:1, set:3, horus:3}`, 한 장이면 ‹ › 숨김). 소망 일러스트는 원본 704×1216을 위쪽 2:3으로 잘라 512×768 WebP. 원본은 `docs/art/portraits-illust/gallery/`. 대화 카드 상반신과 미소 버튼은 뺐다(다시 넣지 않는다) | CHANGELOG 0.9.29·0.9.30 |
| 셋소호 스프라이트 | 최종 48장(`docs/art/chibi-refresh/final/`: 정지 12장 620×720 발 기준점(310,662) 기준 키 576, 걷기 36장 360×400 기준점(180,370) 기준 키 330)을 `tools/art/pack-trio-motion.py`로 패킹한다. `final/manifest.json`의 `runtimeEligible`이 true여야 한다. 결과 `data/art/characters/trio-motion.png`(256px)·`-small.png`(폰 125px), 연결은 `data/sprites.json`의 `looks.<who>.motion`. 표시 높이 31.2 논리 px, 걷기 0-1-2-1 180ms. 호루스는 173 비율 수정본 | [TRIO-MOTION-098.md](TRIO-MOTION-098.md) |
| 동작(상호작용) | 소망 172(0.9.26), 세트 174·오른팔 175(0.9.30), 호루스 176·좌우 177(0.9.31). 셋 다 있다. 말 걸기(`window.js talk`)가 `player.playAct('interact', x, y)`로 대상 쪽으로 돌아 한 번 재생(각 150ms, 마지막 장 220ms 머묾), 260ms 뒤 카드가 열린다. 그리는 쪽은 `render.js motionPerson`의 `anim.act` | 아래 "동작 넣는 법" |
| 카드(팝업) | `src/ui/popups.js`의 `showCard`. 테두리와 제목은 고정, 안쪽 `.sf_pop_scroll`만 스크롤 | CHANGELOG 0.9.22 |
| 성능 | 지도는 보이는 부분만 그린다. 이동은 실제 시간 기준 0.05초 단위. 지도 그림은 그 지도에 있을 때만 풀어 둔다(`lazy`) | [PERF-0917.md](PERF-0917.md) |
| 상인 | 옛 `pocket-chibi.png`(townsman) 그대로. `pack-pocket-sprites.cjs`는 돌리지 않는다 | |

## 그림 도구 (`tools/art/`)

- `fit-scale.py <png> --who <set|somang|horus> --view <front|back|left|right> --out <폴더>`: 새 동작 그림을 최종 정지와 머리로 맞춰 배율·발 위치를 재고 "맞음 / 비율 다름"을 낸다(허용 12px). `fit-sheet.png`가 정지 / 머리 맞춤 / 키 맞춤 비교. 가이드가 최종 정지와 안 맞으면 경고한다.
- `pose-guide.py`: 최종 정지를 흐리게 깐 그리기 가이드(`docs/art/chibi-refresh/pose-guides/`). 최종 정지가 바뀌면 다시 돌린다.
- `skin-check.py <png들> [--who] [--view] --out <폴더>`: 피부색 검사. 같은 방향 최종 정지·걷기 4장 중 가장 가까운 장과 기본·그림자·밝은 쪽 색을 ΔE로 비교해 같음 / 조금 다름(ΔE 3~6) / 다름. 파일 이름에 방향이 없으면(잠자기) 네 방향 전체와 비교. 최종 48장은 모두 "같음"이 나온다. 앉기·눕기처럼 자세가 크게 다르면 fit-scale의 "비율 다름"은 당연하고 머리 크기(머리 맞춤 배율·일치도, 머리카락 폭)만 본다.
- `check-sprite.py`: 비율·색·투명 보조 검사(아스트라용. 통과가 완성은 아님).
- `pack-trio-motion.py`: 최종 48장 + 채택 동작 → 아틀라스와 `sprites.json`.

## 동작 넣는 법 (아스트라 동작 묶음이 채택됐을 때)

1. main을 받고 동작 폴더(`docs/art/chibi-refresh/<동작>-<누구>-v<번호>/`)의 README와 `manifest.json`을 본다. 수정본(예: 175)이 같은 폴더에 덮여 있을 수 있다. git log로 최신을 확인한다.
2. 8장(4방향×프레임) 모두 `fit-scale.py`를 돌린다. 결과 시트를 `<폴더>/opus-fit/fit-all.png`와 표가 있는 README로 남긴다(`interaction-horus-v176/opus-fit/` 참고). 같이 눈으로 본다: 피부색·톤이 같은 방향 최종 정지·걷기와 같은지(얼굴·팔·다리 확대), 왼쪽을 반전해 오른쪽에 겹쳤을 때 팔 길이·굵기·손이 같은지. 다르면 사용자에게 짚어 준다(아스트라 규칙: ASTRA-PLAN 2단계 공통 규칙).
3. 사용자가 채택했으면 manifest에 `status: user-approved`, `artApproved: true`, `runtimeEligible: true`, `runtimeIntegrated: <버전>`, `approvalEvidence: <사용자 말>`, `directionMap: {front:down, back:up, left:left, right:right}`를 넣는다(파일 sha256은 그대로 둔다, 패킹 때 검사함).
4. `pack-trio-motion.py`의 `ACTIONS` 목록에 폴더를 더하고 돌린다 → `looks.<who>.motion.acts[동작][방향][프레임]`, `actPlay`.
5. 새 동작 이름이면 어디서 부를지 연결한다(`playAct(name, x, y)`).
6. `act-sheet.js`, `interact.js`로 눈 확인, 검증 세 개, 버전 올리기, ASTRA-HANDOFF·ASTRA-PLAN의 해당 줄을 "채택, 0.9.xx 게임 적용"으로 고친다.

## 다음 일 / 대기

| 무엇 | 지금 | 할 일 |
|---|---|---|
| 생활 동작(줍기·잠자기·앉기·낚시·요리…) | ASTRA-PLAN 2단계에 동작별 명세. 0.9.28부터 생활 동작은 **셋 다** 그린다 | 채택되면 넣고, 동작마다 부를 곳(낚시터, 부엌, 침대 등)을 연결 |
| 전투 동작 7종 | ASTRA-PLAN 2단계(대기·기본 공격·고유 기술·주문·피격·회복·지침, 한 방향) | 두아트 전투 화면에 붙일 자리 설계가 필요 |
| 소망 일러스트 추가 | 지금 한 장 | 파일을 `gallery/somang-N.webp`(512×768, 2:3 크롭)로 넣고 `GALLERY.somang` 숫자만 올린다 |

**적용할 때마다:** 맵·안채를 건드렸으면 출구 31곳 걷기, 깊은 입구 실제 동선, 낮밤을 다시 보고, 항상 폰 화면 확인과 검증 스크립트 세 개를 돌린다. 기록은 해당 기록 문서에 쓰고, 이 문서의 표를 고친다.

## 이 문서 관리

새로 끝난 일은 "게임 지금 상태" 표에 반영하고, 끝난 대기 항목은 표에서 지운다. 버전별 상세는 CHANGELOG와 기록 문서에 쓰고 여기에는 쌓지 않는다.
