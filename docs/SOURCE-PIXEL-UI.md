# 원본 픽셀 UI · 0.9.1

0.9.0은 CSS로 시안의 색과 분위기를 근사했지만, 사용자는 시안의 실제 그림과 배치를 원했다. 이번 수정은 원본 장식을 추출해 연결하며 원본을 새로 생성하지 않는다.

## 사용한 원본

다섯 승인 시안의 원본 위치와 Drive 링크는 `/workspace/ui-concepts-20261010/manifest.json`. 패킹할 때 그 manifest 경로를 인자로 받는다. 저장소에 원본5번은 `docs/art/ui-approved-05.png`로 보존되어 있다. 다른 시안은 이전 인수인계의Drive 링크를 따른다.

## 바뀐 표현

- 창틀/아이템 칸/선택 테두리/파티 카드/미니맵: 원본 모서리와 변을9분할 PNG로 패킹해 화면 크기에 맞춰 이어 쓴다.
- 제목줄: 원본의 장식을 넓은 띠 그대로 사용한다. 원본에 그려진 샘플 글자는 동일 이미지의 빈 종이/배경 조각으로 교체하고 실제 제목을 얹는다. 4번의 날개와5번의 꽃 간격을 유지한다.
- 가방/말 걸기 버튼: 원본 버튼 그림. 버튼의실제동작/접근성 이름은 유지한다.
- 하단 메뉴/태양/가방/대화 아이콘: 원본에서 추출. 각 테마의 색과 그림이 달라진다.
- 아이템: 각 시안에 있는 그림을 먼저 사용한다. 없는 그림은5번의 공용 아이콘. 실제 아이템UID와 이력은 보존한다.
- HUD: 1번은 날짜/태양/데벤을 한 줄에, 나머지는 시안의 작은 패널 배치로 조정했다. 5번의 계절/동기화 줄을 유지한다.
- 가방: 1/2번4열, 4/5번5열, 3번은 목록과 책 중앙 접힘.320px에서는 읽기와 터치를 위해 칸 수를 조정한다.
- 모바일에서 스크롤한 팝업을 닫은 뒤 게임 전체가9px옆으로 밀리던 ST문서 가로스크롤을 보정한다. 세로스크롤은 건드리지 않는다.

## 픽셀 검증의 범위

`data/art/ui/skins/provenance.json`은 모든 원본SHA256, 크롭영역,9분할 조각위치와 글자패치영역을 기록한다. 추출된PNG183개에서 실제로 남긴614,367픽셀의RGB를 원본과 비교해 변경0을 확인한다. 투명배경을 만들 때 가장자리 배경의alpha만 지우며 남긴그림의RGB는 바꾸지 않는다.

이는 그림소스의일치검사이다. 데이터로 표시하는 제목/아이템명/수량/능력치, 사용자가 선택한 정밀 미니, 휴대폰 화면비율까지 원본 시안 스크린샷과 똑같다고 주장하지 않는다. 가짜HP/MP/아이템을 게임데이터에 추가하지 않는다.

## 재현

```sh
node tools/art/pack-ui-skins.cjs /workspace/ui-concepts-20261010/manifest.json
node tools/art/verify-ui-source-pixels.cjs /workspace/ui-concepts-20261010/manifest.json /tmp/source-pixel-verification.json
node tools/art/verify-cozy-ui.cjs /tmp/source-ui-cozy-check
node tools/art/verify-ui-themes.cjs /tmp/source-ui-release
```

ST서버8000과 테스트채팅이 필요하며 UI검사는 순차실행한다. 테스트아이템과테마를 임시로 바꾼 뒤 복원하고 채팅을 보내지 않는다. 원본 추출기와검증기는 원본시안파일에 접근할 수 있어야한다.

테마 PNG 합계1,607,685바이트(약1.53MiB). 0.9.0의“약20KB추가”는 CSS근사방식에 대한이전수치이며 이번원본이미지방식의용량과 다르다. 맵/캐릭터그림은 중복하지 않는다.

## 최종 확인 화면과 결과

- [5번 원본과 실제 게임 비교](consult/source-pixel-ui/05-source-vs-game.png)
- [1번](consult/source-pixel-ui/1-classic-bag.png) · [2번](consult/source-pixel-ui/2-walnut-bag.png) · [3번](consult/source-pixel-ui/3-journal-bag.png) · [4번](consult/source-pixel-ui/4-temple-bag.png) · [5번](consult/source-pixel-ui/5-cozy-bag.png)
- [원본 픽셀 검사](consult/source-pixel-ui/pixel-verification.json): PNG183개,614,367픽셀, 원본RGB변경0.
- [테마 검사](consult/source-pixel-ui/themes-verification.json): 8개 검사 통과, 페이지오류/확장요청실패/모델생성요청0.
- [상호작용 검사](consult/source-pixel-ui/interaction-verification.json): 9개 검사 통과. 스크롤 후팝업경계, 데이터보존, 동행, 초상화, 표정, 채팅입력준비.
- [모바일 원본 화면 Drive](https://drive.google.com/drive/folders/18RH8mPy8kymNwgjcGBreX8ICQ1Eqclr9).

원본에 있던샘플문자/장식의RGB검증과 실제반응형게임화면의시각대조를 구분한다. 사용자는 아직0.9.1의최종외형을 새로확정하지 않았으므로 다음수정도 원본시안에 계속대조한다.
