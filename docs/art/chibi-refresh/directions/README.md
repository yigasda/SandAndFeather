# 캐릭터 방향별 기본 자세 시안

## 호루스 v1

사용자가 스프라이트 제작 시작과 호루스 눈 크기 축소를 제안했다. 승인된 참조 그림체를 유지하며 눈 크기를 약 10% 줄이는 방향으로 만든 4방향 기본 자세 검토 시안이다. 정확한 수치 보정이 아닌 이미지 생성 기반 시각 조정이다.

왼쪽부터 정면, 뒷면, 왼쪽을 보는 측면, 오른쪽을 보는 측면. 작은 몸과 둥근 손, 남색 짧은 머리, 흰 치마와 갈색 샌들을 유지한다. 눈장식은 캐릭터의 왼쪽 얼굴에만 있으므로 측면을 단순 반전하지 않는다. 눈장식 세로 획에 회색기가 남아 있으며 금색 통일은 후속 정리가 필요하다.

- `horus-idle-v1.png`: 투명 배경 방향별 시안.
- `horus-idle-v1-preview.jpg`: 밝은 배경 모바일 확인용.
- [Drive 미리보기](https://drive.google.com/file/d/17O7u_MnKEjIDBQJUAffgBaYGlE1OPeDB/view)

이 이미지는 외형과 방향 확인용이다. 게임용 프레임 크기, 발 위치 정렬, 방향별 스케일 보정 및 애니메이션은 아직 적용하지 않았다. 기존 게임 에셋을 교체하지 않는다.

다른 캐릭터 기준: 세트는 `../reference-style/trio-v2-somang-hair.png`의 세트, 소망은 사용자가 승인한 `../reference-style/somang-v3-user-reference.png`. 소망 v1/v2로 돌아가지 않는다.

제작 순서는 각자의 4방향 기본 자세, 걷기, 전투 대기, 공격, 주문, 피격, 쓰러짐 순으로 진행한다. 타격·주문 효과는 캐릭터 프레임과 분리하며, 생활 및 두 캐릭터 상호작용 동작은 기본 동작 이후 확장한다.

## 호루스 v2: 머리색과 길이

사용자가 v1 머리가 검게 보이고 길다고 지적하며 남색의 짧은 삐죽머리 참고 그림 두 장을 제공했다. 4방향의 머리를 푸른 기가 분명한 남색으로 조정하고 길게 솟은 머리 덩어리를 짧은 뾰족한 머리결로 다듬은 후속 시안이다. 줄인 눈 크기와 기존 의상 방향을 유지한다. 새 참고의 날개나 근육은 추가하지 않았다.

`horus-idle-v2-blue-hair.png`는 원본, `horus-idle-v2-blue-hair-preview.jpg`는 밝은 배경 확인용이다. 기존 v1은 보존한다. 아직 게임용 프레임으로 적용하지 않았다.

[v2 Drive 미리보기](https://drive.google.com/file/d/1HjNhBibVElJnplqxUSFMsOraoUF2864P/view)

## 호루스 v3: 위쪽 큰 안광 제거

사용자가 v2 머리를 승인하며 각 눈의 맨 위 큰 안광만 제거하도록 요청했다. 정면과 양쪽 측면의 위쪽 흰 반사점을 제거하고 금색 홍채 아래의 작은 안광은 유지한 검토 시안이다. 이미지 생성 편집 특성상 동공 형태에 미세한 변화가 있으므로 사용자 확인 전 최종 확정하지 않는다.

`horus-idle-v3-catchlight.png`는 투명 원본, `horus-idle-v3-catchlight-preview.jpg`는 밝은 배경 미리보기다. 게임 적용은 하지 않았다.

[v3 Drive 미리보기](https://drive.google.com/file/d/16fSzzBC5Km8R7ktMEx2eM9YE002sZIDi/view)

## 호루스 v4: 원본의 안광 픽셀만 직접 수정 — v3 대체

사용자가 v3의 커진 동공을 거절했다. v3는 사용하지 않는다. 사용자가 요청한 직접 픽셀 수정 방식으로 승인된 v2(67번) 원본에 돌아가 네 눈의 위쪽 안광 영역만 주변 동공색으로 보간했다. 이미지 재생성을 사용하지 않았다.

`horus-idle-v4-pixel-correction.png`가 최신 검토 원본이다. 2160×728 PNG에서 수정된 픽셀은 총 180개, 네 작은 안광 마스크 밖의 변경은 0개, 알파 변경은 0개다. 동공 외곽 및 크기, 아래쪽 안광, 나머지 캐릭터는 원본과 동일하다. 재현 스크립트는 `scripts/art/horus-remove-catchlights.cjs`, 검증 기록은 `horus-idle-v4-pixel-correction-verification.json`에 있다. JPEG 미리보기는 인코딩에 따른 픽셀 차이가 있을 수 있으며 위 검증은 PNG 원본 기준이다.

- [4방향 Drive 미리보기](https://drive.google.com/file/d/12RI13xm4Kt39t-Is0XHFXR7T6L9uUYv6/view)
- [정면 확대 Drive 미리보기](https://drive.google.com/file/d/11PapQmPWVtL8zlLFX1LX-04EEFrCAxCN/view)

## 세트·소망 4방향 v1

사용자가 호루스 v4를 승인하고 세트와 소망의 방향별 제작을 요청했다. 각 시트는 왼쪽부터 정면, 뒷면, 왼쪽을 보는 측면, 오른쪽을 보는 측면이다. 외형 검토용으로 아직 게임 프레임을 교체하지 않았다.

- `set-idle-v1.png`: 승인된 세트 외형을 바탕으로 긴 다크 크림슨 생머리, 차콜 치마, 가는 금색 허리끈과 작은 중앙 금장식을 유지한다. 트임은 캐릭터 왼쪽에만 있으며 좌우 시트를 단순 반전하지 않는다. [Drive](https://drive.google.com/file/d/1lFpcLSyKYGbGpLOZa0rCMDIk97PtYXyT/view)
- `somang-idle-v1.png`: 승인된 소망 v3 단독 시안을 바탕으로 가슴 길이의 풀어 내린 곱슬, 나른한 처진 눈매, 목 끈리본과 느슨한 아이보리 드레스, 갈색 샌들을 따른다. 이전의 둥글게 뜬 눈과 별자리 치맛단은 사용하지 않는다. [Drive](https://drive.google.com/file/d/15RPNBu6kWfl6dePCHyqJbgGyIrdfMcqL/view)

각 `-preview.jpg`는 밝은 배경 미리보기다. 후속 게임 에셋화 과정에서 셋의 표시 높이 및 발 위치를 정렬하고, 뒷면 샌들처럼 방향에 따라 달라지는 작은 부분을 정리해야 한다. 현재 시안을 곧바로 완성된 애니메이션 시트로 취급하지 않는다.

## 세트·소망 v2: 호루스와 비율·그림체를 맞춘 새 사용자 참고

사용자가 등신과 그림체를 맞추기 위해 세트와 소망의 새 단독 그림을 제공했다. 이 두 그림을 최우선 기준으로 새 4방향 시안을 제작했다. 아래 v2가 현재 검토 대상이며, v1과 이전 의상 디테일을 자동으로 다시 넣지 않는다. 호루스는 승인된 v4를 유지한다.

- `set-idle-v2-new-reference.png`: 큰 머리와 작은 몸, 다크 크림슨 긴 머리와 끝이 살짝 휘는 옆머리, 붉은 눈과 차분한 표정. 새 참고대로 단순한 금색 허리끈과 발목 길이의 닫힌 차콜 주름치마를 사용하며 이전 트임과 중앙 술장식은 추가하지 않았다. [Drive](https://drive.google.com/file/d/10Tpu-e_4inpvqDS9vuoT2ejuUueoXqZN/view)
- `somang-idle-v2-new-reference.png`: 새 참고의 부드러운 미소와 처진 눈매, 시스루 앞머리와 가슴 길이 곱슬, 흰 목 끈리본, 종아리가 보이는 가벼운 아이보리 치맛단을 따른다. 이전의 나른한 무표정 시안을 기준으로 되돌리지 않는다. [Drive](https://drive.google.com/file/d/1CAhvBeHNp5U7K6WRnKFUV-MmgWa7omih/view)

둘 다 왼쪽부터 앞·뒤·왼쪽·오른쪽이며, 같은 이름의 `-preview.jpg`는 밝은 배경 확인용이다. 사용자 검토 전으로 게임 프레임 교체나 걷기 애니메이션 적용은 하지 않았다.

## 세트 v3: 하체 길이 축소

사용자가 세트의 등신이 길다고 하여 v2의 허리 아래 치마와 다리 길이를 줄인 4방향 수정 시안을 만들었다. 얼굴과 상체 디자인을 유지하는 방향으로 편집했으며, 치마는 짧아진 다리에서도 발목 길이의 닫힌 주름치마로 유지한다. `set-idle-v3-shorter-lower-body.png`가 최신 검토 원본, 같은 이름의 `-preview.jpg`가 밝은 배경 미리보기다. 소망과 호루스는 이번 수정 대상이 아니다.

[세트 v3 Drive 미리보기](https://drive.google.com/file/d/17ii0c315uPVSgNZgq-_1u3FEso8AKsML/view)
