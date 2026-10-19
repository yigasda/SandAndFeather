# 회귀 검사 13개 + B1 (main 0.9.89 합친 작업 브랜치, 2026-10-19)

시험 ST: 이 컨테이너(`node server.js --port 8000`), 412×900 폰 화면, `NODE_PATH=/opt/node-tools/node_modules`.

| # | 검사 | 결과 | 내용 |
|---|---|---|---|
| 1 | verify-full-map | 통과 | 옴보스 낮밤·이동, 페이지 오류 0 |
| 2 | verify-cozy-ui | 통과 | 폰 UI, 실패 요청 0 |
| 3 | verify-ui-themes | 통과 | 테마 |
| 4 | duat-maps | 통과 | 7맵, 출구 14 걸어서 |
| 5 | duat-field | 통과 | 23개 (세 명 각각) |
| 6 | residence-exits | 통과 | 출구 31 걸어서 |
| 7 | dock71 (낚시 부두) | 통과 | 10개 |
| 8 | life70 (낚시 자세 등) | 통과 | 37개 |
| 9 | records68 (낚시 기록·저장) | 통과 | 36개 |
| 10 | market (상점) | 통과 | 15개 |
| 11 | items53 (아이템) | 통과 | 44개 |
| 12 | desert-maps | 통과 | 11구간 도착, 오류 0 |
| 13 | desert-save-move | 통과 | 9개 (옛 ID 저장 이관) |
| B1 | desert-b1 (터치 조이스틱) | 통과 | 18개, 영상 `b1-joystick.mp4` |

처음 실패했던 셋의 원인:
- duat-maps·residence-exits: 브라우저 경로가 `/usr/bin/chromium`으로 고정(이 컨테이너에 없음, 환경) → common.js와 같은 방식으로. 그 뒤 남은 실패는 페이지 오류 하나: 시험 ST가 AI Horde를 쓰도록 설정돼 있어 페이지를 열 때마다 `/api/horde/*`가 500(인터넷 없음), ST가 그 답을 JSON으로 읽다 오류(환경). 시험 ST 설정 `main_api`를 openai로 바꿔 없앰. 검사 기준은 그대로.
- duat-field 몹 0개: 앞장(호루스)이 쓰러진 채 다음 앞장 차례가 바로 시작돼, 0.9초 뒤 옴보스로 옮기는 패배 처리와 겹침(시험 순서 문제). 0.9.88 main에서도 5번 중 2번 같은 식으로 실패. main 0.9.89(`5b526c1`)가 시험에서 업혀 올라갈 때까지 기다리게 고쳤고, 0.9.89 게임 쪽은 벽에 막혀도 방향키 쪽을 보게 고쳐(`vdir null` 실패의 원인) 지금 통과.
- 이 브랜치에서 고친 게임 오류 하나: 게임 창을 닫았다 다시 열 때 그림을 불러오는 동안 렌더러 맵 없이 그려 나던 페이지 오류(`window.js frameNow`). B1 채팅 전환에서 발견.
