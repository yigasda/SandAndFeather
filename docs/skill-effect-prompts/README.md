# 스킬 이펙트: 새 6프레임 실제 생성 프롬프트

세트·호루스·소망의 **기존 v2 피크/유지 그림을 제외한 새 6프레임**을 만든 실제 생성문과, 최종 묶음에 사용된 시트의 수정 생성문을 원문 그대로 보존한다. 각 캐릭터는 새 6장 + 기존 1장으로 총 7프레임이다. 이 기록은 아카이브에 들어 있던 결과를 식별하며, 새 채택이나 게임 적용을 뜻하지 않는다.

## 바로 쓰는 생성문과 결과 연결

| 캐릭터 | 처음 6프레임 생성문 | 최종 묶음 결과를 만든 후속 생성문 | 새 프레임 순서 / 기존 프레임 |
|---|---|---|---|
| 세트 | [actual-animation](prompts/Set-actual-animation-prompt.txt) | [final-animation](prompts/Set-final-animation-prompt.txt): 전체 원문 + 마지막 CRITICAL CORRECTION까지 포함 | 0, 1, 2, 4, 5, 6 / 기존 3 |
| 호루스 | [generation](prompts/Horus-generation-prompt.txt) | [layout-correction-2](prompts/Horus-layout-correction-2-prompt.txt) | 0, 1, 2, 4, 5, 6 / 기존 3 |
| 소망 | [generation](prompts/Somang-generation-prompt.txt) | [spatial-correction](prompts/Somang-spatial-correction-prompt.txt) | 0, 1, 2, 3, 5, 6 / 기존 4 |

셀 순서는 모두 2열 × 3행의 왼쪽→오른쪽, 위→아래다. 처음 생성문만 읽으면 최종 시트의 여백·배치 수정이 빠지므로 후속 생성문과 참고 순서를 함께 확인한다. 호루스·소망 생성문에 포함된 예전 단일 키프레임 문단도 원문이므로 삭제하지 않았다. 그 문단은 최신 6프레임 지시에 종속된다. 별도의 `*-approved-v2-prompt.txt`는 새 6프레임 프롬프트가 아니므로 여기에는 복사하지 않았다.

## 참고 파일·해시·재현 범위

[reference-map.json](reference-map.json)에 캐릭터별 입력 순서, 기존 프레임, 선택된 결과 시트, 아카이브 내부 파일명과 SHA-256을 기록했다. 원래 참고 순서 파일도 [prompts](prompts)에 그대로 보존했다. 원문 안의 절대 경로는 당시 실행 환경의 기록이며 현재 열 수 있는 경로라는 뜻이 아니다. 옮긴 환경에서는 매핑의 아카이브 경로와 해시로 파일을 찾는다.

원본 보관 묶음: `skill-fx-v2-animation-21-frames.zip`, Library `libfile_a2d38796a61881919f701dcd617746d9`, 버전 `1`. 이 Library 식별자는 소유자의 보관본을 찾기 위한 것이며 공개 다운로드 링크가 아니다. 그림은 이 커밋에 포함하지 않는다.

중요한 이름 차이:
- 세트 최종: `generated-sheets/Set-six-new-frames.png`.
- 호루스 최종: 아카이브의 `generated-sheets/Horus-six-new-frames.png`는 메타데이터/QA의 `Horus-six-new-frames-final-layout.png`다.
- 소망 최종: 아카이브의 `generated-sheets/Somang-six-new-frames.png`는 메타데이터/QA의 `Somang-six-new-frames-spaced.png`다.

후속 수정에 넣었던 **최초 생성 시트 중간본**은 이 ZIP에 별도로 남아 있지 않다. 따라서 그 입력의 해시를 추정하지 않았고, 최종 시트를 최초 입력인 것처럼 연결하지 않았다. 매핑의 `null`과 설명을 확인한다. 모델 버전·시드도 기록되어 있지 않아 바이트 단위 재생성을 보장하지 않는다.

## 수정 시도 구분

- 호루스 [첫 배치 수정](prompts/Horus-layout-correction-prompt.txt)은 충분하지 않았고, [최종 QA](prompts/Horus-final-layout-qa.txt)가 두 번째 수정 결과를 지정한다. 두 수정은 각각 최초 생성 시트를 참고했다.
- 소망 [cleanup](prompts/Somang-cleanup-prompt.txt)은 실패한 정리 시도다. [초기 QA](prompts/Somang-QA-notes.txt)와 [최종 배치 QA](prompts/Somang-spatial-correction-QA.txt)를 구분한다. 최종 배치 수정은 cleanup 결과가 아닌 최초 시트를 참고했다.
- QA 파일의 투명도·기준점 관찰은 당시 기록 그대로다. 이번 저장 작업에서 새 이미지를 생성하거나 시각 검수를 수행한 것은 아니다.

저장 범위는 텍스트 생성문·참고 대응·설명뿐이다. 21장 PNG, 참고 이미지, 런타임 파일과 release 브랜치는 변경하지 않는다.
