# 모래와 깃털 (Sand and Feather)

세트·호루스 RP 채팅 옆에서 돌아가는 이집트 오픈월드 게임이다. SillyTavern 확장으로 동작한다.

**현재 버전 0.9.89.** 버전별 변경 내역은 [CHANGELOG.md](CHANGELOG.md)에 있다.

## 어디로 갈까요?

| 목적 | 바로가기 |
|---|---|
| **게임 설치·플레이** | [설치](#설치) → [게임 사용법](#게임-사용법) |
| **아스트라: 그림 제작** | **[ASTRA-START](docs/ASTRA-START.md)** → 아래 [아스트라 작업별 지도](#아스트라-작업별-지도) |
| **오푸스: 게임 구현·적용·검증** | **[OPUS-HANDOFF](docs/OPUS-HANDOFF.md)** → 아래 [오푸스 작업별 지도](#오푸스-작업별-지도) |

공통 작업 규칙은 **[AGENTS.md](AGENTS.md)**, 버전별 변경 내역은 **[CHANGELOG.md](CHANGELOG.md)**. 역할별 입구부터 읽고, 맡은 작업에 필요한 교차 참조를 따라간다. 모든 문서를 한꺼번에 읽을 필요는 없다.

### 아스트라 작업별 지도

| 지금 할 일 | 읽을 문서 |
|---|---|
| 새 작업 시작·기준 확인 | [START](docs/ASTRA-START.md) → 공통 그림 규칙 [HANDOFF](docs/ASTRA-HANDOFF.md) |
| 진행 상태·다음 할 일 확인 | [DRAW-STATE](docs/ASTRA-DRAW-STATE.md) · [PLAN](docs/ASTRA-PLAN.md) |
| 캐릭터 스프라이트 제작·검사 | [SPRITE](docs/ASTRA-SPRITE.md) |
| 맵 아트 제작·프롬프트 확인 | [MAP](docs/ASTRA-MAP.md) · [MAP-PROMPTS](docs/ASTRA-MAP-PROMPTS.md) |
| 사막 맵 작업 | [DESERT-HANDOFF](docs/ASTRA-DESERT-HANDOFF.md) → [05–20 GUIDE](docs/ASTRA-DESERT-05-20-GUIDE.md) |
| 몬스터·스킬 이펙트 제작 | [MOB](docs/ASTRA-MOB.md) · [스킬 이펙트 프롬프트](docs/skill-effect-prompts/README.md) |
| 캐릭터별 아트 레퍼런스 | [세트](docs/ASTRA-REF-SET.md) · [호루스](docs/ASTRA-REF-HORUS.md) · [소망](docs/ASTRA-REF-SOMANG.md) · [호루스 재생성 원문: 정면·뒷면·먹기 프롬프트와 채택 PNG](docs/HORUS-SPRITE-PROMPTS.md) |

### 오푸스 작업별 지도

| 지금 할 일 | 읽을 문서 |
|---|---|
| 인수인계 시작·작업 순서 확인 | [HANDOFF](docs/OPUS-HANDOFF.md) → [WORKFLOW](docs/OPUS-WORKFLOW.md) |
| 맵·충돌·출구 적용 | [MAPS](docs/OPUS-MAPS.md) |
| 아트 파일 수정·적용 | [ART-EDIT](docs/OPUS-ART-EDIT.md) |
| 캐릭터 스프라이트 연결 | [SPRITE-INTEGRATION](docs/OPUS-SPRITE-INTEGRATION.md) |
| 배포 전 검증 | [RELEASE-CHECKS](docs/OPUS-RELEASE-CHECKS.md) |
| 현재 상태·미완료 항목 확인 | [CURRENT-STATE](docs/OPUS-CURRENT-STATE.md) |
| 사막 맵 인수·적용 | [DESERT-MAPS](docs/OPUS-DESERT-MAPS.md) · [DESERT-OPUS-HANDOFF](docs/DESERT-OPUS-HANDOFF.md) |
| 두아트 필드 전투 작업 | [DUAT-FIELD-COMBAT-PLAN](docs/DUAT-FIELD-COMBAT-PLAN.md) |

## 작업 전 필수 확인

아래 원문은 작업 지시를 받거나 그림을 제작·수정하기 전에 반드시 확인한다. 접힌 것은 화면 정리를 위한 것이며 선택 사항이라는 뜻이 아니다. 그림의 최신 채택 기준과 레퍼런스는 [ASTRA-START](docs/ASTRA-START.md)에서 먼저 확인한다. 아래 보존 원문의 과거 `final/` 안내만으로 현재 기준을 판단하지 않는다.

<details>
<summary><strong>필수 작업 지시·그림 규칙 원문 펼치기</strong></summary>

> # 🛑 DO EXACTLY WHAT THE USER SAID. NOT YOUR VERSION OF IT. 🛑
> - **THE USER'S WORDS ARE THE ORDER. DO NOT REINTERPRET, NARROW, SOFTEN OR "OPTIMISE" THEM.** "Trace Horus's body and redraw" means **TRACE THE WHOLE BODY AND REDRAW IT** — not "match the outer width", not "fix only the outline", not "adjust a few pixels".
> - **IF YOU THINK A SMALLER OR EASIER VERSION IS ENOUGH, YOU ARE WRONG. DO THE WHOLE THING.**
> - **IF YOU ARE UNSURE WHAT THE USER MEANT, ASK BEFORE YOU DRAW. NEVER GUESS AND NEVER PICK THE CHEAPER READING.**
> - **BEFORE YOU START, WRITE BACK THE USER'S ORDER WORD FOR WORD, THEN WHAT YOU WILL DO FOR EACH PART OF IT.** If your plan drops or shrinks any part, it is wrong.
> - **CHANGING THE TASK YOU WERE GIVEN INTO A DIFFERENT TASK = REJECTED. EVERY TIME.**
> - **IF YOU CANNOT OPEN OR READ A PICTURE THE USER GAVE YOU, SAY SO RIGHT AWAY AND ASK FOR THE FILE (PNG in the repo or a Drive link). NEVER GUESS WHAT IT SHOWS. NEVER SAY "I MATCHED IT" ABOUT A PICTURE YOU DID NOT SEE.** Claiming you followed something you never read is a lie, and it is worse than asking.

> # 🚨 ASTRA, STOP. READ THIS BEFORE YOU TOUCH ANY PICTURE. 🚨
> ## THE FINAL IDLE AND WALK SPRITES ARE THE ANSWER. YOUR JOB IS TO MATCH THEM, NOT TO IMPROVE THEM.
> - **OPEN `docs/art/chibi-refresh/final/<who>/idle/` AND `walk/` FIRST. EVERY TIME. SAME DIRECTION.**
> - **TRACE ON THE GUIDES:** `head-check.py --guide`, `palette/palette.md`, `palette/eyes.png`, `notes/hair-reference.png`.
> - **SAME FACE SHAPE. SAME HEAD SIZE. SAME LINE THICKNESS. SAME HAIR DETAIL. SAME COLOURS. SAME FACE MARK.** ONLY THE POSE CHANGES.
> - **DO NOT ADD DETAIL. DO NOT REDESIGN. DO NOT "FIX" WHAT NOBODY ASKED YOU TO FIX.**
> - **DRAW EVERY FRAME NEW. FRAME 1 IS A NEW DRAWING, NOT FRAME 0 COPIED AND THEN STRETCHED, SHIFTED, WARPED OR RECOLOURED.** No frame tricks. `sprite-review` catches copied frames (over 50 % identical pixels). Only exception: an action where only a hand or foot moves.
> - **A PASSING CHECK IS NOT A FINISHED DRAWING.** PUT IT NEXT TO THE IDLE AND LOOK BEFORE YOU SEND.
> - **THEN GO TO [docs/ASTRA-START.md](docs/ASTRA-START.md) AND READ IT. ALL OF IT.**

</details>

## 설치

**설치는 `release` 브랜치로 한다.** SillyTavern 확장 설치에서 주소 `https://github.com/yigasda/SandAndFeather`, 브랜치 `release`. main은 그림 작업 기록(1 GB 넘음)까지 들어 있어서, main으로 깔면 SillyTavern이 켤 때마다 자동 업데이트로 그걸 다 받느라 느려진다. release는 게임이 쓰는 파일만(약 100 MB).

## 게임 사용법

기존 README의 플레이 안내를 원문 그대로 보존했다. 아래 두아트 설명은 기존 갈림길·턴 전투 안내이며, 새 필드 전투의 구현 상태를 뜻하지 않는다. 개발 상태는 [OPUS-CURRENT-STATE](docs/OPUS-CURRENT-STATE.md)와 해당 작업 문서에서 확인한다.

<details>
<summary><strong>게임 열기·조작·하루·활동·일행·AI 모험 안내 펼치기</strong></summary>

## 게임 열기

마술봉 메뉴 → **모래와 깃털**, 또는 확장 탭 서랍 → **게임 열기**. 방향키·WASD, 폰에선 왼쪽 아래 패드. 가까이 가서 **말 걸기** 또는 E.

**하루:** 챗의 하루마다, 또는 게임에서 침대에 누워 자면(태양 기운이 절반 이하일 때) 새 하루가 돼서 태양 기운이 차. 게임에서 자도 챗의 날짜는 그대로고, 챗이 그 밤을 넘기면 두 번 세지 않아. 식탁 같은 자리에 앉아 쉬면 태양 기운 +1(하루 두 번). 기본 12, 서랍 "보기"에서 4부터 30까지 바꿀 수 있어. 걷기, 구경, 말 걸기, 꺼내기는 공짜고 활동만 기운을 써. 모든 활동이 모험 등급 경험치를 줘. 매일 의뢰 둘.

| 놀이 | 어디서 | 하는 것 |
|---|---|---|
| 생활 | 시장 | 재료, 씨앗, 자재 사고팔기 |
| | 선착장 | 타이밍 낚시, 하루 한 번 건지기 |
| | 텃밭 | 씨앗 심고 며칠 뒤 수확 |
| | 부엌 | 요리. 음식은 두아트 회복용이나 선물 |
| 육성 | 필사실 · 훈련장 · 제단 | 지혜 · 체력 · 신앙. 지혜로 기록 해독 |
| 원정 | 두아트 문, 모든 시간대 | 세트나 호루스와 갈림길, 턴 전투, 사건, 유물. 죽지 않아 |
| 경영 | 신전 지도 탁자 | 수로, 밭, 배 정비. 며칠 뒤 지도가 바뀌어 |
| 집 | 세트 신전 안채 | 옴보스 신전 문으로 걸어 들어가. 우물 마당, 부엌, 식사 공간, 세 사람 방, 성소, 열주 계단, 지붕. 낮밤이 바뀌어. 식탁·쉼터에 앉아 쉬고, 세트 침대에서 자면 새 하루 |
| 탐험 | 마을 곳곳 | 밤에만, 계절에만, 동행과 함께일 때만 보이는 것 |
| | 강 건너 무너진 신전 | 배 수리와 모험 등급 3. 비문, 사당, 발굴터 |
| 작은 모험 | 마을 | 하루 하나. 첫 모험은 숨은 정원. 그다음은 AI가 쓰거나 무작위 조립 |
| RP 연결 | 가방, 임무 탭 일지 | 원할 때 지금 장면에 꺼내기 |

**일행 탭:** 소망, 세트, 호루스 중 누가 앞장설지 고른다. 앞장선 사람을 맵에서 움직이고, 그 사람이 낚시·요리·텃밭·원정을 하고 성장한다. 셋 다 혼자 다닐 수도 있고, 나머지 둘 중 하나와 같이 걸을 수도 있다. 셋은 능력치·모험 등급·배움을 각자 따로 가진다(자세히). 자세히 카드에는 각자 일러스트가 나온다(세트·호루스는 세 장을 ‹ ›로 넘긴다). **임무 탭:** 매일 의뢰, 모험 힌트, 일지와 꺼내기.

**AI 모험:** 서랍 "작은 모험"에서 쓰는 쪽을 골라: 커스텀 API, Vertex AI, 아카이브 초안 모델, 아카이브 AI 기능 모델, 끄기. 커스텀은 주소, 키, 형식, 모델이고 모델 불러오기와 연결 시험 버튼이 있어. Vertex는 서비스 계정 JSON, 위치, 모델. 새 모험 하나에 한 번 불러. 하루 모험 수는 기본 3이고, 하나 끝나면 다음 게 바로 이어져.

트래커 예:
```
<tracker> 🌇 05:48 오후 | 하티르 여드렛날, 2년 | 옴보스 → 서쪽 별채 | ☀️ 맑음 </tracker>
```

데이터는 `data/` 아래 JSON이라 손으로 고칠 수 있어. 틀리면 어느 파일 몇 번째인지 알려 줘.

</details>

## 추가 참고

- 캐릭터 베이스·걷기 GIF 기록: [최종 베이스48장](docs/art/chibi-refresh/final/README.md). 현재 채택 기준은 [ASTRA-START](docs/ASTRA-START.md)에서 먼저 확인한다. 채택된 동작(말 걸기, 줍기, 앉기, 잠들기)은 [ASTRA-SPRITE](docs/ASTRA-SPRITE.md) D를 참고한다.
- 캐릭터 그림 검사: `python3 tools/art/sprite-review.py <동작 폴더> --out <폴더>/review` (피부색·머리·프레임·좌우·기준 그림·붙여넣기를 한 번에, [ASTRA-SPRITE](docs/ASTRA-SPRITE.md) ④)
- 기획서: [SPEC.md](SPEC.md)
- 다른 AI 상담용 소개서: [docs/CONSULT.md](docs/CONSULT.md)
- 초기 시안: [docs/mockups](docs/mockups)

## 문서 관리

- 이 README는 설치·플레이와 역할별 문서 입구를 연결하는 안내판이다. 상세 규칙·할 일·상태를 여기 중복 작성하지 않는다.
- 아스트라 작업은 START의 길 안내를 따라 HANDOFF·PLAN·DRAW-STATE와 작업별 문서에서 확인하고 갱신한다. 오푸스 작업은 HANDOFF에서 각 분야 문서로 이동하며, 현재 상태는 CURRENT-STATE에서 확인하고 갱신한다.
- 역할별 문서가 기본 경로다. 다른 역할의 규칙이나 산출물이 필요한 작업은 해당 교차 참조도 읽는다.
- `docs/`에는 현재 인수인계와 과거 작업 기록이 함께 있다. 모든 문서를 최신 상태로 간주하지 말고, 역할별 입구와 문서의 적용 범위·상태를 확인한다. 지난 변경 경과는 git 커밋 기록도 참고한다.
- 문서 추가·분리·이동 시 담당 역할의 입구와 이 README의 관련 링크를 함께 갱신한다. 공통 규칙은 [AGENTS.md](AGENTS.md), 게임 버전 변경은 [CHANGELOG.md](CHANGELOG.md)에 반영한다.
