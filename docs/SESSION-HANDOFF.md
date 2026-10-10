# 다음 세션 인수인계 — 모래와 깃털

최종 갱신: 2026-10-10. 이 문서는 과거 `docs/HANDOFF.md` 및 `/workspace/SandAndFeather-DESIGN-HANDOFF.md`보다 최신이다. 아래 진행 상태가 실제 완료 여부의 기준이다.

## 지금 요청과 진행 상태

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
