# 사막 인수인계 — 사막 맵·사막 몹 (오푸스, 2026-10-19 기준)

이 문서 하나로 지금까지의 사막 작업(맵·몹·전투·퍼즐)을 이어받을 수 있게 정리했다. 세부 근거는 각 절에 연결된 문서에 있다. 공통 규칙은 [OPUS-HANDOFF](OPUS-HANDOFF.md), 그림(아스트라) 쪽은 [ASTRA-DESERT-HANDOFF](ASTRA-DESERT-HANDOFF.md)다.

---

## 0. 당시 구현 상태 한눈에

> 이 표와 아래 실행 기록은 작성 시점 스냅샷이다. 최신 설계는 [신전 최신 연결 기준](DESERT-TEMPLE-CONNECTIONS.md)이며, 문서 갱신으로 새 그래프가 게임에 적용된 것은 아니다.

| 항목 | 상태 |
|---|---|
| 작업 브랜치 | `ccr-3d224608-3ozn95`. 2026-10-19 전체 시험(7절 17개) 통과 뒤 main에 반영(사용자 지시 "검증 후 메인에 푸시") |
| 버전 | **올리지 않음.** `manifest.json`·`src/core/settings.js` 그대로(사용자: 버전 변경 보류) |
| release 브랜치 | **반영하지 않음.** 사막 몹 그림 84 MB를 release에 넣을지 사용자 결정 보류 중(4절 "배포") |
| 저장 판 | 14판(`src/core/state.js` STEPS 12·13: 옛 사막 ID → 의미 ID) |
| 게임에서 걸어 갈 수 있는 사막 맵 | 01 황금 사구해 ↔ 04 ↔ 03 ↔ 02, 02 ↔ 11 ↔ 17 (옴보스 동쪽 끝 ↔ 01 서쪽) |
| 등록은 됐지만 문이 없는 맵 | 15 열주홀(`desert_colonnade`), T1W 서쪽 제례 앞뜰(`desert_forecourt_west`) — 시험 이동(`travel`)으로만 들어감 |
| 몹 | 12종 그림·도형·판정 완성. 실제 배치는 **T1W 가죽 방패병 한 마리**뿐(`data/desert.json`). 나머지 11종은 전투 수치가 없음 |
| 퍼즐 | 15 A안 "올림" 맵 안 시제품(사용자 영상 검토 대기). 15 전용 화면(B2)은 기능 시제품으로만 남김. **16은 사용자가 새 메커니즘을 따로 줌 — 그 전까지 16 설계를 더 하지 않는다** |

---

## 1. 반드시 지킬 사용자 지시 (누적)

- **승인된 그림·배경을 다시 그리거나 고치지 않는다.** 사용자 충돌 PNG를 고치거나, 자동 추정으로 다시 만들거나, 단순화하지 않는다.
- **원본 PNG는 보존한다.** 용량 때문에 줄이거나 화질을 낮추지 않는다(아틀라스도 4096을 넘으면 그 종 안에서 여러 장으로 나누지, 축소하지 않음).
- **원본 자료 위치:** 맵 원본은 Drive "사막맵", 수동 충돌은 Drive "사막맵 충돌". 저장소에도 `사막맵/`(원본 39장), `사막맵/충돌/`(충돌 35장, 16도 `사막맵/충돌/16_빛우물.png`에 있음)이 있다. **로컬에 없거나 게임에 등록되지 않았다는 이유로 원본이 없다고 보고하지 않는다.**
- **시험을 끄거나 기준을 낮추지 않는다.** 실패는 그대로 보고(통과 / 실패 / 미실행 / 환경 차단).
- **승인된 전투 수치(기술 피해·반경·가드 시간·가죽 방패병 사거리·돌진 등)를 임의로 바꾸지 않는다.**
- 보고는 짧게: 끝낸 것 / 사용자가 정할 것. 캡처·영상을 보여 준다. 정말 사용자 결정만 묻는다.
- 커밋 작성자 `Somnag <soonjung118@gmail.com>`, 모델 이름을 커밋·문서에 쓰지 않는다.
- 안채 맵(`data/maps/` 안채)은 `tools/maps/residence.py`로만. 사막 맵 데이터도 `tools/maps/desert.py`로만 만든다(손으로 고치지 않음).

---

## 2. 자료 위치

