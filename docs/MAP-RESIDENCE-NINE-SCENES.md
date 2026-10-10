# 옴보스 안채 추가 공간 9장 — 오푸스 전달

2026-10-10. 사용자가 요청한 모든 공간을 각각 별도 배경으로 제작했다. 후속 피드백에서 부엌·식사방·성소 수정과 빠진 낮밤 배경을 요청했다. **최신 파일 선택은 [수정본과 낮밤 목록](MAP-RESIDENCE-DAY-NIGHT.md)이 우선**이다. 아래 표는 최초 9장 이력으로 보존한다. 작업은 아트와 인수인계 등록만이며 실제 게임 코드·저장 데이터는 변경하지 않았다.

## 파일과 열람 링크

원본 PNG를 게임 자산 가공의 출발점으로 사용한다. 모바일 JPG는 열람용이며 PNG를 대신하지 않는다. 기존 드라이브 폴더의 27~35번 파일이다.

| 공간 | 제안 장면 ID | 저장소 원본 | Drive 모바일 | Drive 원본 |
| --- | --- | --- | --- | --- |
| 우물마당 | `temple_courtyard` | [PNG](art/map-expansion/well-courtyard-v1.png) | [모바일](https://drive.google.com/file/d/19H2eDuf3v9gj8fDcla_9FqwGxt246APZ/view?usp=drivesdk) | [원본](https://drive.google.com/file/d/1_oGRVGbNBr0p4PmGf-2SM9zC32Mm3SxY/view?usp=drivesdk) |
| 부엌 | `temple_kitchen` | [PNG](art/map-expansion/temple-kitchen-v1.png) | [모바일](https://drive.google.com/file/d/1WdKQ5ZC7nkfVCzU_NzFpOCrTZLSI_9b-/view?usp=drivesdk) | [원본](https://drive.google.com/file/d/12_kvEGpM1FWpNa8T8FonO-c78LGBsUex/view?usp=drivesdk) |
| 식사공간 | `temple_dining` | [PNG](art/map-expansion/temple-dining-v1.png) | [모바일](https://drive.google.com/file/d/1AsvDFjoTk9ny9ewxznsRH2iEP6LYatUR/view?usp=drivesdk) | [원본](https://drive.google.com/file/d/1CWew5npdhM_DbS45tUKFCGBl_wfLVE27/view?usp=drivesdk) |
| 성소 세트동물 | `temple_sanctuary` | [PNG](art/map-expansion/set-sanctuary-v1.png) | [모바일](https://drive.google.com/file/d/17XrBb76Cxjm2Uvy_KMyxoIo_k6qwr9L0/view?usp=drivesdk) | [원본](https://drive.google.com/file/d/1uHt_eW9oLPxUv9udven3QFm_5N3VbmLR/view?usp=drivesdk) |
| 동쪽회랑 | `temple_east_gallery` | [PNG](art/map-expansion/east-gallery-v1.png) | [모바일](https://drive.google.com/file/d/1I_2qzdTtZBSjsF6BON6e3kY8imIUl9wA/view?usp=drivesdk) | [원본](https://drive.google.com/file/d/11hNfU4iVwAojjLyF6He3fXxpqjdi7lNx/view?usp=drivesdk) |
| 서쪽회랑 | `temple_west_gallery` | [PNG](art/map-expansion/west-gallery-v1.png) | [모바일](https://drive.google.com/file/d/1NPEVYaCayDvIN-yPQZ-fH80NF7Pk9wSf/view?usp=drivesdk) | [원본](https://drive.google.com/file/d/1ILiTqfN88pn-7WH1mKW03pw7ZbZQXnK0/view?usp=drivesdk) |
| 중앙회랑 | `temple_central_gallery` | [PNG](art/map-expansion/central-gallery-v1.png) | [모바일](https://drive.google.com/file/d/1gxi4gBECGfqfAzEtt2quUDFU3gknPP7t/view?usp=drivesdk) | [원본](https://drive.google.com/file/d/1WSikrZIE9bWCiohflaeFTnUoYUSGq4j8/view?usp=drivesdk) |
| 열주계단 | `temple_colonnade` | [PNG](art/map-expansion/colonnade-stairs-v1.png) | [모바일](https://drive.google.com/file/d/1Da6EybgN1f1y2RL9yhn6t40diNEbZVUa/view?usp=drivesdk) | [원본](https://drive.google.com/file/d/1Z9bb1TYrJ9GhbqZYx-9tMkiYRN3HwQzE/view?usp=drivesdk) |
| 지붕 별밤 | `temple_roof` | [PNG](art/map-expansion/temple-roof-v1-night.png) | [모바일](https://drive.google.com/file/d/1XB_NDlzl_pSgvR0hnwqsN85bJxO_h1fd/view?usp=drivesdk) | [원본](https://drive.google.com/file/d/1yfdCOXsEE3i-EEB7wXlmlBobxlNON6ZP/view?usp=drivesdk) |

회랑 세 장은 2172×724(3:1), 모바일은 1600×533. 나머지 여섯 장은 1774×887(2:1), 모바일은 1200×600이다. PNG는 생성 결과와 바이트 단위로 동일하게 보존했다. 모든 시안은 한 번에 한 장씩 확인했다.

## 공간별 의도

- **우물 마당:** 중앙의 실제 우물과 두레박, 왼쪽 빨래 대야, 오른쪽 벤치. 우물 둘레를 걸을 여백이 있다. 별도 연못 회랑을 대체하지 않는다. 빨래 대야는 손으로 물을 채우는 형태이며 초기 생성에 있던 현대식 수도꼭지는 제거했다.
- **부엌:** 왼쪽 화덕·솥, 오른쪽 조리대, 가운데 반죽 작업대, 저장 항아리. 요리 기능을 연결할 수 있으나 이번 작업에서 기능을 옮기지는 않았다. 화덕과 가구는 충돌 구역이다.
- **식사 공간:** 낮은 식탁과 방석 세 자리, 공유 음식, 식기 수납. 부엌과 다른 독립 장면이다.
- **성소:** 사용자 지정인 **세트 동물(Sha)** 석상. 최신 v2는 사용자 요청에 따라 주둥이를 짧고 끝이 둥근 귀여운 형태로 수정했다. 위가 평평한 직사각형 귀와 갈라진 꼬리를 유지한다. v1의 긴 주둥이로 되돌리지 않는다. 앞쪽 제단·공물·향로, 양쪽 화로, 접근 가능한 의식용 바닥.
- **동쪽 회랑:** 붉은 직물·사막 문양·등불. 세트 입구 구간을 향하는 긴 길이며 뒷벽의 붉은 문틀은 성소로 가는 열린 통로다. 세트의 방문을 새로 그려 중복시키지 않았다.
- **서쪽 회랑:** 청회색 직물·별 문양·별 지도. 호루스 입구 구간으로 이어지는 길, 뒷벽의 별 장식 통로는 열주 계단으로 연결하는 제안이다.
- **중앙 회랑:** 밝은 사암의 중립적인 연결 공간. 좌우 길, 뒷벽 중앙 열린 통로, 앞쪽 중앙 진입구를 구분한다.
- **열주 계단:** 오른쪽 넓은 계단과 앞쪽 대기 공간, 왼쪽 기둥 사이 쉬는 자리. 계단 자체에서 대화·휴식할 수 있고 지붕과 별도 장면이다.
- **지붕:** 별밤, 낮은 난간, 별을 보며 쉬는 방석·탁자, 오른쪽 계단실 출입구. 난간 바깥은 보행 구역이 아니다.

최초 제작 때 지붕은 밤만, 우물·계단·부엌·식사방은 낮만 있었으나 후속 작업에서 빠진 시간대를 채웠다. [최신 낮밤 대응표](MAP-RESIDENCE-DAY-NIGHT.md)를 따른다. 성소와 창 없는 실내 회랑은 등불 배경을 낮밤 공통으로 사용한다. 새 아트의 사용자 승인 및 실제 시간대 전환 구현은 별도다.

## 연결 제안

아래는 그림을 바탕으로 한 구현 제안이다. 그림의 좌우와 세계 지도 동서 방향을 동일시하지 않는다. 특히 기존 긴 입구 맵의 화면상 순서 **세트—소망—호루스**와 서쪽 호루스 설정을 함께 유지한다.

| 출발 공간 | 보이는 연결 지점 | 도착 공간 / 복귀 |
| --- | --- | --- |
| 우물 마당 | 하단 중앙 넓은 입구 | 옴보스 신전 문 앞 |
| 우물 마당 | 왼쪽/오른쪽 가장자리 보행 구간 | 각각 부엌 / 식사 공간 제안, 벽·화단을 통과시키지 말고 실보행 폭 확인 |
| 우물 마당 | 상단 오른쪽 정원으로 이어지는 빈 통로 | 기존 열린 연못 회랑 |
| 부엌·식사방 | 각 하단 중앙 문턱 | 마당의 해당 진입 위치 |
| 기존 열린 회랑 → 기존 안쪽 복도 | 기존 장면의 보행 끝 | 중앙 회랑 하단 중앙 진입구 |
| 중앙 회랑 | 화면 왼쪽/오른쪽 보행 끝 | 서쪽 / 동쪽 회랑 |
| 중앙 회랑 | 뒷벽 중앙 아치 | 기존 긴 입구 맵의 소망 입구 인근 보행 구간 |
| 동쪽 회랑 | 왼쪽 끝 / 오른쪽 끝 | 중앙 회랑 / 긴 입구 맵 세트 구간 |
| 동쪽 회랑 | 뒷벽 붉은 문틀 통로 | 성소 하단 중앙 입구 |
| 서쪽 회랑 | 오른쪽 끝 / 왼쪽 끝 | 중앙 회랑 / 긴 입구 맵 호루스 구간 |
| 서쪽 회랑 | 뒷벽 별 장식 통로 | 열주 계단 하단 중앙 입구 |
| 성소 | 하단 중앙 문턱 | 동쪽 회랑의 성소 통로 앞 |
| 열주 계단 | 하단 중앙 문턱 | 서쪽 회랑의 별 장식 통로 앞 |
| 열주 계단 | 오른쪽 계단 아래 접근 지점에서 ^ | 지붕 오른쪽 계단실 문 앞 |
| 지붕 | 오른쪽 계단실의 내려오기 상호작용 | 열주 계단의 같은 접근 지점 |

중앙 회랑의 아치는 소망 방문 자체가 아니다. 기존 긴 입구 맵에 도착한 뒤, 기존 방문을 이용해 방으로 들어간다. 동서 회랑 역시 침실 내부로 즉시 순간이동시키지 않는다.

## 카메라·충돌·상호작용

1. 모바일 기준 폭 412 CSS px에서 회랑 전체를 한 화면에 맞추지 않는다. 승인된 캐릭터/가구 배율을 기준으로 카메라가 가로로 따라가도록 한다. 넓은 방도 동일 배율을 우선하며 필요하면 카메라를 이동한다.
2. 원본 이미지의 위치를 그대로 충돌값으로 추측해 확정하지 않는다. 우물·탁자·방석·기둥·계단 난간·성소 단·화로의 실제 발밑 경계를 대조해 보행 폴리곤을 만든다. 기둥이나 벽 뒤 가림은 기존 렌더링 방식을 따른다.
3. 가장자리 연결은 바닥이 실제로 열려 있는 부분에서만 작동한다. 우물 마당의 좌우 진입 폭이 현재 캐릭터와 맞지 않으면 임의의 구멍을 뚫거나 화단을 통과시키지 말고 아트 보정 위치를 요청한다.
4. 이동마다 출발 장면·출입 지점·귀환 위치를 기억한다. 도착점을 트리거 바로 위에 겹쳐 두지 않아 왕복 튕김을 막는다. 동행, 저장 후 복원, 안전 위치도 함께 처리한다.
5. **^는 그림에 그리지 않았다.** 계단 접근 시 UI에서 '지붕으로 올라가기' 버튼으로 표시한다. 터치 영역 44 CSS px 이상, 기존 5테마 대응. 접근만으로 자동 이동하지 않는다.
6. 지붕에서 내려오면 같은 계단 아래로 돌아온다. 집 안 이동과 계단 사용은 날짜·태양 기운을 소비하지 않는다.
7. 우물 물 긷기/빨래, 부엌 요리, 식사, 제단 공물, 지붕 별 보기 등은 기능 연결 후보다. 새 퀘스트나 소비 규칙이 이번 시안으로 확정되었다고 취급하지 않는다.
8. 현재 생활 시기 시안이다. 처음 만난 시기의 사제단·호루스 거주 여부·소망 소지품 등은 별도 상태에 따른다. 현재 배경의 생활 소품이 초기 시기에도 반드시 보여야 하는 것은 아니다.
9. 새 구현 전 기존 맵·UI·스프라이트·다른 작업자의 커밋을 보존하고, 사용자 승인된 그림을 코드 도형으로 다시 그려 대체하지 않는다.

## 검증 상태

이미지별 구도와 주요 도상을 눈으로 확인했고, PNG 원본 일치 및 크기, JPG 출력, Drive 업로드를 확인했다. **게임 적용·412px 실제 플레이·출입 좌표·충돌·가림·저장 복원은 아직 검증하지 않았다.** 이 문서는 그 작업을 위한 아트 인수인계다.

