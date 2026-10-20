# 0.9.93 배포 검증

검사 기준 게임 코드: `bfe858565498e4a251c4c48a3c8b49c2ecdcc9d1`.
최종 UI 수정은 `7213c09bb0229f00d172adb6b2935eea87f90bae`이며 이후 제품 변경은 0.9.93 버전 표기뿐이다.

## 가드 경직 검사 측정 오류

전체 검사 중 `desert-horus-leap`의 소망 가드 깨기만 경직 0.47초로 실패했다. 기존 검사는 스크린샷을 찍은 뒤 시간을 재므로 이미 소비한 경직 구간을 누락했다. 게임은 가드 깨기 직후 0.8초 경직을 설정하며 이 로직은 이번 배포에서 변경하지 않았다.

분리된 release 시험 서버에서 스크린샷 뒤 300ms 지연을 넣어 재현했다. 기존 측정은 0.24/0.17/0.04초였으나 실제 break 이벤트부터 hit 종료까지는 0.793/0.811/1.461초였다(마지막 벽시계 시간에는 프레임 지연 포함). 마지막 hit 프레임의 게임 내부 누적 시간은 0.78/0.8/0.8초였다. [진단 로그](guard-diagnostic.log).

검사만 수정했다: 기술 직전부터 프레임 상태를 기록하고 실제 break→hit 종료 구간을 측정한다. 기존 `held > 0.5`를 유지하고 마지막 hit 프레임의 게임 시간도 `> 0.5`인지 추가 확인한다. 기대 경직 시간이나 제품 동작은 낮추거나 변경하지 않았다.

수정한 동일 검사에서 호루스·세트·소망을 각각 3회, 총 9회 반복해 모두 통과했다. 측정 경직은 0.789–0.830초였다. 일반 공격 가드 피해도 통과했다. [재검증 로그](guard-fixed.log).

명령:
```sh
BASE_URL=http://127.0.0.1:8001 GUARD_REPEATS=3 node tools/st-test/desert-horus-leap.cjs /tmp/guard-duration-fixed --guard-only
```

전체 검사 도중 바뀐 것은 이 검사 파일뿐이다. 게임 코드·데이터는 바뀌지 않아 이미 통과한 다른 검사 결과는 유효하다. 전체 검사를 처음부터 반복하지 않고 실패한 측정 구간을 위와 같이 재검증했다.

## 배포 전 전체 검사

`NODE_PATH=/opt/codex/cua_node/lib/node_modules ST_ROOT=/workspace/sillytavern PLAYWRIGHT_BROWSERS_PATH=/tmp/hud-playwright bash tools/st-test/tiers.sh full --since origin/main --out /tmp/release-0993-final`

2026-10-20 20:59:45 UTC 시작, 21:40 UTC 종료. [전체 결과](full-summary.txt): 30개 항목 중 29개 exit 0, 경직 시간 측정 오류가 포함된 desert-horus-leap만 최초 exit 1. 위 수정 후 가드 9회 재검증 통과. 최초 full 종료 코드 1은 보존한다. 변경 JS 23개 문법 검사 통과. desert-ult의 채팅 전환 시나리오는 격리 서버에 채팅 하나만 있어 명시적으로 생략됐으며 나머지 21항목이 통과했다.

요청된 UI 3종은 모두 exit 0:
```sh
node tools/art/verify-cozy-ui.cjs /tmp/release-0993-final/verify-cozy-ui
node tools/art/verify-ui-themes.cjs /tmp/release-0993-final/verify-ui-themes
node tools/art/verify-full-map.cjs /tmp/release-0993-final/verify-full-map
```

최종 전체 실행의 시험 서버는 시작 시 복사한 bfe85856 게임 코드다. 실행 중의 검사 파일 수정은 제품 파일을 변경하지 않았다. 본문·로그 기록만 추가한 최종 커밋에서도 제품 파일이 동일함을 확인한다.

향후 검사 범위 개선 후보: 이번에 직접 수정하지 않은 전투 타격·조준·궁극기·몹 AI 규칙 검사는 고정 full 목록 때문에 실행했다. 필드/입력/저장 공통 의존성과 배포 위험을 확인해 규칙을 별도로 개정하면 조건부 실행 대상으로 분리할 수 있다. 이동·문·회전·HUD·NPC 렌더·줌·저장 및 release 파일 검증은 이번 변경과 연결되어 유지할 필요가 있다. 이번 배포에서 규칙 자체는 변경하지 않았다.

## release 사본 확인

`sh tools/release.sh`로 생성한 release `3bea8827ffd02d700a5a5d741b0362602391b0ac`를 depth 1로 별도 clone해 시험 서버 8001에 연결했다. 776개 파일이 main 제품 파일 및 clone과 바이트 단위로 모두 일치했다. [파일 검증](artifact-validation.json).

`BASE_URL=http://127.0.0.1:8001 node tools/st-test/date-hp-layout.cjs /tmp/release-0993-smoke-layout` 통과: 5개 테마의 날짜 블록 중앙, 회전 후 세로 수치→이벤트→HP 배치. [로그](release-layout.log).

`BASE_URL=http://127.0.0.1:8001 REPEATS=3 node tools/st-test/door-neutral-arrival.cjs /tmp/release-0993-smoke-door` 통과: 중립 도착 직후 새 입력으로 문 통과, 입력을 유지한 도착은 해제 전 재진입 금지, 각각 3회. [로그](release-door.log).

새 아트와 미확정 메뉴바는 포함하지 않았다. 일반 이동 버벅임은 원인 미확정이며 해결 완료로 표시하지 않는다.