| 무엇 | 어디 |
|---|---|
| 맵 원본 그림 | `사막맵/*.png` (34곳·40장, `사막맵/manifest.json`) · Drive "사막맵" |
| 맵 수동 충돌 | `사막맵/충돌/*.png` · Drive "사막맵 충돌". 칠한 곳 = 바닥, 투명 = 막힘. 게임은 알파 128 이상을 원본 1px 단위 `pixelWalk`로 읽음 |
| 몹 원본 | `몹/사막/01_봉인항아리` … `12_파릉수문장` (종마다 10장, `몹/사막/manifest.json`) |
| 몹 아틀라스(게임용) | `data/art/enemies/desert-<종>-<n>.png`, `-small-<n>.png` · 정보는 `data/sprites.json enemies.<종>` |
| 사막 전투 데이터 | `data/desert.json` (`enemies`, `maps.<id>.spawns`) |
| 사막 맵 데이터 | `data/maps/desert_*.json`, 그림 등록 `data/scene-art.json` (생성: `tools/maps/desert.py`) |
| 등록표 | [DESERT-REGISTRY.md](DESERT-REGISTRY.md) (34곳, 연결, 정한 것, 추천안, 미정) · [DESERT-MOBS.md](DESERT-MOBS.md) (12종) |
| 전투 조사·결정 | [DESERT-COMBAT-SURVEY.md](DESERT-COMBAT-SURVEY.md) |
| 작업 기록·실행법 | [DESERT-WORK-LOG.md](DESERT-WORK-LOG.md) |
| 퍼즐 | [DESERT-PUZZLES.md](DESERT-PUZZLES.md) (B2 전용 화면), [DESERT-PUZZLE-A.md](DESERT-PUZZLE-A.md) (15 A안·16 옛 설계), [DESERT-PUZZLE15-DESIGNS.md](DESERT-PUZZLE15-DESIGNS.md) |
| 사용자 전달서 | `docs/consult/desert/puzzle-mechanisms-2026-10-19.txt`, `…-v2-inworld-2026-10-19.txt` |
| 검수 그림·영상 | `docs/consult/desert/{b1,b2,b3,maps,mobs,puzzle15,puzzle16}` |

---

## 3. 사막 맵

**최신 설계:** [신전 최신 연결 기준](DESERT-TEMPLE-CONNECTIONS.md) 및 [정리 지도](consult/desert/temple-route-2026-10-19/route.png). 본선 02→15→T2→11→02, 앞뜰 순환 15→T1W→T1E→T2→15, 16은 T2→T3→16. T1E-B·C↔T1W-B 두 길 모두 보존한다. T2-B·C 출구는 최신 파란 표시를 기준으로 원본 정합 후 정한다. 15-B·T3 양옆 네 구멍은 출입 제외다.

**보류:** T3 큰 문 통과 조건, W-B 두 경로의 트리거·귀환 방식, 11-A의 기존 17 연결 재배치. 기존 17 연결은 임의 삭제하지 않는다.

### 3-1. 당시 게임에 들어간 8곳 (`src/core/data.js DESERT`)

| 번호 | ID | 크기 구분 | 출구 → | 들어오는 이름(entries) |
|---|---|---|---|---|
| 01 | `desert_golden_dunes` | 대형 | 옴보스, 04 | west, east |
| 04 | `desert_dry_flats` | 대형 | 01, 03 | west, east |
| 03 | `desert_quiet_dunes` | 대형 | 04, 02 | west, east |
| 02 | `desert_buried_temple` | 대형 | 03, 11 | west, door |
| 11 | `desert_city_gate` | 세부 | 02(두 곳), 17 | outside, door |
| 17 | `desert_city_plaza` | 세부 | 11 | east |
| 15 | `desert_colonnade` | 세부 | 없음 | east |
| T1W | `desert_forecourt_west` | 세부 | 없음 | yard |

