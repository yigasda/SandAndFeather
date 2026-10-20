# 오푸스 · 검증과 배포

[오푸스 입구로](OPUS-HANDOFF.md)

작업에 해당하는 검사를 먼저 고르고, 원문에 적힌 전체 검증·배포 조건을 지킨다. 아래 0.9.89·알려진 실패·도구 상태는 원문에 기록된 시점의 내용이다. 실제 버전과 실행 결과는 최신 저장소에서 확인한다. 원문의 “이 문서/맨 위 기준 버전” 갱신 위치는 [기록된 상태](OPUS-CURRENT-STATE.md)와 이 파트의 버전 항목이다. 완료 후 기록 정리는 [입구의 문서 관리](OPUS-HANDOFF.md#문서-관리)를 따른다.

## 버전과 검증

- 버전은 `manifest.json`의 `version`과 `src/core/settings.js`의 `VERSION`을 같이 올린다. 지금은 **0.9.89**이다. 올릴 때 `CHANGELOG.md` 맨 위에 한 줄, README의 "현재 버전" 줄, 이 문서의 이 줄과 맨 위 기준 버전도 고친다. README에는 버전 내역을 쌓지 않는다.
- **배포(0.9.54~):** 사용자는 `release` 브랜치로 설치한다(main은 docs 그림 기록 때문에 1 GB 넘음, SillyTavern은 `auto_update`로 켤 때마다 git pull). 버전을 올리고 main에 푸시한 뒤 `sh tools/release.sh && git push origin release`로 release도 올린다. 스크립트는 `index.js`, `style.css`, `manifest.json`, `README.md`, `src/`, `data/`와 `data/*.json`이 가리키는 `../docs/` 그림만 담는다. 게임이 새로 docs 밖 파일을 읽게 되면 스크립트에 더한다. 확인은 `git clone --depth 1 --branch release`한 폴더를 확장 자리에 넣고 검증 스크립트를 돌린다.
- 캐릭터 그림은 게임 창을 열 때 불러온다(`ensureSpriteArt`, `window.js openGame`). 그 전에 그림을 쓰는 코드를 만들면 먼저 `ensureSpriteArt()`를 기다린다.
- **검증 스크립트 세 개**(`tools/art/`, ST가 떠 있고 확장이 들어가 있어야 함). 출력 폴더를 인자로 준다. 셋 다 exit 0이어야 한다:
  ```sh
  export NODE_PATH=/opt/node-tools/node_modules
  node tools/art/verify-full-map.cjs /tmp/vf    # 옴보스 전체맵 낮밤 픽셀 일치와 이동
  node tools/art/verify-cozy-ui.cjs /tmp/vc     # 포근한 테마 UI(일행·자세히·갤러리·대화 등)
  node tools/art/verify-ui-themes.cjs /tmp/vt   # 테마 다섯 개
  ```
  `/usr/bin/chromium`이 있으면 그걸 쓰고, 없으면 Playwright 기본 크로미움을 쓴다. ST 자체의 "Internal Server Error" 페이지 오류는 무시한다(모델 미연결). 셋은 `tiers.sh ui` 묶음으로 돌린다(다른 검사와 동시에 돌리지 않음).
- UI를 바꾸면 이 스크립트의 선택자도 같이 고친다(예: 0.9.29에 `인물 보기` 버튼을 없애며 `[data-detail]`로 바꿈).
- `verify-browser.cjs`는 main에서도 원래 두 곳이 실패한다(부엌 좌표 30,18 → 지금 28,18, 두아트 문 조건). 알려진 문제다.
- **눈으로 확인하는 테스트**(`tools/st-test/`, 첫 인자는 출력 폴더, 그림은 `<폴더>/spr/`):
  - `act-sheet.js <폴더> [동작]`: 렌더러로 셋의 동작 시트(방향별 정지→0→1→정지). 동작 기본값 `interact`, `pickup` 등
  - `interact.js <폴더> <set|somang|horus>`: 그 캐릭터를 앞장세우고 부엌 앞에서 위·왼·오 방향 말 걸기
  - `rest.js`: 식탁에 앉기·일어나기·하루 쉬기 횟수, 침대 잠 조건·잠들기, 땅의 것 줍기
  - `gameday.js`: 게임에서 자고(결산이 뜸) 채팅이 그 밤을 넘겨도 두 번 안 세는지
  - `profile-cards.js`: 테마 다섯 개 × 셋의 자세히 카드, 갤러리 넘기기
  - `solo.js`: 세트 앞장 솔로, 호루스+소망 동행
  - **`seats.js <폴더> [자리,…]`**(새 자리를 만들면 파일 위쪽 목록에 줄을 더한다. 서는 곳이 막혀 있으면 카드가 안 뜬다): 앉을 곳마다 셋을 앉아 쉬기 카드로 실제로 앉힌다(전체 화면 dpr 2). 시트는 `python3 tools/art/fix/seat-sheet.py <폴더> <시트.png>`(자리 × 소망·세트·호루스). **앉는 자리나 앉은 그림을 바꾸면 이 시트를 보낸다**
  - **`bed-pairs.js <폴더> [방] [x,y]`**: 침대 카드로 같이 자기 6조합 + 혼자 3개를 실제로 눕히고(전체 화면 dpr 2) 일어나면 동행도 일어나는지 본다. 기본 세트 침대, 호루스 침대는 `horus_room 6.0,7.7`. 시트는 `python3 tools/art/fix/combo-sheet.py <폴더> <침대 박스> <시트.png>`(세트 침대 `342,690,632,850`, 호루스 침대 `140,680,440,900`). **누운 자리나 누운 그림을 바꾸면 항상 이 시트를 사용자에게 보낸다**
  - `pose-try.js <폴더> '<[이름,방,[서는x,y],자세,[x,y,방향]] 목록>' [누구]`: 스팟 없이 자세만 그 자리에 놓아 본다(자리 찾기)
  - `bed-measure.js <폴더> '<[누구,[x,y,방향],이름] 목록>' [방]`: 한 사람만 침대 자리에 눕힌 화면과 뺀 화면. 두 장 차이의 박스가 그 사람(머리 위끝·턱 높이 재기)
  - 폰 크기는 412×900. 안채나 맵을 고치면 출구 걷기·낮밤도 본다.
- 검사를 고르고 돌리는 순서·재사용·실패 재검사·진단 반복은 아래 [작업·검수 절차](#작업검수-절차-단계별-검사)를 따른다.

<a id="작업검수-절차-단계별-검사"></a>
## 작업·검수 절차 (단계별 검사)

사용자 10-19: 작은 수정마다 30~40분짜리 전체 회귀를 다시 돌리지 않는다. **빠른 검사 → 영향받는 묶음 → 병합 전 전체** 순서로 하고, 통과 기준은 낮추지 않는다. 실행은 [`tools/st-test/tiers.sh`](../tools/st-test/tiers.sh) 하나로 한다(시험 서버로 코드 복사, 잠금, 기준 코드 기록이 들어 있다).

### 1. 준비

- 시험 서버: `cd /home/user/sillytavern/sillytavern && node server.js --port 8000 --listen false` (컨테이너가 다시 뜨면 죽어 있다 → 다시 켠다). `tiers.sh`가 `src`·`data`·`index.js`·`style.css`·`manifest.json`을 확장 자리로 복사한다. 맵 그림(`docs/art/map-expansion`)을 바꿨다면 [사막 실행법](DESERT-WORK-LOG.md#실행법)대로 따로 복사한다.
- `NODE_PATH=/opt/node-tools/node_modules`(스크립트가 기본값으로 둔다). 문법 검사는 모듈 모드(`--experimental-default-type=module --check`) — 그냥 `--check`는 같은 이름 함수 두 번 선언을 못 잡는다. `tiers.sh`가 이렇게 한다.
- 새 검사를 쓸 때 부트 코드는 `desert-15-lift.cjs`(첫 화면 Save·캐릭터 목록 기다리기), 터치 걷기는 `touch-walk.cjs`를 따른다.

### 2. 세 단계

| 단계 | 언제 | 명령 | 시간 |
|---|---|---|---|
| ① 빠른 검사 | 수정할 때마다 | `bash tools/st-test/tiers.sh quick <직접 관련 검사>` | 문법 몇 초 + 그 검사 1~5분 |
| ② 관련 묶음 | 한 갈래 수정을 마쳤을 때(커밋 전) | `bash tools/st-test/tiers.sh <묶음>...` | 묶음당 2~9분 |
| ③ 전체 | 다른 작업과 합친 뒤·main 반영 전에 한 번 | `bash tools/st-test/tiers.sh full --since origin/main` | 약 30분 |

- **빠른 검사도 직접 관련 검사를 이름으로 준다.** 문법만으로 끝내지 않는다.
- `quick`은 **검사한 문법 파일 수와 기준 커밋**을 적는다(`summary.txt`). 커밋 이후 바뀐 JS가 0개면 "검사한 파일 0개 — 통과 아님"으로 적고 exit 3이다. 이미 커밋한 변경은 `--since <커밋>`으로 그 커밋 이후를 본다.
- 결과 폴더(`--out`, 기본 `/tmp/st-tiers`)의 `summary.txt`에 시작 시각·**기준 코드**(커밋, 커밋 안 한 수정은 `+수정<해시>`)·검사별 통과/실패/걸린 초가 쌓인다. 보고에는 이 기준 코드를 함께 적는다.

### 3. 변경 유형별 검사 고르기

| 바꾼 것 | 묶음(검사) | 대략 |
|---|---|---|
| 궁 규칙·게이지·궁 그림·크기·층·궁 타격 범위 | `ult` (desert-ult, ult-fx-view) | 3분 |
| 타격 판정·조준·방향(`blowMeets`·`touches`·`aimWay`·`turnToFoe`), 기술 | `hit` (desert-strike, desert-target, desert-horus-leap, duat-field) | 9분 |
| 몹 행동·추격·공격·안전구역·가드 | `mob` (desert-entry-safe, desert-b3, desert-mob-hits) | 6분 |
| 버튼·조이스틱·터치(`input.js`, HUD 버튼) | `input` (pad-tabs) | 2분 |
| 출구·착지·동행 경로·맵 데이터(`map.js`·`player.js`·`window.js` 출구·`tools/maps`) | `map` (portal-walk 연결별 `--connections`·`--temple-*` — 기본값은 옛 02↔T1W라 쓰지 않음, desert-maps, desert-save-move) | 10~15분 |
| HUD·CSS·카드·테마, 옴보스 맵 | `ui` (verify-cozy-ui, verify-ui-themes, verify-full-map — 위 검증 스크립트 세 개) | 3분 |
| 몹·궁 그림 패킹·해상도·메모리·보스 가림 | `art` (desert-boss-view, ult-memory) | 2분 |
| 두 갈래 이상, 공통 파일(`field.js` 전역 구조·`state.js` 저장) | 해당 묶음 모두. 저장을 바꿨으면 desert-ult(저장·다시 불러오기)·desert-save-move 포함 | |

- 검사 하나는 이름으로 바로 돌릴 수 있다: `bash tools/st-test/tiers.sh desert-entry-safe`. 플래그가 필요한 검사는 `이름:--플래그,--플래그`(예: `portal-walk:--temple-02-15`).
- 그림만 고쳤으면 영상 검사를 다시 찍지 않고 캡처로 확인한다.

### 4. 이전 통과 결과를 다시 쓸 때

- 그 결과의 **기준 코드(커밋)**와 지금 사이의 변경(`git diff <그 커밋> -- <검사가 보는 파일>`)을 보고, 그 검사가 보는 코드·데이터를 건드리지 않았을 때만 재사용한다. 재사용했다면 보고에 "커밋 ○○ 결과 재사용, 이번 변경은 ○○만 바꿈"이라고 적는다.
- 한 묶음을 돌리는 도중 코드를 바꿨다면 `tiers.sh`가 "검사 도중 코드가 바뀜 (A → B), 결과는 A 기준"을 남긴다. 그 결과는 A 기준으로만 보고하고, 바뀐 부분이 닿는 검사는 B에서 다시 돌린다.
- 병합 전 전체 검사는 재사용하지 않는다(합친 코드로 한 번 돌린다).

### 5. 실패했을 때

1. **실패한 검사 파일부터** 다시 돌린다(같은 기준 코드). 같은 사례가 다시 실패하면 원인을 찾는다.
2. 고친 뒤에는 그 검사를 먼저 통과시키고, 다른 검사는 **그 수정이 그 검사가 보는 코드를 바꿨는지**로 다시 돌릴지 정한다. 무효가 아닌 검사는 다시 돌리지 않고 이유를 적는다.
3. 시험만 틀렸으면(벽 너머에 세움·키를 뗀 뒤 읽음 등) 시험을 고치되 **기대값·기준은 낮추지 않는다**. 게임 코드가 틀렸으면 게임을 고친다. 어느 쪽이었는지 보고한다.
4. "가끔 실패"를 원인으로 쓰지 않는다. 아래 진단 반복으로 재현하거나, 재현 못 했다고 적는다.

### 6. 진단 반복(간헐 실패)

- **상한을 먼저 정한다:** 예) 최대 10번 또는 30분. 그 안에 재현되지 않으면 "N번·M분 동안 재현 못 함"으로 보고하고 원인을 지어내지 않는다.
- **먼저 확인할 것:** 장면마다 상태를 초기화했는지(`testReset`, 쿨·자세·몹 수치), 공격 직전의 위치·방향·동작 가능 여부(바쁨·쿨·쓰러짐), 그 자리에서 몹이 보이는지(벽). 실패 줄에 이것을 남기게 시험을 먼저 고친다(`testEvents`의 press·ignored·blow, `testBlow()`, `testClear()`).
- **기준 코드와 수정 코드를 같은 조건으로** 돌려 비교한다(같은 검사·같은 반복 수·같은 서버 부하). 한쪽만 돌린 결과로 회귀라고 하지 않는다.
- **재현되면 그 사례만** 따로 반복한다(검사 전체를 다시 돌리지 않는다). 고친 뒤 같은 상한으로 다시 돌려 0번 실패를 확인한다.
- 예: duat-field "공격으로 몹 체력 줄어듦" 간헐 실패(10-19) — 실패 순간 기록에서 다섯 몹 모두 벽에 가려 있었다(`seen false`). 시험이 몹 왼쪽 0.9칸에 무조건 세워 벽 너머가 된 것. 시험이 벽 없는 쪽을 고르게 고친 뒤 4번 연속 23/23.

### 7. 병행과 보고

- **같은 시험 서버에는 한 번에 하나만** 돌린다. `tiers.sh`는 `/tmp/st-tiers.lock`을 잡고, 이미 돌고 있으면 바로 멈춘다(서버의 코드를 갈아 끼우므로 동시에 돌리면 앞 검사 결과가 섞인다). 직접 `node tools/st-test/...`를 돌릴 때도 다른 검사가 없는지 먼저 본다.
- 검사가 도는 동안 **검사와 무관한 작업**(문서, 다음 수정의 코드 읽기, 그림 비교 준비)은 계속한다. 단, 시험 서버로 복사하는 일(`sync`·`tiers.sh`)은 검사가 끝날 때까지 하지 않는다.
- **실제 수정 결과·캡처와 핵심 결과는 먼저 보여 준다.** 전체 검사가 끝날 때까지 기다리지 않는다. 보고는 통과/실패/미실행/환경 차단으로 나누고, 각 결과의 기준 코드를 적는다.
- 사막 검사 목록과 마지막 결과: [DESERT-OPUS-HANDOFF.md 7. 시험](DESERT-OPUS-HANDOFF.md#7-시험-실행법), 생성기 명령: [DESERT-WORK-LOG.md](DESERT-WORK-LOG.md#실행법).
