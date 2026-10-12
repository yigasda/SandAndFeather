# 스프라이트 검토 — sleep-side-inhale-v200

기준 그림: sleep · 그림 4장

## 볼 것 0개

- 없음 (숫자로 걸린 것만 없다는 뜻이다. 시트를 직접 본다)

## 캐릭터·자세별

| 그림 | 프레임별 키·머리 맞춤 | 판정 | 시트 |
|---|---|---|---|
| horus sleep-side | 0: 키 99% / 1: 키 100% (누운 그림: 머리는 머리 시트로) | 볼 것 없음 | [동작](horus-sleep-side-action.png) · [0↔1](horus-sleep-side-onion-01.png) · [기준](horus-sleep-side-reference.png) · [머리](horus-sleep-side-0-head.png) |
| set sleep-side | 0: 키 100% / 1: 키 99% (누운 그림: 머리는 머리 시트로) | 볼 것 없음 | [동작](set-sleep-side-action.png) · [0↔1](set-sleep-side-onion-01.png) · [기준](set-sleep-side-reference.png) · [머리](set-sleep-side-0-head.png) |

## 피부색

| 파일 | 판정 | 기본 / 그림자 / 밝은 쪽 ΔE |
|---|---|---|
| horus-sleep-side-0.png | 같음 | 2.1 / 2.9 / 0.0 |
| horus-sleep-side-1.png | 같음 | 1.9 / 2.0 / 1.5 |
| set-sleep-side-0.png | 같음 | 2.1 / 2.1 / 2.0 |
| set-sleep-side-1.png | 같음 | 2.1 / 2.1 / 2.0 |

## 머리색

| 파일 | 판정 | 어둠 / 중간 / 밝음 ΔE | 기준 | 견본 |
|---|---|---|---|---|
| horus-sleep-side-0.png | 같음 | 0.9 / 0.3 / 0.2 | horus-right.png | [견본](horus-sleep-side-0-hair.png) |
| horus-sleep-side-1.png | 같음 | 1.7 / 1.1 / 2.1 | horus-left.png | [견본](horus-sleep-side-1-hair.png) |
| set-sleep-side-0.png | 같음 | 0.3 / 0.2 / 0.2 | set-right-1.png | [견본](set-sleep-side-0-hair.png) |
| set-sleep-side-1.png | 같음 | 1.2 / 1.2 / 1.2 | set-left.png | [견본](set-sleep-side-1-hair.png) |

시트 읽는 법: chain = 걷기 0·1·2 → 정지 → 새 프레임 → 정지(같은 배율, 파란 선 = 발), 같은 이름의 .gif(큰 크기)와 -game.gif(게임 크기)로 이어 재생해 비율·동작이 툭 끊기지 않는지 본다. action = 정지 | 0 | 1(파란 선 = 발 기준선), onion = 겹친 윤곽(빨강 A, 파랑 B) · 바뀐 픽셀 · 윤곽만 다른 곳, mirror = 왼쪽과 뒤집은 오른쪽(팔 길이·손 크기), reference = 채택된 기준 그림과 겹침(구도·원근·머리 위치), head = 정지 머리 윤곽(빨강).
머리 맞춤 ×1.00 = 정지와 같은 크기. 채택된 쪼그린·앉은 그림도 ×1.03~1.11로 재진다.
