# 0.9.92 가로 화면·메뉴 배포 검증

- 기준 원격 main: `237b926b8b48e67d9efa5a748bd492e62482446b` (0.9.91).
- 실제 게임 변경: 가로 HUD 정렬, B형 조이스틱, 기존 메뉴 접근, 맵 전용 핀치줌과 카메라 경계, 사막 13개 맵 이동속도 1.6, 승인된 original10 메뉴.
- 메뉴 전달 원본: `3d68d03c5b5c034e0bbb0fe457a150ef9271c72c`. 원본 자료는 `docs/handoff/menu-original10/`에 보존한다. 새 imagegen 시안과 새 전투 버튼 그림은 포함하지 않았다.
- 시험 환경: 별도 SillyTavern, 합성 캐릭터/채팅, Chromium. 사용자 저장 데이터와 유료 AI 호출은 사용하지 않았다.

## 검사와 기준 코드

요청된 기존 UI 3종은 아래 명령이다. 모두 exit 0. 메뉴 통합 단계의 release 복제본(별도 localhost:8001 호스트)에서도 동일 스크립트의 호스트 주소만 바꿔 통과했다. 출구 보호를 추가한 최종 런타임의 3종 결과는 `final-ui-input-summary.txt`에 있으며, 최종 release 복제본은 별도 연결·사막 전체 이동·저장·메뉴 시험으로 확인했다.

```sh
node tools/art/verify-cozy-ui.cjs /tmp/vc
node tools/art/verify-ui-themes.cjs /tmp/vt
node tools/art/verify-full-map.cjs /tmp/vf
```

`tiers.sh full`의 현재 검사 목록을 묶음별로 모두 확인했다. 이미 통과한 불변 범위는 재사용하고 실패 항목은 개별 재검증했으며, 하나의 full 실행이 처음부터 끝까지 무실패였다는 뜻은 아니다.

- 전투 회귀의 시작 기준은 `ed2b2d2d`. 최종 런타임 기준은 `713bafbe`(메뉴 아이콘 및 출구 입력 해제 보호 포함), 최종 시험 코드 기준은 `97351b29`다. 출구 보호 변경 뒤 현재 맵 연결·사막 전체 이동·저장과 입력/UI 3종을 재검증했다. 전투 수치·타격·AI 동작의 불변 범위는 앞선 통과 결과를 재사용했다.
- `pad-tabs`: 16항목. 최종 출구 입력 해제 보호 적용 뒤 통과.
- `landscape`: 최종 release에서 11항목. 900×412, 740×360, 640×360과 5테마, 메뉴, 터치 조합 구분, 줌 제한, 4개 맵 카메라 경계, 세로 탭, 접기/닫기.
- `landscape-menu`: 최종 release에서 테마/밝기/가로 크기 20조합. 실제 상태 기반 인물·기록·게이지, 선물 소모/재확인/불가 조건, 키보드 포커스, 기록 관리, 추억 수첩, 5개 메뉴 이벤트.
- 기존 `tools/bond/browser.cjs`: 세로/데스크톱 30조합과 기존 인연 기능 통과.
- `desert-maps`: 최종 release 복제본에서 이동속도 1.6과 출구 보호 적용 후 통과.

## 발견한 문제와 재검증

