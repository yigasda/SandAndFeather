# 0.9.92 이후 세로 홈 UI·확대율 수정 (미발행)

기준: main `717fee00ed5d20266385b310f2b3bdd00d92168e`. 사용자 요청에 따라 수정·검증만 수행하며 main/release 발행과 버전 변경은 하지 않는다. 새 아트, 전투 버튼 시안, 인연 AI 분석 로직은 변경하지 않는다.

## 가로/세로 대조

| 항목 | 기존 0.9.92 세로 | 이번 변경/확인 |
|---|---|---|
| B형 조이스틱, 상황별 말걸기/공격·스킬·궁 | 이미 공통 적용 | 기존 아트·이벤트 유지, 실제 복합 터치 재검증 |
| 핀치줌, 맵 두 손가락만 허용, UI 혼합 제외 | 이미 공통 적용 | 입력 중복 구현 없음. 첫 진입·맵 이동·회전·취소 후 실제 터치 검사 |
| 맵 경계·최소/최대 줌 | 이미 공통 적용 | 경계 계산 유지, 네 모서리 검사 |
| 선택 확대율의 맵 간 유지 | 양쪽 모두 초기화 | 초기화 제거, 맵의 cameraScale과 별도로 선호 배율 유지 |
| 날짜/체력 좌측 축 정렬 | 가로에만 적용 | 세로 날짜 아래 체력, 그 아래 상태/모험 행 배치 |
| 모험 등급 아래 퀘스트 | 가로에만 적용 | 세로 등급을 행 첫 칸에, 안내를 다음 행 같은 좌측 축에 배치 |
| 미니맵 아래 메뉴·설정·가방 | 메뉴는 가로에만 노출 | 세로에도 3버튼, 가로·세로에서 같은 메뉴 기능 |
| 기존 화살표/X 이동 | 세로 미니맵을 가림 | 세로에서도 숨기고 메뉴 내부 접기/닫기로 접근 |
| HP/공포 3줄, 전투 대상 제목 | 이미 공통 적용 | 글씨 박스·화면 경계 재검증, 기존 타깃 이름 로직 유지 |
| original10 메뉴 아트·내부 메뉴 이동·기록/선물 정보 | 가로 미디어 조건에 제한 | 승인된 기존 소스만 공통 적용. 세로는 제목/탐색을 두 행, 내용을 한 열로 쌓고 스크롤 유지 |

## 카메라 유지 범위

기존 저장 설정 및 게임 상태에 사용자 줌 저장 항목은 없었다. 이번에는 기존 Renderer의 메모리 안에서 유지한다. 사용자가 핀치하기 전에는 각 맵의 원래 cameraScale을 따른다. 핀치한 뒤에는 화면 기본 배율(baseZoom)에 대한 선호 비율을 기억해 맵별 기본 cameraScale 변화가 사용자 선택을 덮어쓰지 않게 한다.

맵이 작아 그 배율로는 외부 여백이 생기면 **실제 표시만** 해당 맵의 한계로 보정한다. 선호 값은 덮어쓰지 않으므로 큰 맵으로 돌아오면 복구된다. 창 접기/다시 열기도 유지한다. 화면 회전은 기존 화면 폭 기반 baseZoom 계산을 따르며 선호 비율을 지우지 않는다. 브라우저 새로고침까지 영구 저장하는 변경은 포함하지 않는다. 저장데이터 이관은 없다.

## 얼룩 고양이 안내 회전 제보

제보의 패널을 홈의 `.sf_hint_pill` 작은 모험 안내로 해석해 조사했다. 실제 모험 상태의 안내를 `얼룩 고양이를 따라가 보자.`로 둔 격리 시험이다. 기존 CSS와 수정 CSS 각각 5개 테마에서 가로(844×390) → 세로(390×844) → 가로 → 세로 → 가로를 캡처하고 날짜/상태/등급/안내/미니맵의 DOM 위치·크기를 비교했다.

기존 버전에서 회전 후 가로 좌표는 첫 가로와 같았고, 두 번째 세로도 첫 세로와 같았다. 안내 요소에 남는 인라인 스타일도 없었다. 따라서 **제보된 배열 깨짐은 이 환경에서 재현하지 못했으며 수정 완료로 주장하지 않는다.** 실제 깨진 화면, 테마, 기기/브라우저 및 어느 패널인지 추가 증거가 필요하다. 핀치 입력은 회전 도중 취소 후 새 두 손가락 입력이 정상 작동하는지 별도 확인했다.

## 검사 및 증거

최종 결과는 `summary.txt`와 추가 검사 로그에 기록한다. 기존 UI 3종은 `node tools/art/verify-cozy-ui.cjs <out>`, `node tools/art/verify-ui-themes.cjs <out>`, `node tools/art/verify-full-map.cjs <out>`이다. 기존 하단 탭 직접 클릭은 새 메뉴 열기 후 같은 목적지를 클릭하도록 시험 동선을 갱신했다. 기능·경계 기준은 유지했다.

처음 작성한 세로 터치 스크롤 검사는 내용이 844px 화면에 모두 들어가 스크롤이 필요 없는 상태를 실패로 판정했다. 진단값은 clientHeight=scrollHeight=732였다. 실제 스크롤이 필요한 390×640 상태로 바꾸고 손가락 드래그 후 scrollTop=159를 확인했다. 게임 스크롤 고장을 숨기기 위해 기준을 낮춘 것이 아니다.

