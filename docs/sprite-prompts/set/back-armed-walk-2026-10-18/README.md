# 세트 뒷모습 무기 걷기 0·1·2 — 채택 (2026-10-18)

- [걷기 0](approved/set-back-armed-walk-0.png)
- [걷기 1](approved/set-back-armed-walk-1.png)
- [걷기 2 최종](approved/set-back-armed-walk-2.png): 로컬 set-back-armed-walk-2-v2.png의 바이트를 이름만 바꿔 보존.
- [채택 0·1·2 GIF](walk-preview.gif)
- [규격 및 해시](manifest.json)

## 프레임 0·1 실제 입력과 프롬프트

[최초 배치의 정확한 프롬프트 JSON](initial-prompts.json) 중 배열 0과 1이 채택 프레임 0과 1의 실제 요청이다. 배열 2는 반려된 최초 2번 결과의 기록이며 채택 2의 프롬프트가 아니다. 반려 이미지는 이 폴더에 올리지 않았다.

걷기 0 입력 순서:
1. references/set-front-armed-walk-0.png — 채택 정면 걷기 0
2. references/1000483756.png — 뒷걷기 0 가이드
3. references/original-back.png — 원파일 1000483724(1).png

걷기 1 입력 순서:
1. references/set-front-armed-walk-1.png — 채택 정면 걷기 1
2. references/1000483757.png — 뒷걷기 1 가이드
3. references/original-back.png — 동일 뒷모습 원본

## 프레임 2 실제 계보

[채택 2의 정확한 수정 프롬프트](frame-2-accepted-exact-prompt.txt)를 사용했다. 입력 이미지는 **채택 뒷걷기 0 (approved/set-back-armed-walk-0.png) 한 장뿐**이다. 반려된 최초 2번 시트나 정면 걷기 2, 뒷걷기 2 가이드를 이번 채택 2 생성 입력으로 사용하지 않았다.

## 보존 및 적용

채택 PNG는 1402×1122 RGBA 원본을 그대로 보존하며 docs/art/chibi-refresh/final/set/armed-walk/에도 동일 바이트로 저장한다. 이 백업은 런타임 등록, 아틀라스, 충돌/앵커 설정을 바꾸지 않는다. 기존 일반 걷기를 교체하지 않는다. 뒷찌르기는 별도 작업이다. 생성 재현과 픽셀 단위 정확한 일치를 보증하지 않는다.
