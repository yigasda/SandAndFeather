# 아스트라 입구 — 여기서 시작한다

> **작화 실행 절차 (2026-10-14):** 새 그림·부분 수정·재시도 전 [현재 작업](ASTRA-DRAW-STATE.md)과 [작화 시작표](ASTRA-DRAW-CHECK.md)를 확인한다. 상세 지침과 실제 원본·가이드를 확인한 뒤, 각 생성의 참고 파일·가이드 사용·지시문·결과 비교를 작업 폴더에 기록한다. 파일 목록 확인이나 기억만으로 읽음/검수 완료를 선언하지 않는다.
> **승인 범위:** 이미 승인된 계획은 반복 승인받지 않는다. 아래의 계획 확인 규칙은 아직 승인되지 않은 새 범위에 적용한다. 최신 사용자 지시가 우선한다. 이 시작표는 아래 상세 지침을 생략하는 허가가 아니다.

> # 🛑 DO EXACTLY WHAT THE USER SAID. NOT YOUR VERSION OF IT. 🛑
> - **THE USER'S WORDS ARE THE ORDER. DO NOT REINTERPRET, NARROW, SOFTEN OR "OPTIMISE" THEM.** "Trace Horus's body and redraw" means **TRACE THE WHOLE BODY AND REDRAW IT** — not "match the outer width", not "fix only the outline", not "adjust a few pixels".
> - **IF YOU THINK A SMALLER OR EASIER VERSION IS ENOUGH, YOU ARE WRONG. DO THE WHOLE THING.**
> - **IF YOU ARE UNSURE WHAT THE USER MEANT, ASK BEFORE YOU DRAW. NEVER GUESS AND NEVER PICK THE CHEAPER READING.**
> - **BEFORE YOU START, WRITE BACK THE USER'S ORDER WORD FOR WORD, THEN WHAT YOU WILL DO FOR EACH PART OF IT.** If your plan drops or shrinks any part, it is wrong.
> - **CHANGING THE TASK YOU WERE GIVEN INTO A DIFFERENT TASK = REJECTED. EVERY TIME.**
> - **IF YOU CANNOT OPEN OR READ A PICTURE THE USER GAVE YOU, SAY SO RIGHT AWAY AND ASK FOR THE FILE (PNG in the repo or a Drive link). NEVER GUESS WHAT IT SHOWS. NEVER SAY "I MATCHED IT" ABOUT A PICTURE YOU DID NOT SEE.** Claiming you followed something you never read is a lie, and it is worse than asking.

