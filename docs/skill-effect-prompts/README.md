# 스킬 이펙트: 최종 6프레임 생성 프롬프트

각 캐릭터는 새 6장과 기존 피크/유지 1장으로 총 7프레임이다.

| 캐릭터 | 입력 시트 생성문 | 최종 생성문 | 새 프레임 순서 / 기존 프레임 |
|---|---|---|---|
| 세트 | [입력 시트](prompts/Set-actual-animation-prompt.txt) | [최종 생성문](prompts/Set-final-animation-prompt.txt) | 0, 1, 2, 4, 5, 6 / 기존 3 |
| 호루스 | [입력 시트](prompts/Horus-generation-prompt.txt) | [최종 생성문](prompts/Horus-layout-correction-2-prompt.txt) | 0, 1, 2, 4, 5, 6 / 기존 3 |
| 소망 | [입력 시트](prompts/Somang-generation-prompt.txt) | [최종 생성문](prompts/Somang-spatial-correction-prompt.txt) | 0, 1, 2, 3, 5, 6 / 기존 4 |

최종 호출에 실제로 사용한 프롬프트 전문을 보존한다. 입력 시트 생성문은 최종 호출의 이미지 입력을 만드는 데 필요한 원문이다. 셀 순서는 2열 × 3행, 왼쪽→오른쪽·위→아래다.

## 입력과 결과 대응

[reference-map.json](reference-map.json)에 실제 입력 순서, 기존 프레임, 최종 시트와 원본 해시를 기록했다. 입력 파일은 원문 절대 경로 대신 아카이브 경로·해시로 찾는다.

보관 묶음: `skill-fx-v2-animation-21-frames.zip`, Library `libfile_a2d38796a61881919f701dcd617746d9`, 버전 `1`.

- 세트: `generated-sheets/Set-six-new-frames.png`
- 호루스: `generated-sheets/Horus-six-new-frames.png` (원래 결과명 `Horus-six-new-frames-final-layout.png`)
- 소망: `generated-sheets/Somang-six-new-frames.png` (원래 결과명 `Somang-six-new-frames-spaced.png`)

최종 호출의 입력 시트 원본이 아카이브에 없는 항목은 매핑에서 `null`이다. 최종 결과 시트로 대체하지 않는다. 모델 버전·시드는 기록되지 않았다.

최종 시트의 기준점·알파 관찰: [호루스](prompts/Horus-final-layout-qa.txt), [소망](prompts/Somang-spatial-correction-QA.txt).
