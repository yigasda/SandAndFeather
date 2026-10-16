# 아스트라 맵 제작 — 작업별 실행 지침

> **최신 사용자 절대 금지: 앞으로 모든 맵에 앙크 문양을 넣지 않는다.** 참고 원본에 있어도 복사하지 않는다. 고리 달린 십자가·생명의 열쇠 형태와 변형도 제외한다. 예외: 05 시안 1은 사용자가 앙크 포함 원본 그대로 채택했다. 이 예외를 다른 새 맵에 확대하지 않는다.

> **05~20 최신 통합 작화 지침:** [통합 문서](ASTRA-DESERT-05-20-GUIDE.md). 사용자 첨부 2종과 맵별 분위기·퍼즐·10가지 기능을 통합했다. 05는 시안 1 원본(앙크 포함) 채택. 06은 03에 통합하기로 확정했다. 03 통합 시안 2 채택. 현재 제작 범위는 07 낮 시안 4개이며 런타임 미적용이다.

이 문서는 다음 맵 작업을 바로 실행하기 위한 지침이다. 최신 사용자 지시가 우선한다. 작업 저장소는 `/workspace/horus-combat-publish`.

## 1. 현재 기준과 바로 열 파일

01 황금 사구해·02 매몰 신전 사막·03 고요한 사구·04 메마른 모래벌판은 최종 채택됐다. 재작화 지시 없이 변경하지 않는다. 다음 맵은 사용자 지정 후 시작한다. 01~04 채택 원본과 이 지침을 main에 전달한다. Drive 업로드·게임 런타임 적용은 미실행이다. 02 최종본은 원래 채택 PNG에 풍화된 오른쪽 출구만 합성한 버전이며, 반복 재생성된 전체 맵을 사용하지 않는다.

| 용도 | 파일 |
|---|---|
| 01 최종 그림 | [approved-final.png](art/desert-01-method-2026-10-16/approved-final.png) |
| 02 최종 그림 | [approved-final.png](art/desert-02-candidates-2026-10-16/approved-final.png) |
| 03 최종 그림 | [approved-final.png](art/desert-03-ridge-approved-2026-10-16/approved-final.png) |
| 04 최종 그림 | [approved-final.png](art/desert-04-approved-2026-10-16/approved-final.png) |
| 01 정확한 최종 호출 | [approved-final-request.json](art/desert-01-method-2026-10-16/approved-final-request.json) |
| 02 합성 전 원본 생성 호출 | [approved-final-request.json](art/desert-02-candidates-2026-10-16/approved-final-request.json) |
| 지도별 설계·미술 지시 | [map-art-plan.txt](art/desert-handoff-sources/map-art-plan.txt) |
| 지도 연결·기능 계획 | [features-plan.txt](art/desert-handoff-sources/features-plan.txt) |
| 01~04 배치 원본 | [원본 보관함](art/desert-handoff-sources/README.md) |
| 승인 근거·크기·해시 | [manifest](art/desert-approved-manifest.json) |

최종 호출 JSON의 이미지 경로는 JSON 파일이 있는 폴더 기준 상대경로다. 실행 시 절대경로로 해석한다. 입력 이미지도 같은 폴더의 `final-source-references/`에 보존되어 있다. `candidate`, `result`라는 이름을 최종본으로 추정하지 않는다.

02 최종 합성 재현: [스크립트](art/desert-02-candidates-2026-10-16/composite-exit.py), [합성 전 원본](art/desert-02-candidates-2026-10-16/approved-before-exit.png), [출구 소스](art/desert-02-candidates-2026-10-16/exit-weathering-source.png). 마스크 바깥은 원본과 픽셀이 동일하다.

03은 04 첫 번째 시안 지형에 03 두 번째 시안의 오브젝트 두 군을 옮기고 외곽선을 보강한 버전이다. 04는 마지막 시안(전체 4번)이다. 각 폴더의 manifest와 최종 PNG를 기준으로 삼는다.

## 2. 요청을 받으면 먼저 작업 종류를 고른다

