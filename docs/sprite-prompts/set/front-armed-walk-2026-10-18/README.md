# 세트 정면 무기 든 걷기 0·1·2 — 채택 (2026-10-18)

팔장식 수정 대기 0을 베이스로 생성한 정면 무기 걷기 3장을 사용자가 채택했다. 이전 반려 걷기 시안은 이 폴더에 포함하지 않는다.

- [걷기 0](approved/set-front-armed-walk-0.png)
- [걷기 1](approved/set-front-armed-walk-1.png)
- [걷기 2](approved/set-front-armed-walk-2.png)
- [걷기 GIF](walk-preview.gif)
- [실제 프롬프트 3개](prompts.json): 배열 0·1·2 순서가 해당 프레임 번호다.
- [파일 해시와 규격](manifest.json)

## 실제 입력

각 프레임을 독립 생성했다. 매번 입력 1은 [팔장식 수정 정면 대기 0](references/set-front-combat-idle-0.png)이다. 입력 2만 프레임별로 바뀐다.

- 걷기 0: [기존 걷기 0 가이드](references/walk-0-guide.png), 원파일 1000483753(1).png
- 걷기 1: [기존 걷기 1 가이드](references/walk-1-guide.png), 원파일 1000483754(1).png
- 걷기 2: [기존 걷기 2 가이드](references/walk-2-guide.png), 원파일 1000483755(1).png

무기·얼굴·화풍·비율은 수정 대기 0을 기준으로 하고, 걷기의 다리 벌림→오므림→반대 벌림 흐름은 각 가이드를 따른다. 입력으로 종합 가이드나 반려 걷기 결과를 추가했다는 뜻이 아니다. 정확한 생성 요청은 prompts.json을 따른다.

## 보존 및 적용 상태

PNG는 원본 1402×1122 RGBA를 그대로 보존한다. 채택 소스는 docs/art/chibi-refresh/final/set/armed-walk/에도 동일 바이트로 저장한다. 기존 일반 걷기나 런타임 파일은 교체하지 않았다. 이 커밋은 원본·프롬프트 백업이며 인게임 등록, 충돌/앵커 설정, 아틀라스 작업은 포함하지 않는다. 뒷걷기는 별도 제작이다. 생성 결과 재현이나 픽셀 단위 동일성은 보증하지 않는다.
