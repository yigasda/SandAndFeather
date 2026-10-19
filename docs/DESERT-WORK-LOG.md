# 사막 작업 기록 (단계 A-6)

OPUS 사막 계획서 1·19절과 사용자 보완 지시 2·A-6. 실제로 한 것과 확인한 것만 적는다.

## 기준

| 항목 | 값 |
|---|---|
| 작업 브랜치 | `ccr-3d224608-3ozn95` (main에는 사용자 승인 뒤에만 반영) |
| 합친 main | `9a6aaf8` (0.9.88, 2026-10-19 받음). 직전 작업 브랜치 끝 `9397fee`. 그 사이 main에 0.9.85~0.9.88(두아트 전투 그림·몹 길찾기, 색 맞춤, 기술 이펙트 20장 등)이 있었고 충돌 없이 합침 |
| 합치기 전 미커밋 변경 | 없음 (`git status` 깨끗) |
| 저장 판 | main 12판, 이 브랜치 14판(12 → 13 사막 01~04 ID, 13 → 14 11·17 ID). main과 번호 겹치지 않음 |
| 작업 전 백업 | 시험 ST의 채팅 저장 전체를 세션 작업 폴더에 복사(`chats-20261019-0148`). 시험 서버 안의 자료라 저장소에는 넣지 않음. 시험 저장 하나(Seraphina, 13판)가 `desert_17`에 서 있었음 → 14판 이관 대상 |

## 실행법

```sh
# SillyTavern (시험용, 이 컨테이너)
cd /home/user/sillytavern/sillytavern && node server.js --port 8000 --listen false
# 확장 복사 (저장소 → ST)
EXT=/home/user/sillytavern/sillytavern/data/default-user/extensions/SandAndFeather
cp -r src data index.js manifest.json style.css README.md "$EXT"/ && cp -r docs/art/map-expansion "$EXT"/docs/art/
export NODE_PATH=/opt/node-tools/node_modules
```

## 생성기와 검사

| 일 | 명령 |
|---|---|
| 사막 맵 데이터 | `python3 tools/maps/desert.py` (data/maps/desert_*.json, scene-art, 그림 복사. 손으로 고치지 않음) |
| 등록표 | `python3 tools/maps/desert-registry.py` → `docs/DESERT-REGISTRY.md` |
| 몹 등록표 | `python3 tools/maps/desert-mobs.py` → `docs/DESERT-MOBS.md`, 확인 그림 |
| 맵별 오버레이 | `python3 tools/maps/desert-overlay.py [map id …]` → `docs/consult/desert/maps/<id>-overlay.png` |
| 03·04 충돌 | `python3 tools/maps/desert-collision.py` (사용자 승인본, 다시 돌리면 같은 PNG) |
| 사막 걷기 | `node tools/st-test/desert-maps.cjs [out]` |
| 저장 이관 | `node tools/st-test/desert-save-move.cjs` |
| 회귀 | [`DESERT-COMBAT-SURVEY.md`](DESERT-COMBAT-SURVEY.md) 「회귀 시나리오」 |

## 기록

| 날짜 | 단계 | 한 일 | 결과 |
|---|---|---|---|
| 10-18 | A | 등록표(34곳·40장), 코드 경로, 오버레이 6맵 | 해시·크기 통과, 경계 차이 0px |
| 10-18 | B1 준비 | 02 돌 문 → 11 → 17, 출구·착지 사용자 표시대로, 세부맵 카메라 0.8·캐릭터 ×1.4, 11·17 문틀 가림 | 걷기 11구간 통과 |
| 10-19 | A 보완 | main 0.9.88 합침, 전투 조사(A-1), 몹 등록표 12종·120장(A-3), 이 기록(A-6), 등록표 정한 것·추천안·미정 정리(A-7), 11·17 의미 ID와 저장 14판 이관(A-8) | 몹 해시 120장 통과, 저장 이관 9개 통과 |
| 10-19 | B1 마무리 | main 0.9.89 합침, 회귀 13개 + B1 18개, 렌더러 다시 열기 오류 수정, 17 동쪽 착지 1725 → 1651, 564(사용자 파란 동그라미, 화면 안), 태양거울 방향·발사점, 몹 배치·부유·재출현 결정 반영 | 모두 통과. 처음 실패 셋은 환경(브라우저 경로, 시험 ST의 AI Horde 500)과 시험 순서(0.9.89에서 main이 고침) |

## 따로 고칠 것

- 창을 닫지 않고 새로고침하면 위치가 마지막 저장(창 닫기·접기·맵 이동)으로 돌아간다. 모든 맵 공통의 기존 동작(window.js `remember`). 이번 작업에서는 저장 방식을 바꾸지 않았다. 개선안을 따로 제안한다.

