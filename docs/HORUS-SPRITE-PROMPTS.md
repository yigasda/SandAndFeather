# 호루스 스프라이트 재생성 프롬프트

2026-10-17에 채택된 정면·뒷면 및 먹기 스프라이트를 만들 때 사용한 **프롬프트 원문**이다. TXT는 문구·공백·줄바꿈을 수정하지 않고 보존했다.

## 원문 바로 열기

- **정면·뒷면 정지:** [프롬프트 TXT](sprite-prompts/horus/horus-front-back-idle-v1-prompt.txt) · [채택 정면 PNG](art/horus-replacement-originals-2026-10-17/horus-front-idle-v1.png) · [채택 뒷면 PNG](art/horus-replacement-originals-2026-10-17/horus-back-idle-v1.png)
- **먹기:** [프롬프트 TXT](sprite-prompts/horus/horus-eating-v1-prompt.txt) · [채택 먹기 PNG](art/horus-replacement-originals-2026-10-17/horus-eating-v1.png)
- **눈 감고 먹기:** [표정 수정 프롬프트 TXT](sprite-prompts/horus/horus-eating-eyes-closed-v1-prompt.txt) · [채택 PNG](art/horus-replacement-originals-2026-10-17/horus-eating-eyes-closed-v1.png)

## 다시 사용할 때: 첨부 이미지 역할

프롬프트의 Reference/image 번호는 **당시 생성 요청에 첨부한 순서**다. TXT만으로 입력 이미지가 함께 전달되지는 않는다. 아래 역할에 맞는 실제 원본을 확인해 함께 첨부한다.

- **정면·뒷면:** Reference 1은 캐릭터 외형 기준 원본, Reference 2는 채택 걷기 시트다. 두 이미지는 외형·비율·뒷모습 기준이며, 위의 정면·뒷면 PNG는 이번 생성의 채택 결과다.
- **먹기:** Reference 1은 외형 기준 정면, Reference 2는 채택 걷기 시트, Reference 3은 이번 정면·뒷면 정지 쌍, Reference 4는 오른쪽을 보는 무릎 꿇은 마시기 자세, Reference 5는 사용자가 선택한 앉기/무릎 꿇기 시트다. **Reference 5의 아래 가운데 오른쪽 방향 자세가 몸·자세의 주 기준**이다. 위 채택 PNG는 결과물이며, 다섯 입력 이미지 전체를 대신하지 않는다.
- **눈 감고 먹기:** image1은 위의 [먹기 PNG](art/horus-replacement-originals-2026-10-17/horus-eating-v1.png), image2는 당시 마시기 표정 참고다. image2는 **눈·표정만** 참고하며 컵이나 자세를 가져오는 용도가 아니다.

이 문서는 당시 사용한 원문과 채택 결과를 찾기 위한 안내다. 원문 속 방향·문양 표현은 수정하지 않았으므로, 재생성 때는 실제 채택 이미지와 함께 확인한다. 아직 링크하지 않은 당시 입력 이미지는 별도로 확인해야 하며, 비슷한 다른 그림으로 임의 대체하지 않는다.

정면·뒷면 결과는 원래 1774×887 시트를 887×887 두 장으로 무손실 분리한 것이다. 먹기 두 장은 각각 1284×1225 원본이다. 프롬프트 원문은 기존 아트 하위 폴더에서 이 문서 옆의 `sprite-prompts/horus/`로 옮겼으며, 이전 위치와 내용은 Git 기록에 남아 있다.

[스프라이트 기준 문서로 돌아가기](ASTRA-SPRITE.md) · [저장소 README](../README.md)