- 나머지 26곳은 등록표에만 있다(그림·충돌 승인됨, 게임 미등록). 연결 계획은 [DESERT-REGISTRY 「연결」](DESERT-REGISTRY.md).
- **표시 배율(사용자 확정):** 대형맵(01~04) 두아트 대비 44 %, 카메라 0.6, 캐릭터 ×1.6, 걷기 1.4배. 세부맵 두아트 배율, 카메라 0.8, 캐릭터 ×1.4(`actorScale`), 걷기 1배.
- **착지 규칙:** [최신 공통 기준](OPUS-MAPS.md)을 따른다. 원문의 사람 폭 3배/GAP 설명은 옛 검사 기록이며 사용자 지정 착지를 옮기는 기준이 아니다. 실제 발·동행·재전환 여유를 검사한다. 당시 사용자 지정 17 동쪽 착지 1623, 570, 11 문 672, 468은 임의 변경하지 않는다.
- **가림:** 11 계단 입구 인방·양 문설주, 17 두 집 문을 그림 외곽선 픽셀로 딴 occluders(사용자: 다 가림).
- **03·04 충돌:** 오푸스가 만들고(`tools/maps/desert-collision.py`) 사용자가 고쳐 승인. 다시 돌리면 같은 PNG.
- **T1W 착지·몹 자리:** 몹 기준점을 몸통 가운데로 옮길 때 그림 위치를 지키려고 스폰 x를 38.25 → 38.68로 바꿨다.

### 3-2. 맵 작업 방법

```sh
python3 tools/maps/desert.py            # data/maps/desert_*.json, scene-art, 그림 복사 (손으로 고치지 않음)
python3 tools/maps/desert-registry.py   # docs/DESERT-REGISTRY.md
python3 tools/maps/desert-overlay.py [map id …]   # docs/consult/desert/maps/<id>-overlay.png (원본 경계·적용 경계·발·출입·착지)
node tools/st-test/desert-maps.cjs <out>          # 옴보스↔01, 01→04→03→02 왕복, 02→11→17→11→02 걷기
node tools/st-test/desert-b1.cjs <out>            # 02 돌 문 → 11 → 17 → 11 → 02 터치 조이스틱 걷기
node tools/st-test/desert-save-move.cjs           # 옛 ID 저장 이관
```

새 맵을 넣을 때: `desert.py`에 등록 → 충돌은 사용자 PNG 그대로 → 오버레이로 출구·착지 확인받기 → `DESERT` 목록 → 걷기 시험(`touch-walk.cjs`의 터치 걷기, 순간이동 아님) → 낮밤·폰 화면.

### 3-3. 맵 쪽 미결

- 20↔보물방 문턱, 전망맵 워프 목적지·착지, 보물방 상자 열림 충돌(C4만 있음), 황금 부장고 상자 수·보상.
- 새 신전 연결의 구현·검증은 [신전 최신 연결 기준](DESERT-TEMPLE-CONNECTIONS.md)의 현재 구현 대조와 미결 목록을 따른다. 옛 순서로 문을 복구하지 않는다.
- 새로고침하면 마지막 저장 위치로 돌아가는 공통 동작(window.js `remember`) — 개선안 따로 제안 예정.

---

## 4. 사막 몹

### 4-1. 12종과 배치 계획

| 종 ID | 이름 | 크기(캐릭터 키 배) | 부유 | 배치 대상(종 구성만 확정, 마릿수·좌표 미정) |
|---|---|---|---|---|
| `desert_sealed_jar` | 봉인 항아리 | 0.95 | × | T1W·T1E, T2, 17 |
| `desert_leather_shield` | 가죽 방패병 | 1.5 | × | T1W·T1E, 03·04 |
| `desert_sealed_shield` | 봉인 방패병 | 1.6 | × | P2, 03·04 |
| `desert_walking_stela` | 걸음 비석 | 1.4 | × | P4, 10 |
| `desert_sun_mirror` | 태양거울 | 1.3 | ○ | T2 |
| `desert_balance_sentinel` | 천칭 파수꾼 | 1.3 | ○ | T3, P1 |
| `desert_mask_priest_mantle` | 빈 가면 사제 장막형 | 1.45 | ○ | T2 |
| `desert_mask_priest_shroud` | 빈 가면 사제 수의형 | 1.45 | ○ | P3A |
| `desert_royal_mask_warden` | 왕면 수문장(보스) | 4.2 | × | P2 (첫 처치 = 14 통로 영구 개방) |
| `desert_temple_warden` | 신전 수문장(보스) | 4.2 | × | T3 |
| `desert_throne_warden` | 왕좌 수문장(보스) | 4.2 | × | P3B 한 개체 |
| `desert_broken_tomb_warden` | 파릉 수문장(보스) | 4.2 | × | P4 |

