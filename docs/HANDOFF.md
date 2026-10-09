# 인수인계 · 모래와 깃털 0.5.8

> 다음에 이 확장을 맡을 Claude에게. 이 문서 하나로 이어서 일할 수 있게 썼어.
> 함께 읽을 것: `SPEC.md` 기획서, `docs/PROGRESS.md` 진행 상황, `docs/CONSULT.md` 소개서, `README.md`.

---

## 1. 소망과 일하는 방식

소망은 이 확장의 주인이야. 코드는 못 읽고, Claude가 만들고 소망이 폰에서 직접 써 보면서 의견을 줘.

**말투와 형식**
- 한국어 반말로, 편하게.
- 첫마디를 소망의 감정 얘기로 시작하지 않아.
- 묻지 않은 조언은 하지 않아.
- 괄호를 아주 싫어해. 소망이 읽는 답, UI 문구, 문서에서 괄호를 쓰지 마. 코드 주석은 괜찮아.
- 화면 군더더기를 싫어해.

**결정**
- 품질이나 비용이 달라지는 변경은 장단점을 보여 주고 소망이 고르게 해.
- 프롬프트에 들어가는 문장을 크게 바꿀 땐 먼저 보여 줘.

**작업 규칙** `SPEC.md` 0번
- 큰 단계는 계획 먼저 보여 주고 "ㄱㄱ"를 받은 뒤에 짜.
- 작은 버그 수정은 바로 해도 돼.
- 실리태번 API는 추측하지 마. NarrativeArchive 확장에서 쓰는 방식을 따라.
- `index.js` 하나에 몰지 말고 모듈로 나눠.

**다른 AI의 의견**
- 소망은 다른 AI, 아스트라나 솔한테 상담하고 그 답을 붙여 넣어 줘.
- 아스트라가 솔보다 상위 모델이고, 소망이 더 믿어.
- 붙여 넣은 의견은 그대로 따르지 말고 코드와 맞춰 본 뒤에 판단해. 이미 된 것, 맞는 것, 내 생각이 다른 것으로 나눠서 답하면 소망이 좋아해.

## 2. 저장소와 올리기

- 저장소: `https://github.com/yigasda/SandAndFeather`, 브랜치 `main`에 바로 올려.
- 로컬 경로는 `/home/user/sandandfeather`야. 없으면 클론해.
- 커밋할 때:
  ```
  git -c user.name="Somnag" -c user.email="soonjung118@gmail.com" commit -F -
  ```
