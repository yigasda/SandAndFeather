# 세트 뒷모습 전투 대기 0·1·2 — 최종 채택 (2026-10-18)

- [대기 0 원본](approved/set-back-combat-idle-0.png)
- [대기 1 원본](approved/set-back-combat-idle-1.png)
- [대기 2 수정 채택본](approved/set-back-combat-idle-2.png)
- [채택 미리보기](preview.gif)
- [최초 생성 프롬프트](prompts.json)
- [2번만 수정한 실제 프롬프트](fix2-prompt.txt)
- [파일 해시](manifest.json)

## 실제 입력과 채택 계보

최초 각 프레임의 입력 1은 references/set-front-combat-idle-{0,1,2}.png 중 해당 번호의 팔장식 수정 정면 대기였다. 입력 2는 동일 references/back-guide.png (원파일 1000483757(1).png)였다.

사용자는 세 번째 프레임만 수정하도록 명시했다. 현재 0·1은 최초 생성 원본을 그대로 유지한다. 이후 불필요하게 재생성된 1번 결과는 채택하지 않았고 이 폴더에 넣지 않았다.

채택 2는 fix2-prompt.txt로 생성한 로컬 set-back-combat-idle-2-v2.png이다. 수정 입력 순서는 다음과 같다.
1. references/original-back-idle-2-before-fix.png — 최초 뒷대기 2
2. approved/set-back-combat-idle-0.png — 최초 뒷대기 0

references/의 최초 2는 수정 입력 보존용으로만 남긴다. 현재 채택 2와 혼동하지 않는다.

## 원본 및 적용 상태

세 PNG는 1402×1122 RGBA 원본 바이트 그대로 보존했다. docs/art/chibi-refresh/final/set/combat-idle/에도 동일 파일을 저장한다. 리사이즈·재인코딩하지 않았다. 런타임/아틀라스/충돌·앵커 설정은 변경하지 않는다. 이 작업으로 세트 앞뒤 무기 걷기 6장, 전투 대기 6장, 찌르기 4장 총16장의 원본 소스를 정리한다. 공격 회수 프레임은 사용자 지시로 생략한다.