| 사용자 요청 | 실행 방식 | 고정할 것 | 새로 만들 것 |
|---|---|---|---|
| 새 맵 디자인 | 3절 | 맵 명세·세계관·연결·카메라·화풍 | 배치·건축·지형 설계 |
| 이 베이스대로 새로 그려 | 4절 | 지정 베이스의 위치·비율·형태·동선 | 표면·색·명암·도트·모든 경계 |
| 세부맵과 똑같이 해 | 5절을 작화 전체에 적용 | 대상 맵의 디자인 | 참고와 같은 표현 체계 |
| 도식 만들어 | 6절 | 원본 구조·실루엣·동선·주요 문양 위치 | 작화 정보를 덜어낸 중간 상세도 설계도 |
| 여기만 수정해 | 7절 | 수정 범위 밖의 그림 | 지정 부분과 필요한 접합부 |
| 시안 여러 개 줘 | 8절 | 사용자가 고정한 디자인 | 요청에 맞는 작화 또는 설계 차이 |

이미 장수와 방향이 지정됐으면 재승인을 요구하지 않는다. 새 디자인과 지정본 재작화를 혼동하지 않는다. 후자는 마음대로 더 예쁜 건물·장식·지형을 설계하는 작업이 아니다.

## 3. 새 맵을 디자인하는 방법

### 입력

해당 맵의 명세, 연결 대상, 최신 배치 시안이 있는지 확인한다. [지도별 미술 지시](art/desert-handoff-sources/map-art-plan.txt)의 해당 번호와 공통 기준을 읽고 실제 이미지를 연다. 기준 화풍으로 사용할 채택 세부맵도 직접 연다.

### 순서

1. 맵의 역할을 정한다: 전체 지역을 보여주는 대형맵인지, 건물 접근부인지, 실내 탐사 공간인지.
2. 주 랜드마크, 출입구, 이동 여백, 보조 지형 순으로 배치한다. 장식으로 빈 공간을 채우지 않는다.
3. 대형맵의 건물을 확대하는 세부맵에서는 그 건물 전체를 다시 축소 배치하지 않는다. 기단·문·벽·기둥 일부가 크게 보이게 하여 실제 규모를 전달한다.
4. 같은 3/4 내려다보기 투시와 통일된 광원을 잡는다. 출입문 앞 착지·회전 공간, 조사 대상 접근 공간, 전경 가림을 고려한다.
5. 구조가 정해지면 6절의 중간 상세도 도식을 만들고, 5절의 화풍 기준으로 완성 그림을 그린다.
6. 가동 문·퍼즐 장치·획득물·변하는 효과는 고정 배경에 무심코 합치지 않는다. 실제 레이어 제작 범위는 미술 지시와 사용자 요청을 따른다.

### 사막 공간 규칙

큰 사구 몇 개와 넓은 평지가 사막 규모를 만든다. 작은 언덕을 반복하거나 여백을 잔해·풀로 채우지 않는다. 식생은 지정된 종류·수·위치만 쓴다. 고대 이집트 건축이며 새것처럼 복원한 유적이나 무관한 장식을 만들지 않는다.

03 고요한 사구: 큰 곡면·넓은 평지·소수 암석군. 도로·발자국·상시 천막 금지.
04 메마른 모래벌판: 낮은 층상 사암·드문 마른 식생/고사목. 초록 잔풀과 잔해 도배 금지, 도로 추가 금지.
정확한 배치와 비율은 해당 원본 및 최신 지시를 따른다.

## 4. 지정 베이스대로 처음부터 다시 그리는 방법

### 입력 구성

- 사용자가 지정한 베이스 PNG를 반드시 넣는다. 임의로 다른 시안이나 최신 결과로 교체하지 않는다.
- 화풍은 사용자가 지정한 채택 세부맵들을 넣는다.
- 별도 요청이 없으면 도식과 베이스를 중복으로 넣지 않는다. 참고 역할을 혼합하지 않는다.
- 완성 PNG가 있으면 휴대폰 확대 스크린샷 대신 PNG를 쓴다.

### 베이스에서 가져올 정보

건물 위치·폭·높이·실루엣, 기둥 수와 간격, 지붕 단차·붕괴, 문 위치, 계단·문턱, 큰 암석군, 길의 경로·폭 변화·유실, 식생, 사구 능선·방향, 여백의 비율.

### 베이스에서 가져오지 않을 정보

낮은 선명도, 일정한 선색·선폭, 탁한 색감, 흰끼, 미세한 잡색 부스러기, 불필요한 균열·반짝임. 사용자가 지적한 추가 장식도 제외한다.

### 생성 지시의 순서

1. 최상단: **화풍·색·빛·재질·도트·경계는 채택 세부맵 기준. 베이스는 디자인 기준.**
2. 배치와 건축에서 고정할 대상을 구체적으로 나열한다.
3. 모든 표면과 윤곽을 새로 그리며, 기존 선을 보존하거나 위에 색칠하지 않는다고 명시한다.
4. 이번 수정 조건을 구체적인 면·색·경계 관계로 설명한다.
5. 다른 참고 이미지의 내용이 섞이지 않도록 금지한다: 가구·꽃·동굴·불꽃·하늘·새 장식 등.

