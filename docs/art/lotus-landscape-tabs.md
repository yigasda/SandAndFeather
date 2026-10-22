# 픽셀동화 가로 메뉴 적용

기준: `3b830b0b977b4a463cc234d12ca62bb854de8932`. 검토 브랜치만 변경하며 main/release 배포와 버전 변경은 하지 않는다.

## 실제 탭과 적용 범위

- 세계: 실제 맵과 HUD. 팝업으로 바꾸지 않으며 변경하지 않는다.
- 일행: 기존 앞장 3명, 동행 선택, 인연/자세히 버튼과 저장 동작을 그대로 둔다. 현재 앞장/동행 표시 아래 두 열로 배치하고 각 목록은 스크롤할 수 있다.
- 인연과 유대: 승인된 1842×854 장면과 기존 코드·manifest를 그대로 둔다.
- 임무: 작은 모험/매일 의뢰/배움/축제와 챗 메모/일지를 두 열에 배치한다. 기존 지우기/꺼내기/업적 동작을 그대로 둔다.
- 지도: 실제 minimap canvas와 위치 표식을 왼쪽에, 실제 안내/탐사 수첩/오벨리스크 이동을 오른쪽에 둔다. 등록된 map part를 복제하거나 생략하지 않는다.

## PNG 부품 매핑

- 공통 창: body.background, header.underlay, header.background-restored, window.frame.
- 헤더: header.lower-rail, header.left-junction, ornament.header-lotus. 승인된 장면 배치 좌표를 사용하며 PNG 파일을 변경하지 않는다.
- 메뉴: nav.*.frame / face-restored와 icon.home / heart / rings / scroll / map / close. 현재 탭에는 기존 초록 선택 프레임을 재사용한다.
- 목록/지도 패널: panel.record1.fill / frame / corner-ornaments를 동일한 56px 9-slice로 겹쳐 사용한다.
- 실제 버튼: tab.neutral.fill / frame, tab.selected.fill / frame를 동일한 16px 9-slice로 겹쳐 사용한다.
- 글자는 실제 한국어 폰트와 원래 게임 데이터를 사용한다. 전체 화면 PNG를 배경으로 붙이거나 CSS로 장식을 다시 그리지 않는다.

## 보존 방식

새 모듈은 cozy(픽셀동화) + 가로 + party/quests/map 최상위 메뉴에만 활성화한다. 기존 .sf_pop, 버튼, 이벤트 리스너, 목록 노드와 canvas를 그대로 사용한다. 회전/테마 변경 시 임시 레이아웃 그룹을 풀어 원래 DOM 순서를 복원한다. 원본 PNG 90개, manifest의 112개 배치, 인연 장면 모듈은 수정하지 않는다.

## 검사

- 수정 JS의 ES module 문법 검사 완료.
- 실제 실행 검사는 GitHub Actions의 격리된 SillyTavern에서 한다. 로컬 게임 실행이나 조립 이미지를 런타임 증거로 사용하지 않는다.
- 대상: 일행/임무/지도 1842×854, 844×390 캡처, 실제 탭/앞장/동행/상세/업적/탐사/스크롤 동작, 회전 복원, 세로/다른 테마/세계/인연 장면 기준 비교.
- 현재 문서 작성 시점: 런타임 검증 대기. 문법 통과만으로 완료 판정하지 않는다.
