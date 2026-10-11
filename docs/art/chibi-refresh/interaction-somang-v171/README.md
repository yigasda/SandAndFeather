# 소망 상호작용 정면 대표171 — 확인 대기

사용자 최신 지시: 170은 아무 안도 채택하지 않음. 이번에는 소망 정면 대표1장만. 정지151·동일 방향 가이드를 참조해 그린 **프레임1(손이 닿음)**이다. 무릎을 펴고 서서 한 손을 앞으로 내밀며 손바닥이 보인다. 다른 손은 옆에 둔다. 물체·효과는 없다.

- 전달PNG: `somang-front-contact-1.png`, 투명620×720, 발 기준점(310,662), 기준 키576.
- 머리 크기·자리, 몸 길이, 치맛단·발끝은 `../pose-guides/somang-front-guide.png`를 밑그림 참조로 사용했다. 생성 도구에 가이드와 최종 정지 원본을 함께 입력했다.
- 생성 원본은 `sources/generated.png`. 출력 입력 크기를620×720으로 균등 정규화하고 알파8/255 이하 생성 잔여 픽셀을 제거한 것이 `sources/fit-input.png`. 색상·팔다리 길이의 수치 변형은 하지 않았다. `fit-scale.py`의 머리 정렬·균등 배율·발 보정 결과를 전달했다.
- `checks/fit-input.json`: 맞음(발+1px 보정). 전달PNG를 다시 입력한 `checks/fit-delivery.json`: 맞음(발+3px 보정).

## 실제 그림 확인

최종 정지·걷기3장과 동작1장을 같은 기준 키·발 기준으로 나란히 배치한 `previews/idle-contact-walk-light.png`, `idle-contact-walk-dark.png`를 직접 확인했다. 머리 크기, 목 연결, 치맛단·발끝 위치, 무릎을 편 서기, 손·소매의 연결과 여분 손 유무를 봤다. `neck-sleeve-hand-dark.png`에서 손목·소매·목 접합을 확대 확인했다. 초안의 손 아래 흰 소매 조각과 과하게 벌어진 손가락은 생성 편집으로 수정했다.

`check-sprite.py --pose free` 결과는 `checks/sprite/`에 포함한다. 머리·얼굴·머리카락 폭·팔레트·외곽선은 같은 범위이며 합성 틈0, 가장자리 흰 픽셀 비율0이다. 반투명 픽셀 항목에는 차이 판정이 남아 있다. 검사 전체 통과나 픽셀 동일을 주장하지 않으며, 밝고 어두운 배경에서 실제 연결과 투명도를 별도 확인했다.

재검사: `python3 tools/art/fit-scale.py docs/art/chibi-refresh/interaction-somang-v171/somang-front-contact-1.png --who somang --view front --out /tmp/somang171-fit`

상호작용 전체 계획은 4방향×2프레임, 각150ms, 한 번 재생 후 정지. 아직 추가 프레임이나 다른 방향·캐릭터는 만들지 않았다. 사용자 확인 전 게임에 적용하지 않는다. 기존 베이스48장 해시는 전부 유지했다.