- 크기: 항아리 0.95(사용자 지정), 수문장 4.2(사용자: 1.5배 더). 나머지는 팩 값.
- 부유는 그림 높이만이다(충돌·기준점은 지상과 같음). 지금 부유 여부는 `data/desert.json enemies.<종>.float`로 정하며, 가죽 방패병만 `float: false`로 들어가 있다.
- 재출현(사용자 확정): 일반몹·보스 모두 게임 하루가 지난 뒤 재입장할 때. 최초 처치(`s.desertFight.first`)와 쓰러진 날(`s.desertFight.killed[spawnId]`)은 따로 저장. 패배하면 그 맵 들어온 곳으로 물러남(잃는 것 없음, "물러났어" 카드).

### 4-2. 그림 묶기 (`tools/art/desert-mob-pack.py`)

```sh
python3 tools/art/desert-mob-pack.py [종 …]         # 종별 아틀라스 다시 묶기 + sprites.json (원본 그대로)
python3 tools/art/desert-mob-pack.py --hit [종 …]   # 시트는 두고 피격 도형(hit)만 다시 재기
```

- **종별 아틀라스(사용자):** 한 종의 10모션을 그 종 시트에. 4096×4096을 넘으면 그 종 안에서 여러 장(`sheets`), 축소 없음. 큰 묶음(`visible` 256)과 작은 묶음(`small`). 프레임 = `[x, y, w, h, 기준x, 기준y, 장]`. oxipng 무손실(−3 %, 픽셀 같음).
- **기준점(사용자):** 가로 = 몸통 가운데(HIT의 cx), 세로 = 등록표 발 줄(`footLineCandidate`). 한 종 한 기준점이라 좌우 반전(그림은 왼쪽을 봄, 오른쪽을 보면 반전 `o.faceR`)에 몸이 밀리지 않는다.
- **HIT 표(눈으로 잰 값, 원본 px):** `(몸통 가운데 x, 몸통 반폭, 앞 몸체 끝 x)`. 무기·추·천·섬광·투명 여백은 빼고 잰다. 수문장 앞 몸체는 주먹 **가운데**(사용자: 더 가깝게).
- **sprites.json `hit`(캐릭터 키 단위):**

| 키 | 뜻 |
|---|---|
| `body` | 몸통 반폭. 바닥에서는 타원: 좌우 `body`, 앞뒤 `body × 0.4`(`DEPTH`) |
| `front`, `frontKind` | 앞으로 내민 것, 발 줄 위 한 줄. `shield` = 방어 표면(가죽·봉인 방패병), `body` = 몸(수문장 주먹) |
| `back` | 수문장만. 발 기준점(주먹 앞 바닥)에서 몸통 타원 가운데까지 뒤로. 타원 앞 끝 = 대기 그림 몸통 가운데 열의 맨 아래 |

  현재 값: 항아리 body .334 / 가죽 .179·front .837 shield / 봉인 .203·1.003 shield / 왕면 1.003·1.003 body·back .824 / 신전 1.13·1.606·.833 / 왕좌 1.433·1.994·.71 / 파릉 .942·2.221·.485 (나머지는 body만).

### 4-3. 불러오기·메모리 (`src/core/data.js`, field.js `keepArt`)

- 그 맵에 있는 종만, 그리는 프레임이 든 장만 불러온다(`spriteFile`). 화면에 작게 그릴 땐 작은 묶음, 원하는 묶음이 준비되면 다른 묶음을 놓는다(`releaseSprites`). 필드를 떠나면 `keepArt([])`로 모두 놓는다. 디코딩 중에 놓은 그림이 다시 붙지 않게 로딩 약속 대조.
- 측정(`node tools/st-test/mob-art-load.cjs`, 폰 412×900 dpr 2, CPU 4배 느리게, 로컬): T1W 가죽 방패병 처음 보이기 1.0~1.2초, 5.3 MB. 수문장 하나 더하면 52.7 MB(큰 묶음 한 장 47.4 MB). 맵 왕복에도 쌓이지 않음.
- **배포(결정 보류):** `tools/release.sh`는 `src`·`data`를 담으므로 지금 release를 만들면 `data/art/enemies`의 사막 아틀라스(약 81 MB)가 들어간다. 원본(`몹/사막`)은 안 들어간다. 사용자가 정하기 전에는 release를 만들지 않는다.