복사용 문장:

> References 1–4 are the mandatory authority for art style, palette, lighting, material rendering, pixel-cluster scale and edge treatment. Reference 5 supplies ONLY the exact scene design and composition. Reconstruct the painting from scratch. Preserve geometry and paths, but redraw every contour and surface using the approved detailed maps. Do not trace, recolor, sharpen or preserve the base image's rendering defects.

‘fresh redraw’라는 문구만으로 실제 재작화가 보장되지는 않는다. 결과가 기존 그림과 거의 같으면 크게 달라졌다고 보고하지 않는다. 사용자 지정 베이스를 제외하는 방식으로 임의 해결하지 않는다.

## 5. ‘세부맵과 똑같이’ 맞춰야 하는 항목

같은 색 몇 개를 쓰거나 참고를 첨부하는 것만으로 충족하지 않는다. 다음 항목을 함께 맞춘다.

| 항목 | 적용 방법 |
|---|---|
| 카메라 | 같은 3/4 내려다보기, 일관된 바닥·기둥·문 투시 |
| 도트 | 같은 픽셀 덩어리 크기감과 디테일 밀도. 작은 물체도 윗면·옆면·접합 그림자가 읽히게 구성 |
| 면 | 깨끗한 큰 색면 안에 절제된 재질 변화. 선·균열·반짝임을 늘려 선명함을 대신하지 않음 |
| 색 | 밝은 면·중간 면·그늘·반사색의 관계를 따름. 한 색 필터나 전역 채도 조절로 대체하지 않음 |
| 재질 | 돌·모래·나무·잎·도기·금속 각각의 색과 반사 성질 구분 |
| 입체감 | 깊은 틈, 겹침, 노출 면, 반사광의 위치와 강도로 덩어리 구성 |
| 외곽 | 같은 윤곽 안에서도 색·폭·농도·끊김 변화. 물체마다 닫힌 선으로 분리하지 않음 |
| 노후감 | 큰 파손·닳은 모서리·부분 매몰·구조 이음새. 잡색점과 미세 얼룩으로 도배하지 않음 |
| 장면 통일 | 같은 빛, 주변 반사색, 공유 접촉 그림자로 오브젝트를 땅과 연결 |

### 참고 이미지별 사용할 정보

기본 색 조화와 깨끗한 면이 필요하면 우물마당·지붕을 우선한다. 아래는 각 이미지의 역할이지, 매번 모두 넣으라는 고정 규칙은 아니다. 최신 사용자의 입력 지정이 우선한다.

| 채택 참고 | 가져올 것 | 가져오지 않을 것 |
|---|---|---|
| 우물마당 낮 | 밝은 사암의 크림·꿀빛·반사색 조화, 항아리/바구니/벽의 자연스러운 경계 연결 | 우물·가구·화분·하늘·물 |
| 옴보스 지붕 낮 | 환한 건물, 깨끗한 면, 절제된 밝은 모서리와 명암 | 지붕 가구·꽃·수평선 |
| 세트 방 낮 | 따뜻하고 풍부한 중간색, 재질별 색 관계 | 침실·가구·실내 구도 |
| 부엌 낮 | 조화로운 재질색, 작은 물체의 읽히는 형태와 경계 | 조리도구·음식·가구 |
| 두아트 모래 성소 | 묵직한 풍화 석재, 깊은 접합, 윤곽 강약 | 동굴 조명·남색 암벽·청록 불꽃 |

원본 경로는 `docs/art/map-expansion/` 아래:
`well-option3-night-v1/well-courtyard-option3-day.png`, `temple-roof-v1-day.png`, `set-room-v6-single-window-day.png`, `temple-kitchen-v2-open-day.png`, `duat-field-05-sand.png`.

### 색을 지시하는 방법

- 기본: 밝은 크림/꿀빛 사암 + 따뜻한 중간색 + 절제된 황토/시에나 전환 + 깊은 틈의 엄버 + 주변 모래의 반사색. 색은 서로 관련된 면으로 연결한다.
- 탁하고 어두우면: 건물의 넓은 밝은 면과 중간색에 빛과 재질색을 돌려준다. 그림 전체 노출을 올리지 않는다.
- 흰끼가 많으면: 넓은 백색 면을 크림·꿀빛 베이지·옅은 살구 반사색으로 구성한다. 가장 옅은 빛은 작은 노출 모서리에 제한한다. 명도를 일괄 낮추지 않는다.
- 색 부스러기가 보이면: 맨 돌 면의 무작위 노랑·청록·주황 점과 안료 조각을 없앤다. 빛과 그늘의 다색 표현은 유지한다. 의도된 문양·띠는 정해진 영역에만 남긴다.

