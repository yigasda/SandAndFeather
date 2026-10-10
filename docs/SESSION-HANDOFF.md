# 다음 세션 인수인계 — 모래와 깃털

> 후속 요청: 호루스의 흰 가슴천이 누락되어 [2차 기본 시안·걷기 GIF](art/chibi-refresh/review-chest-cloth/README.md)를 추가했다. 해당 폴더는 새 검토본이다. 기존 승인 원본 및 적용 명세는 유지하며, 가슴천 없는 호루스가 최종 의상이라는 뜻은 아니다.

최종 갱신: 2026-10-10. 이 문서는 과거 `docs/HANDOFF.md` 및 `/workspace/SandAndFeather-DESIGN-HANDOFF.md`보다 최신이다. 아래 진행 상태가 실제 완료 여부의 기준이다.

## 우선 적용 요청 — 승인된 셋소호 기본 자세·걷기

호루스의 밝은 뉴트럴 쿨톤 피부와 걷기 머리 전체 수정까지 사용자 승인. 최종 원본은 `docs/art/chibi-refresh/approved/`의 정지 12장·걷기 36장뿐이다. 사용자의 요청으로 이전 반려·교체 시안과 옛 버전 선택 지시를 제거했다. 최종 PNG 48장은 픽셀 변경 없이 옮겼다.

**런타임 연결은 아직 하지 않았다.** [오푸스 상세 지시](OPUS-IDLE-WALK-INTEGRATION.md), [48장 파일별 목록](APPROVED-IDLE-WALK-FILES.md), [단일 명세](art/chibi-refresh/approved/manifest.json)를 먼저 읽는다. 최종 걷기 미리보기는 97번이며 호루스 정면에 원본 셀 기준 ±1픽셀 미세 배치 설정을 한 번만 적용한다.

## 최신 상태 — 0.9.8 셋소호 정지·걷기 스프라이트

- `docs/art/chibi-refresh/approved/`의 48장을 `tools/art/pack-trio-motion.py`로 `data/art/characters/trio-motion.png`에 패킹하고, `sprites.json`의 `looks.*.motion`에 연결했다. 상세는 [TRIO-MOTION-098.md](TRIO-MOTION-098.md).
- 표시 높이 24 논리 px. 정지와 걷기 높이가 같다. 걷기는 0-1-2-1, 180ms. 호루스 정면만 승인 오프셋이 있고, 옛 bob은 셋소호에서 뺐다.
- 상인은 옛 `pocket-chibi.png` 그대로다. `pack-pocket-sprites.cjs`를 실행하지 말 것.
- 0.9.9: 전신 보기(파티, 소망 카드)는 정면 정지 그림 `data/art/portraits/*-idle-full.png`.
- 0.9.10: 대화 카드 상반신, 소망 미소 버튼 두 개, `전신 크게 보기` 버튼 제거. 상반신은 다시 넣지 말 것.
- 0.9.11: 파티 카드를 어깨까지로 줄임.
- 0.9.13: 파티 카드와 소망 카드는 사용자 일러스트 `data/art/portraits/*-illust-head.png`, 누르면 `*-illust.png` 전체. 원본은 `docs/art/portraits-illust/`, 바탕 제거는 `tools/art/cut-illust-portraits.py`.

## 이전 완료 — 0.9.7 새 옴보스 전체맵 낮밤

- 승인된 `ombos-upgrade-v1-day/night.png`를 게임 배경으로 연결했다. 밤은 밤 그림 그대로 나오고 마을 전체 필터는 없다. 상세는 [OMBOS-097.md](OMBOS-097.md).
- 충돌은 이전 그대로 두고, 신전 탑문, 문, 기둥 네 개만 새 그림에 맞췄다. 신전 문은 `ombos.json`의 `exits`로 안채 우물 마당과 이어진다.
- 이전 `data/art/ombos-approved.png`는 보존만 하고, 지금은 쓰지 않는다.

## 이전 완료 — 0.9.6 옴보스 안채 세부맵

- 승인된 안채 15장면을 실제 맵으로 연결했다. 문과 통로로 걸어서 이동하고, 9곳은 낮밤 그림이 바뀌며, 열주 계단에서 `^`로 지붕에 오른다. 성소는 v6-neutral. 상세와 검증은 [RESIDENCE-096.md](RESIDENCE-096.md)에 있다.
- 맵 데이터는 `tools/maps/residence.py`가 만든다. 충돌, 출구, 도착점을 고치려면 이 파일을 고친 뒤 다시 실행한다. `data/maps/temple_*.json`과 `scene-art.json`의 안채 항목을 손으로 고치지 않는다.
- 옴보스 쪽 출입은 0.9.7에서 새 전체맵에 맞췄다.
- 시기 구조: 맵 항목에 `eras`, 상태에 `era`가 있고 기본값은 `now`다. 첫 만남 시작은 아직 만들지 않았다.
- 맵 디자인은 아스트라 담당이다. 오푸스는 그림을 다시 그리지 않고 연결만 한다.

## 이전 완료 — 0.9.5 승인 메뉴 아이콘

PR #6으로 main 병합 완료. 병합 커밋 `c9d3c7dbf9cf23f66214fa12d7c10dff214493cc`, 기능 커밋 `7a942dbd9771ab2d994c2ed9586c69fb087eaf64`. 확장 업데이트 후 새로고침하면 0.9.5를 받는다.