### 4-4. 전투 판정 (`src/packs/duat/field.js`, 두아트와 같은 코드)

`charTiles() = 31.2/16 × actorScale` — 캐릭터 키를 칸으로. 도형은 `shape(o)` = 시험값 `o.e.hit` 또는 sprites.json `hit`. 두아트 몹은 도형이 없어 점(발 가운데)이고, 판정은 예전과 같다.

| 무엇 | 함수 | 규칙 |
|---|---|---|
| 몸통 | `hurtArea` | 타원: 가운데 (발 x, 발 y − back), 반지름 x `body`, y `body × 0.4` |
| 앞 몸체 | `frontLine` | 발 줄 위 한 줄, 몹이 보는 쪽(`faceR`)으로 `front` 길이 |
| 일반 공격 | `strike` → `blowMeets` | 공격 상자(발 바로 뒤 0.2칸 ~ 사거리, 좌우 0.75칸, 길이·방향·피해 그대로)와 몸통 타원·앞 몸체가 겹치는지. 몸통·주먹 = 전부 피해, **방패에만** 닿음 = 가드 규칙 `max(1, round(피해×0.3))`·막힘 효과·움찔 없음. 맞는 점까지 벽 없음(`clearLine`) |
| 기술 | `useSkill` → `touches` | 기술 원과 몸통 타원(`toTorso`) 또는 앞 몸체. 방패는 **호루스 기술만** 명중(C안), 세트·소망은 몸통·주먹만(A안). 가드는 기술이 깸 |
| 호루스 착지 | `leapTarget`, `room` | 보는 쪽(좌우) 도약 경로의 가장 가까운 몹 앞 몸체(없으면 몸통) 끝에서 0.6칸(`LAND_GAP`) 띄우고 착지. 없으면 기존 2.5칸 |
| 몹이 알아챔 | `stepMob` | `AGGRO`(4) + 몸·주먹 길이 (큰 수문장이 주먹 끝을 맞고도 모르는 일 방지) |
| 몹 공격 거리·돌진·간격 | `stepMob` | **발 가운데 기준 그대로**(가죽 방패병 승인값 보호). 다른 종 전투 수치를 넣을 때 몸 끝 기준으로 바꿀지 정해야 함(6절) |

### 4-5. 방향·겨냥 (사용자 10-19 "방향 안 맞음", "타겟팅은 다른 몹도 이상해")

- **몹:** 싸우는 상대 쪽을 본다(`o.faceR`). 걷는 중엔 가는 쪽, 막는 중·움찔·공격 뒤에도 상대 쪽, 준비1에서 겨냥이 고정되면·돌진 중엔 그대로.
- **앞장(그):** 스틱을 **뗀 채** 공격·기술을 누르면 `aimWay`가 돌 방향을 고른다.
  1. 몹마다 네 방향 공격 상자 중 실제로 닿는 방향(몸통·주먹이 방패보다 우선), 그 중 몹 쪽에 가장 가까운 방향.
  2. 닿는 몹이 있으면 가장 가까운 몹으로, 없으면 사거리 + 1칸 안의 가장 가까운 몹 쪽으로(헛치기).
  3. 몹 몸 안에 서 있으면 몸통 가운데 쪽으로.
  4. 호루스 기술은 도약이 좌우뿐이라 좌우에서만 고른다.
  스틱을 기울이고 있으면 그 방향 그대로. 그림 방향(`player.dir`)도 같이 바뀐다. 전투에 들어갈 때(`faceMob`)도 같은 규칙.
- **동행:** 몹 몸통 높이에서, 몸 끝 + 사거리 0.75배 떨어진 반대편에 선다. 실제로 칠 때는 앞장과 같은 공격 상자(`blowMeets`, 방패만이면 막힘). 전투 시작·대상 고르기 거리(`FIGHT_NEAR` 6칸)는 몸 끝부터(`nearPoint`).
- **두아트에도 적용됨:** 스틱 뗀 공격의 자동 돌기는 두아트에도 같다(두아트 몹은 점이라 나머지 판정은 예전과 같음). 사막에만 둘지는 사용자 결정 대기.

### 4-6. 몹 쪽 미결 (임의로 채우지 않음)

