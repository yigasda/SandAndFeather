# 호루스 — 원본·가이드 바로 열기

## 최우선: 호루스 재작화 입력 제한 (2026-10-14)

- 호루스는 처음부터 다시 그린다. 이전 전투 시안의 동세·표정도 참고하거나 추출·재사용하지 않는다. 기존 전투 출처표는 보관 기록일 뿐 이번 작화 참고가 아니다.
- 생성에 넣을 수 있는 이미지는 채택된 뒷머리 제거 대기 0, 원본 걷기·정지·잠자기, 이 원본들에 근거한 오푸스 전신·머리 가이드뿐이다. 이전 전투 PNG·크롭·비교판·그것을 따라 만든 동세 가이드는 넣지 않는다.
- 새 동작·표정은 현재 동작 명세의 글을 바탕으로 새로 구성한다. 이전 전투 그림을 눈으로 보고 재현하지 않는다. 대기 0의 채택 외형은 보존한다.
- 가이드 첨부 자체는 합격 근거가 아니다. 첫 새 그림을 원본과 같은 캐릭터 배율로 비교하고 머리·몸·팔다리 비율, 색, 외곽선, 하이라이트 양이 어긋나면 다음 장을 생성하지 않는다. 실패한 기준으로 묶음을 끝까지 만들지 않는다.
- 실제 생성 참고 경로를 기록하고 호출 직전에 허용 목록과 대조한다. 구 전투 참고를 허용한다는 이전 문구보다 이 지시가 우선한다.


이 페이지에서 실제 이미지를 열고 작업한다. 설명만 읽고 그리지 않는다. **외형·비율은 정지·걷기, 기존 전투는 동세·표정 의도만 참고한다.**

## 정지·걷기·전신 가이드

| 방향 | 정지 | 걷기 0·1·2 | 오푸스 전신 가이드 |
|---|---|---|---|
| 정면 | [원본](art/chibi-refresh/final/horus/idle/horus-front.png) | [0](art/chibi-refresh/final/horus/walk/horus-front-0.png) · [1](art/chibi-refresh/final/horus/walk/horus-front-1.png) · [2](art/chibi-refresh/final/horus/walk/horus-front-2.png) | [가이드](art/chibi-refresh/pose-guides/horus-front-guide.png) |
| 왼쪽 | [원본](art/chibi-refresh/final/horus/idle/horus-left.png) | [0](art/chibi-refresh/final/horus/walk/horus-left-0.png) · [1](art/chibi-refresh/final/horus/walk/horus-left-1.png) · [2](art/chibi-refresh/final/horus/walk/horus-left-2.png) | [가이드](art/chibi-refresh/pose-guides/horus-left-guide.png) |
| 오른쪽 | [원본](art/chibi-refresh/final/horus/idle/horus-right.png) | [0](art/chibi-refresh/final/horus/walk/horus-right-0.png) · [1](art/chibi-refresh/final/horus/walk/horus-right-1.png) · [2](art/chibi-refresh/final/horus/walk/horus-right-2.png) | [가이드](art/chibi-refresh/pose-guides/horus-right-guide.png) |

## 색·눈·머리

- [색 표](art/chibi-refresh/palette/palette.md)에서 **호루스·해당 방향** 사용. [팔레트 그림](art/chibi-refresh/palette/palette-horus.png).
- [눈 견본](art/chibi-refresh/palette/eyes.png) · [원본 머리 기준](art/chibi-refresh/notes/hair-reference.png).
- [상세 외형](ASTRA-SPRITE.md): A의 비율·색·눈 규칙, B의 해당 캐릭터 머리 설명과 금지 사항을 확인한다.
- [삐죽머리 참고](art/chibi-refresh/notes/horus-hair-short.jpg). 평범한 스포츠 머리로 바꾸지 않는다.
- **문양 모양이 헷갈리면 [채택 잠자기 정면 0](art/chibi-refresh/sleep-trio-v220/png/horus-sleep-0.png)을 직접 본다.** 캐릭터 왼쪽 눈에는 문양 없음. 화면 좌우와 혼동하지 않는다.

## 동작에 맞춘 머리 가이드

- [오푸스 가이드 사용법](art/chibi-refresh/pose-guides/README.md) · [머리 가이드 코드](../tools/art/head-check.py).
- 저장소 루트에서 `python3 tools/art/head-check.py --guide --who horus --view 방향 --at x,y --angle 각도 --size 1.0 --out 출력폴더`로 만든다. 값은 동작에 맞게 정하고 기록한다.
- 기본 도구는 620×720, 머리 범위는 상단 45%다. 완전한 얼굴 마스크나 3/4 투시 생성기가 아니다. 전투 캔버스 배치·관절 길이 적용은 [가이드 한계](ASTRA-DRAW-REFERENCE.md#가이드-한계와-첫-샘플-판정)를 확인한다.

## 이번 동작·표정과 그리기

- [현재 작업](ASTRA-DRAW-STATE.md) → [동작별 자세·표정](ASTRA-PLAN.md). 해당 캐릭터·동작 칸을 읽는다.
- 전투 동세 한눈에: [239 비교표](art/chibi-refresh/combat-reference-sheets/239-combat-latest-54.png) · [240 정지 정면과 나란히](art/chibi-refresh/combat-reference-sheets/240-combat-54-vs-idle-front.png). 동세·표정 의도만, 잘라 쓰지 않는다.
- [전투 동세 파일·해시 목록](ASTRA-COMBAT-POSE-SOURCES.json): 외형 기준이 아니다. 파일이 로컬에만 있을 수 있으므로 실제 존재와 해시를 확인한다.
- 기준을 확인했으면 **[그리기·비교](ASTRA-DRAW-CHECK.md)**로 진행한다. 추가 문서 순회를 반복하지 않는다.