- 커밋 메시지는 한국어로 쓰고, 끝에 이 두 줄을 붙여:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: <지금 세션 주소>
  ```
- 올리기:
  ```
  git push -q origin HEAD:main
  git ls-remote origin main
  ```
- 커밋, 문서, 코드 어디에도 모델 이름을 넣지 마. 위 Co-Authored-By 줄만 예외야.
- 버전은 `manifest.json`의 version과 `src/core/settings.js`의 `VERSION` 두 곳을 같이 올려. 고칠 때마다 0.4.x를 올리고, 큰 기능이면 0.5.
- 바뀐 내용은 `README.md`에 짧게 반영해.

## 3. 무엇을 만들고 있나

세트·호루스 RP 채팅 옆에서 돌아가는 이집트 오픈월드 게임 확장이야. 위에서 내려다보는 픽셀 마을을 걷고, 장소마다 생활·육성·원정·경영 놀이가 있어. 그 위에 원신식 모험 등급, 매일 의뢰, 작은 모험이 얹혀 있어.

**핵심 원칙** 기획서 2절, 6절
- **챗이 진짜야.** 게임 시간은 챗 트래커를 따라가. 게임이 RP 장면을 옮기거나 캐릭터의 대사, 감정, 약속을 정하지 않아.
- **프롬프트엔 짧은 영어만 넣어.** 숫자, 수치, 단계 이름은 안 넣어. 첫 줄은 날짜와 장소이고, 나머지는 소망이 꺼내기로 보낸 사실 한 줄이야.
- **버튼은 준비만 해.** 꺼내기는 입력칸에 문장을 넣기만 해. 보낸 메시지에 물건 이름이 남아 있을 때만 프롬프트에 들어가. `news.js`의 armPrepared가 이 일을 해.
- **재생성이나 스와이프로 날짜가 흔들려도 같은 하루, 같은 보상이 두 번 나오지 않아.** `ledger.js`가 막아.
- **게임은 채팅 분기를 따라가지 않아.**
- **플레이어는 죽지 않아.**
- **소망의 RP 플롯은 데이터에 넣지 않아.**

## 4. 코드 지도

```
index.js                 ST 이벤트 연결, 팩 불러오기
style.css                화면 전체. 크림·주황, .sf_dark가 어두운 테마
data/*.json              소망이 고칠 수 있는 데이터. 맵은 data/maps
src/core/
  st.js settings.js state.js   ST 접근, 전역 설정, 채팅별 저장. STATE_VERSION과 STEPS로 버전 올림
  bus.js                 이벤트. 이름은 EVENTS에 등록된 것만 됨
  clock.js tracker.js    이집트력, 트래커를 칸마다 따로 읽기
  inject.js news.js      프롬프트 블록, 챗에 넘길 일과 전달 상태
  ledger.js sun.js progress.js   처리 기록, 태양 기운, 능력치·등급·일지·매일 의뢰
  bag.js check.js data.js ko.js  가방, 데이터 검사, 불러오기, 을/를 조사
  picks.js               챗에서 받은 것: 배움 목표, 모험 소재, 메모. 그 메시지에 문장이 남아 있을 때만 살아 있어
  daylog.js codex.js     하루 결산 기록과 도장, 도감. 둘 다 이벤트를 듣고 스스로 채워
  ai.js                  모험 AI 연결. 커스텀 URL, Anthropic, Vertex. 아카이브와 같은 코드
src/world/               map.js 오버레이와 충돌, render.js 캔버스, player.js, input.js, things.js
src/ui/                  window.js 게임 창, hud.js, popups.js, kit.js, items.js, talk.js 꺼내기·찾아가기,
                         tabs.js 소망·파티·임무 탭, drawer.js 확장 서랍, icon.js,
                         mesbtn.js 메시지마다 붙는 게임에 반영하기 버튼과 카드,
                         daycard.js 하루 결산과 달력, codexcard.js 도감
src/packs/
  life/     market dock garden kitchen festival
  growth/   growth.js: 필사실, 훈련장, 제단, 강 건너 비문·사당·발굴터
  duat/     duat.js 원정
  realm/    works.js 정비
  world/    world.js 비밀, 배와 이동, obelisk.js 오벨리스크 빠른 이동
  adventure/ engine.js 실행, gen.js 무엇을 만들지, ai.js AI가 쓰고 검사
```

**새 기능을 붙이는 길**
- **장소:** `onSpot(id, (spot, ui, map) => …)`
- **맵 위 물건:** `addThings(fn)`
- **창 열릴 때:** `onOpen(fn)`
- **날짜 카드 버튼:** `addTodayButton({ label, onClick(ui) })`
- **지도 탭:** `addMapPart(ui => 요소)`, 큰 지도 위 표시는 `addMapMarks(mapId => [{ x, y, on }])`
- **게임 창이 열려 있을 때 뭔가 띄우기:** `gameMode() === 'open'`이면 `gameUi()`
- **카드:** `ui.showCard({ tag, title, text, body, buttons, onClose })`. 버튼의 onClick이 false를 돌려주면 카드가 안 닫혀.
- **목록:** `kit.js`의 list, para, stack, bar
- **활동 비용:** `spend(s, n)`. 끝나면 `addXP`, `didAct(s, kind)`, `saveState()`
- **꺼낼 일:** `journal(s, { ko, say, en, marks })`
- **조사:** `${josa(name, '을')}`. 이름 뒤에 을·이를 직접 붙이지 마.

## 5. 시험하는 법

진짜 실리태번을 깔아서 확장을 넣고 Playwright로 놀려 봐. 가짜 페이지로는 못 잡는 버그가 있었어. 게임 창이 높이 0으로 열린 문제가 그랬어.

1. **실리태번 받기:** 공개 저장소라 그냥 클론하면 돼.
   ```
   GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/SillyTavern/sillytavern /home/user/sillytavern/sillytavern
   ```
2. **설치하고 켜기:** `npm install` 다음 `node server.js --port 8000 --listen false --browserLaunchEnabled false`를 백그라운드로. 첫 화면의 페르소나 창은 Save로 넘겨.
3. **확장 넣기:** `data/default-user/extensions/SandAndFeather`에 git clone하고, 고친 뒤엔 src, data, style.css를 복사해.
4. **AI 시험:** 진짜 키 대신 CORS를 허용하는 작은 가짜 OpenAI 서버를 띄워. GET /models와 POST /chat/completions에 고정 JSON 모험을 돌려주게 해서 시험해.
5. **Playwright:** `/opt/node-tools/node_modules/playwright`, 화면은 412×900 폰 크기. 스크린샷은 꼭 열어서 눈으로 봐.
6. **주의:** pkill -f 패턴이 지금 실행 중인 bash 자신까지 죽일 수 있어. 프로세스 정리는 따로 스크립트 파일로 해.

## 6. 지금 상태

0.5.8 기준으로 네 장르, 탐험, 작은 모험, AI 모험이 다 조금씩 돌아. 자세한 건 `docs/PROGRESS.md`.

**최근 고친 것**
- 탭을 나갔다 오면 바닥이 사라지던 문제. `renderer.repaint()`로 다시 그려.
- 태양 기운을 설정으로 뺐어. 기본 12, 4~30.
- 모험 AI 연결을 서랍에서 직접 설정해.
- 하루 모험 수 기본 3. 하나 끝나면 다음이 바로 이어져.

**소망이 아직 확인 안 한 것**
- 진짜 제미니로 AI 모험이 잘 써지는지. 서랍 "작은 모험" 칸에 "AI가 씀"인지 "지난 AI 실패"인지 뜨니까 그걸 물어봐.

## 7. 다음 할 일

0.5.0에서 한 것: 배움 목표 셋, `data/lessons.json`과 `progress.js`의 lessonStep. 배운 기술로 모험 갈림길 추가는 `engine.js` choose, 두아트 엄호와 보호 주문은 `duat.js`. 매일 의뢰는 넷 중 둘. AI 모험 프롬프트에 지금 RP 장소, 배움, 예전 선택, 연결 강도를 넣었고, 연결 강도는 분위기만 70퍼센트야. 신의 말이나 마음을 정한 en 문장은 거부해.

0.5.1에서 한 것: 챗에서 게임으로. 메시지 메뉴의 깃털 버튼 "게임에 반영하기"로 문장 하나를 골라 배움 목표, 모험 소재, 메모로 받아. 버튼은 실리태번 메시지 틀 `#message_template .extraMesButtons`에 넣어서 새 메시지마다 붙어. 받은 건 보상이 없고, `picks.js`가 메시지에 그 문장이 남아 있는지로 살아 있는지 봐. 스와이프로 사라지면 숨고, 돌아오면 살아나고, 다음 메시지가 오면 지워. 배움 목표는 한 걸음도 안 했을 때만 원래대로 돌아가. 모험 소재가 있으면 AI 프롬프트의 연결 강도 대신 그 문장이 들어가고, AI가 모험을 쓰면 소재는 다 쓴 걸로 지워져.

0.5.2~0.5.8에서 한 것:
- **0.5.2 모험 기억:** 끝난 모험마다 제목, 단계 모양, 고른 갈림길, 간직했는지, 배운 기술을 썼는지, 동행을 `adv.recent`에 남겨. AI 프롬프트의 최근 모험 줄에 이게 들어가고, 요즘과 다른 종류의 갈림길을 내라고 해. 무작위 조립은 최근 결말을 덜 골라.
- **0.5.3 하루 결산:** `daylog.js`가 act:done, journal:added, bag:changed, stats:changed를 듣고 하루를 모아. day:started에 닫아서 `s.days`에 도장과 함께 넣어. 결산은 다음에 창을 열 때 떠. 날짜 카드에 달력.
- **0.5.4 축제의 밤:** `data/festivals.json`. 축제 7일 전부터 신전 앞 광장 24,16에 기둥. 준비 셋, 축제 날 저녁과 밤에 축제에 가기. 해마다 한 번 `s.fest`. 결과는 일지로만 챗에 가고 자동 주입은 없어.
- **0.5.5 도감:** 가방에 들어온 적 있는 물건과 찾은 비밀. 소망 탭 아래 버튼.
- **0.5.6 오벨리스크:** 맵 JSON의 obelisks. 깨우면 `flags['obelisk:id']`, 지도 탭에서 이동.
- **0.5.7 스프라이트:** `data/sprites.json` 사람 넷의 16×16 그림. 렌더러가 있으면 쓰고 없으면 코드 그림. things도 같은 모양으로 넣을 수 있어.
- **0.5.8 메모리:** 접거나 닫으면 `renderer.release()`로 화면, 바닥, 위층 캔버스를 1×1로. 접힌 동안 refresh는 그림을 다시 그리지 않아. 열 때 다시 칠해.

저장 버전은 지금 8이야.

아직 안 한 것:
1. 소망이 진짜 제미니로 AI 모험을 써 봤는지 확인.
2. 나중 후보: 축제 더 많이, 지도 위 물건 스프라이트, 사람 말고 다른 NPC, 판결석, 일정판, 탐사율.

## 8. 알아 두면 좋은 것

- **실리태번 화면 크기:** `<html>`에 transform이 걸려 있고 높이가 0이야. fixed 창은 inset만 주면 안 되고 크기를 vw, vh, dvh로 직접 줘야 해.
- **폰의 탭 전환:** 탭을 나갔다 오면 캔버스 그림이 비워질 수 있어. visibilitychange와 contextrestored 때 다시 그려.
- **ST 이벤트 시점:** MESSAGE_SENT와 GENERATION_STARTED는 ST가 끝나길 기다려 줘. 그 안에서 `applyInjection`을 동기로 부르면 이번 생성에 반영돼.
- **시험할 때 슬래시 명령:** `/sendas`, `/addswipe switch=true`로 진짜 메시지와 스와이프를 만들 수 있어. 트래커 안의 `|`는 명령을 끊으니까 `\|`로 써.
- **AI 답:** `{물건}을`처럼 조사를 중괄호 밖에 써서 와. engine.js의 fill이 처리해.
- **경제 숫자:** 시작 데벤 60. 정비는 수로 10, 밭 10, 배 20 데벤에 자재가 필요해.
- **두아트 난이도:** 체력 13+3×체력, 공격 3+체력+0~2. 문지기 16/4. 맨몸이면 대략 열에 일곱 번 이기고, 준비하면 거의 다 이겨. 숫자를 바꾸면 시뮬레이션으로 다시 맞춰.
- **메모리:** 게임을 열면 약 10MB, 대부분 캔버스야. 접거나 닫으면 0.5.8부터 비워.
- **NarrativeArchive:** 소망이 쓰는 다른 확장이고 `yigasda/NarrativeArchive`에 있어. 이 확장의 디자인과 AI 연결 코드는 그쪽을 따라 했어. 그쪽 작업은 따로야.