- 11종의 전투 수치(체력·공격·사거리·공격 종류·가드 확률·부유·timing). 지금은 시험에서 가죽 방패병 수치를 빌려 쓴다.
- 공격 종류: 내려찍기(비석·천칭·왕면), 광선(태양거울), 주문(사제), 압착·누름·붙잡기(보스) — 코드에는 돌진·발사만 있음.
- 태양거울 광선: 방향(몹이 보는 쪽 수평)·발사점(06 (222, 299)·07 (210, 302)) 확인됨. 벽 차단·피해·게임 화면 미완료. 인수 조건은 [DESERT-COMBAT-SURVEY 「태양거울 광선」](DESERT-COMBAT-SURVEY.md).
- 맵별 마릿수·좌표(화면 오버레이로 확인받기), home/roam·leash, 보스 방 전체 어그로.
- 최초·반복 처치 보상(기존 아이템 목록 확인 뒤 제안).
- 큰 몹 몹 쪽 거리를 몸 끝 기준으로 할지(4-4 표 마지막 줄).
- release에 몹 그림을 넣을지(4-3).

---

## 5. 퍼즐

- **15 열주홀 A안 "올림"(맵 안 시제품, 사용자 영상 검토 대기):** `src/packs/puzzle/lift.js`(순수 규칙: 낮은·높은 빛, 기둥 창 나란히), `colonnade-lift.js`(맵 안 장치·`.sf_dev` 창·`map.dynamic` 막힘·깊이 정렬된 빛). 저장 `s.puzzles['desert.colonnade.lift']`. 임시 도형(분홍 테두리·점선)만, 최종 그림 틀은 규칙·위치가 확정된 뒤. 상세 [DESERT-PUZZLE-A](DESERT-PUZZLE-A.md).
- **15 전용 화면(B2):** `src/packs/puzzle/colonnade.js` `openColonnadeDemo` — 맵 장치는 뺐고 시험용으로만 남김(`desert-b2.cjs`).
- **16 빛 우물:** 사용자가 **따로 메커니즘을 준다**. 받기 전에는 설계를 더 하지 않는다. 옛 설계(X·K, `tools/puzzle/lightwell_*.py`)는 참고용. 16 계단은 최신 설계상 **T3 북쪽 큰 문에서 들어오는 길**이다(15→T2→T3→16). 공간 연결 지정은 새 16 퍼즐 설계나 T3 문 개방 조건 승인이 아니다.

---

## 6. 사용자 결정 대기 (모아 보기)

1. 스틱 뗀 공격의 자동 돌기를 두아트에도 둘지, 사막만 할지.
2. release에 사막 몹 그림(약 81 MB)을 넣을지.
3. 버전을 언제 올릴지(지금 main 반영은 버전 그대로).
4. 15 A안 시제품 영상 검토 결과 → 최종 그림 틀.
5. 16 메커니즘 문서.
6. 11종 전투 수치, 맵별 배치, 보상, 큰 몹의 몹 쪽 거리 기준.
7. 3-3·4-6의 맵·몹 미결 항목.

---

## 7. 시험 (실행법)

```sh
cd /home/user/sillytavern/sillytavern && node server.js --port 8000 --listen false   # 컨테이너가 다시 뜨면 서버가 죽어 있음 → 다시 켬
EXT=/home/user/sillytavern/sillytavern/data/default-user/extensions/SandAndFeather
cp -r src data index.js manifest.json style.css README.md "$EXT"/
export NODE_PATH=/opt/node-tools/node_modules
node --experimental-default-type=module --check src/packs/duat/field.js   # 문법 검사는 모듈 모드로(중복 선언을 잡음)
```

- 브라우저: `/usr/bin/chromium`이 없으면 Playwright 기본 chromium + `--no-sandbox`(스크립트가 알아서 고름). ST 첫 화면은 Save 버튼을 누르고 캐릭터가 뜰 때까지 기다린다(스크립트에 들어 있음).

