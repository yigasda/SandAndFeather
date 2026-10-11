# 스프라이트 비교 도구

기준은 **[최종48장](../final/README.md)**이다. 구버전 시안은 사용자 요청으로 삭제됐다. 이번 기본 스프라이트 작업은 완료됐으며 이 도구는 후속 동작 검수에 쓴다.

```sh
python3 tools/art/check-sprite.py --ref docs/art/chibi-refresh/final/somang/idle/somang-front.png --cand <후보.png> --pose same
python3 tools/art/check-sprite.py --ref-dir docs/art/chibi-refresh/final/somang/idle --cand-dir <후보폴더>
```

`--pose same`은 전체 비율, `walk`는 머리·목·색·외곽선·틈, `free`는 큰 자세 변화에 맞춰 비교한다. 출력은 후보 폴더의 `sprite-check/`이며 report.md·report.json·비교PNG가 생긴다.

머리·얼굴·목·다리·신발 비율, 색, 외곽선, 합성 틈을 확인한다. 색 기반 추정치이므로 보고서와 전체 그림·확대 접합부를 함께 본다. 숫자 통과는 그림 완성이나 사용자 채택을 뜻하지 않는다. 베이스를 고치기 위한 자동 보정 도구가 아니다.

정지 출력은620×720·기준 키576, 걷기는360×400·기준 키330이다. 게임 배율과 발 위치는 최종manifest를 따른다.
