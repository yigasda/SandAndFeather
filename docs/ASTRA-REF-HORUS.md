# 호루스 — 현재 원본·외형 가이드 바로 열기

**약 12시간의 수정과 사용자 채택을 거쳐 확정한 외형이다.** 외형 보존 규칙은 [스프라이트 문서의 호루스 현재 기준](ASTRA-SPRITE.md#horus-current)을 먼저 확인한다. 재생성은 종료 상태이며 새로운 사용자 요청이 있을 때만 작업한다.

## 1. 외형을 확인할 때

| 확인할 것 | 바로 열기 |
|---|---|
| 원본 그림 한 장 | [호루스 원본 PNG](art/horus-appearance-guides-2026-10-15/original/horus-original.png) |
| 원본·채택 정면/뒷면·shy·서프라이즈 얼굴과 머리 | [얼굴·머리 비교](art/horus-appearance-guides-2026-10-15/overview/face-hair-priority.png) |
| 눈·피부·머리색 종합 | [외형 종합 가이드](art/horus-appearance-guides-2026-10-15/overview/appearance-guides.png) |
| 원본 묶음에서 추출한 눈·색 | [원본 눈·색 보드](art/horus-appearance-guides-2026-10-15/eye-colors/original-bundle-eye-colors.png) |
| 기존 전투 6장의 눈·색 | [전투 6장 눈·색 보드](art/horus-appearance-guides-2026-10-15/eye-colors/combat-six-eye-colors.png) |
| 왼쪽 눈 모양 | [채택 왼쪽 눈 가이드](art/horus-appearance-guides-2026-10-15/left-eye/left-eye-guide.png) |
| 머리·어깨·골반·발 기준선과 비율 | [상세 비율 가이드](art/horus-appearance-guides-2026-10-15/proportions/combat-landmark-guide.png) |
| 전신·머리 기본 가이드 | [원본 추출 가이드](art/horus-appearance-guides-2026-10-15/proportions/combat-source-guide.png) |
| 원본 크롭·RGB·추출 좌표·해시 | [외형 가이드 전체 목록](art/horus-appearance-guides-2026-10-15/README.md) |

## 2. 채택 그림을 찾을 때

| 용도 | 사용할 파일 |
|---|---|
| 최신 전투 전달본 | [최종 18장 안내](art/horus-combat-approved-18-2026-10-15/README.md) · [개별 PNG](art/horus-combat-approved-18-2026-10-15/png/) · [채택·출처 manifest](art/horus-combat-approved-18-2026-10-15/manifest.json) |
| 전투 전체 확인 | [18장 비교판](art/horus-combat-approved-18-2026-10-15/previews/all-18-contact.png) · [좌우 동작 GIF](art/horus-combat-approved-18-2026-10-15/previews/paired-actions.gif) |
| 걷기·생활 등 채택본과 기존 첫 전투 6장 | [51장 안내](art/horus-redraw-2026-10-14/README.md) · [개별 PNG](art/horus-redraw-2026-10-14/png/) · [출처 manifest](art/horus-redraw-2026-10-14/manifest.json) |

부분 채택 시트는 manifest에 적힌 셀만 사용한다. 최신 전투 적용 목록은 18장 폴더다. 기존 6장의 옛 공격 프레임을 최신 지상 찌르기 대신 적용하지 않는다. main 보관과 게임 런타임 적용은 별개이며 현재 상태는 [STATE](ASTRA-DRAW-STATE.md)에서 확인한다.

## 3. 자세 가이드를 다시 만들 때

[자세 자료 보관함](art/horus-pose-guides-2026-10-15/README.md)에 12동작 도식, 얼굴 방향·각도·표정 분석, 생활 동작, 68프레임 도식과 제작 스크립트가 있다. 초기·중간 가이드도 들어 있으므로 모두 최종 채택본으로 간주하지 않는다. 스크립트의 당시 절대 경로는 재실행 환경에 맞춰야 한다.

외형은 위의 원본·외형 가이드로 정하고, 자세 자료는 방향·관절·동세·표정 의도에 사용한다. 삭제한 구 전투 12장을 되살리거나 구 비교판의 외형을 새 기준으로 삼지 않는다.

이전 `chibi-refresh` 호루스 자료와 2026-10-14 재작화 입력 제한은 과거 작업 기록이다. 현재 파일을 찾기 위해 그 경로로 되돌아가지 않는다. 작업이 요청되면 필요한 실제 원본과 가이드를 열고 [그리기·비교](ASTRA-DRAW-CHECK.md)로 진행한다.