- 사용자가 승인한 시안: `docs/art/menu-icons-approved.png`. https://drive.google.com/file/d/1GzwBe8KFEmDE-BkP74lk75SfKZn3BmIX/view
- 두 이전 시안은 반려됨: 캐릭터 일러스트 아이콘, 그리고 5번 모양으로 전체 통일한 아이콘. 반드시 테마마다 원래 다른 디자인 유지. 1번은 지구본·별, 3번은 야자수·앉은 사람.
- 승인 시안에서 직접 분리한 25개 PNG는 `data/art/ui/menu-icons/`. 48×48 에셋, 실제 24×24 CSS px, 사방 투명 여백, 합계86,788바이트. 선택 상태 대비 처리.
- 하단 메뉴만 변경. Opus의 0.9.3/0.9.4 수리와 `data/art/ui/skins`는 유지. `pack-approved-menu-icons.cjs`만 사용하고 전체 skin packer를 실행하지 말 것.
- 구현/검증/제한: [APPROVED-MENU-ICONS.md](APPROVED-MENU-ICONS.md). 5테마×3화면폭×5메뉴 선택 상태 검증과 기존 UI 회귀 통과.
- 실제 화면: https://drive.google.com/drive/folders/1g0P3rnygjoVKDNRxwP3FdI3HJMVEEzf9
- **사용자가 인라인 이미지를 못 본다. 이미지 결과는 무조건 Google Drive 링크 포함.**

## 이전 완료 — 0.9.4 포근한 테마 말 걸기 테두리

- 포근한 테마 말 걸기 버튼 오른쪽과 오른쪽 아래에 갈색 상자 조각이 튀어나와 있었다. 원본에서 그 자리가 상자 그림에 가려 있었기 때문이다. 이제 팔각형 오른쪽 변과 모서리를 왼쪽에 맞춰 대칭으로 자른다. `cut-action-buttons.py`.
- 푸른 연꽃 뒤로 튀어나오던 분홍빛 바탕은 0.9.3에서 이미 지웠다. 0.9.4 화면에서 다섯 테마 모두 다시 확인했다.
- **하단 메뉴 아이콘은 새로 그리지 않는다.** 사용자가 디자인을 아스트라에게 맡기기로 했다. 아이콘은 지금 그대로 둔다.

## 이전 완료 — 0.9.3 깨진 프레임 전수 수리

요청: 말 걸기와 가방처럼 프레임이 깨지고 늘어난(초록 테두리) 부분을 모든 테마에서 찾아 수정. main에 직접 반영.

