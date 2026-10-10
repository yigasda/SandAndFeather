# 셋소호 최종 승인 아트

2026-10-10. 호루스 피부·걷기 머리 전체 수정까지 승인. 현재 사용할 원본은 **[approved/](approved/)** 한 곳이다. 이전 반려·교체 시안과 시안 생성 스크립트는 사용자의 요청으로 제거했다. 최종 48개 PNG는 승인 파일을 바이트 그대로 이동했으며 다시 그리거나 압축하지 않았다. 이전 제작 과정은 Git 이력에만 남아 있다.

- [오푸스 적용 지시](../../OPUS-IDLE-WALK-INTEGRATION.md)
- [48장 파일별 목록](../../APPROVED-IDLE-WALK-FILES.md)
- [프레임·방향·pivot·해시·재생 설정](approved/manifest.json)
- [최종 정지 4방향](approved/previews/trio-idle.jpg)
- [최종 걷기 합본](approved/previews/trio-walk-preview.gif)

`approved/idle/` 정지 12장, `approved/walk/` 걷기 36장, `approved/sheets/` 투명 합본, `approved/previews/` 확인용 JPG/GIF로 구성한다. 아트 승인과 게임 적용은 별개이며 **런타임은 아직 연결 전**이다.

걷기는 0→1→2→1, 각 180ms. 호루스 정면만 원본 360×400 셀 기준 (+1,0), (0,-1), (-1,0), (0,-1)을 적용한다. 추가 회전은 없다.

다음 제작 범위: 달리기, 상호작용, 줍기/조사, 전투 대기, 기본 공격, 강한 공격/고유 기술, 주문 준비/발동, 방어, 회피, 피격, 부상, 넘어짐, 쓰러져 있음, 일어나기, 회복. 이 동작들은 아직 제작 전이며 이번 정지·걷기 적용을 막지 않는다.