> # ⚠️ READ THIS FIRST — NON-NEGOTIABLE
> ## THE FINAL IDLE AND WALK SPRITES ARE THE ANSWER. COPY THEIR LOOK EXACTLY. DO NOT REDESIGN ANYTHING.
> 1. **OPEN THE ORIGINAL FILES BEFORE YOU DRAW** — `docs/art/chibi-refresh/final/<who>/idle/` and `walk/`, same direction. Not from memory, not from a description, not from your last attempt.
> 2. **TRACE ON THE GUIDES. DO NOT DRAW FREEHAND.** Head and face: `head-check.py --guide` (the idle's own head, faded, at the right place and size). Colours: `palette/palette.md` + `palette/eyes.png` only. Hair: `notes/hair-reference.png`.
> 3. **SAME FACE SHAPE, SAME HEAD SIZE, SAME LINE THICKNESS, SAME HAIR DETAIL, SAME COLOURS, SAME FACE MARK as the idle.** Only the pose changes. Never narrower, pointier, longer, thinner-lined, more detailed, paler or greyer.
> 4. **NO EXTRA DETAIL.** Never draw hair or shading finer than the idle/walk.
> 4-1. **DRAW EVERY FRAME NEW.** Frame 0 and frame 1 are two separate drawings. **NEVER copy frame 0 and stretch, shift, warp or recolour it into frame 1.** No frame tricks. `sprite-review` flags copied frames. (Only exception: an action where only a hand or foot moves — keep the body, redraw just that hand or foot.)
> 5. **"sprite-review 0 issues" IS NOT "DONE".** Before sending, put your picture next to the idle at the same scale and look. If anything differs from the idle, fix it first.
> 6. **If you did not open the idle and trace on a guide, the drawing is rejected.**

> **길 안내** — 입구 [START](ASTRA-START.md) · 할 일 [PLAN](ASTRA-PLAN.md) · 캐릭터 그림 [SPRITE](ASTRA-SPRITE.md) · 맵 [MAP](ASTRA-MAP.md) · 공통 규칙 [HANDOFF](ASTRA-HANDOFF.md)
> **지금 여기: 입구.** 매번 이 문서부터 열고, 아래 순서대로 다음 문서로 간다.

> ## 🪜 THE LADDER — EVERY CHARACTER DRAWING, EVERY TIME. SKIP ONE STEP AND IT IS REJECTED.
> **① READ THE DOCS. ACTUALLY READ THEM.** The PLAN spec, the SPRITE rules, hair, expressions. **OPEN** the idle, the walk and the reference pictures. Opening a file list is NOT opening a picture.
> **② SEND THE PROPOSAL AND WAIT FOR OK.** The pre-drawing form (SPRITE ②). **NO OK, NO DRAWING.**
> **③ DRAW ON TOP OF THE IDLE AND WALK.** Same direction, laid underneath. Draw it new — **DO NOT CUT AND PASTE. DO NOT FREEHAND. DO NOT REDESIGN.**
> **④ RUN THE CHECK.** `sprite-review.py` must say 0. **0 IS THE MINIMUM, NOT THE FINISH.**
> **⑤ LOOK AT IT YOURSELF.** Walk → idle → your frames, as the chain GIF, next to the idle at the same scale. **DOES IT LOOK LIKE THE SAME CHARACTER IN A REAL GAME? IF NOT, FIX IT. DO NOT SEND IT.**
> **⑥ REPORT.** What you checked AND what you did not. Never write "done" for something you did not look at.

**아스트라 문서는 다섯 개다. 각 문서 맨 위의 길 안내에 "다음에 볼 것"이 있다.** 현재 대화에서 사용자가 내린 지시가 문서보다 우선한다.

## 매번 이 순서로

1. **main을 받는다.** `git fetch` 후 main. 오푸스도 같은 main에 올린다. 강제 푸시하지 않는다.
2. **[ASTRA-PLAN](ASTRA-PLAN.md)의 "지금" 표를 본다.** 지금 내 차례인 작업과 그 명세가 있다.
3. **작업 종류에 따라 하나를 연다.**

| 작업 | 열 문서 | 그 문서에서 하는 일 |
|---|---|---|
| **캐릭터 그림** (동작, 수정, 표정, 정지·걷기) | [ASTRA-SPRITE](ASTRA-SPRITE.md) | 작업 카드 ①~⑤: 파일 열기 → **그리기 전 확인서를 보내 OK 받기** → 하지 말 것 → `sprite-review.py` 볼 것 0개 + 눈 확인 → 보고 |
| **맵·배경** (새 세부맵, 장면 수정, 두아트, 새 지역) | [ASTRA-MAP](ASTRA-MAP.md) | 기준 파일 열기 → 계획 확인 → 맵 규칙 → 맵 검수 → 보고 |
| **말풍선·효과** | [ASTRA-SPRITE](ASTRA-SPRITE.md) | 캐릭터 그림과 같은 카드(화풍·외곽선 기준이 같다) |

4. **처음이거나 오랜만이면 [ASTRA-HANDOFF](ASTRA-HANDOFF.md)(공통 규칙)를 한 번 읽는다.** 일하는 방식, 모든 그림 공통 검수, 저장소·전달·보고.

## 절대 하지 않는 것 (모든 작업)

- 계획 확인 없이 새 장면·새 동작·여러 장 생성을 시작하기.
- 채택 파일이 아닌 것을 베이스로 쓰기, 요청 밖을 바꾸기.
- 런타임 파일(`src/`, `data/`, `tools/maps/`) 고치기. 게임 적용은 오푸스가 한다.
- 검사 통과를 완성 근거로 보고하기. 확인하지 않은 것을 "완료"라고 쓰기.
