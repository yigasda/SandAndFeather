# 제작 기록

sources/는 네 장 모두 이미지 생성 도구로 새로 그린 전체 이미지다. 정지 머리·얼굴·몸 조각을 합성하지 않았다.

register.py는 기준 몸 또는 머리·발에서 SIFT 대응점을 측정한다. register.cjs로 전체 프레임에 균등 배율·회전·이동 한 번을 적용했다. 최종 행렬은 JSON에 보관했다. palette.py/cjs와 shadow 스크립트는 같은 방향 정지에서 얻은 피부 팔레트로 색만 바꾼다. alpha-clean은 고립된 1px 두 점만 제거했다.

preview.py는 비교 배치·차이 분석용이다. browser-preview.cjs는 실제 게임 렌더러처럼 Chromium canvas imageSmoothingEnabled=true, quality=high로 31px 근처 크기를 만든다. 확대본은 그 결과를 nearest로 확대한다.

이 스크립트는 작업 환경 /workspace/actions192 경로와 설치된 의존성을 기록한 재현 자료이며 독립 실행 패키지는 아니다. 게임 적용은 오푸스 담당이다.
