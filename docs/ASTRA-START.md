# 아스트라 입구 — 여기서 시작한다

> # ⚠️ READ THIS FIRST — NON-NEGOTIABLE
> ## THE FINAL IDLE AND WALK SPRITES ARE THE ANSWER. COPY THEIR LOOK EXACTLY. DO NOT REDESIGN ANYTHING.
> 1. **OPEN THE ORIGINAL FILES BEFORE YOU DRAW** — `docs/art/chibi-refresh/final/<who>/idle/` and `walk/`, same direction. Not from memory, not from a description, not from your last attempt.
> 2. **TRACE ON THE GUIDES. DO NOT DRAW FREEHAND.** Head and face: `python3 tools/art/line-guide.py` (the idle's own head lines in red, at the right place and size) and `head-check.py --guide`. Colours: `palette/palette.md` + `palette/eyes.png` only. Hair: `notes/hair-reference.png`.
> 3. **SAME FACE SHAPE, SAME HEAD SIZE, SAME LINE THICKNESS, SAME HAIR DETAIL, SAME COLOURS, SAME FACE MARK as the idle.** Only the pose changes. Never narrower, pointier, longer, thinner-lined, more detailed, paler or greyer.
> 4. **NO EXTRA DETAIL.** Never draw hair or shading finer than the idle/walk.
> 5. **"sprite-review 0 issues" IS NOT "DONE".** Before sending, put your picture next to the idle at the same scale and look. If anything differs from the idle, fix it first.
> 6. **If you did not open the idle and trace on a guide, the drawing is rejected.**

> **길 안내** — 입구 [START](ASTRA-START.md) · 할 일 [PLAN](ASTRA-PLAN.md) · 캐릭터 그림 [SPRITE](ASTRA-SPRITE.md) · 맵 [MAP](ASTRA-MAP.md) · 공통 규칙 [HANDOFF](ASTRA-HANDOFF.md)
> **지금 여기: 입구.** 매번 이 문서부터 열고, 아래 순서대로 다음 문서로 간다.

> **지시 사다리 — 캐릭터 그림은 한 칸도 건너뛰지 않는다**
> **① 문서 자세히 확인** (PLAN 명세, SPRITE 규칙·머리·표정, 정지·걷기·기준 그림을 실제로 연다) → **② 제안서**(그리기 전 확인서를 보내 OK) → **③ 대고 그리기**(같은 방향 정지·걷기를 밑에 깔고 새로 그린다, 잘라 붙이지 않는다) → **④ 검사**(`sprite-review.py` 볼 것 0) → **⑤ 직접 검수**(걷기→정지→새 그림 이어 보기 GIF로, 실제 게임 스프라이트처럼 자연스러운지 눈으로) → 보고

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
