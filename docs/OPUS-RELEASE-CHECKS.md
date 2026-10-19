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
  - **`seats.js <폴더> [자리,…]`**(새 자리를 만들면 파일 위쪽 목록에 줄을 더한다. 서는 곳이 막혀 있으면 카드가 안 뜬다): 앉을 곳마다 셋을 앉아 쉬기 카드로 실제로 앉힌다(전체 화면 dpr 2). 시트는 `python3 tools/art/fix/seat-sheet.py <폴더> <시트.png>`(자리 × 소망·세트·호루스). **앉는 자리나 앉은 그림을 바꾸면 이 시트를 보낸다**
  - **`bed-pairs.js <폴더> [방] [x,y]`**: 침대 카드로 같이 자기 6조합 + 혼자 3개를 실제로 눕히고(전체 화면 dpr 2) 일어나면 동행도 일어나는지 본다. 기본 세트 침대, 호루스 침대는 `horus_room 6.0,7.7`. 시트는 `python3 tools/art/fix/combo-sheet.py <폴더> <침대 박스> <시트.png>`(세트 침대 `342,690,632,850`, 호루스 침대 `140,680,440,900`). **누운 자리나 누운 그림을 바꾸면 항상 이 시트를 사용자에게 보낸다**
  - `pose-try.js <폴더> '<[이름,방,[서는x,y],자세,[x,y,방향]] 목록>' [누구]`: 스팟 없이 자세만 그 자리에 놓아 본다(자리 찾기)
  - `bed-measure.js <폴더> '<[누구,[x,y,방향],이름] 목록>' [방]`: 한 사람만 침대 자리에 눕힌 화면과 뺀 화면. 두 장 차이의 박스가 그 사람(머리 위끝·턱 높이 재기)
  - 폰 크기는 412×900. 안채나 맵을 고치면 출구 걷기·낮밤도 본다.
- **검사 시간 줄이기(사용자 10-19: "왜 이렇게 오래 해")**
  - 고친 부분에 해당하는 검사만 먼저 돌린다. 넓은 회귀 검사는 커밋 직전에 한 번만 돌린다.
  - 같은 검사를 다시 돌리지 않는다. 결과는 처음 실행에서 `| tee`로 남긴다.
  - 서로 상관없는 검사는 백그라운드로 동시에 돌린다. 끝 알림은 그 명령 자체가 끝날 때 오게 하고, 따로 기다리는 감시 루프는 만들지 않는다.
  - 그림만 고쳤으면 영상 검사를 다시 찍지 않고 캡처로 확인한다.
  - 문법 검사는 모듈로 한다(`node --experimental-default-type=module --check`). 그냥 `--check`는 같은 이름 함수가 두 번 선언돼도 통과시킨다.
  - 컨테이너가 재시작되면 ST를 다시 띄운다(`node server.js --port 8000 --listen false`). 첫 화면의 Save 버튼과 캐릭터 목록을 기다리는 부트 코드는 `desert-15-lift.cjs`를 따른다. 터치로 걷는 도우미는 `tools/st-test/touch-walk.cjs`.
  - 사막 검사 목록과 실행법: [DESERT-WORK-LOG.md](DESERT-WORK-LOG.md) 「실행법」.
  - **사막 맵·몹 전체 인수인계:** [DESERT-OPUS-HANDOFF.md](DESERT-OPUS-HANDOFF.md) (지킬 지시, 자료 위치, 맵 8곳, 몹 12종 도형·판정·방향, 퍼즐, 결정 대기, 시험).

