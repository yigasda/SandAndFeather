# 안채 출구 아트 — 현재 파일

**동시 작업 반영:** 오푸스의 `be86ecd`(0.9.20)가 기존 9장 출구 아트를 게임에 연결했다. 그 코드·충돌·도착점을 보존했다. 이번 양쪽 확장 우물은 별도 파일 `well-courtyard-expanded-v2.png`, `well-courtyard-expanded-v2-night.png`로 전달하며 **아직 게임 미적용**이다. 게임이 읽는 기존 `well-courtyard-v1(-night).png`는 1774×887 그대로 유지한다. 새 확장본을 연결할 때만 맵 폭과 모든 좌표를 함께 수정한다. [0.9.20 적용 기록](../../../RESIDENCE-096.md).

2026-10-11. 원본은 상위 폴더에 보존. 새 제안9장(확장 우물2장+기존7장)은 전달용, 기존 well-courtyard-v1 낮밤2장은 현재 게임용 유지, sources는 제작용, previews는 검토용이다.

우물 마당의 112·113번 통로도 사용자 반려: 가구 뒤에 떠 보였고 상단에 합성 흔적이 있었다. 현재는 원본1774×887을(432,0)에 두고 좌우432px씩 확장한2638×887 검토본이다. 새 양옆 공간에 가구와 분리된 출입구를 만들고 상단 구조 전체를 다시 그렸다. 원본의 접합부/상단 밖과 가구 보호 영역은 픽셀 동일. 116·117번이 현행 검토본이며 미채택·런타임 미적용. 연못 낮밤/동쪽 채택 해시는 유지했다.

- 새 `well-courtyard-expanded-v2(-night).png`:2638×887, 원본 위치(432,0), 새 양쪽 문+상단 전체 보정. 미채택.
- 연못 낮밤:1932×1086, 원본 위치(0,0), 사용자 채택(e2a536b).
- 동쪽 회랑:2172×724, 항아리 제거본 사용자 채택(e2a536b).
- 안쪽/중앙/서쪽/방문 회랑:2172×724, 이번 수정 없음.

[오푸스 적용 명세](../../../RESIDENCE-EXITS-V2.md) · [좌표](exit-coordinates.json) · [승인 해시](approval.json) · [검증](latest-review-validation.json)

[우물 낮밤](https://drive.google.com/file/d/1ww6CyNkKrqFoz-GgQo0FNp-_jrrZC6fO/view) · [세 입구 확대](https://drive.google.com/file/d/1yj1bB8hqGNqF1FAp_gNZVe1qvHEkaqmF/view)
