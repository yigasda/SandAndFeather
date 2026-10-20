# original10 가로 메뉴 — 임시 전달 소스

사용자가 임시 배포 대상으로 지정한 마지막 **원본 기반** 시안의 재현 자료다. 새로 생성한 UI 아트, right11/refined12, 사용자 채팅, 전체 호스트 HTML, 캡처 이미지/영상은 포함하지 않는다.

- 기준 게임: `c5569cc53fcb6cfdab44fcb54f9abdab04cbd6c4`
- 원본 ZIP: Library `libfile_ca45e7eb64148191b9dad256bf774fbb`
- 임시 브랜치: `handoff/landscape-menu-original10`
- 이 커밋은 전달 자료만 추가한다. main/release 병합, 버전 변경, 게임 자동 적용은 하지 않는다. 통합·배포 확인 후 부모 작업에서 임시 원격 브랜치 삭제를 조율한다.

## 파일과 재현

- `preview.css` → `components-art.css` → `original-art.css` 순서로 주입한다. 세 파일과 `icon-fit.json`은 전달 전 원본과 바이트 단위로 동일하다.
- `capture.sample.cjs`: Playwright에서 샘플 게임 상태를 열고 메뉴 DOM·헤더·테마를 조립하는 재현 스크립트. `buildHeader` 및 `page.evaluate` 안의 DOM 조립이 실제 시안 구성 소스다.
- `icon-fit.json`: 기존 테마별 메뉴 PNG의 표시 크기와 위치.
- `source-manifest.json`: 출처와 원본 SHA256, 전달용 변경 범위.
- 기존 그림은 `/scripts/extensions/third-party/SandAndFeather/data/art/...` 경로로 참조한다. 새 아트를 복사하거나 생성하지 않는다.

별도 **폐기 가능한** SillyTavern 테스트 인스턴스에 이 체크아웃을 확장으로 연결하고 Playwright/Chromium을 준비한다. 테스트 인스턴스에는 선택 가능한 가짜 캐릭터 하나가 필요하다.

```sh
SF_PREVIEW_DISPOSABLE=1 \
SF_PREVIEW_URL=http://127.0.0.1:8000/ \
SF_PREVIEW_OUT=/tmp/sf-menu-original10-output \
node docs/handoff/menu-original10/capture.sample.cjs
```

Chromium 경로는 `SF_CHROMIUM`, Playwright 설치 위치는 실행 환경의 `NODE_PATH`, 비디오 의존성은 `PLAYWRIGHT_BROWSERS_PATH`로 지정할 수 있다. 스크립트는 localhost/loopback 주소만 허용한다.

**샘플 전용:** 스크립트는 새 채팅 생성, 게임 상태 초기화, 호루스 유대 12/100·가짜 기록 3개·가짜 아이템 4개 주입을 실행한다. 개인/실사용 ST에서 실행하지 않는다. 이 fixture와 고정 문자열(`호루스와의 기록과 교류`, `기록 3개`)을 게임 코드에 복사하면 안 된다. 제품에서는 현재 선택 캐릭터·실제 기록·인벤토리에서 계산해야 한다. 출력에는 5테마 PNG, 키보드 포커스 캡처, 영상, 측정 JSON이 생성된다. 전체 호스트 HTML은 사용자 데이터 혼입 방지를 위해 내보내지 않는다.

## 통합 담당자에게

이것은 동작이 완성된 플러그인이 아니라 **렌더 시안 소스**다. 메뉴 복제에 `cloneNode`를 쓰므로 이벤트 리스너는 복제되지 않는다. 실제 탭 전환·선물·활동·캐릭터 변경 시 재렌더와 포커스 처리는 기존 게임 이벤트에 연결해야 한다. 상태 초기화/샘플 데이터 코드는 테스트에만 둔다.

CSS에는 이전 시안에서 누적된 HUD/레이아웃 규칙도 있다. 전체 파일을 게임 `style.css`에 무분별하게 붙이지 말고, 인연 팝업에 필요한 최종 규칙만 범위를 제한해 이식한다. 이번 전달은 HUD 재설계 적용 승인이 아니다.

원본 기반 시안의 좌표는 844×390 고정 검토용이다: L=417/R=814, M=713.25~719.25(6px), 본문 y=98~328, 수첩 x=666~814. 헤더는 원본 `header-full.png` 조각으로 구성하며 모서리·장식을 등비 표시하고 연결 영역만 확장한다. 신전 프레임은 게임 최종값인 panel.png/slice12, 수첩 선택 자산은 primary.png다.

5테마 원본 시안에서 오른쪽 overflow 없음과 44×44 메뉴/닫기 터치 영역을 확인했다. 이번 전달 시점에는 JS 구문, 실행 가드, 파일 동일성 및 diff 검사만 수행한다. 실제 통합 후 기능·반응형·저장 검증과 배포는 별도 작업이다.

## 0.9.92 실제 통합

전달 원본 커밋: `3d68d03c5b5c034e0bbb0fe457a150ef9271c72c`.
`src/ui/menu-header.js`, `popups.js`, `window.js`와 범위를 한정한 `style.css`로 원본 테마 머리글·실제 메뉴 이동을 연결했다. `bondcard.js`는 선택 인물·기록 수·선택 선물 이름을 현재 상태에서 계산한다. 샘플 데이터는 런타임에 넣지 않았다. 인물/선물 재렌더 시 포커스와 선물 목록 스크롤을 유지한다. 기존 세로 화면·중첩 카드·선물 확인·인연 분석 구조는 유지한다.

검증: `tools/st-test/landscape-menu.cjs`의 20가지 테마/밝기/가로 크기, 실제 선물 소모·재확인·인물 변경·키보드 선택·관리 메뉴·추억 수첩·5개 머리글 메뉴 이동 통과. 기존 `tools/bond/browser.cjs`의 30가지 세로/데스크톱 조합과 실제 선물 기능도 통과. 가로 640×360처럼 높이가 부족한 화면은 오른쪽 내용 영역을 스크롤한다.