1. 메뉴 게이지에 기존 블록 스타일이 겹침: 범위 한정 CSS 우선순위 수정. 인물/선물 재렌더 포커스와 호두 테마 아이콘 대비 보완. 최종 release 메뉴·UI 검사 통과.
2. 궁 일반 공격 시험에 동행의 자율 스킬/처치가 섞일 수 있음: 일반 공격 보너스 시험만 동행 없이 분리했다. 게임 충전 규칙·허용값은 변경하지 않았다. 수정 시험 전체 통과, 두 채팅 사이 게이지 분리/복원도 통과.
3. 안전구역 퇴각 위치의 초회 시간 의존 실패: 체력 유지, 진단 재검사에서 실제 구역 이탈 확인. 원본 판정·대기시간을 바꾸지 않은 추가 재검사도 7항목 통과. 초회 기록은 보존했다.
4. `--connections`는 스크립트 자체에 폐기된 옛 그래프라고 명시됐지만 tiers 목록에 남아 있었다. 현재 그래프의 모든 개별 연결 시험은 유지하고 이 옛 옵션만 현재 묶음에서 제외했다.
5. 빠른 이동 중 출입구 시험의 CDP 관찰 지연: 최초 착지는 정확했으나 늦게 읽은 움직인 좌표로 판정했고, 복귀 좌표를 읽는 동안에도 시험 스틱이 눌려 있었다. 기존 최초 도착 기록으로 판정하고, 측정 전에 실제 터치를 중립으로 돌린다. 거리 허용치·왕복 횟수·재진입 방지·저장 판정은 유지했다. 이 시험 보정 자체는 게임 이동 코드를 변경하지 않았다.
6. 실제 앞뜰 출구 재전환 문제: 속도 1.6에서 같은 스틱 입력을 계속 유지하면 다음 출구로 다시 전환됐다. 이동 입력을 한 번 놓기 전에는 재전환을 막고, 그 동안 다시 만난 문턱을 지나 바깥으로 걸어 나가지 않게 멈춘다. 입력 취소/키보드/접기/닫기 수명주기 14항목과 현재 연결 왕복을 검증했다.
7. 원점 복귀 보조 코드가 길찾기의 근접 목표 반경에서 끝나던 문제와, 유효한 출발점이 격자로 반올림되며 문기둥 안으로 들어가던 문제를 보완했다. 실제 터치로 이동하며 좌표를 강제로 옮기지 않는다.
8. 벽 앞 정지는 엔진의 최대 하위 걸음(0.05초 × 4.2 × 맵 속도) 내 실제 충돌 데이터를 확인한다. 열주홀 실패 위치는 0.08칸 앞은 비었지만 0.12칸 앞부터 벽이었다.

짧은 이동은 원래 260ms에 해당하는 거리 `0.26 × 4.2 × 1.6 = 1.7472`칸으로 실측해 CDP/영상 처리 지연을 분리한다. 위치 허용오차는 유지했다. 추가로 실행한 2.1칸 모드는 일부 맵에서 의도적으로 문까지 도달하는 더 긴 이동이므로 기존 짧은 입력 계약과 구분한다. 2.1칸으로 왕복 전체를 통과한 연결은 그 연속 경로가 더 짧은 거리도 포함하므로 결과를 재사용했다.

## release 산출물

`tools/release.sh`로 생성 후 별도 얕은 clone을 확장 위치에 연결해 검증했다. 776개 배포 파일이 main의 해당 파일과 바이트 단위로 일치한다. `src/ui/menu-header.js`와 기존 그림이 포함되며, 전달 시안·샘플 상태 주입 스크립트는 release에 포함되지 않는다. 버전은 manifest/settings 모두 0.9.92.

## 캡처

실제 release 실행 화면이다. 메뉴의 기록/인벤토리는 격리된 시험 데이터이며 사용자 저장 데이터가 아니다. 작은 가로 화면은 내용 영역 스크롤을 사용한다.

- [탐험](exploration.png), [전투](combat.png)
- [기본](menu-classic.png), [호두](menu-walnut.png), [호두 어두움](menu-walnut-dark.png), [수첩](menu-journal.png), [신전](menu-temple.png), [포근](menu-cozy.png)

## 재현 기록

최종 런타임 커밋 `713bafbe1fa6bb7328c315139e9a2d0bc014ca2d`, 검사 보완 커밋 `97351b29` 기준. 캡처·기록 커밋은 런타임 변경이 없다. 각 결과는 아래 원본 요약과 최종 판정 파일을 함께 본다. 초회 실패가 있는 로그를 숨기거나 삭제하지 않았다.

- [initial-regression-summary.txt](initial-regression-summary.txt)
- [initial-route-summary.txt](initial-route-summary.txt)
- [final-ui-input-summary.txt](final-ui-input-summary.txt)
- [release-map-summary.txt](release-map-summary.txt)
- [current-route-summary.txt](current-route-summary.txt)
- [route-recheck-summary.txt](route-recheck-summary.txt)
- [exit-neutral-summary.txt](exit-neutral-summary.txt)
- [ult-recheck.txt](ult-recheck.txt)
- [safe-zone-recheck.txt](safe-zone-recheck.txt)
- [e17-recheck.txt](e17-recheck.txt)
- [release-menu.json](release-menu.json)
- [boss-summary.txt](boss-summary.txt)
- [memory-summary.txt](memory-summary.txt)
