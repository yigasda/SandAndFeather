# 134 셋소호 4방향 걷기 검토본

2026-10-11. 사용자 “그래 ㄱㄱ 기왕이면 셋소호 전부 다”에 따른 세 캐릭터 × 4방향 × 3포즈, 총36장. **미채택·게임 미적용.**132·133번 걷기는 모두 반려됐고 이번 입력으로 사용하지 않았다. 호루스132번 폴더에서 사용한 것은 움직이지 않은 이마 정리 원본뿐이다.

## 원본과 방법

동작 기준은 `../approved/walk/`의 **개별 PNG 36장**이다. GIF에서 프레임을 잘라 추정한 것이 아니다. 캐릭터별 원본12장을 동일 순서로 배치해 이미지 편집 입력으로 사용하고, 각 캐릭터의 현재 외형 파일을 함께 넣어 동작용 외형 편집을 했다. 따라서 새 걷기 몸과 옆/뒤 외형은 편집 결과이며 원본 픽셀과 동일하다고 주장하지 않는다.

정면 머리/얼굴은 편집 출력의 얼굴을 사용하지 않고 아래 실제 외형 원본을 고정 배율로 복사했다. 세트는 긴 머리의 정면 원본 픽셀도 보존하도록 분리 합성했다. 호루스 몸 색은 최종 원본 몸에서 추출한64색 팔레트로 맞췄다. 같은 방향 세 포즈는 공통 배율과 머리 위치를 사용하며, 발/다리를 메시로 변형하거나 개별 신발 폭을 늘리지 않았다.

| 캐릭터 | 외형 입력 |
|---|---|
| 세트 | `../review-pocket-style-v2/front/set-front.png`(v1 유지 파일) |
| 소망 | `../review-somang-skin-v3/somang-front.png`(121번 피부 수정 후보) |
| 호루스 | `../review-horus-walk-v1/native/horus-front-1.png`(131번 이마 정리 원본, 정지 포즈) |

호루스131번 외형의 채택을134번 걷기 또는 셋/소망의 새 방향 채택으로 확대 해석하지 않는다. 소망121번 피부의 최종 승인 여부도 별개다.

## 파일

- `walk/`: 360×400 투명 PNG36장. 파일명은 원본과 동일.
- `sheets/`: 캐릭터별1080×1600. 행은 front/back/left/right, 열은0/1/2.
- `previews/134-trio-walk.gif`: 세 캐릭터 ×4방향 합본.
- `previews/134-{set,somang,horus}-walk.gif`: 캐릭터별4방향. 위 front/back, 아래 left/right.
- `previews/134-front-three-poses.png`: 정면3포즈 확인판.
- `idle-reference/`: 실제 정면 외형3장을620×720, 발 기준310,662, 높이628로 정규화한 참고 파일. **새 정지12장 패키지가 아니다.** 새 그림체 옆/뒤 정지 그림은 아직 별도로 만들지 않았다.
- `sources/`: 이미지 편집 출력 보관. 최종 정면 머리는 이 출력이 아닌 실제 외형 원본에서 복원했다.
- `manifest.json`: 원본36장과 새36장 일대일 대응, 크기/발 기준/해시/재생 규칙.
- `validation.json`, `build.py`: 공통 배율·머리 고정 기록 및 후처리 재현.
- `134-trio-walk-review.zip`: PNG36장·시트3장·정면 참고3장·명세 묶음.

## 재생과 확인

원래 `approved/manifest.json`에 따라 걷기 셀360×400, 기준 높이330, 발 기준180,370. 순서0→1→2→1, 각180ms, 주기720ms. 호루스 정면만 기존±1px 오프셋. PNG에는 오프셋을 굽지 않았다. 정지 명세는620×720/310,662/높이628로 유지했다.

검증한 것: 새 PNG36장 크기·RGBA·셀 잘림 없음, GIF4개 모두4프레임·각180ms, 방향별 머리 고정 영역 포즈 간 차이0, 기존 승인48장 해시 변화0. 원본/수정본36쌍의 하체 비교판으로 발 방향·앞뒤 겹침·치마 들림·팔 포즈를 확인했다. 이 확인은 다른 그림체의 픽셀 동일성이나 사용자 채택을 뜻하지 않는다. 실제 브라우저에서 교체·이동 테스트는 하지 않았다. 게임 런타임과 원래 승인 폴더는 그대로다.

## 보기

- [셋소호 걷기 합본](https://drive.google.com/file/d/1haqvC69InlUJUKjUe7UHrSDuUO1Fs2Lz/view)
- [호루스](https://drive.google.com/file/d/16e90sriAro-TXF9X-0nJhWJYWJ0XzerL/view)
- [세트](https://drive.google.com/file/d/1soCxCw66xYgCKf0msSQKw5Vm1n9OxcNR/view)
- [소망](https://drive.google.com/file/d/1qCDwN7aPc6ntAf_JmbLjct7H8leXmMEl/view)
- [PNG/시트/명세 ZIP](https://drive.google.com/file/d/1aKpihBnP9KW-fsC_jdB_ysSGPChUN6cV/view)
