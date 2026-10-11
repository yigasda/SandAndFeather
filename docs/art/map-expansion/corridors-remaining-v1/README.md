# 긴 회랑 나머지 4장 — 140~143

2026-10-11. **사용자 “회랑 다 채택”으로140~143번 전부 최종 채택. 게임 미적용.** 앞서139 안쪽 복도와138 우물 마당 밤도 채택됐다. Drive의 기존 ZIP은 채택 전 문서가 들어 있는 전달본이다. PNG는 동일하며 현재 채택 상태는 이 README와 manifest가 우선한다.

| 번호 | 장면 | 전달 PNG | 전체 전후 비교 |
|---|---|---|---|
| 140 | 중앙 회랑 | [central-expanded.png](central-expanded.png) | [Drive](https://drive.google.com/file/d/15G6VFCgsSY0rVnDMPRipE5DA2kMH-dww/view) |
| 141 | 동쪽 회랑 | [east-expanded.png](east-expanded.png) | [Drive](https://drive.google.com/file/d/1j9xyimTVtiLVeX9-pWu74S5Huc82Kiqh/view) |
| 142 | 서쪽 회랑 | [west-expanded.png](west-expanded.png) | [Drive](https://drive.google.com/file/d/1JjLCHOZjVO2e8o7_6b9jZTJ1BaSr02Rp/view) |
| 143 | 방문 회랑 | [rooms-expanded.png](rooms-expanded.png) | [Drive](https://drive.google.com/file/d/1hnpTUiywNahBrnEYWJwezACiaS41_P8B/view) |

## 크기와 보존

네 장 모두 **2492×887**. 좌우 각160px, 위64px, 아래99px를 추가했다. `../exits-v2/`의 각 원본2172×724를 **(160,64)**에 그대로 놓았다. 원본 영역은 리사이즈 없이 RGB 픽셀 변경0이다. 중앙 아치·성소 문·서쪽 계단 통로·방문 세 개·원래 계단·가구·항아리 제거 상태는 그대로다. 회랑은 낮 PNG만 제작하며 게임이 밤을 어둡게 처리한다.

## 오푸스 전달

- 사용할 최종 채택 파일은 이 폴더 최상위의 `*-expanded.png` 네 장이다. `sources/`와 `previews/`는 게임 파일이 아니다.
- [coordinates.json](coordinates.json): 새 그림 좌표 기준 문턱, 앞쪽 통로 바닥, 안쪽 바닥 다각형, 제안 출구·도착점. 내부 문/아치/계단은 시각적 문턱과 기존 게임 좌표의 단순 평행이동을 구분했다.
- 내부 좌표 변환은 원본 픽셀좌표에 (+160,+64). 기존27×9 논리좌표는 먼저 원본2172×724로 환산한다. 새 맵은 약31×11칸이며, 정확한 픽셀 크기를 보존한다.
- 끝 통로는 앞쪽 폭 약140~150px, 안쪽으로 약100~120px 깊이이며 투시에 따라 좁아진다. 중앙·동·서의 좌우 도착 제안은 (145,420)/(2352,420), 방문 회랑은 (125,425)/(2367,425).
- 좌표는 **제안**이다. 새 외곽 벽/기둥의 충돌과 가림, 중앙 아래 출구와 방문 계단 아래 연장부의 트리거는 적용 시 별도 조정해야 한다. 기존 출구 사각형을 옮긴 값이 새 캔버스 끝까지 자동으로 연장되는 것은 아니다.
- `tools/maps/`, `data/`, `src/`는 이번 작업에서 수정하지 않았다.

## 확인과 한계

[qa.json](qa.json)에 크기와 원본 픽셀 비교를 기록했다. 같은 배율의 전체 전후 비교, 양끝2배 확대, 약160px 보이는 키의 셋소호 정적 배치, 폰폭960px 크롭을 확인했다. 방문 회랑은 계단 밑부분까지 확인했다. 런타임 이동·충돌·가림은 미검증이다. 정적 배치 이미지를 인게임 실행 증거로 취급하지 않는다.

## 제작 소스와 재현

139 승인 확장본의 같은 구조를 재사용하고, 다른 구조인 중앙 전면 난간·방문 회랑 외곽은 원본 기준 국소 확장 소스를 사용했다. 원본 밖에만 경계 정렬과 색 차이 보정을 적용했다. 흐린 알파 합성으로 두 그림을 겹치지 않는다.

- `sources/central-outpaint.png`: 중앙 난간·상하 확장 소스. `central-reuse.png`: 139 승인본 복사, 윗부분 양끝에 사용.
- `sources/east-outpaint.png`: 139 승인본 복사. 기존 동쪽 회랑의 붉은 깔개는 원본 그대로 유지.
- `sources/west-outpaint.png`: 139 외곽 중 작은 적색 영역만 서쪽 원본의 청색 팔레트로 조정. 최종 청색 보 띠는 원본의 같은 띠를 사용.
- `sources/rooms-outpaint.png`: 방문 회랑의 국소 양끝 확장을 기준으로 위·아래를 확장한 소스. `rooms-left/right-edit.png`는 그 전 단계 소스이며 납품본이 아니다.
- `*-registration.json`: 원본 경계 정렬값. `register.py`는 분석값만 쓰며 이미지 파일을 출력하지 않는다.

저장된 소스로 최종본을 재현하는 순서(저장소 루트에서):

```sh
cd docs/art/map-expansion/corridors-remaining-v1
node build.cjs central
node build.cjs east
node build.cjs west
node build.cjs rooms
python3 tone-analysis.py
node tone.cjs
node west-band.cjs
node previews.cjs
```

`tone.cjs`는 누적 색 보정이므로 재실행할 때 반드시 `build.cjs`부터 다시 시작한다. `guides.cjs`, `assemble.cjs`, `west-palette.cjs`는 제작 당시 가이드/소스 구성 도구이며 위 최종 재현 순서에 포함하지 않는다. 실패한 동/서 국소 생성 소스는 납품 폴더에서 제외했다.