출입구 검사의 첫 실행은 동영상용 ffmpeg 경로 환경변수가 빠져 브라우저 페이지 생성 전에 중단됐다. 기존 설치 경로 `PLAYWRIGHT_BROWSERS_PATH=/tmp/hud-playwright`를 지정해 해당 검사만 다시 실행한다.

캡처의 게임 데이터는 격리 시험용이며 사용자 저장데이터가 아니다. 유료 AI/실제 채팅 생성은 호출하지 않는다.

## 최종 실행 결과

런타임은 `717fee00` 이후 `src/world/render.js`와 `style.css`만 변경했다. 최초 최종 묶음의 변경 지문은 `2c7b3cf`, 이후 메뉴 시험의 세로 옵션 추가 후 지문은 `7257a97`이다. 두 묶음 사이 게임 런타임 변경은 없다.

- `ST_ROOT=/workspace/sillytavern bash tools/st-test/tiers.sh quick portrait-zoom hint-rotation input ui --out /tmp/portrait-zoom-final`: 문법 8개, portrait-zoom 7, hint-rotation 8, pad-tabs 16, landscape 11 통과. UI 3종 모두 exit 0. 출입구 첫 실행은 ffmpeg 환경 누락으로 시작 전 실패.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/hud-playwright ST_ROOT=/workspace/sillytavern bash tools/st-test/tiers.sh portal-walk:--exit-lifecycle --out /tmp/portrait-exit-retry`: 출입구 생명주기 14개, exit 0.
- `ST_ROOT=/workspace/sillytavern bash tools/st-test/tiers.sh quick landscape-menu:--portrait zoom-clamp-retention npc-visibility --out /tmp/portrait-final-extras`: 문법 11개, 세로 20개 테마/밝기/화면 조합 + 실제 선물/반복 확인/인물 선택/5개 메뉴 이동 통과. 낮은 줌 선호 값의 임시 경계 보정 후 복구 2개 통과. 일반 NPC 16조합 픽셀 검사 통과.
- `NODE_PATH=/opt/codex/cua_node/lib/node_modules node docs/consult/portrait-zoom-fix/npc-zoom-culling.cjs <out>`: 가로·세로 최소/최대 줌 4조합에서 일반 상인 픽셀 유지, exit 0.
- 전체 병합/발행 검사는 이번에 수행하지 않았다. 요청 범위는 수정·검증이며, main/release 발행 전 전체 검사는 별도 필요하다.

### NPC 소실 제보: 조사 결과와 남은 제한

옴보스 맵 데이터의 NPC는 세트·호루스·상인이다. 앞장/동행 중인 인물만 정적 위치 목록에서 빠지고, 상인은 그 필터에서 제외되지 않는다. 일반 상인을 빼고 그린 캔버스와 넣고 그린 캔버스를 같은 프레임에서 비교했다. 실제 상인 픽셀 차이는 세로 기본 줌 3,255~3,359개, 가로 7,291~7,533개였다. 아침·낮·저녁·밤, 방 왕복, 회전 두 차례 모두 존재했다. 최소/최대 줌에서도 1,332~68,053개 픽셀 차이가 남았다. 배경 가림을 임시 제외한 진단도 함께 기록했다. 동행이 보인다는 사실로 일반 NPC 정상 여부를 대신 판단하지 않았다.

현재 시험 환경에서는 **일반 NPC 소실을 재현하지 못했다. 원인 확인 또는 수정 완료 상태가 아니다.** NPC 좌표·아트·생성 조건·가림 코드는 근거 없이 변경하지 않았다. 첨부 `libfile_593d82ffd9d481919237ba9e7571ee90`의 Library 메타데이터와 다운로드 주소 발급은 성공했으나, 실행환경에서 이미지 호스트 연결이 `Tunnel connection failed: 403 Forbidden`으로 차단됐다. 원본 이미지 픽셀은 직접 열지 못했고 부모의 화면 설명을 참고했다. 실제 발생 기기의 화면/버전·확대율·재현 동선 확인이 남아 있다.

### 대표 캡처

- 수정 전 세로: `before-390-home.png`
- 수정 후 세로/가로 홈: `390-cozy-combat.png`, `844-cozy-combat.png`
- 세로/가로 메뉴: `390-cozy-menu.png`, `844-cozy-menu.png`
- 세로 터치 스크롤: `390-menu-touch-scroll.png`
- 확대율 유지 후 탐색: `390-exploration-zoom.png`, `844-exploration-zoom.png`
- 안내 회전: `event-cozy-first-landscape.png`, `event-cozy-portrait.png`, `event-cozy-return-landscape.png`
- 일반 상인: `npc-1-390-morning.png`, `npc-5-844-morning.png`, 밤 캡처 2장

두 재현 미확인 제보(이벤트 안내 배열, NPC 소실)를 해결 완료로 표시하지 않는다.

## 후속 정정

위 기록은 56cd1507 당시의 결과다. `morning`은 유효한 시간 enum이 아니므로 해당 캡처로 아침 검증을 주장한 것은 정정한다. 후속 검사에서 하티르 8일 `dawn`과 실제 scene.part를 확인했다. 상인은 가상으로 추가하지 않고 실제 merchant 렌더만 켜고 꺼 비교했다. 이후 캐시 손실 복구 결함을 주입 재현했고 이벤트/날짜 패널도 사용자 제보 기준으로 수정했다. 최신 범위·전후 증거·한계는 [후속 보고](../npc-panel-recovery/README.md)를 따른다.
