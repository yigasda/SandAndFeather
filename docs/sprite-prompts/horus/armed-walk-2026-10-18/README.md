# 호루스 무기 든 걷기 — 2026-10-18 채택본과 실제 프롬프트

사용자가 채택한 좌·우 0·1·2 PNG 6장과 각 생성에 실제 사용한 프롬프트 원문이다. TXT는 생성 요청 원문을 수정하지 않고 보존했다.

## 채택 PNG와 프롬프트

- [horus-left-armed-walk-0-v1.png](../../../../메인2/호루스/무기든걷기-2026-10-18/horus-left-armed-walk-0-v1.png) · [프롬프트 원문](horus-left-armed-walk-0-prompt.txt)
- [horus-left-armed-walk-1-v1.png](../../../../메인2/호루스/무기든걷기-2026-10-18/horus-left-armed-walk-1-v1.png) · [프롬프트 원문](horus-left-armed-walk-1-prompt.txt)
- [horus-left-armed-walk-2-v1.png](../../../../메인2/호루스/무기든걷기-2026-10-18/horus-left-armed-walk-2-v1.png) · [프롬프트 원문](horus-left-armed-walk-2-prompt.txt)
- [horus-right-armed-walk-0-v1.png](../../../../메인2/호루스/무기든걷기-2026-10-18/horus-right-armed-walk-0-v1.png) · [프롬프트 원문](horus-right-armed-walk-0-prompt.txt)
- [horus-right-armed-walk-1-v1.png](../../../../메인2/호루스/무기든걷기-2026-10-18/horus-right-armed-walk-1-v1.png) · [프롬프트 원문](horus-right-armed-walk-1-prompt.txt)
- [horus-right-armed-walk-2-v1.png](../../../../메인2/호루스/무기든걷기-2026-10-18/horus-right-armed-walk-2-v1.png) · [프롬프트 원문](horus-right-armed-walk-2-prompt.txt)

## 실제 입력 이미지 4장과 순서

매번 아래 4장을 함께 입력했다. 좌향과 우향에서 INPUT1·INPUT2만 교환하고 INPUT3·INPUT4는 유지했다.

| 입력 | 왼쪽 0·1·2 | 오른쪽 0·1·2 | 역할 |
|---|---|---|---|
| INPUT1 | 1000483731.png | 1000483733.png | 같은 방향 전투 대기 가이드. 상체·얼굴·머리·손의 그립·창의 형태와 위치 보존을 요청한 주 기준 |
| INPUT2 | 1000483733.png | 1000483731.png | 반대 방향 가이드. 외형·좌우 비대칭 확인용이며 자세·캔버스·얼굴을 반전 복사하는 기준이 아님 |
| INPUT3 | 1000483734.png | 1000483734.png | 채택 전투 대기/걷기 비교 종합 가이드 |
| INPUT4 | 1000483688.png | 1000483688.png | 정면 외형 마스터 |

원본 참조 이미지 식별자:
- 1000483731.png: 왼쪽 가이드, 604×481. Library ID: libfile_fe7cb80541e08191a8961a019f1f55e1
- 1000483733.png: 오른쪽 가이드, 725×669. Library ID: libfile_1121171657448191b5f9406e5ea55d8b
- 1000483734.png: 종합 가이드, 2048×704. Library ID: libfile_b967b2466c3c8191a16a4046d69b7469
- 1000483688.png: 정면 마스터, 908×1236. Library ID: libfile_c5cb0c9df6048191bd1d8f67d3a2c433

위 ID는 실제 입력 파일의 식별 기록이며 공개 다운로드 링크가 아니다. 저장소의 기존 그림과 동일한 파일로 확인되지 않아 임의로 기존 경로를 연결하지 않았다.

## 요청과 실제 결과를 구분

- 프롬프트는 가이드의 원래 캔버스·상체·창을 고정한 트레이싱 편집을 요청했다. 이는 요청 내용이며 픽셀 단위 일치가 달성됐다는 검증 결과가 아니다.
- 실제 채택 PNG는 왼쪽 3장 모두 1406×1119, 오른쪽 3장 모두 1305×1205의 RGBA 이미지다. 가이드의 604×481 / 725×669 캔버스와 같지 않다.
- 0·2 프레임의 보폭이 유사하다는 점과 원본 캔버스 불일치를 알린 뒤 사용자가 이 6장을 채택하고 main 업로드를 요청했다.
- PNG는 채택된 생성 결과의 바이트 그대로 보관했다. 재생성·리사이즈·후처리는 하지 않았다.
- 이 업로드는 새 파일 보관과 프롬프트 기록이다. 기존 전투 채택 자산·게임 런타임·애니메이션 연결은 변경하지 않았다.
