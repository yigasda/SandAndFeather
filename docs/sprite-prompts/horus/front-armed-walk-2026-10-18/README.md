# 호루스 정면 무기 걷기 0·1·2 — 채택

approved/의 0·1은 최초 생성 원본이다. 2는 사용자가 요청한 눈 실제 복사 결과다. 반려된 sheet-v2 발구르기 시트는 사용하지 않았다. 세 PNG 모두 1402×1122 RGBA 원본이다.

## 최초 생성 입력
prompts.json의 각 프롬프트를 아래 입력 순서로 사용했다.
1. references/horus-front-combat-idle-0.png
2. 프레임 0/1/2 각각 references/1000483765.png, 1000483766.png, 1000483767.png
3. references/1000482841(2).png

## 최종 2: 눈 복사
copy_eyes.py는 실제 수행한 스크립트 원문이다. approved/horus-front-armed-walk-0.png에서 눈 영역을 가져와 references/walk-2-before-eye-copy.png에 적용했다. 위치 오프셋 (+5,+4), 영역 마스크와 경계 처리 등 정확한 연산은 스크립트를 따른다. 별도 AI 재생성 결과가 아니다. 원래 실행 경로는 스크립트에 보존되어 있으므로 재실행 시 입력 경로를 명시적으로 대응시켜야 한다. 이 보존 작업은 스크립트를 재실행하지 않고 사용자가 채택한 결과 바이트를 그대로 복사했다.

preview.gif는 채택본 미리보기다. PNG는 docs/art/chibi-refresh/final/horus/armed-walk/에도 보존한다. 런타임 변경은 없다.
