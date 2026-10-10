# 호루스 원본 머리 유지 수정본

2026-10-11. 검토본, 미채택·게임 미적용.

기준: `../review-horus-set-body-v5/option-2.png`(124번 비교판 왼쪽).
이미지 생성 없이 원본 픽셀을 국소적으로 리샘플했다. 눈은 원래 중심 기준 가로·세로90%, 귀는 얼굴 쪽 접합을 기준으로 가로94%(높이 유지). 눈 주변 피부의 좁은 연결 영역도 마스크에 포함한다. 눈 아래 문양은 보호했다. 나머지 원본과 몸은 변경하지 않았다. 따라서 기존2안 몸의 외곽선 상태도 그대로이며, 외곽선 추가 보강본이 아니다.

- `horus-front.png`: 수정본. 576×730, 원본 배경 포함.
- `126-horus-original-preserved.png`: 왼쪽 원본, 오른쪽 수정본.
- `edit-mask.png`: 수정 허용 영역. 그 밖의 변경 픽셀0.
- `validation.json`: 원본 해시, 축소 수치, 수정 영역 밖 검증.
- `build.py`: 재현 스크립트. 생성형 도구 미사용.

[수정본 보기](https://drive.google.com/file/d/1tWxqNZpnnwvNhm0YgmVe3SeqVPVwPOzo/view)
