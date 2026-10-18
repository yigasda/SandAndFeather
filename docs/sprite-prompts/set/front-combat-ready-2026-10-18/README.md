# 세트 정면 전투 대기 0·1·2 — 현재 채택본 (2026-10-18)

**현재 제작 기준.** 사용자가 전투 준비 자세 3개 중 첫 번째를 채택하고 이전 프롬프트 대신 이 프롬프트를 사용하도록 지정했다.

- [채택 원본 PNG: set-front-combat-idle-0.png](approved/set-front-combat-idle-0.png)
- [이번 생성에 실제 사용한 프롬프트 원문](actual-generation-prompt.txt)
- [파일별 SHA-256 / Git blob SHA / 규격](manifest.json)

## 입력 이미지 5장 — 실제 순서

1. [종합 가이드](references/01-1000483771.png)
2. [왼쪽 전투 대기 0](references/02-set-left-combat-idle-0.png)
3. [왼쪽 찌르기 0](references/03-set-left-combat-attack-0.png)
4. [정면 걷기 트레이싱 가이드](references/04-1000483753.png)
5. [세트 정면 원본](references/05-set-front-original.png)

원본 5장으로 새로 생성했으며 이전 생성 시안을 편집 입력으로 사용하지 않았다. transparent_background=true. 동일 프롬프트 3회 생성 중 첫 번째 채택. 생성 ID: exec-9e1a553c-473e-4862-a79f-5cd6bad6faaa.png.

## 현재 기준

살짝 내려다보는 정면, 기존의 큰 머리와 매우 짧은 팔다리·작고 평평한 남성 흉곽을 유지한다. 긴 와스 지팡이는 자루만 길게, 손잡이 두께와 양끝 장식 크기는 유지한다. 무기를 단순히 들고 서 있는 자세가 아니라, 짧은 무릎을 살짝 굽히고 발을 앞뒤로 엇갈리며 두 손으로 무기를 받치는 전투 준비 자세다. 장신구를 추가하지 않는다. 화면 왼쪽 옆머리 끝의 깨진 픽셀은 자연스러운 끝으로 정리한다.

후속 프레임은 이 채택본과 같은 외형·무기·비율·화풍을 기준으로 제작한다. 프레임 사이 동작 차이는 실제로 읽혀야 한다. 현재 이 폴더에는 승인된 대기 0·1·2가 보존되어 있다. 다른 모션 완성이나 게임 적용을 의미하지 않는다. 생성 결과의 정확한 재현이나 가이드와 픽셀 단위 일치를 보장하지 않는다.

## 이전 시안

[이전 긴 지팡이 정면 시안](../front-armed-2026-10-18/README.md)은 이 전투 대기 채택본으로 대체되었다. 기록 보존용일 뿐 현재 제작 프롬프트나 자세 기준으로 사용하지 않는다. 기존 게임 자산과 런타임은 이 백업에서 변경하지 않았다.

## 2026-10-18 추가 채택: 대기 1·2 프레임

사용자가 대기 1·2와 0–1–2 미리보기를 확인하고 채택했다. 대기 0의 원본과 최초 프롬프트는 그대로 보존한다.

- [대기 1 PNG](approved/set-front-combat-idle-1.png)
- [대기 2 PNG](approved/set-front-combat-idle-2.png)
- [0·1·2 GIF 미리보기](approved/set-front-combat-idle-012-preview.gif)
- [대기 1·2 실제 프롬프트 원문 JSON](idle-1-2-exact-prompts.json): 배열 첫 항목은 1번, 둘째 항목은 2번 프레임이다.

이번 1·2 생성의 실제 입력 순서는 아래와 같다. 대기 0 최초 생성의 입력 목록과 혼동하지 않는다.

1. 채택 대기 0: approved/set-front-combat-idle-0.png (생성 시 set-front-ready-stance-1.png)
2. 종합 가이드: references/01-1000483771.png
3. 왼쪽 전투 대기 0: references/02-set-left-combat-idle-0.png
4. 왼쪽 찌르기 0: references/03-set-left-combat-attack-0.png
5. 세트 정면 원본: references/05-set-front-original.png

이번 생성은 입력 5장 제한 때문에 독립 정면 걷기 가이드를 제외했다. 종합 가이드에 걷기 참고가 포함되어 있다. 기존 입력 5장에 대기 0을 더한 6장 생성으로 설명하면 안 된다. 두 프레임 모두 투명 배경으로 요청했으며, 대기 1은 올라오는 호흡, 대기 2는 낮아지는 준비 자세를 요청했다. 게임 적용이나 다른 방향/공격 프레임 완성을 의미하지 않는다.
