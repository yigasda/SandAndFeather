# 다섯 UI 테마와 정밀 미니 · 0.9.0

사용자가 선택한 5번을 기본으로 하고, 추가 요청에 따라 UI 1~5번을 모두 설정에서 고를 수 있게 구현했다. HUD·탭·가방·파티·대화·공통 팝업에 적용하며 승인된 맵과 캐릭터 그림을 공유한다.

## 테마 선택

게임 우측 상단 **⚙ → 화면 설정**, 또는 **확장 설정 → 모래와 깃털 → 보기 → UI 테마**. 누르면 열린 창에서 바로 반영되고 SillyTavern 확장 설정에 저장된다. 채팅별 게임 세이브와는 별개다. 밝기(자동/밝게/어둡게)는 따로 선택한다.

| 번호 | 이름 | 표현 | 실제 가방 화면 |
|---|---|---|---|
| 1 | 클래식 크림 | 네모난 이중 테두리와 삼각 선택 표시 | [보기](consult/ui-themes/1-classic-bag.png) |
| 2 | 월넛 골드 | 짙은 갈색 창, 금빛 선, 크림색 글씨 | [보기](consult/ui-themes/2-walnut-bag.png) |
| 3 | 사막 여행수첩 | 종이 창, 책갈피 탭, 목록형 가방과 가로 파티 카드 | [보기](consult/ui-themes/3-journal-bag.png) |
| 4 | 청동 신전 | 모래색/청록색 창과 날개 태양 장식 | [보기](consult/ui-themes/4-temple-bag.png) |
| 5 | 포근한 픽셀 동화 (기본) | 크림색 창, 갈색 제목줄과 작은 꽃 | [보기](consult/ui-themes/5-cozy-bag.png) |

