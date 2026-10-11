# 호루스 동공 위 하이라이트 지우기 — 아스트라 손작업

호루스는 동공 위에 흰 하이라이트가 없다(최종 정지처럼 **아래 안광만**). 아래 그림들의 동공 위 하이라이트만 지운다.

> **분홍 테두리는 위치 표시일 뿐이다.** 테두리는 하이라이트보다 넓게 쳐 놓았다. **테두리 모양대로 칠하지 않는다.** 테두리 안을 통째로 다시 칠하지 않는다.

- **지우는 법(1px씩 교체):** 테두리로 위치만 찾고, 그 안에서 **하이라이트 픽셀(흰색·연한 크림색 점) 하나하나**를 그 픽셀에서 **가장 가까운 홍채 배경 픽셀의 색**으로 1px씩 바꾼다. 한 번에 한 색으로 덮지 않는다. 동공(짙은 갈색)이나 눈꺼풀선(검정), 흰자의 색은 가져오지 않는다. 하이라이트가 아닌 픽셀은 하나도 바꾸지 않는다.
- **건드리지 않는 것:** 동공 모양, **아래 안광**, 눈꺼풀선, 흰자, 눈 아래 문양, 하이라이트가 아닌 모든 픽셀. 바뀐 픽셀 수와 위치를 보고한다(하이라이트 점 크기만큼, 파일마다 수십 px 이내).
- **하지 말 것:** 테두리 모양대로 칠하기, 흐리게 문지르기, 평균색으로 덮기(얼룩·링이 남는다), 동공을 옆으로 번지게 하기, 이미지 생성·편집 도구로 다시 그리기.
- 같은 파일 이름으로 그 폴더 `png/`에 덮어쓰지 말고 새 버전 폴더에 낸다. 전/후 확대본과 테두리 밖 픽셀 차이 0 확인을 같이 보낸다.

| 파일 | 하이라이트 위치(x, y) | 표시 |
|---|---|---|
| `pickup-trio-v182/png/horus-front-0.png` | (239, 462) · (371, 463) · (354, 465) | [보기](pickup-trio-horus-front-0.png) |
| `pickup-trio-v182/png/horus-left-0.png` | (208, 434) | [보기](pickup-trio-horus-left-0.png) |
| `pickup-trio-v182/png/horus-left-1.png` | (207, 508) | [보기](pickup-trio-horus-left-1.png) |
| `interaction-horus-v176/png/horus-right-0.png` | (395, 332) | [보기](interaction-horus-horus-right-0.png) |
| `interaction-horus-v176/png/horus-right-1.png` | (396, 334) | [보기](interaction-horus-horus-right-1.png) |
| `sit-trio-v190/png/horus-left-floor-0.png` | (211, 387) | [보기](sit-trio-horus-left-floor-0.png) |
| `sit-trio-v190/png/horus-right-bench-0.png` | (403, 353) | [보기](sit-trio-horus-right-bench-0.png) |
| `sit-trio-v190/png/horus-right-floor-0.png` | (406, 383) | [보기](sit-trio-horus-right-floor-0.png) |

줍기 182·상호작용 176은 게임에 들어가 있다. 채택되면 오푸스가 다시 넣는다. 앉기 190은 검토 중인 묶음이라 그 묶음과 함께.
