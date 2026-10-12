# 모래와 깃털 (Sand and Feather)

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

세트·호루스 RP 채팅 옆에서 돌아가는 이집트 오픈월드 게임이다. SillyTavern 확장으로 동작한다.

**현재 버전 0.9.53.** 버전별 변경 내역은 [CHANGELOG.md](CHANGELOG.md)에 있다.

## 작업자는 여기부터

이 저장소는 두 에이전트가 나눠서 작업한다. **자기 문서만 읽으면 된다.**

| 누구 | 하는 일 | 읽을 문서 |
|---|---|---|
| **아스트라** | 그림: 시안, 캐릭터 스프라이트, 맵 아트 | **[docs/ASTRA-START.md](docs/ASTRA-START.md)** 입구 하나. 거기서 할 일 [PLAN](docs/ASTRA-PLAN.md) → 캐릭터 그림 [SPRITE](docs/ASTRA-SPRITE.md) / 맵 [MAP](docs/ASTRA-MAP.md) → 공통 규칙 [HANDOFF](docs/ASTRA-HANDOFF.md)로 이어진다 |
| **오푸스** | 게임: 채택된 그림 적용, 충돌·출구·저장, UI, 코드, 검증 | [docs/OPUS-HANDOFF.md](docs/OPUS-HANDOFF.md) |

- 아스트라 문서는 모두 맨 위에 길 안내(지금 여기 · 다음 볼 것)가 있다. 규칙은 한 문서에만, 할 일·상태는 PLAN에만 쓴다.
- 인수인계 문서에는 지금 기준만 있다. 지난 경과는 git 커밋 기록에만 남아 있다.
- 그 밖의 `docs/*.md`는 작업별 기록이다. 인수인계에서 링크할 때만 찾아본다.
- 공통 규칙 요약은 [AGENTS.md](AGENTS.md)에 있다.

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
| 원정 | 두아트 문, 저녁과 밤 | 세트나 호루스와 갈림길, 턴 전투, 사건, 유물. 죽지 않아 |
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

## 참고 문서

- 현재 채택 캐릭터 그림·걷기GIF: [최종 베이스48장](docs/art/chibi-refresh/final/README.md). 채택된 동작(말 걸기, 줍기, 앉기, 잠들기)은 [ASTRA-SPRITE](docs/ASTRA-SPRITE.md) D
- 캐릭터 그림 검사: `python3 tools/art/sprite-review.py <동작 폴더> --out <폴더>/review` (피부색·머리·프레임·좌우·기준 그림·붙여넣기를 한 번에, [ASTRA-SPRITE](docs/ASTRA-SPRITE.md) ④)

- 기획서: [SPEC.md](SPEC.md)
- 다른 AI 상담용 소개서: [docs/CONSULT.md](docs/CONSULT.md)
- 초기 시안: [docs/mockups](docs/mockups)
