# 아스트라 맵 프롬프트 — 압축 후 재사용

사용자 요청: “지금 프롬프트 좀 저장해두자 … 압축된 뒤에도 쓰게”. 2026-10-16의 실제 호출 15개를 보존한다. 새 이미지는 생성하지 않았다.

## 바로 재개하는 순서

1. 최신 사용자 요청과 [현재 상태](ASTRA-DRAW-STATE.md)를 확인한다.
2. [05–20 통합 작화 지침](ASTRA-DESERT-05-20-GUIDE.md)에서 해당 맵의 역할·연결·접근·분리 조건을 읽는다.
3. 아래에서 가장 가까운 유형을 고르고 실제 참고 PNG를 연다. JSON에 적힌 순서를 유지한다.
4. 실제 원문 전체를 토대로 공통 화풍·카메라·색·공간 지시는 유지하고, 맵 역할·배치·오브젝트 수·출입 위치만 이번 명세에 맞춘다. 이전 맵의 피라미드·앙크·물·야자수를 다른 맵으로 가져오지 않는다.
5. 요청한 수만 한 장씩 생성하고 각 결과를 확인한다. 사용자가 중간에 채택하고 다음 맵을 지시하면 남은 이전 시안은 만들지 않는다.
6. 원문·참고 순서·출력 번호를 저장한다. 시안은 채팅에서, Drive에는 채택 그림만 올린다. 게임 적용과 그림 채택은 별개다.

## 실제 원문과 출력

| 유형 | 실제 호출 원문 | 채택 상태 | 재사용할 핵심 |
|---|---|---|---|
| 05 피라미드 기단 | [4개 원문](art/desert-05-candidates-2026-10-16/requests.json) | 1번 원본 채택, 앙크 포함 예외 승인 | 건축 일부를 크게 자른 세로 접근 맵, 넓은 계단·문 앞 대기 공간 |
| 03 관측 통합 | [3개 원문](art/desert-03-ridge-candidates-2026-10-16/requests.json) | 2번 채택, 4번은 생성 전 작업 전환 | 기존 지형을 기준으로 관측 자리와 작은 길잡이 돌 통합 |
| 07 오아시스 | [4개 원문](art/desert-07-candidates-2026-10-16/requests.json) | 2번 원본 채택 | 물·식생 표현과 사막 재질 참고를 분리한 자연 생활 맵 |

[휴대 가능한 전체 인덱스](art/map-prompt-library-2026-10-16/index.json)에 **프롬프트 전문, 참고 PNG 순서·저장소 상대경로·SHA256, 결과 PNG·SHA256, 채택 상태**를 함께 저장했다. 같은 폴더의 `*-01.txt` 등은 실제 전문, `*-base.txt`는 공통 앞부분, `*-variants.json`은 시안별 배치 지시다. 05의 3·4번은 앙크 금지에 맞춰 앞부분도 변경했으므로 해당 번호의 전문을 우선한다.

역사 기록인 기존 requests.json의 `/workspace/SandAndFeather/`를 다른 세션에 그대로 가정하지 않는다. 현재 저장소 루트에 index.json의 상대경로를 붙여 해석한다. 참조 PNG가 존재하고 해시가 같은지 확인한다. 임시 generated_images 경로에 의존하지 않는다. 모든 출력과 참고는 저장소에 보존돼 있다.

08 추가: [4개 실제 원문](art/desert-08-candidates-2026-10-16/requests.json). 참고 순서는 우물마당 낮 → 부엌 낮 → 04 사막이다. 화풍·도기·목재·천과 사막 재질을 연결했다. 08은 시안 4 채택. TXT·인덱스에도 추가 보존했다.

## 화풍을 유지한 입력 방식

- **참고의 역할을 먼저 지정한다.** 건축 05는 우물마당·지붕이 화풍, 01은 피라미드 외형만 제공했다. 03 통합은 기존 03이 배치, 지붕은 선·면·재질 표현만 제공했다. 07은 연못 회랑·우물마당이 물·식생·화풍, 04는 사막 재질 연속성만 제공했다.
- 3/4 overhead / RPG Maker / tsukuru / game floor map을 명시했다. 하늘·수평선·멀리서 보는 풍경화·아이소메트릭 섬·UI를 제외했다.
- `coherent clean painted pixel-clusters`, `crisp varied material-colored edge weights`, `warm cream sandstone`, `honey middle planes`, `umber occlusion`처럼 면·선·색을 함께 지정했다. 사진·3D 렌더나 단순 검은 테두리로 대체하지 않는다.
- 실루엣·랜드마크·출입·빈 공간을 먼저 정했다. 사막의 여백을 잔해·풀·자갈로 채우지 않고 큰 사구·넓은 면을 남겼다.
- 오브젝트 수와 위치를 구체적으로 정했다. 예: 07 야자수 3그루, 갈대 소수, 낮은 바위 쉼터, 낚시 전경을 가리지 않는 물가.
- 같은 맵의 4개 시안은 공통 조건을 유지하고 마지막 배치 지시를 바꿨다. 색 필터만 바꾸거나 다른 화풍을 섞지 않았다.
- 건축 장면의 문·계단·문턱, 자연 장면의 접근 가능한 물가·관측 위치를 설명했다. 이것이 실제 충돌·낚시·관측 기능 검증을 대체하지는 않는다.

