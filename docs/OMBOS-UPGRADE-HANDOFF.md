# 옴보스 전체맵 품질 개선 — 낮 승인·밤 검토

2026-10-10. 사용자가 세부맵을 승인하고 오푸스에게 적용을 맡긴 뒤, 전체맵이 세부맵과 어울리도록 품질 개선 시안 제작을 요청했다. 배치를 살리고 재질·디테일을 높이는 방향이다. **사용자가 낮 v1을 승인하고 밤 버전 제작을 요청했다. 낮은 승인 완료, 밤 v1은 새 검토본이다. 게임 배경을 덮어쓰지 않았다.**

- [1차 낮 PNG](art/map-expansion/ombos-upgrade-v1-day.png)
- [Drive 전체 모바일](https://drive.google.com/file/d/1Qqa6ISmSdxcR6ZfVffyprx4xF93uG-ov/view?usp=drivesdk)
- [Drive 신전 주변 확대](https://drive.google.com/file/d/1LK1UejAro7z0DLMwV6OitMrY9j3nxrLk/view?usp=drivesdk)
- [Drive 원본](https://drive.google.com/file/d/1Dv3ECmc8brL-gR2-ZqyJsArkmeAJyaZ4/view?usp=drivesdk)
- [현재 게임 승인 배경](../data/art/ombos-approved.png)

## 밤 v1 — 새 검토본

- [밤 PNG](art/map-expansion/ombos-upgrade-v1-night.png)
- [Drive 밤 전체 모바일](https://drive.google.com/file/d/1ehq3L2STtaR3Xc8d3jD5at5Fz1Kbhn8V/view)
- [Drive 밤 신전 주변 확대](https://drive.google.com/file/d/1eeMFVWOIplhT-ZmWtH9pgMTrJ6FvRRY0/view)
- [Drive 밤 원본](https://drive.google.com/file/d/14P6OVVAADBfpws6jonrM4IQpgooZogA3/view)

승인된 낮 v1을 직접 편집해 밤으로 바꿨다. 건물·길·훈련장·신전·동굴·시장·밭·선착장의 큰 배치를 유지하며, 차가운 달빛과 신전 화로·집 문과 창의 따뜻한 빛을 함께 썼다. 강물에는 은은한 반사를 넣고 길과 출입구의 식별성을 유지했다. 탑다운 맵 위에 별도 하늘 영역을 추가하지 않았다.

원본과 낮·밤 시안 모두 1392×1130. 확대본은 새 전체 시안을 크롭한 검토용이며 별도 맵으로 연결하지 않는다.

## 유지한 구도와 개선 방향

기존 승인 배경을 직접 편집 대상으로 삼고 승인된 우물 마당을 재질·화풍 참고로 사용했다. 상단 왼쪽 건물, 단순한 훈련장, 중앙 위 신전, 오른쪽 절벽 동굴, 중간 시장·집, 아래 밭과 녹지, 남쪽 강·선착장의 큰 배치와 길 연결을 유지하는 방향이다.

사암 벽돌과 지붕 가장자리, 목제 문·상자, 차양, 야자수, 절벽 면, 물결 표현을 세부맵과 가까운 밀도로 다듬었다. 넓고 가장자리가 불규칙한 보도를 유지하도록 했다. 낮의 외관 방향은 사용자 승인을 받았으며, 밤의 밝기·색감은 이번 검토 대상이다.

이미지 생성에 따른 세부 위치·발밑 경계 차이가 있으므로, 같은 해상도라고 기존 충돌과 출입 좌표를 그대로 확정하지 않는다. 적용 시 신전 입구, 동굴, 각 집 문, 선착장과 길의 실제 위치를 낮·밤 양쪽에서 다시 확인한다. 생성 이미지이므로 낮밤의 모든 픽셀이 동일한 위치라고 보장하지 않는다.

## 오푸스 작업과 분리

- 세부맵 내부 연결·낮밤 전환은 기존 인수인계 기준으로 진행할 수 있다. 성소 최종 승인 방향은 v6-neutral이다.
- 낮 외관은 승인됐으므로 이를 기준으로 전체맵 입구·충돌 좌표를 검토할 수 있다. 밤은 사용자 확인 뒤 연결하고, 시간 전환 때 캐릭터가 벽·물에 걸리지 않는지 확인한다.
- 이 파일은 docs/art의 검토용이다. data/art/ombos-approved.png, 맵 데이터, UI, 스프라이트, 저장 데이터는 변경하지 않았다.
- 낮·밤 원본과 모바일 검토본을 모두 저장했다. 신전 확대본은 검토용이며 게임 맵으로 쓰지 않는다.