- 가방·말 걸기 10장은 테두리 모양대로 잘라 투명. CSS는 늘이지 않고 `contain`으로 그린다. 도구는 `tools/art/cut-action-buttons.py`.
- 지도 창, 4번 날짜판·칩·바깥 틀, 1·2·3번 하단 탭 바, 2·3번 선택 탭은 원본 크롭이 옆 그림을 물고 있었다. 같은 테마의 깨끗한 프레임으로 돌렸다. 표는 [UI-FRAME-REPAIR.md](UI-FRAME-REPAIR.md#093-깨진-프레임-전수-수리)에 있다.
- 아이템 수량 잔재, 3번 연꽃 주황 바탕, 2번 선택 칸 흰 바탕, 4번 제목줄 네모를 정리했다. 도구는 `tools/art/repair-ui-skins.py`이고 provenance `repairs`에 기록된다.
- 닫기 ✕ 위치: 1번 가방, 2번, 4번, 3번 넓은 화면.
- 전후 비교 이미지: `docs/consult/ui-frame-repair-093/`.

## 이전 완료 — 0.9.2 프레임과 가방 상세

PR #5로 main 병합 완료. 병합 커밋 `fc4bc6aa8c5fdcf3d28ff8e3ae938bdb805623f4`, 기능 커밋 `2e161bafd23f6791992e8a85985799b0ab7d446a`. 확장 업데이트 후 새로고침하면 0.9.2를 받는다.

- 사용자 최신 요청은 깨지는 프레임 전반 수정과 가방 오른쪽을 원본 시안처럼 만드는 것. 1~5 테마, 기존 맵/캐릭터 유지.
- 버튼·패널 외곽의 배경 픽셀을 투명 처리하고 클래식 선택 프레임 및 수첩 버튼 크롭을 수정했다. 원본 색/장식은 유지. 이미지 생성 사용하지 않음.
- 가방 상세 DOM은 `.sf_inventory_detail_head` 안의 `.sf_inventory_icon_frame`, `.sf_inventory_identity`와 별도 `.sf_inventory_description`. 아이콘 칸, 제목 아래 점선, 수량, 설명 칸이다.
- **살펴보기 버튼과 입수 날짜는 가방 요약에서 제거. 선택된 슬롯을 다시 누르면 기존 itemCard로 이동.** 개별 UID·날짜/출처·아이템 행동은 기존 상세에 그대로 있다.
- 1/5번 내부 칸은 실제 원본에서 추가 크롭. 총 PNG187개. 아이템 원본 수량/이웃 선 조각도 제거했다.
- 구현 및 검증: [UI-FRAME-REPAIR.md](UI-FRAME-REPAIR.md). 실제 화면과 JSON은 `docs/consult/ui-frame-repair/`.
- 모바일 확대: https://drive.google.com/drive/folders/1wNp_G2Xxc8J72B7fZX7OGMELHMVI5dlp

## 이전 완료 — 0.9.1 원본 픽셀 UI

PR #4로 main에 병합 완료. 병합 커밋 `2600a4a616695cba6c63e804cf2986cdc992d6ab`, 기능 커밋 `005e3bcc4bb3fe34abc4fbfcf642f9bb2aea5e1b`. 확장 업데이트와 새로고침으로 받는다.

사용자가 0.9.0 UI를 “시안과 너무 다르고 분위기만 10%”라고 지적했다. **단순한 색/테두리 CSS 근사를 승인한 것이 아니다.** 앞으로 시안과 같다고 말하려면 원본 장식과 배치를 실제로 대조해야 한다.

- 프레임·제목줄·버튼·아이콘·질감을 다섯 승인 시안에서 직접 추출한 `data/art/ui/skins/` PNG183개로 교체. 합계1,607,685바이트. 맵/정밀 미니는 유지.
- `tools/art/pack-ui-skins.cjs`에 원본 크롭/9분할/글자 제거용 원본 종이 패치 좌표가 있다. 재생성 도구를 사용하지 않았다. 각 파일의 원본 SHA256과 영역은 `data/art/ui/skins/provenance.json`.
- 원본은 `/workspace/ui-concepts-20261010/manifest.json`의5개 경로/Drive 링크. 원본 디자인을 다시 그리지 않는다.
- 제목줄은 원본의 넓은 띠를 사용하여 장식 간격을 보존. 창틀은 모서리를 고정하고 변만 늘리는9분할. 가방/말 걸기 동작 버튼은 원본 그림을 그대로 사용하고 실제 클릭 동작/접근성 이름을 유지.
- 시안별HUD배치, 1/2번4열·4/5번5열 가방, 3번 목록과 책 중앙 접힘을 반영. 아이템은 각 테마의 원본 그림을 우선 사용하고 시안에 없는 종류만5번 공통 그림 사용.
- `verify-ui-source-pixels.cjs`는 원본 장식의614,367픽셀 RGB 일치를 검증한다. 이는 **추출한 에셋 검증이지 전체 UI 화면의100% 픽셀 일치 보장은 아니다.** 실제 텍스트/아이템/능력치/화면 비율은 런타임 데이터에 따른다.
- 상세 설명/검증: [SOURCE-PIXEL-UI.md](SOURCE-PIXEL-UI.md).
- ST가html에transform을 적용하므로 모바일 팝업을 닫을 때 발생하는 문서 가로scroll9px가 고정 게임을 밀 수 있었다. `src/ui/popups.js`의keepGameInViewport가 팝업 열기/닫기 시 가로scroll만0으로 돌리고 세로 위치를 유지한다.

실제 수정화면/원본 비교: https://drive.google.com/drive/folders/18RH8mPy8kymNwgjcGBreX8ICQ1Eqclr9

## 이전 완료 — 0.9.0

사용자가 전체 UI **5번 포근한 픽셀 동화**를 확정하고 실제 게임 적용, 미반영 초미니 등록, 대화 상반신과 파티/캐릭터 전신 사용까지 명시적으로 요청했다. 이후 **1~5번 테마 모두 설정에서 선택**하도록 요청했고, 5번 기본값을 유지하며 다섯 테마를 구현하고 검증했다. 변경 전체는 PR #3으로 main에 병합 완료했다. 병합 커밋은 `041ab86e7f832256f74c3aee31b00a8dea26cf53`, 기능 커밋은 `a42714de266a6df11ecafc0f065a6c4e633e6288`이다. 아래 0.8.14 및 UI 선택 전 기록보다 이 단락과 문서 마지막의0.9.0 내역이 우선한다. 사용자 기기에서는 확장을 업데이트하고 새로고침해 0.9.0을 받는다. 현재 작업은 main 기준으로 이어간다.

- 새 버전: **0.9.0**. `manifest.json`과 `src/core/settings.js` 일치.
- 구현/실제 화면: [COZY-UI.md](COZY-UI.md).
- 테마 선택: 게임 우측 상단 ⚙ → 화면 설정, 또는 확장 설정 → 보기 → UI 테마. 5번 기본. 전역 `settings.uiTheme`(classic/walnut/journal/temple/cozy), 밝기 `settings.theme`는 별도.
- 모바일 화면: https://drive.google.com/drive/folders/1jKWH_en5N49dYIqFLhkKLynDLASQXoa7
- 테마별 맵/정밀 미니 복제 없이 CSS와 작은 SVG로 구현. 선택창/추가 테마 스타일 등 약20KB 이내. 정밀 미니 PNG8개는 총5,187,309바이트 별도.
- 정밀 미니 UI가 미구현이라는 아래 과거 설명은 이제 유효하지 않다. 구현 완료다.
- 초미니는 이미 구현된 코드를 함께 배포한다. 새로 재생성하지 않았다.

## 이전 요청과 진행 기록 — 0.8.14

사용자는 세션의 이미지 용량 오류를 걱정해 최대한 자세한 인수인계와 실제 게임 스프라이트 등록을 요청했다. 초미니 4번 셋소호와 같은 비율의 상인을 게임에 등록했고 실제 SillyTavern 검증을 마쳤다. 버전 0.8.14. 변경은 `feat/pocket-chibi-sprites` 브랜치로 전달하며 main 병합 및 사용자 기기의 확장 업데이트는 별도다. 아래 완료 내역과 제한을 반드시 읽는다.

## 먼저 알아둘 사용자 지시

- 한국어 반말로 따뜻하고 간결하게. 사용자는 안드로이드 모바일에서 확인한다.
- 이미지는 **한 번에 한 장씩** 읽는다. 큰 스크린샷은 필요한 부분을 자르거나 축소해서 확인한다. 여러 큰 이미지를 한꺼번에 도구 출력으로 다시 넣지 말 것.
- 기존 수정 파일을 유지하고 이어서 작업한다. 선택한 시안을 설명만 보고 새로 그리지 말고 실제 원본을 사용한다.
- 반복 재생성과 불필요한 확인 질문으로 구독 할당량을 낭비하는 것을 매우 싫어한다. 가능한 수정은 국소적으로 한다.
- 모바일 Codex의 local 세션 링크, GitHub 앱 이미지 확대가 실패한 적이 있다. **Google Drive 원본 링크**가 가장 잘 작동했다. 업로드 후 메타데이터로 확인한다.
- 프리뷰나 시안을 실제 적용 완료라고 말하지 않는다. 생성 이미지의 픽셀 해상도 표시는 실제 런타임 사양이 아니다.

## 저장소와 환경

- GitHub: https://github.com/yigasda/SandAndFeather
- 실제 체크아웃: `/workspace/SandAndFeather-git`. `/workspace/SandAndFeather`는 오래된 복사본이므로 수정하지 않는다.
- 이번 작업 브랜치: `feat/pocket-chibi-sprites`, 기준 `origin/main`의 `67c09d8`.
- 시작 버전 0.8.13. manifest와 `src/core/settings.js`의 VERSION을 함께 갱신한다.
- 0.8.13 전체 맵 작업은 PR #2로 main에 병합됨. 과거 `design/duat-guardian-clearance` 브랜치에 계속 쌓지 않는다.
- 실제 SillyTavern 테스트 호스트 `/workspace/duat-test-host`, 포트 8000. `public/scripts/extensions/third-party/SandAndFeather`가 현재 체크아웃으로 연결됨.
- 실행: `node server.js --port 8000 --listen --browserLaunchEnabled false`.
- Chromium `/usr/bin/chromium`, Node에서 `require('playwright')`, `require('sharp')` 사용 가능.
- 환경 스킬 `cloud-environment:cloud-environment-runtime`을 읽고 상태/네트워크를 확인했다. HTTP unrestricted, VPN 없음. 인증 비밀값을 출력하지 않는다.

## 확정된 맵 — 건드리지 말 것

`data/art/ombos-approved.png` 1392×1130은 사용자가 최종 채택한 넓은 도보 2번 전체 원본이다. 새로 그린 그림으로 대체하지 않는다.

- SHA256: `0212bfa39f68b4516a84895f2ac662d56c8b789fe7304b0b8079a79e40f14749`
- 런타임 42×34타일, 논리 타일 16px. `data/scene-art.json`의 fullMap으로 원본 전체를 렌더링한다.
- 낮/밤은 동일 원본에 시간대 틴트. 건물/절벽/물가 원본, 충돌/이동/상호작용 위치 모두 맞춘 상태.
- `src/world/reference-scene.js`는 건물/나무의 앞뒤 가림을 처리한다. 캐릭터는 별도 동적 레이어.
- `data/maps/ombos.json`에는 실제 이미지 좌표 기반 충돌 다각형과 지점 좌표가 있다.
- 수로/밭/정원 정비와 배 기능 유지. 자동 시즌 배경 교체는 의도적으로 적용하지 않는다.
- 설명 `docs/OMBOS-APPROVED.md`, 회귀 검사 `tools/art/verify-full-map.cjs`.
- 맵 작업 때 실제 SillyTavern에서 낮/밤 원본 픽셀 일치, 접근성, 키보드/터치 이동, 상호작용, 두아트 입구, 가림, 정비, 세이브 위치 복구, 접기/복귀 등 12개 검사 통과.

## 캐릭터 외형 — 최신 확정만 사용

### 세트

- 마른 근육, 슬림한 팔/어깨/허리. 보디빌더 체격 아님.
- 짙은 적갈색 **생머리**, 끝은 허리 아래~골반. 웨이브/컬 없음.
- 붉은 눈, 금장 목걸이/팔찌/허리띠, 검정 주름 의상, 갈색 샌들.
- 최종 정밀 미니: `docs/art/sprites/approved/set.png`.
- Drive https://drive.google.com/file/d/1_CZHqlHc8yFJuk1mB-Xu7M-gqHUzsUWQ/view
- 생성 원본 `/workspace/generated_images/exec-8036833c-6737-4ec9-8a30-c7a070ef75f6.png`.

### 호루스

- 세트보다 탄탄한 체격. 짧고 낮은 남색 머리, 이마와 귀가 드러남. 큰 솟은 머리 금지.
- **날개 없음**. 옛 참고에는 날개 있지만 사용자가 제거 확정했다.
- 금빛 눈, 무심한 표정. **정면 이미지 오른쪽 눈 아래에만** 호루스 눈 문양. 해부학적으로 캐릭터의 왼쪽 눈이다. 반대쪽은 점/세로줄도 없어야 한다.
- 금장 칼라와 팔찌, 흰 주름 의상, 갈색 샌들.
- 최종 정밀 미니: `docs/art/sprites/approved/horus.png`.
- Drive https://drive.google.com/file/d/1yibKx4QWpUV-krvZ4yNMBMD10YDHZMwb/view
- 생성 원본 `/workspace/generated_images/exec-e1e6a3d6-e30b-44f0-b52f-41626de3a0d4.png`.
- 방향별 스프라이트에서 좌우 미러로 문양이 반대 눈으로 옮겨가지 않게 주의.

### 소망

- 사용자가 네 얼굴 시안 중 **2번**을 확정했다. 1/3/4번으로 바꾸지 않는다.
- 짙은 갈색~검정 웨이브 머리, 끝은 **가슴**. 허리 아래로 늘리지 않는다.
- **시스루 뱅**: 얇은 앞머리가 이마 전반에 내려옴. parted/curtain bangs, 넓은 가운데 가르마 금지.
- **tareme**: 눈꼬리가 아래로 처지고, slightly half closed eyes. 동그랗게 크게 뜬 인형 눈 금지.
- 입술 아래 화면 오른쪽 작은 점. 정밀 그림에 유지하고 초미니는 식별성을 우선한다.
- 아이보리 긴 원피스, 목 리본, 소매 프릴, 갈색 샌들, 머리 뒤 작은 아이보리 리본.
- 활짝 웃는 2번 원본: `docs/art/sprites/approved/somang-options-01-02.png`의 오른쪽.
- 입만 다문 미소: `docs/art/sprites/approved/somang-closed.png`.
- Drive 다문 미소 https://drive.google.com/file/d/1JcZAVjAAAlRw19laWJ7kWV3r7A3H46JS/view
- Drive 1/2번 원본 https://drive.google.com/file/d/1XHPmYiYOzr7SRb6ZpUzFif6Hdw-xSm0W/view
- 생성 다문 미소 `/workspace/generated_images/exec-5c267e65-c08f-45e0-8725-1e62fb3bdd7c.png`.

## 초미니 — 실제 맵용으로 확정

- 사용자 `444444444444444444`: **4번 POCKET CHIBI**, 마지막 행 확정.
- 열 순서 **세트 / 소망 / 호루스**. 혼동하지 말 것.
- 원본 `docs/art/sprites/approved/ultra-mini-options.png`, 1024×1536.
- 생성 원본 `/workspace/generated_images/exec-28709827-a4ce-475d-a050-2839d183beec.png`.
- Drive https://drive.google.com/file/d/14BrD7NlI0ZLIL_l54r8xDIaGsoKISqY7/view
- 왕머리와 매우 짧은 몸, 약1.5~1.7등신. 정밀 미니를 단순 축소한 길쭉한 비율로 되돌리지 않는다.
- 이번 요청으로 상인도 같은 초미니 치비로 변경한다. 기존 townsman의 갈색 피부, 짧은 검은 머리, 밝은 린넨과 샌들이 출발점.

## 정밀 미니 활용 논의

사용자가 초미니 외 정밀 미니를 어디에 쓰냐고 물었고, 대화창 얼굴/상반신과 파티/소망 상세의 전신으로 쓰는 구성을 제안했다. **이 제안이 이미 구현된 것으로 착각하지 말 것**. 새 AI 대사 생성 기능을 만들라는 요청이 아니다. 게임의 대화는 기존 채팅에 꺼내기/찾아가기 흐름을 유지한다.

## 기존 스프라이트 코드와 등록 작업 주의

- 기존 `data/sprites.json`: somang,set,horus,townsman 16×16 글자 픽셀, down/up/side.
- `src/core/data.js`: JSON 로드 및 sceneArt 이미지 decode.
- `src/world/render.js`: setSprites에서 작은 캔버스 생성, person에서 발밑 정렬, 이동 시 bob, art Map 사용.
- 기존 side를 미러해 left를 만드는 로직은 호루스 비대칭 문양에 부적절하므로 새 에셋은 명시 좌우를 가진다.
- `src/core/check.js`: 데이터 검사. 새 포맷을 추가하면 검증도 맞춘다.
- `data/maps/ombos.json` 상인은 look `townsman`.
- `src/ui/window.js`: renderer.setSprites 호출, 플레이어 somang 및 NPC/동행 렌더링.
- 맵의 충돌/발 좌표는 유지. 머리 그림이 커져도 충돌 크기를 머리에 맞춰 키우지 않는다.
- 게임 에셋은 정적 PNG를 로컬 data에 등록. Drive나 원격 생성 URL을 런타임에서 불러오지 않는다.

## Drive와 원본 보존

- 사용자 참고 폴더 https://drive.google.com/drive/folders/1XQed7EFneOSBbWIoLBZBeEQr1uVi79Ld — 이름 셋소호 이미지, 원본18장.
- 결과 폴더 https://drive.google.com/drive/folders/1qY5G9gD5M-qhwcnt2-pZEglxU3Szbadr — 세트·호루스·소망 스프라이트 시안12종 및 후속수정.
- 원본 참고 로컬 `/workspace/sprite-concepts/refs/00.png`~`17.png`, 매핑 `/workspace/sprite-concepts/ref-paths.json`.
- 01은 소망 얼굴/점 참고, 04는 호루스 원화, 06은 세트 전신, 11은 소망 치비.
- 큰 이미지 전체를 반복해서 여러 장 출력하지 말고 필요한 한 장만 축소 확인한다.
- 이전에 Google Drive skill을 읽고 사용했다. 업로드 tool의 file_uri는 실제로 절대 로컬 경로 문자열을 받아서 성공했다. 업로드 후 get_file_metadata로 이름/크기/링크 확인. 공개 공유 설정은 변경하지 않았다.

## 이번 작업 완료 내역 — 0.8.14

### 실제 등록 에셋

- `data/art/characters/pocket-chibi.png`: 투명 PNG 256×256, 셀 하나 64×64, 총 16개.
- 행 순서: **세트 / 소망 / 호루스 / 상인 townsman**.
- 열 순서: **앞 down / 왼쪽 left / 오른쪽 right / 뒤 up**.
- `data/sprites.json` 각 look의 `atlas.file`, `atlas.scale`, `atlas.frames`로 등록한다.
- scale은 `20/64 = 0.3125`. 캔버스상 전체 셀 20×20 논리 px, 실제 인물 높이 18.75px. 기존 타일 16px의 발 위치를 유지한다. 사진 원본이 크다고 게임에서 크게 그리지 않는다.
- 호루스 좌우는 별도 그림이다. **left에는 눈 문양, right에는 없음**, down 화면 오른쪽만 있음. 어떤 방향도 새 atlas에는 미러를 쓰지 않는다.
- 상인은 갈색 피부, 짧은 갈색 머리, 아이보리 민소매 린넨, 황토색 허리띠, 샌들, 작은 주머니다. 셋소호와 같은 머리 비율.
- 서 있는 방향별 1프레임이며 이동 중 기존 1논리 px bob을 유지한다. **독립된 다리 교대 걷기 사이클이나 표정 애니메이션은 아직 없다.** 등록 완료를 풀 애니메이션 완성으로 오해하지 않는다.

### 원본과 파생 그림 구분

- 승인된 초미니 4번 원본은 `docs/art/sprites/approved/ultra-mini-options.png`에 그대로 보존했다.
- 정면 시안만 있었으므로 실제 이동용 좌우/후면과 상인을 포함한 방향 시트를 생성했다. 이 방향 시트는 원본에서 잘라낸 16방향이라고 주장하면 안 된다. 별도 파생 에셋이다.
- 방향 시트 원본 `docs/art/sprites/pocket-directions-source.png` 1261×1247. 생성 파일 `/workspace/generated_images/exec-06d21503-0002-4da9-ab45-9298ce69ed16.png`와 동일.
- `tools/art/pack-pocket-sprites.cjs`가 각 셀의 알파 범위를 자르고 nearest neighbor로60×60 안에 맞춘 뒤64×64 셀의 아래쪽에 정렬한다. 원본 그림을 코드로 재작성하지 않는다.
- 재패킹: 저장소에서 `node tools/art/pack-pocket-sprites.cjs`. 의존성 sharp. 실행 위치 무관.
- 앞으로 사용자에게 얼굴 차이 피드백이 오면 해당 캐릭터/해당 셀만 고친다. 맵과 나머지 캐릭터를 다시 생성하지 않는다.

### 수정 코드와 역할

| 파일 | 변경 |
|---|---|
| `src/core/data.js` | JSON이 읽힌 뒤 공통 PNG를 한 번 decode, `DATA.spriteArt[file]`에 보관. 실패 시 파일을 명시한 한국어 오류. 다음 로드에서 재시도 가능 |
| `src/world/render.js` | 기존 글자 그림 포맷을 유지하며 새 명시적4방향을 우선 사용. PNG 원본크기와 게임표시크기를 분리하고 발 정렬/그림자/이동bob 유지. 호루스 코드 대체그림의 날개 속성 제거 |
| `src/core/check.js` | 이미지 로드, scale양수,4방향 프레임정수/크기/범위 검사 |
| `data/sprites.json` | somang/set/horus/townsman 모두 새atlas 연결. 이전 글자 그림은 호환용으로 남아 있음 |
| `manifest.json`, `src/core/settings.js` | 버전0.8.14 |
| `tools/art/verify-pocket-sprites.cjs` | 실제ST 로드,16프레임 알파/발 정렬, 호루스 비대칭, 데이터오류 감지, 상인말걸기와 스크린샷 |

### 이번 세션 검증 결과

실제 로컬 SillyTavern, Chromium, 모바일 412×900, 별도 테스트 채팅에서 검증했다. AI 요청/사용자 채팅 전송 없음. 테스트는 기존 채팅 메타데이터를 복원한다.

1. 16개 프레임 모두64×64와 scale0.3125, 투명한 네 모서리, 아래 발 정렬 통과.
2. 호루스 left와 right의 미러가 서로 다름 확인. 눈 문양과 전체 외형은 축소 시트를 육안으로 확인.
3. 정상 데이터 오류 0개. 의도적인 이미지 범위 초과 프레임을 검사기가 감지하고 원복함.
4. 세트·소망·호루스 실제 모바일 화면 확인. 상인 앞 화면과 상인 상호작용 확인.
5. 맵 회귀 12개 모두 통과: 낮/밤 원본 픽셀 일치, 접근성, 키보드 벽 충돌, 터치 패드,시장/부엌/필사실/신전/훈련/부두/NPC상호작용,두아트 시간대,두아트/부두 보행,가림/캔버스 해제,수로/밭/배 정비,저장 위치 복구,접기/복귀.
6. 낮/밤 각각1,462,272픽셀 비교에서 배경 불일치 0. 맵 PNG의 SHA256도 이전과 동일.
7. 페이지 JS 오류 0, 확장 파일 HTTP 실패 0.

결과 파일:
- `docs/consult/pocket-chibi/verification.json`
- `docs/consult/pocket-chibi/map-regression.json`
- `docs/consult/pocket-chibi/board.png`: 런타임 렌더러로 만든 16방향 확대판
- `docs/consult/pocket-chibi/map.png`: 실제 렌더러의 전체 맵, 네 인물 포함
- `docs/consult/pocket-chibi/trio-mobile.png`: 실제 게임 셋소호
- `docs/consult/pocket-chibi/merchant-mobile.png`: 실제 게임 상인과소망

재현 명령:
```sh
node tools/art/verify-pocket-sprites.cjs /tmp/pocket-sprites
node tools/art/verify-full-map.cjs /tmp/pocket-map-regression
```
서버 8000이 실행 중이어야 하고 테스트용 캐릭터/채팅이 있어야 한다. 두 검사는 동일 프로필을 수정하므로 **동시에 실행하지 않는다**. 테스트 스크립트가 확장 로딩과 저장 복원까지 담당한다.

## 다음 세션 시작 순서

1. 이 문서를 먼저 읽고 `git status --short`, `git branch --show-current`, `git log -5 --oneline`, 원격 PR 상태를 확인한다. main 병합 여부를 추측하지 않는다.
2. 세션이 바뀌어 `/workspace`가 없으면 GitHub 브랜치를 클론한다. 임시 `/workspace/generated_images`보다 저장소의 보존 원본과 Drive를 신뢰한다.
3. 미커밋 변경을 보존한다. reset/checkout으로 원본과 에셋을 날리지 않는다.
4. 이미 등록된 PNG와 인수인계를 읽고 이어간다. 새로 전체 시안을 생성하지 않는다.
5. 사용자가 게임에서 구버전이 보인다고 하면 설치된 브랜치/버전/브라우저 새로고침/PNG 요청부터 확인한다. 이미지 재생성으로 해결하려 하지 않는다.
6. 새에셋수정후재패킹,실제 게임검증,필요한영역의화면만한장씩확인한다.

## 아직 하지 않은 것과 범위

- main 병합과 사용자 폰의 확장 업데이트는 이 문서 작성만으로 완료되지 않는다. PR 상태를 확인하고 설명한다.
- 정밀 미니를 소망/파티 탭이나 대화 상세에 표시하는 기능은 구현하지 않았다. 원본만 영구 보존했다.
- 4방향 독립 걷기 프레임/표정/전투 동작은 미구현. 현재는 방향별 정지 그림과 기존 bob.
- 초미니에서 작은 얼굴 점과 머리 한 가닥의 식별성은 화면 확대 배율에 따라 제한된다. 사용자의 형태 선택을 바꾸지 말고 해당 셀만 수정한다.
- 사용자 기기의 성능과 실제 설치 환경에서는 추가 확인이 필요하다. 이번 확인은 로컬 실제 ST 모바일 뷰포트다.


## 원격 보존과 전달 상태

- 구현 커밋: `4d14eb3f088eed58cfcce99da2dc350168faaeb3`.
- 브랜치: `feat/pocket-chibi-sprites`, origin에 push 완료.
- PR #3: https://github.com/yigasda/SandAndFeather/pull/3 — 생성 당시 open, main 미병합. 다음 세션은 실시간 상태를 다시 확인한다.
- 온라인 인수인계 원문: https://github.com/yigasda/SandAndFeather/blob/feat/pocket-chibi-sprites/docs/SESSION-HANDOFF.md
- 모바일용 4방향 확대판: https://drive.google.com/file/d/1LRTgBSRA3H4T_ZsoFfYAxg-hmV9mn2bp/view
- 실제 셋소호 게임 화면: https://drive.google.com/file/d/1bMqJUzzGpHnjoZPwsgbSujq29ZryL277/view
- 실제 상인 게임 화면: https://drive.google.com/file/d/1Tx23II3cvh1n3FdpFCv0qQNledd6q4Ig/view
- 인수인계 TXT는 기존 결과 Drive 폴더에도 업로드한다. 이름 `다음세션_상세인수인계_0.8.14.txt`.
- 전체 원본/등록PNG/코드/검증결과가 GitHub 브랜치에 들어 있다. 이 채팅이 닫혀도 위 링크와 저장소로 작업을 이어갈 수 있다.

다음 세션에 보낼 짧은 시작 문장:

> SandAndFeather PR #3와 `docs/SESSION-HANDOFF.md`를 먼저 읽고 현재 브랜치와 main 병합 여부를 확인해 줘. 맵과 확정 시안 원본을 보존하고, 초미니4번 셋소호·상인 등록 작업에서 이어서 해 줘. 이미지는 한 번에 한 장씩 필요한 영역만 확인해 줘.

## 후속 요청 — 전체 UI 쯔꾸르 시안 5개

사용자가 같은 세션에서 계속 작업하기로 했고, 기존 베이스와 비슷한 색의 쯔꾸르 UI 시안5개를 요청했다. 게임 화면을 참고해 탐험HUD·가방·파티·상호작용창을 묶은5개 콘셉트 이미지를 생성했다. **선택 전이며 실제 UI 코드에는 적용하지 않았다.** 시안의 배경/캐릭터는 생성 과정의 표현이므로 기존 맵이나 확정 스프라이트를 대체하는 에셋으로 쓰면 안 된다. 수치·레벨·아이템 문구도 디자인 예시이며 새 기능이 구현된 것이 아니다.

- 원본 폴더: https://drive.google.com/drive/folders/1YIQpIYd3Q8NbQmqYMHDvyABdaRZ2-MGL
- 1 클래식 크림: https://drive.google.com/file/d/18NurJC7C1_dfgkUqjfXlGjVxskIbyZlE/view
- 2 월넛 골드: https://drive.google.com/file/d/1Q3ayInu0nTSXncZU0VZkj5wTgUUKreFF/view
- 3 사막 여행수첩: https://drive.google.com/file/d/1jCAnLjPbmjc1AhTO2hzxxlkXt9Qt435W/view
- 4 청동 신전: https://drive.google.com/file/d/1CZqaZwOGjlzMN9eshXaHm1uw3mur9SYS/view
- 5 포근한 픽셀 동화: https://drive.google.com/file/d/1YWXb3xmMV3J4buq1WZRh8cawIDilhdTB/view
- 로컬 원본 경로/프롬프트/Drive 매핑: `/workspace/ui-concepts-20261010/manifest.json`.
- 각각 한 장씩 축소 확인했고 Drive 파일 업로드 후 메타데이터를 확인했다.
- 추천 의견은 1번이 정통 쯔꾸르, 3번이 여행수첩 분위기, 5번이 현재 맵과 초미니에 포근하게 어울린다는 것. **사용자가 선택했다는 뜻은 아니다.**


## 0.9.0 상세 인수인계

### 확정사항과 실제 구현

- 전체 UI는5번 확정이다. 기존 UI 시안5장 중 다시 고르게 하지 않는다.
- `style.css` 마지막의0.9 섹션이 테마를 담당한다. 크림색 패널, 짙은 갈색 헤더, 주황색 선택, SVG 테두리/꽃, 모바일 HUD/탭/공통팝업을 함께 적용했다. 다크 모드는 따뜻한 크림색을 조금 더 어둡게 조정한다.
- 말 걸기 창에서 세트/호루스의 상반신과 소망 상반신을 표시한다. 소망의 다문 미소/활짝 웃기 버튼은 외형만 바꾼다. 자동 표정 추론이나 AI 대사 생성 기능이 아니다.
- 파티는3명 전신을 보여주고 누르면 확대한다. 소망 상세도 전신/표정/확대와 기존 능력치/배움 목표를 제공한다.
- `src/ui/portraits.js`의 `portrait`, `somangPortrait`, `conversationPortraits`, `characterDetail`을 이용한다. `src/ui/popups.js`의kind는 DOM data-kind로 종류를 구분한다.
- 정밀 미니 전신과 상반신은 확정 원본을 자른PNG다. 원본 외형은 새로 그리지 않았다. `/data/art/portraits/`의8개 파일을 확인한다. `tools/art/pack-portraits.cjs`에 원본 크롭 좌표가 있다.
- `docs/art/ui-approved-05.png`의 아이템 그림 일부를 잘라서 가방에 사용한다. 재현 스크립트 `tools/art/pack-ui-icons.cjs`. 수량 글자는 별도의 실제 데이터 렌더링이다. 나머지 아이템은 기존아이콘을 사용한다.
- 가방 묶음 키는 item.id/opened/talked. 실제 저장 아이템을 합치지 않는다. 상세는 그 묶음의 최신 UID를 사용하며 기존 열기/찾아가기/지금 꺼내기 흐름이 유지된다.
- 파티 선택 후 저장이 끝날 때 닫은 창을 다시 여는 기존경쟁상태를 수정했다. 현재 열린 선택패널만 갱신하므로 창닫기/다른탭열기를 되돌리지 않는다.

### 검증과 재현

`node tools/art/verify-cozy-ui.cjs docs/consult/cozy-ui`로 실제 SillyTavern 테스트를 재현한다. 서버8000과 테스트용 채팅이 필요하다. 다른 ST 테스트와 동시 실행하지 않는다. UI9개 검사와 기존맵12개 검사 통과, 페이지오류/확장파일요청실패0이다. 손가락 터치 스크롤도 CDP 입력으로 검증했다. 대화 이동은 입력칸에만 준비하고 채팅 메시지수는 변하지 않는지 확인한다. 검증후 채팅메타데이터, 테마설정, 입력칸을 복원한다.

`docs/consult/cozy-ui/`에 실제 모바일/데스크톱 PNG들과 verification.json, map-regression.json이 있다. 화면은 테스트 가방을 채운 별도테스트채팅에서 찍은 것이다. 사용자의 실제 인벤토리 내용으로 오해하지 않는다.

### 아직 없는 기능

- 독립적인 다리 교대 걷기 애니메이션. 초미니4방향과 기존bob은 유지한다.
- 실제 RP 메시지를 읽어 표정을 자동 전환하는 기능. 표정은 화면에서 사용자가 선택한다.
- UI 시안의 예시HP/MP/캐릭터레벨을 새 게임규칙으로 추가하지 않았다. 기존실제수치만 표시한다.
- 사용자기기 업데이트는 SillyTavern 확장 업데이트와 새로고침으로 받는다. main 버전과 설치버전부터 확인한다.


### 다섯 테마 추가 구현과 검증

- `src/core/settings.js`의 `UI_THEMES`, `uiTheme` 기본값/유효성 검사.
- `src/ui/appearance.js` 게임 내 테마 라디오와 밝기 선택. 키보드 방향키/Home/End도 동작한다.
- `src/ui/window.js`의 `applyTheme()`가 게임·접기칩·아이템선택창·확장설정에 `data-ui-theme`와 밝기를 함께 반영하고 서랍의 select를 동기화한다.
- `style.css` 마지막 부분에 공통 선택창과 각 테마 스타일. 3번은 실제 목록형 가방과 가로 파티 카드이다.
- `src/world/input.js`: 팝업 내부 키 입력은 팝업이 처리하도록 이동 capture handler에서 제외했다.
- `tools/art/verify-ui-themes.cjs` 전체8검사 통과. 5종 × 모바일320/412/데스크톱1280에서 가방/파티/대화, 밝기 변경, 저장→서버 설정 저장 응답→실제 페이지 재로드까지 검사했다. `docs/consult/ui-themes/verification.json`.
- 최종 기존맵12검사도 다시 통과했다. 낮/밤 원본 비교 각1,462,272픽셀 불일치0.
- 전체 테마 검증 PNG25장은 `/workspace/ui-theme-verification-20261010/`에 보존. 저장소에는 대표6장만 포함하여 용량을 줄였다. Drive 링크는 `docs/consult/ui-themes/drive-links.json`.