복사용 문장:

> Rich LIGHTING COLORS, not random COLOR DEBRIS. Keep coherent cream, honey, peach, ochre and shaded turning planes. Bare stone surfaces remain clean. No isolated yellow/turquoise pigment flecks, multicolored chips or noisy microtexture. Intentional motifs remain bounded within their designed regions. Preserve luminous daylight without chalky white expanses or a monochromatic beige wash.

### 외곽선을 지시하는 방법

사암은 빛받는 크림/황토 → 돌아가는 시에나 → 깊은 겹침의 엄버로 이어진다. 잎은 올리브/녹색, 줄기는 붉은 갈색, 도기는 적갈색, 금속은 청동/금갈색, 길은 조용한 회갈색/황토색을 쓴다. 전부 같은 갈색이나 검정색으로 두르지 않는다.

같은 선 안에서 밝은 곳은 가늘고 옅거나 사라지고, 겹침은 짧고 짙고 두꺼워진다. ‘투명도’는 그림 안에서 주변색에 섞여 보이는 정도이며 PNG 알파를 바꾸라는 뜻이 아니다. 기둥과 벽의 구조 경계는 길보다 묵직해야 한다. 땅에 묻힌 밑부분은 모래와 공유 그림자로 연결한다.

복사용 문장:

> Redraw ALL contours. Vary hue, thickness and apparent opacity ALONG each edge according to material, light and overlap. Lost sunlit edges, colored turning planes, short tapered weighty occlusions. No constant-width brown or black rings and no white piping. Standing masonry has stronger structural weight than quiet flat paving; shared shadows integrate objects into one painting.

## 6. 배치 도식을 만드는 방법

목적은 화풍을 제공하는 것이 아니라 **정확한 디자인을 보존하면서 표면 잡음을 제거**하는 것이다.

### 반드시 남길 것

전체 비율·투시, 건물 실루엣, 앞뒤 기둥의 위치·직경·간격, 기둥 머리의 주요 형태, 지붕 단차와 큰 붕괴, 문·계단·문턱, 주요 문양의 위치와 큰 형태, 큰 암석군, 식생 위치, 길의 폭·굴곡·유실, 사구 능선과 방향, 빈 공간.

### 빼야 할 것

모래결, 미세 자갈과 점, 잔균열, 촘촘한 해칭, 색 부스러기, 모든 돌의 작은 깨짐, 반복 반짝임. 돌을 동그라미·건물을 네모·나무를 막대사탕으로 축약하지 않는다.

### 표현

중간 상세도의 중성 선화와 소수의 면 명암. 겹침과 윗면·옆면 정도만 구별한다. [02 채택 도식](art/desert-02-candidates-2026-10-16/weathered-path-layout.png)을 적정 구조 정보량의 예로 본다. 도식의 일정한 선색·두께는 완성 그림에서 반드시 버린다.

길은 이어진 일정 폭 띠로 그리지 않는다. 큰 포석이 남은 넓은 구간, 좁은 잔존 구간, 모래에 묻힌 넓은 끊김을 불규칙하게 둔다. 길 가장자리를 작은 자갈 목걸이로 둘러싸지 않는다. 문 앞 접근은 읽히게 유지한다.

복사용 문장:

> Create a moderate-detail architectural layout guide. Preserve exact geometry, column spacing, major carved motifs, structural damage, entrances, path footprint and dune crests. Remove microcracks, sand grain, tiny gravel, hatching and pigment noise. Use restrained neutral lines and a few flat values. This is a precise design reference, not a massing sketch and not a textured illustration.

완성 그림 호출에는 별도 문장을 붙인다:

> The guide supplies geometry ONLY. Its linework, palette, saturation, opacity and shading style must have ZERO authority over the final painting. Discard the guide lines and redraw all edges from the approved detailed-map references.

## 7. 부분 수정 방법

