# 두아트 맵 확대 시안 — 미배포

사용자 요청: “맵이 더 컸으면 좋겠어!!”

인물·몹 없는 세부맵1/두아트/01_경계동굴.png 원본을 그대로 사용했다. 캐릭터 배율은 유지하고 맵의 게임 내 크기와 이동 거리를 늘린다. 새 지역이나 길을 그려 추가한 것은 아니다.

| 안 | 원본 px/칸 | 이전 52px 대비 가로·세로 | 면적 |
|---|---:|---:|---:|
| 이전 | 52 | 100% | 100% |
| 1 | 44 | 118.2% | 139.7% |
| 2 (추천) | 36 | 144.4% | 208.6% |

412·320 화면 너비 × 입구·계단·문 × 세 배율, 실제 게임 캡처 18장. 위치 검사 통과, 밤 배경 색 변경 0, 페이지 오류 0. compare-412-stairs와 compare-320-door를 직접 열어 비교했다. 충돌·출구·몹 배치는 미구현이며 최종 배율 미확정.

재현:
```
python3 tools/maps/duat-preview.py --out docs/consult/duat-field/scale-wide --sizes 52 44 36
node tools/st-test/duat-scale.cjs docs/consult/duat-field/scale-wide
node tools/st-test/duat-wide-panels.cjs
```

Drive: https://drive.google.com/drive/folders/1jAuvKy4_Cdi6SVYRGamnbuYl9bF48Edx
