# 0.9.5 — 승인된 다섯 테마 메뉴 아이콘

사용자가 테마별 원래 디자인을 유지한 비교 시안을 승인하고 실제 적용을 요청했다. 일러스트형 아이콘과 다섯 테마를 한 모양으로 통일한 이전 제안은 **반려**되었다.

승인 원본은 `docs/art/menu-icons-approved.png`. 이를 직접 분리해 `data/art/ui/menu-icons/{theme}/{world,somang,party,quests,map}.png` 25개로 연결했다. 새로운 그림을 생성하지 않았다.

- 1번: 지구본, 네 갈래 별, 세 사람, 말린 두루마리, 접힌 지도.
- 2번: 금빛 집과 사람, 해당 시안의 파티·두루마리·지도.
- 3번: 야자수, 앉은 사람, 해당 시안의 파티·두루마리·점 있는 지도.
- 4번: 밝은 집과 짙은 사람, 아래 말린 부분이 열린 두루마리 등.
- 5번: 주황 집, 살구색 사람과 파티, 줄 있는 두루마리, 지도.

`tools/art/pack-approved-menu-icons.cjs`가 칸 안의 아이콘만 추출한다. 배경과 내부 빈 공간을 알파로 분리하고, 비율을 보존해 48×48 PNG 안에 맞춘다. 실제 표시는 24×24 CSS px다. 사방 최소 2px(원본 해상도) 투명 여백이 있어 가장자리가 잘리지 않는다. PNG 합계는 86,788바이트다.

밝은 집/지구본이 선택 해제되어 크림색 칸으로 돌아오면 같은 실루엣을 갈색으로 표시한다. 선택된 어두운 칸에서는 글자와 같은 밝은 잉크를 사용한다. 여행수첩의 선택 색은 0.9.3 프레임 수정과 기존 대비 규칙을 따른다.

하단 메뉴만 `--menu-*` 변수로 연결했다. 팝업 제목 아이콘의 기존 `--skin-nav-*`, `data/art/ui/skins/`, 0.9.3/0.9.4 프레임·말 걸기 수정, 맵과 캐릭터는 변경하지 않았다. **전체 skin packer를 실행하면 Opus 수리를 덮어쓸 수 있으므로 메뉴 아이콘 작업에는 독립 추출 도구만 사용한다.**

## 검증

실제 SillyTavern에서 5테마 × 320/412/1280px × 5메뉴의 선택/해제, 이미지 로딩, 48×48 에셋 연결, 잘림 없는 배치를 검사했다. 기존 가방·파티·대화, 테마 선택/저장/재로딩, 어두운 모드 검사도 통과했다. 페이지 오류·실패 요청·AI 생성 요청은 0이다. 채팅과 테스트 설정은 복원한다.

각 에셋 해시와 원본 좌표는 `data/art/ui/menu-icons/provenance.json`. 모든 에셋의 투명 안전 여백과 유효한 실루엣을 확인했다. 승인 맵 SHA256은 기존 `0212bfa39f68b4516a84895f2ac662d56c8b789fe7304b0b8079a79e40f14749` 그대로다.

실제 화면/검증 결과: [consult/approved-menu-icons](consult/approved-menu-icons/).

- 실제 메뉴 확대: https://drive.google.com/file/d/14f4GUmAmFagfGaiZS3S06vTToujQeO74/view
- 테마별 실제 게임: https://drive.google.com/drive/folders/1g0P3rnygjoVKDNRxwP3FdI3HJMVEEzf9
- 승인 시안: https://drive.google.com/file/d/1GzwBe8KFEmDE-BkP74lk75SfKZn3BmIX/view

사용자는 클라이언트 오류 때문에 인라인 이미지를 보지 못하므로 **이미지 결과는 반드시 Google Drive 링크로 전달**한다.
