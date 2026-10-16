# 15번 열주홀 — 공간 구성·장치 배치 재사용 기록

2026-10-16. 사용자가 이번 프롬프트는 상세히 보존하도록 요청함. **두 그림 모두 검토안이며 최종 채택은 아직 아님.** 기존 공통 프롬프트 문서는 변경하지 않았다.

## 파일과 생성 순서

- `raised-receiver.png`: 공간 재설계 최초 생성 원본. 사용자가 “이것도 괜찮지 않아? 이어지는데”라고 다시 검토한 그림. 뒤쪽 높은 단에 원형 수신부가 있다.
- `revised.png`: 그 원본을 입력해 수신부를 아래층으로 옮기고 오른쪽 벽의 중복 태양 장식을 제거한 수정안.
- `prompt.json`: 실제 생성에 사용한 base와 edit 전문. 아래에도 읽기 편하게 그대로 수록했다.
- `spatial-reference.jpg`: 사용자가 공간 분위기 참고로 준 그림. 장치 배치 정답이 아니며 기둥에 있는 인물·문양을 따라하지 말라고 명시했다.

## 유지해야 할 작화 방향

3/4 내려다보는 쯔꾸르풍 게임 배경, 가로로 넓은 고대 매몰 신전. 높은 뒤쪽 열주와 낮은 단차, 왼쪽 계단, 비어 있는 넓은 중앙 홀로 깊이를 만든다. 영화식 눈높이 카메라나 현대적인 3D 게임 화면으로 바꾸지 않는다.

기둥은 수를 절제하고 중앙 이동 공간을 비운다. 온전한 높은 기둥, 깨진 높은 기둥, 낮은 잔해의 높이와 파손 정도를 불균일하게 둔다. 모두 같은 온전한 연꽃 기둥을 반복하지 않는다. 기둥 몸통은 낡은 사암과 단순한 퇴색 띠 중심이며 참고 그림의 인물·상형문자를 복제하지 않는다. 벽화는 뒤쪽 벽면에 제한하고 안료 탈락과 오래된 균열을 표현한다. 새 앙크 문양은 넣지 않는다.

따뜻한 꿀빛·크림색 사암, 바랜 청록 장식, 부분적인 천장 붕괴에서 들어오는 햇빛을 사용한다. 모래는 벽가와 잔해 주위에 쌓고 중앙 바닥을 잔해로 채우지 않는다. 문턱과 계단 바닥이 충분히 보이는 넓은 입출구를 유지한다.

## 장치 배치 의도

명세상 오른쪽은 02 방향 입구, 왼쪽 깊은 계단은 16 방향 진행로다. 입구 가까운 오른쪽 공간에서 광원 → 반사판 → 수신부를 한눈에 읽게 하고, 좌우 주 이동로와 조작 공간이 충돌하지 않도록 중앙을 비워 둔다. 실제 이동 판정은 아직 검증하지 않았다.

작고 낮은 석재 광원 구멍, 청동 U자 반사판 회전 받침, 원형 수신부 프레임을 서로 다른 실루엣으로 구분한다. 긴 기둥이나 계단이 예상 광로를 가로막지 않는 구성을 목표로 한다. 배경에는 받침과 고정 구조를 두고, 움직이는 거울 면·손잡이, 수신 상태, 광선·활성 효과는 별도 에셋으로 구성할 계획이다. 현재 그림만으로 장치 작동을 구현한 것은 아니다.

첫 연습은 광원 1·반사판 1·수신부 1이 기준이다. 두 번째 반사판은 첫 테스트 이후 필요할 때만 검토한다. 봉인석, 문양 조합 잠금, 압력판, 시간 제한, 복잡한 보상 장치를 새로 덧붙이지 않는다. 광원/거울/수신부는 P03/P01·P02/P04, 광선과 상태 효과는 P14 관련 규칙을 다시 확인하고 제작한다.

## 두 배치안의 차이와 미확정점

| 구분 | 높은 단 수신부 원본 | 아래층 수신부 수정안 |
|---|---|---|
| 그림 | raised-receiver.png | revised.png |
| 공간 읽힘 | 계단과 뒤쪽 단이 연결돼 높이 변화가 살아 있음 | 세 장치가 주 바닥 높이에 모여 관계가 단순함 |
| 이동 | 계단으로 연결되는 구성 | 같은 층에서 접근하는 구성 |
| 광학 설계 | 높이 차이를 고려한 거울 기울기·광선 높이 설계 필요 | 같은 높이의 회전 입문 규칙에 맞추기 쉬움 |
| 추가 차이 | 오른쪽 벽에 장식 태양 원판이 남아 있음 | 수신부와 혼동할 수 있는 태양 원판 제거 |

**계단으로 걸어갈 수 있다는 것과 광선이 연결된다는 것은 별개다.** 높은 단 원본도 후보로 유지한다. 현재 엔진이 높이·기울기를 지원한다고 가정하지 않는다. 낮은 단 버전을 최종 채택으로 단정하지 않는다.

