# 잠들기 191 — 세트·호루스 8장 재작화 검토본

189 세트·호루스8장은 반려. 191은 정지의 머리 모양·크기·결을 참고하여 자세 전체를 새로 그렸다. 소망0·1은 변경하지 않았다. **사용자 검토 대기 / artApproved:false / runtimeEligible:false.**

- [전체 비교](previews/sleep-191-all-light.png) · [숨쉬기 GIF](previews/sleep-191-breathing.gif)
- [실제31px GIF](previews/sleep-191-game-31px.gif) · [31px 확대 GIF](previews/sleep-191-game-31px-8x.gif)
- [정면 사용자 예시 비교](previews/user-sketch-comparison.png) · [x310 중심선](previews/supine-x310.png)
- [침대 혼자](previews/bed-alone.png) · [소망과 함께](previews/bed-together.png)
- [외곽선 차이](previews/breathing-exterior-red.png) · [검사 보고서](review/report.md) · [직접 확인한 내용과 한계](review/visual-notes.md)

png/의8장이 신규 투명PNG다. references/의 소망2장은 비교를 위한 보존본이다. 각 장의 몸 가운데 기준점은 manifest.json에 있으며 정면은(310,450)이다. 피부는 해당 방향 최종 정지·걷기 팔레트에 맞췄다.

## 검사 기록

최신 sprite-review.py 전체 실행: 볼 것0개, 피부8장 모두같음. 정지 머리 픽셀 일치율은 checks/idle-head-paste-scores.json에 기록했다. 네 쌍의 외곽선 변화는4.6~6.6%, 바운딩 박스 모두변경. 이 수치는 완성 판단을 대신하지 않는다.

재작화한 프레임 사이에는 호흡 영역 외 작은 선 차이도 있다. 눈·발·베개 위 머리가 픽셀 단위로 동일하다는 뜻은 아니다. 직접 확인한 범위는 review/visual-notes.md 참조.

## 작업 기준

사용자 승인된 범위: 세트·호루스 바로눕기/오른쪽모로눕기 각2장. 최신 발 지시는 밑창이 보이는 투시. 세트 왼팔 올림·오른팔 내림 예외를 적용. 무릎을 접은 정면 자세, 세트 웨이브, 호루스 정지 머리 잘라붙이기는 금지. 이번 검토본은 sources/의 새 전체 그림을 사용했으며 제작 기록은 build/에 있다.
