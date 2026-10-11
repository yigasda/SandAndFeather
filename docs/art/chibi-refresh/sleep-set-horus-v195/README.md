# 세트·호루스 잠들기 195 — 머리·얼굴 재작화

194는 사용자 반려. 195는 사용자 검토 대기이며 게임에 적용하지 않았다. 전달용은 `png/`의 620×720 투명 PNG 8장이다. 소망과 기존 채택 원본은 보존했다.

- [8장 전체](previews/all-light.png) · [어두운 배경](previews/all-dark.png)
- [정지 / 반려194 / 다시 그린195의 머리·얼굴 비교](previews/hair-idle-rejected-redraw.png)
- [정면 chain GIF](previews/chain-front.gif) · [옆면 chain GIF](previews/chain-side.gif)
- [800ms 숨쉬기 GIF](previews/breathing-all.gif) · [31px 게임 크기](previews/breathing-31px.gif) · [게임 크기 확대](previews/breathing-31px-8x.gif)
- [장별 몸 길이](checks/body-measurements.md) · [정지와 같은 배율의 측정선 시트](previews/body-measured-all.png)
- [전체 검사](review/report.md) · [직접 본 내용](review/visual-notes.md) · [기준점과 SHA256](manifest.json)

머리는 정수리부터 끝까지 새 원화로 그렸다. 세트의 큰 생머리 다발에는 붉은 하이라이트를, 호루스의 짧은 삐죽머리에는 남색 바탕과 밝은 파랑 결을 다시 그렸다. 정면 얼굴도 다시 그려 볼 아래에서 턱으로 좁아지는 모양을 맞췄다. 정지 머리나 얼굴의 조각을 붙이지 않았다.

정면 기준점은 (310,450), 옆은 (315,445). 날숨0과 들숨1은 각 800ms 반복한다. [정면 중심선](previews/front-centerlines.png), [호루스191과 세트 정면 겹침](previews/set-horus191-sleep-onion.png), [옆면 겹침](previews/set-horus191-sleep-side-onion.png)도 포함한다. 몸 길이의 최종 비교 대상은 같은 방향의 정지이며, 세트에는 호루스 정지 대비 비율도 적었다.

## 제작 기록

`sources/`는 생성 원화이고 `png/`만 전달용이다. 새로 그린 원화를 620×720에 맞춘 뒤 머리 바깥 크기를 유지하면서 몸 길이와 얼굴의 연속적인 좌표를 정렬했다. 피부와 머리색은 같은 방향의 최종 원본 팔레트로 맞췄다. 명암을 세 색으로 잘라 나누는 처리는 사용하지 않았으며, 여러 명암색과 하이라이트의 연결을 유지했다. 호루스 피부의 기본색은 실제 얼굴의 분홍빛을 기준으로 했으며 치마의 아이보리색을 기본색으로 고르지 않았다.

들숨은 이번에 새로 그린 날숨 그림에서 어깨·가슴·손과 그 위 머리카락을 연속적으로 움직여 만들었다. 어깨는 위로 최대8px, 머리는1px 움직이고 발은 고정했다. 바깥 윤곽 변화와 고정 부위는 [차이 기록](checks/breathing.json) 및 `previews/*-difference.png`에서 확인할 수 있다.
