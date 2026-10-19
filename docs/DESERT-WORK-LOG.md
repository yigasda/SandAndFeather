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
| 호루스 기술·가드 깨기 | `node tools/st-test/desert-horus-leap.cjs [out]` (영상 docs/consult/desert/b3/) |
| 15 빛 퍼즐 A안 | `node tools/st-test/puzzle-lift.mjs`, `node tools/st-test/desert-15-lift.cjs [out]` |
| 사막 몹 12종 몸 범위 검수 | `node tools/st-test/desert-mob-hits.cjs [out]` |
| 일반 공격 판정 | `node tools/st-test/desert-strike.cjs [out]` |
| 몹 그림 로딩·메모리 | `node tools/st-test/mob-art-load.cjs [out]` |
| 회귀 | [`DESERT-COMBAT-SURVEY.md`](DESERT-COMBAT-SURVEY.md) 「회귀 시나리오」 |

## 기록

| 날짜 | 단계 | 한 일 | 결과 |
|---|---|---|---|
| 10-18 | A | 등록표(34곳·40장), 코드 경로, 오버레이 6맵 | 해시·크기 통과, 경계 차이 0px |
| 10-18 | B1 준비 | 02 돌 문 → 11 → 17, 출구·착지 사용자 표시대로, 세부맵 카메라 0.8·캐릭터 ×1.4, 11·17 문틀 가림 | 걷기 11구간 통과 |
| 10-19 | A 보완 | main 0.9.88 합침, 전투 조사(A-1), 몹 등록표 12종·120장(A-3), 이 기록(A-6), 등록표 정한 것·추천안·미정 정리(A-7), 11·17 의미 ID와 저장 14판 이관(A-8) | 몹 해시 120장 통과, 저장 이관 9개 통과 |
| 10-19 | B1 마무리 | main 0.9.89 합침, 회귀 13개 + B1 18개, 렌더러 다시 열기 오류 수정, 17 동쪽 착지 1725 → 1651, 564(사용자 파란 동그라미, 화면 안), 태양거울 방향·발사점, 몹 배치·부유·재출현 결정 반영 | 모두 통과. 처음 실패 셋은 환경(브라우저 경로, 시험 ST의 AI Horde 500)과 시험 순서(0.9.89에서 main이 고침) |
| 10-19 | B3 진단·호루스 A안 | 장면별 초기화 진단(S1~S4): 가드 규칙은 두아트와 같음, 실패는 시험(타이밍·장면 사이 상태·동행 피해 섞임·피해만으로 판정)과 호루스 도약이 가까운 적을 넘어가는 것. **이번 검사 범위에서 사막 변경으로 인한 오류가 확인되지 않았다.** 호루스 기술 A안: 진행 방향 도약 경로의 가장 가까운 유효 적 앞(몸 가장자리 + 0.6칸)에 착지, 적 없으면 기존 2.5칸. 피해·반경 1.2·가드 시간 그대로, 경로 전체 피해(B안) 없음. 적 몸 반경 `body`(데이터, 기본 0 = 두아트 그대로) | `desert-horus-leap.cjs` 16개 통과(근접·최대·넘어섬·큰 적·뒤·옆·벽 너머·벽 앞·두아트 고대장치 2·호루스/세트 가드 깨기·가드 중 반올림 2). 회귀 duat-field 23·duat-mob-video·B2 14·사막 걷기·광학 13 통과 |

| 10-19 | 퍼즐 A안·몸 범위 | 15 A안 맵 안 시제품(받침 회전·올림 틀 밀기·낮은/높은 빛 구분·장치 창·채팅별 저장), 16 구체 설계(돌 하나·그릇 둘·돌림판, 그림·충돌 원본 확인), 방패병 몸 범위 비교(데이터 값 추가, 기본 0) | puzzle-lift 5·desert-15-lift 22·desert-b2 14·horus-leap 16 통과, 16 전체 상태 12 중 정답 1, 몸 범위 비교 4안 |

| 10-19 | 몸 범위·16 보완 | 호루스 C안·세트 A안 적용(착지 여유·기술별 명중 분리), 사막 몹 12종 몸통·앞 몸체 실측과 크기 제안 팩, 16 안 X 보완·안 K 비교·접근 검사·입구 갓·벽감 그림 목록 | desert-mob-hits 24·horus-leap 16 통과, 16 두 안 정답 각 1·접근 통과 |

| 10-19 | 일반 공격·기준점·에셋 | 일반 공격을 공격 범위×피격 도형(몸통·방패 막힘·주먹)으로, 12종 기준점을 몸통 가운데로, 몹 그림 맵별 불러오기·놓기, 무손실 최적화, 로딩·메모리 측정 | desert-strike 58·desert-mob-hits 36·horus-leap 16·mob-art-load 6 통과, duat-mob-video 통과 |
| 10-19 | 수문장 거리·방향 | 몸통을 바닥 타원(앞뒤 0.4배)으로, 수문장 몸통은 주먹 뒤(`hit.back`), 몹이 알아채는 거리를 몸 끝부터, 몹은 서 있어도 상대를 봄, 스틱 뗀 공격·기술은 닿을 몹 쪽으로 돌아서 | desert-strike 130·desert-mob-hits 37·horus-leap 16·desert-b3 통과, duat-field 전체 3회 중 1회 세트 "공격으로 체력 줄어듦" 실패(그때 세트가 맞는 중, 원인 확정 못 함), 다른 2회와 세트만 2회는 통과, 바꾸기 전 세트만 2회 통과 |
| 10-19 | 겨냥·main 반영 | 돌 방향을 실제로 닿는 방향으로(`aimWay`), 동행 자리·공격을 도형으로, 전투 거리 몸 끝부터, 인수인계 문서 DESERT-OPUS-HANDOFF | 전체 17개 통과(desert-target 77·strike 130·mob-hits 38·horus-leap 17·b1·b2·b3·15-lift·maps·save-move·mob-art-load·duat-field·verify 3). strike 벽 검사 3개가 처음 실패 → 스틱 고정 시험에서 전투 시작 돌기가 끼어든 것, 고친 뒤 130 통과 |

## 따로 고칠 것

- 창을 닫지 않고 새로고침하면 위치가 마지막 저장(창 닫기·접기·맵 이동)으로 돌아간다. 모든 맵 공통의 기존 동작(window.js `remember`). 이번 작업에서는 저장 방식을 바꾸지 않았다. 개선안을 따로 제안한다.

