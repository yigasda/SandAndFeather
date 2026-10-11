# 스프라이트 검토 — sleep-trio-v191

기준 그림: sleep · 그림 8장

## 볼 것 0개

- 없음 (숫자로 걸린 것만 없다는 뜻이다. 시트를 직접 본다)

## 캐릭터·자세별

| 그림 | 프레임별 키·머리 맞춤 | 판정 | 시트 |
|---|---|---|---|
| horus sleep | 0: 키 108% / 1: 키 108% (누운 그림: 머리는 머리 시트로) | 볼 것 없음 | [동작](horus-sleep-action.png) · [0↔1](horus-sleep-onion-01.png) · [기준](horus-sleep-reference.png) · [머리](horus-sleep-0-head.png) |
| horus sleep-side | 0: 키 106% / 1: 키 105% (누운 그림: 머리는 머리 시트로) | 볼 것 없음 | [동작](horus-sleep-side-action.png) · [0↔1](horus-sleep-side-onion-01.png) · [기준](horus-sleep-side-reference.png) · [머리](horus-sleep-side-0-head.png) |
| set sleep | 0: 키 111% / 1: 키 111% (누운 그림: 머리는 머리 시트로) | 볼 것 없음 | [동작](set-sleep-action.png) · [0↔1](set-sleep-onion-01.png) · [기준](set-sleep-reference.png) · [머리](set-sleep-0-head.png) |
| set sleep-side | 0: 키 103% / 1: 키 102% (누운 그림: 머리는 머리 시트로) | 볼 것 없음 | [동작](set-sleep-side-action.png) · [0↔1](set-sleep-side-onion-01.png) · [기준](set-sleep-side-reference.png) · [머리](set-sleep-side-0-head.png) |

## 피부색

| 파일 | 판정 | 기본 / 그림자 / 밝은 쪽 ΔE |
|---|---|---|
| horus-sleep-0.png | 같음 | 0.0 / 2.0 / 0.0 |
| horus-sleep-1.png | 같음 | 0.0 / 2.0 / 0.0 |
| horus-sleep-side-0.png | 같음 | 0.0 / 2.7 / 0.0 |
| horus-sleep-side-1.png | 같음 | 0.0 / 2.7 / 1.5 |
| set-sleep-0.png | 같음 | 0.0 / 0.0 / 0.0 |
| set-sleep-1.png | 같음 | 0.0 / 0.0 / 0.0 |
| set-sleep-side-0.png | 같음 | 0.0 / 0.0 / 0.0 |
| set-sleep-side-1.png | 같음 | 0.0 / 1.7 / 1.6 |

시트 읽는 법: action = 정지 | 0 | 1(파란 선 = 발 기준선), onion = 겹친 윤곽(빨강 A, 파랑 B) · 바뀐 픽셀 · 윤곽만 다른 곳, mirror = 왼쪽과 뒤집은 오른쪽(팔 길이·손 크기), reference = 채택된 기준 그림과 겹침(구도·원근·머리 위치), head = 정지 머리 윤곽(빨강).
머리 맞춤 ×1.00 = 정지와 같은 크기. 채택된 쪼그린·앉은 그림도 ×1.03~1.11로 재진다.
