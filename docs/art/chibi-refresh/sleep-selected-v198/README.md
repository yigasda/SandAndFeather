# 잠들기 선택 묶음 198

사용자: “197 정면만 채택 / 195 세트 옆모습으로 채택 195 호루스 외곽선만 기본 정지/걷기 수준으로 수정”.

| 파일 | 기준 | 상태 |
|---|---|---|
| set-sleep-0·1 | 197 올린 왼쪽 팔 길이 수정 | 검토 대기 |
| horus-sleep-0·1 | 197 원본 | 사용자 채택 |
| set-sleep-side-0·1 | 195 원본 | 사용자 채택 |
| horus-sleep-side-0·1 | 195 원본의 바깥 외곽선만 보강 | 검토 대기 |

채택4장은 바이트 그대로 복사했고, 원본 파일의 해시를 확인했다. [보존 확인](checks/approved-preserved.json). 모든 PNG620×720 RGBA. 기준점·출처·채택 여부는 [manifest](manifest.json)의 파일별 필드를 따른다. 전체8장 채택으로 취급하지 않는다.

## 호루스 옆 수정

최종 정지 `final/horus/idle/horus-right.png`와 같은 방향 걷기를 열어 비교했다. 195 바깥 선에만 제한한 마스크로 선을 보강했다. 생성 편집은 선 굵기 견본으로만 보관하고, 전달 PNG는195 원본의 윤곽 띠에서만 수정했다. 내부 그림이나 새로 생성된 얼굴·몸을 교체하지 않았다.

수정 범위는 안쪽 최대2.65px, 바깥1px 이내. 머리 경계는 더 가볍게 보강했다. 원래 실루엣을 따라가며 피부·머리 하이라이트·눈·자세·비율·숨쉬기 배치는 유지했다. [픽셀 차이 범위](checks/outline-only.json).

- [전체8장](previews/all-light.png) · [어두운 배경](previews/all-dark.png)
- [0 전후·정지](previews/horus-side-0-before-after.png) · [1 전후·정지](previews/horus-side-1-before-after.png)
- [0 차이](previews/horus-side-0-difference.png) · [1 차이](previews/horus-side-1-difference.png)
- [숨쉬기](previews/horus-side.gif) · [31px](previews/horus-side-game.gif)
- [검사](review/report.md) · [직접 확인](review/visual-notes.md)

게임 적용은 하지 않았다. 채택4장과 검토4장을 구분해 오푸스에게 전달한다.

추가 사용자 지시: 197 세트 정면 두 장의 올라간 왼쪽 팔을 줄인다. 해당 두 장은 수정 검토 대기로 바꾸며, 호루스 정면·세트 옆4장만 원본 그대로 채택 유지한다.

## 세트 정면 추가 수정

197의 화면 왼쪽 올린 팔 두 장만 짧게 접었다. 작은 노출 팔 영역(111≤x<187,326≤y<420)에 새 국소 편집을 적용하고 귀·얼굴·앞머리·어깨·몸·다리와 알파는 보존했다. 팔을 당기며 드러난 자리는 같은 머리 흐름으로 메웠다. [변경 범위](checks/set-arm-only.json). [4장 전후](previews/four-edits-before-after.png) · [8장 GIF](previews/selected-eight.gif).

세트 팔 최종본2장의 재검사는 [review-set-arm/report.md](review-set-arm/report.md), 전체 통합 검사는 [review/report.md](review/report.md)에 있다.