[설정 화면](consult/ui-themes/5-cozy-settings.png) · [모바일용 Drive 화면 모음](https://drive.google.com/drive/folders/1jKWH_en5N49dYIqFLhkKLynDLASQXoa7).

## 용량

다섯 테마는 같은 맵·아이콘·초상화를 사용한다. 추가 테마 CSS 11,591바이트 + 선택창 JS/신전 SVG 약3KB이며 설정 연결 코드를 포함해 약20KB 이내다. 테마별 큰 이미지 복사본은 없다. 이번 버전의 정밀 미니 전신/상반신 PNG 8개는 별도로 총5,187,309바이트(약4.95MiB)이며 모든 테마가 공유한다. 저장소에 포함된 설명/검증 화면은 설치 다운로드에 포함되지만 게임에서 읽지는 않는다. 아래 수치는 전체 저장소 다운로드 용량이 아닌 테마 기능 자체의 증가량이다.

## 실제 게임 화면

- [탐험 HUD](consult/cozy-ui/01-world-mobile.png)
- [가방](consult/cozy-ui/02-inventory-mobile.png)
- [파티 전신](consult/cozy-ui/03-party-mobile.png)
- [세트 전신 확대](consult/cozy-ui/04-set-full.png)
- [소망 상세](consult/cozy-ui/05-somang-character.png)
- [대화 · 다문 미소](consult/cozy-ui/06-conversation-calm.png)
- [대화 · 활짝 웃기](consult/cozy-ui/07-conversation-smile.png)
- [호루스 대화](consult/cozy-ui/11-horus-conversation.png)
- [데스크톱 파티](consult/cozy-ui/08-party-desktop.png)

테스트용 채팅의 실제 게임 화면이다. 가방에는 검사할 때 추가한 테스트 아이템이 보인다. 사용자의 가방이나 채팅을 변경하지 않는다.

## 동작

- 세트와 호루스에게 말 걸면 정밀 미니 상반신과 소망 상반신이 함께 나온다. 소망은 `다문 미소` / `활짝 웃기`로 표정을 바꾼다. 표정 선택은 대사 생성이나 전송을 하지 않는다.
- 파티에는 소망·세트·호루스의 전신이 나온다. 인물을 누르면 크게 감상한다. 기존 동행 선택도 유지한다.
- 소망 상세에는 전신과 기존 능력치·배움 목표가 나온다. 전신 확대와 표정 선택을 지원한다.
- 가방은 아이템 칸, 분류, 선택한 아이템 설명으로 구성된다. 저장된 물건을 합치지 않고 표시만 묶는다. 종류/개봉/말함 상태가 같은 물건끼리 수량을 표시하며 살펴보기는 최신 물건의 UID를 사용한다. 입수 날짜와 기존 아이템 행동을 유지한다.
- 0.8.14에서 준비한 초미니4방향 셋소호와 상인도 포함한다. 맵용 초미니와 상세용 정밀 미니는 별개다.
- 대화는 기존 SillyTavern 입력칸에 장면을 준비하는 방식이다. 자동으로 RP 대사를 생성하거나 전송하지 않는다.

## 원본 보존과 구현

`docs/art/ui-approved-05.png`가 승인된 UI 원본이다. 가방의 일부 아이콘은 이 원본에서 숫자를 제외하고 잘라 사용한다. 없는 종류는 기존 아이템 아이콘을 사용한다. 프레임과 꽃 장식은 작은 SVG이며 창은 HTML/CSS로 구현했다. UI 시안 전체를 통짜 이미지로 덮지 않았다.

정밀 미니는 `docs/art/sprites/approved/` 원본에서 필요한 영역만 잘랐다. 새로 생성하거나 외형을 다시 그리지 않았다.

- `data/art/portraits/`: 세트·호루스·소망 두 표정의 전신/상반신 PNG8개.
- `src/ui/portraits.js`: 초상화, 소망 표정 선택, 전신 확대.
- `src/ui/items.js`: 가방 분류/그리드/아이템 상세 연결.
- `src/ui/tabs.js`: 파티와 소망 전신. 동행 선택 후 닫은 창이 비동기 저장 완료 때 다시 나타나던 문제도 수정.
- `src/ui/appearance.js`, `src/core/settings.js`, `src/ui/window.js`, `src/ui/drawer.js`: 테마 목록, 선택창, 전역 설정 저장과 즉시 변경.
- `src/ui/hud.js`, `src/ui/popups.js`, `src/ui/talk.js`, `style.css`: 공통 테마와 초상화 연결.
- 재패킹: `node tools/art/pack-portraits.cjs`, `node tools/art/pack-ui-icons.cjs`.

## 검증

- [다섯 테마 검사](consult/ui-themes/verification.json): 누락/잘못된 설정의 기본값, 다섯 테마 즉시 변경, 설정 서랍 동기화, 각 테마의 가방/파티/대화 320·412·1280px 경계, 밝기 변경, 키보드 라디오 탐색, 전체 페이지 재로드 후 저장 유지. 페이지 오류/확장 파일 실패0. 팝업의 방향키가 이동 입력에 가로채이지 않도록 수정했다.
- 재현: `node tools/art/verify-ui-themes.cjs /tmp/ui-themes`. 실제 테스트 채팅을 사용하며 설정을 저장/재로드한 뒤 원래 설정과 채팅을 복원한다. 모든 ST 검사는 같은 테스트 채팅을 쓰므로 순서대로 실행한다.

- [UI9개 검사](consult/cozy-ui/verification.json): HUD 겹침, 아이템 데이터 보존, 전신/동행, 소망 표정, 대화, 모바일 손가락 스크롤, 320/360/412 모바일·가로·데스크톱 화면 경계, 밝은/어두운 변형, 입력칸 준비와 게임 접기. 자동 채팅 전송 없음.
- [기존 맵12개 검사](consult/cozy-ui/map-regression.json): 이동/상호작용/두아트/가림/정비/저장 복구 등. 낮과 밤 배경 픽셀 차이0.
- `verify-pocket-sprites.cjs`: 셋소호와 상인의16방향 로드, 투명도, 발 정렬, 호루스 비대칭과 상인 말 걸기 재확인.
- 실제 로컬 SillyTavern에서 페이지 오류0, 확장 파일 요청 실패0. 테스트 채팅과 설정/입력칸을 복원한다.

아직 없는 것은 별도의 다리 교대 걷기 애니메이션이다. 현재 초미니는 방향별 정지 프레임과 기존 이동bob이다. 이번 UI에 시안의 가짜 HP/MP/레벨 수치를 추가하지 않았다.