1. 정확한 베이스 파일과 수정 부위를 지정한다. 요청 범위 밖 건물·식생·길·크기·구도를 보존한다.
2. ‘어둡게’ 같은 단어만 전달하지 말고 왜 필요한지 관계를 적는다. 예: 길보다 약한 기둥의 접합 그림자와 그늘 쪽 윤곽에 무게를 준다.
3. 추가 장식 제거라면 어떤 형태인지 명시하고 대체할 구조를 지정한다. 예: 날개 달린 금색 원반을 없애고 단순한 석조 인방으로 만든다. 다른 문양 전체를 지우지 않는다.
4. 생성문에 금지했다고 실제 제거된 것은 아니다. 결과에 남은 장식이나 새 하늘이 있으면 그대로 보고하고, 없다고 말하지 않는다.
5. 사용자가 ‘수정본에서 계속 수정하지 말고 처음부터’라고 하면 4절로 전환한다. 임의 업스케일·흐림·샤프닝으로 대체하지 않는다.

## 8. 여러 시안 제작 방법

같은 배치의 독립 시안인지, 서로 다른 디자인인지 먼저 요청에서 구분한다. 사용자가 ‘확 다르게’라고 하면 각 호출에서 우선할 색 관계·명암 구조·픽셀 표현·경계 처리를 구체적으로 달리 적는다. 번호만 바꾸는 것은 작화 방향이 아니다.

예: 모래 성소 중심은 깊은 접합과 풍화 석재, 지붕 중심은 밝고 맑은 면, 세트 방 중심은 풍부한 따뜻한 중간색, 부엌 중심은 재질색의 균형과 연결. 단, 같은 베이스가 강하게 작용해 결과 차이가 작을 수 있다. 실제 차이가 작으면 ‘확연히 다르다’고 단정하지 않는다.

생성 전에 번호와 요청 JSON을 고정한다. 병렬 완료 순서와 시안 번호를 구분하고, 각 PNG를 그 번호로 저장한다. 사용자 지정 장수만 만든다. 사용자 수정이 도착하면 이미 실행한 호출의 완료 여부를 확인한 뒤 다음 행동을 결정한다.

## 9. 실행·전달 시 지킬 사항

- 이미지 작업은 이미지 생성/편집 도구를 사용한다. 실제 열어 본 로컬 PNG를 참고 경로로 전달한다. 당시 성공 호출은 최대 5개 입력 구성이다.
- 도구에 수치 해상도 인자가 없던 작업이다. ‘high quality’ 문구를 4K 설정처럼 말하지 않는다. 확대 무손실이나 화풍 일치를 보장하지 않는다.
- 옴보스와 비슷한 픽셀 수의 사막도 흐려 보였다. 품질 문제를 ‘대형맵이라 해상도 부족’으로 단정하지 않는다. 원인은 면·선·텍스처 구성까지 살핀다.
- 원본 시안 전체를 작화에 넣는 것과 도식 추출에 사용하는 것은 다르다. 사용자가 지정하지 않은 흐릿한 배치 시안을 최종 작화 참고에 자동 추가하지 않는다.
- 맵 분할 생성·조립·업스케일은 승인받지 않았다. 테트리스처럼 접합될 위험을 사용자도 지적했다.
- 사용자는 ‘비교는 내가 한다’고 했다. 임의 비교 시트·순위·우열 평가를 만들지 않는다. 실제 출력과 중요한 미충족 사항을 보여준다.
- 같은 실패를 긴 문장만 더해 반복하지 않는다. 입력의 역할과 실제 결과를 다시 보고 방법을 조정한다. 참고 첨부 자체를 성공으로 보고하지 않는다.
- [ASTRA-MAP](ASTRA-MAP.md)의 인게임 배율·출입·가림 검증은 실제 적용 단계에서 수행한다. 그림 시안 검토만으로 통과했다고 하지 않는다.

## 10. 다음 담당자용 시작 절차

1. 최신 요청을 읽고 2절에서 작업 유형을 선택한다.
2. 해당 맵 명세·배치 원본과 지정 화풍 원본을 실제로 연다.
3. 위 해당 절의 입력 역할과 생성 조건을 적용한다. 이전 맵의 피라미드·원판·문양 조건이 다른 맵 프롬프트에 남지 않게 한다.
4. 정확한 참고 이미지 순서와 실제 생성문을 저장하고 요청한 작업을 실행한다.
5. 최종 채택 시 PNG를 별도로 보존하고 manifest와 상태 문서를 갱신한다. ‘최신/미채택’ 경과를 맨 위에 계속 쌓지 않는다.

이 문서는 일지로 늘리지 말고, 적용할 방법과 현재 기준을 수정한다.