## 참고 순서 — 바꾸지 않고 역할을 이해할 것

05: ① `docs/art/map-expansion/well-option3-night-v1/well-courtyard-option3-day.png` ② `docs/art/map-expansion/temple-roof-v1-day.png` ③ `docs/art/desert-01-method-2026-10-16/approved-final.png`.

03 통합: ① `docs/art/desert-03-approved-2026-10-16/approved-final.png` ② `docs/art/map-expansion/temple-roof-v1-day.png`. 이것은 당시 생성에 쓴 **이전 03**이다. 현재 채택본으로 새 수정할 때는 `docs/art/desert-03-ridge-approved-2026-10-16/approved-final.png`를 베이스로 쓰고, 역사 재현과 혼동하지 않는다.

07: ① `docs/art/map-expansion/exits-v2/courtyard-colonnade-v1.png` ② `docs/art/map-expansion/well-option3-night-v1/well-courtyard-option3-day.png` ③ `docs/art/desert-04-approved-2026-10-16/approved-final.png`.

## 다음 맵에 적용하는 조립 틀

아래는 실행 당시 원문이 아니라 **원문을 새 명세에 옮기는 편집 순서**다. 실제 원문은 위 TXT/JSON을 사용한다.

```text
Draw ONE complete standalone [orientation] game map concept for [map number + name].
References [indices] are ART STYLE authority ONLY: [preserved style terms].
Reference [index] supplies ONLY [layout / building identity / neighboring material].
Do NOT import [unrelated content visible in references].
[3/4 overhead gameplay camera, canvas orientation, no sky/horizon/UI].
[Landmark, scale, material relationships, exact limited objects].
[Entry/return, wide usable ground, interaction approach, foreground clearance].
[Location-specific exclusions; NO ANKH for new maps].
[Changing effects/objects not baked into fixed background].
Variant layout: [one concrete composition, separate call per variant].
```

야외의 “건물 금지”, 오아시스의 “야자수 3그루”, 피라미드의 “세로 2:3”는 장소별 조건이다. 이를 실내·생활 거점에 무조건 복사하지 않는다. 문양 금지 전체로 확대하지 않고 최신 사용자 규칙인 **앙크 금지**를 적용한다. 05 1번만 기존 그림 그대로 승인된 예외다.

## 재현 범위와 실제 상태

- 실제 사용 도구: `image_gen.imagegen`; 입력은 `prompt`, `referenced_image_paths`, `transparent_background: false`였다. 시드·모델 버전·해상도 수치 옵션은 제공받지 않았다. 임의로 4K 설정 등을 기록하지 않는다.
- 실제 출력: 05는 1024×1536, 03 통합·07은 1774×887. 비율은 프롬프트 요청이며 향후 같은 크기·동일 픽셀 재생성을 보장하지 않는다.
- 05 1번과 03 통합 2번은 사용자 채택. 07은 후속 사용자 지시로 2번 원본을 채택했다.
- 07은 명세보다 물색과 수면 하이라이트가 강한 편이다. 명세 문장을 썼다는 사실만으로 모두 충족했다고 하지 않는다.
- 결과는 통합 그림 시안이다. 실제 게임 배율·충돌·낚시 연결·전경/물 효과 분리·낮밤 검증은 별도 적용 단계다.
- 기존 승인 그림을 다시 생성해 대체하지 않는다. 다음 담당자는 해당 맵 최신 채택본과 사용자의 수정 범위를 먼저 확인한다.

## 기록 간소화 — 최신 사용자 지시

앞으로 매 시안 프롬프트 전문을 중복 저장하지 않는다. 작업별 공통 프롬프트 1개, 참고 순서, 시안별 배치 차이만 한 파일에 기록한다. 기존 기록은 보존한다.