최초 프롬프트는 같은 층 배치를 요구했지만 실제 생성 결과는 수신부를 위층에 배치했다. 따라서 원본의 단차를 원래부터 계획한 퍼즐 구현이라고 기록하지 않는다. 수정문 안 좌표는 생성 모델에 전달한 대략적인 위치 지시이며 실제 게임 좌표나 검증된 광선 끝점이 아니다.

## 재개할 때

이 문서와 두 PNG를 먼저 비교하고 최신 사용자 선택을 확인한다. 공통 프롬프트는 그대로 두고 이 작업의 전문을 복사해 다음 개별 요청에 맞춘다. 선택되지 않은 그림을 덮어쓰지 않는다. 게임 적용 전에는 아바타 배율, 문턱·계단 통과, 장치 조작 위치, 실제 광로와 가림 관계를 별도로 검증해야 한다. 이번 저장 작업에서는 새 생성이나 런타임 변경을 하지 않았다.

## 최초 생성 프롬프트 전문

```text
Create ONE new map15 ancient Egyptian buried temple hall concept inspired by attached reference's SPATIAL RICHNESS: high monumental rear columns, rear elevated gallery, broad central open hall, accessible stairs at left, large warm sunlight patches and worn architecture. Same refined 3/4 overhead RPG Maker/tsukuru painted pixel-cluster GAME MAP view, landscape2:1. User explicitly says reference device layout is NOT correct, redesign devices. CRITICAL USER EXCLUSION: do NOT copy ANY FIGURES, HIEROGLYPHS OR CARVED PATTERNS ON COLUMNS. Column shafts plain weathered sandstone, only subtle faded simple horizontal turquoise/ochre bands, simple lotus capitals allowed; no human figures or inscription on any column. NO ANKH anywhere including wall murals. Keep restrained murals only on BACK WALL panels, age and pigment loss, not fake glyph clutter. Rear raised walkway only one low level with wide central steps, three rear column positions but ONE intact tall, ONE heavily chipped capital/uneven surviving shaft, ONE half-height broken stump; asymmetrical heights and wear, not identical repeated flower mushrooms. Low broken shafts only at foreground far edges, no pillars in central floor. Spacious rectangular hall central floor kept clear. Two actual exits ONLY: wide RIGHT-wall entry to02, LEFT deeper stair exit to16. No extra bottom door; low broken foreground wall frames floor. All thresholds sufficiently wide, complete visible floors, no edge-cropped jambs. Partial roof collapse, sand near walls, isolated rubble off route, no giant rubble carpet. IMPORTANT tutorial puzzle SAME FLOOR LEVEL in open right-center bay: ONE small source aperture in a low right-side stone mount oriented toward center; ONE bronze mirror pivot support on low pedestal center-right, EMPTY of movable mirror disc; ONE modest sun receiver fixed frame on inward-facing low wall at rear of SAME lower-floor bay, empty round state insert. Source-mirror-receiver triangular unobstructed sightlines, no pillar/stair/raised platform crossing potential rays. Receiver is NOT at elevated back-left mural altar as in reference. Do not copy glowing blue altar, blue crystals, beams or extra devices from reference. No beam or success glow baked in, no seal stones, glyph combination lock, pressure plates, reward or extra mechanics. Main path right-to-left remains wide beside tutorial bay, controls observable from entrance. Wall relief sun outside device is decorative only avoid confusing duplicate receivers. One sun-shaped receiver frame total. Worn cream/honey sandstone, warm peach/umber shadow, modest faded turquoise trim, coherent old masonry, clear planes, no polished residential white columns/red stripe scheme. No sky/horizon, modern characters, UI, text, arrows, grid. One complete coherent game background, not collage, not cinematic third-person screenshot.
```

## 국소 수정 프롬프트 전문

```text
Make ONE small local correction to this exact image, preserve all architecture, columns, murals, stairs, lighting and floor. The round sun receiver currently stands on upper raised gallery at x~1250 y~270 in1774x887 image. Move THAT receiver and its compact stone mounting frame down onto MAIN LOWER FLOOR at about x~1250 y~450, just in front of the raised gallery edge, behind the existing U-shaped mirror stand (mirror at x1250 y540). The receiver mounting frame must stand entirely on lower floor, base near y480, compact enough not to overlap mirror. Restore old receiver spot upstairs with ordinary matching gallery flagstone and rear wall, no duplicate round target. Keep receiver center roughly same physical height above lower floor as bronze mirror pivot and source aperture at right. Preserve wide main walkway. Remove the extra decorative bright sun disk on far right wall, replace only disk relief with plain weathered stone panel so receiver is the ONLY sun target. Do not add beams, mirror face, new glyphs, characters, or change composition. Column shafts stay plain no figures or hieroglyphs. Output exact same complete map dimensions.
```