| 스크립트 | 보는 것 | 마지막 결과 |
|---|---|---|
| `desert-target.cjs [out]` | 12종 × 세 사람, 여덟 방향 스틱 뗀 공격: 돌아서 침·그림 방향·몹이 봄, 닿지 않는 곳은 돌기만, 동행이 12종을 실제로 침 | 76 통과 |
| `desert-strike.cjs [out]` | 일반 공격 네 방향(몸 끝·빈 공간·방패만·주먹만·옆·뒤·벽), 손 뗀 돌기, 막는 수문장이 봄 | 130 통과 |
| `desert-mob-hits.cjs [out]` | 12종 × 호루스 착지·명중, 세트·소망 기술 닿는 거리 | 37 통과 |
| `desert-horus-leap.cjs [out]` | 호루스 A안 착지, 가드 깨기(세 사람) | 16 통과 |
| `desert-b3.cjs [out]` | T1W 가죽 방패병 한 마리 전투 전체 | 통과 |
| `desert-b2.cjs`, `desert-15-lift.cjs`, `puzzle-lift.mjs`, `puzzle-optics.mjs` | 15 퍼즐 | 통과 |
| `desert-maps.cjs`, `desert-b1.cjs`, `desert-save-move.cjs` | 사막 걷기·출구·저장 이관 | 통과 |
| `mob-art-load.cjs [out]` | 몹 그림 로딩·메모리 | 측정 |
| `duat-field.js <out>` | 두아트 전투(같은 코드) | 통과(이전 전체 실행 한 번에서 세트 공격 한 항목 실패 기록, 원인 미확정 — 그때 세트가 맞는 중) |
| `tools/art/verify-full-map.cjs`·`verify-cozy-ui.cjs`·`verify-ui-themes.cjs` | 옴보스 낮밤·UI·테마 | 통과 |

- **시험 전용 훅(field.js):** `testOnly(kind, x, y, 수치)`, `testFace(dir)`, `testHold(true)`(스틱을 기울인 것처럼: 정해진 방향 공격 검사에 필수 — 안 쓰면 자동 돌기가 끼어듦), `testMobFace(right)`, `testRanges(true)`(초록 몸통 타원·파랑 방패·초록 주먹 줄·주황/노랑 기술 원), `testEvents`, `testHurt`, `testTouch`, `testArt`, `testReset`, `fieldState`. 시험 몹은 `nopush`(밀려나지 않음)로 거리 측정.
- 시험에서 쓰는 거리 계산은 게임 함수를 쓰지 않고 시험 안에서 다시 계산한다(타원·주먹 줄·공격 상자). 도형 규칙을 바꾸면 시험의 `DEPTH`·`edge()`도 같이 바꾼다.

---

## 8. 파일 지도 (사막 관련 코드)

| 파일 | 하는 일 |
|---|---|
| `src/packs/duat/field.js` | 두아트·사막 공통 필드 전투: 스폰(사막은 `data/desert.json` spawns), 몹 상태 기계, 판정(4-4), 방향(4-5), 동행, 그림 그리기(`drawMob`, 종별 시트), 시험 훅 |
| `src/core/data.js` | `DESERT` 맵 목록, `spriteFile`·`releaseSprites`(시트 로딩·놓기, 경쟁 상태 방지) |
| `src/world/map.js` | `pixelWalk` 충돌, `dynamic`(움직이는 장치 막힘, 15 틀) |
| `src/core/state.js` | 저장 14판(사막 ID 이관), `s.desertFight`, `s.puzzles` |
| `src/packs/puzzle/lift.js`, `colonnade-lift.js`, `colonnade.js`, `optics.js` | 15 퍼즐 |
| `tools/maps/desert*.py` | 맵 생성·등록표·오버레이·03/04 충돌 |
| `tools/art/desert-mob-pack.py` | 몹 아틀라스·도형 |
| `tools/puzzle/*.py` | 15 설계안, 16 옛 조사·설계 |
| `tools/st-test/desert-*.cjs`, `touch-walk.cjs`, `mob-art-load.cjs` | 시험 |

---

## 9. 다음에 할 일 (추천 순서)

1. 사용자 답 반영: 6절 1·2·3.
2. 15 A안 영상 검토 반영 → 최종 그림 틀(아스트라에 넘길 목록).
3. 16 메커니즘 문서 받으면 설계·시제품.
4. [신전 최신 연결 기준](DESERT-TEMPLE-CONNECTIONS.md)의 10개 문 대응과 미결 조건을 대조한 뒤, 생성기·오버레이·실제 왕복으로 적용 검증. 현재 문서 갱신과 런타임 적용을 구분한다.
5. 11종 전투 수치 제안(가죽 방패병을 출발점으로, 종별 공격 종류) → 화면으로 확인받기 → 배치(마릿수·좌표).
6. 태양거울 광선(인수 조건대로), 보상.
