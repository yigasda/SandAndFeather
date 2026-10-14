# 맵 +55% 시안 — 미배포

사용자 “맵 55%로 해볼가”에 따라 이전52px/칸 기준 가로·세로 1.55배로 시험. px/칸 = 52/1.55 = 33.54838709677419. 캐릭터 배율 유지, 맵 면적 2.4025배. 바로 전36px/칸(+44.4%) 안과 비교하면 가로·세로 약7.3% 더 크다.

인물·몹 없는 01_경계동굴.png 원본 그대로 사용. 412·320 너비 × 입구·계단·문 × 두 배율 = 12개 실제게임 캡처, 좌표 검사 통과. 밤 배경 변경0, 페이지 오류0. compare-412-stairs 직접 확인. 충돌·출구 연결은 아직 미구현이며 최종 채택 전.

재현: tools/maps/duat-preview.py --out docs/consult/duat-field/scale-55 --sizes 36 33.54838709677419 → tools/st-test/duat-scale.cjs docs/consult/duat-field/scale-55 → tools/st-test/duat-55-panels.cjs.

Drive: https://drive.google.com/drive/folders/1lbRYzpneKIAQDUq4xiy3bEIgHXnOdIRW
