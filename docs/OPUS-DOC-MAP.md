# 오푸스 문서 이동표와 보존 검사

원본 OPUS-HANDOFF의 각 H2 블록을 제목부터 다음 H2 직전까지 문자 그대로 한 파트에 옮겼다. 코드·명령·표·링크·규칙의 본문은 변경하지 않았다. 새 안내·맥락 설명은 블록 밖에 추가했다.

원본 SHA-256: `6d68cf3a85af2dfd602c452f217b688a8286fbe019223146fc45a4bbb4552f88`

| 원본 줄 | 원본 절 | 이동 위치 | 블록 SHA-256 |
|---|---|---|---|
| 5–38 | 모든 맵 공통: 출입구·착지·왕복 기준 | [OPUS-MAPS.md](OPUS-MAPS.md#모든-맵-공통-출입구착지왕복-기준) | `4ee8d94f3a5b04b67ae5c3efe76d3f5e1b0b6fdcaa940f3f9e9b49630e6fd83f` |
| 39–121 | 직접 하는 그림 손질 (`tools/art/fix/`) | [OPUS-ART-EDIT.md](OPUS-ART-EDIT.md#직접-하는-그림-손질-toolsartfix) | `599f72171bdc671fba9c0074ae7e8e830b096a6312ad60e0b9702ec7de6df517` |
| 122–127 | 이 게임 | [OPUS-WORKFLOW.md](OPUS-WORKFLOW.md#이-게임) | `6d4927387fb5d1f547ae9ce9b732a053a55744ff719a5da93c0fd39fcb8c769e` |
| 128–133 | 역할 | [OPUS-WORKFLOW.md](OPUS-WORKFLOW.md#역할) | `afca7296dc80a9ac24a2e36ab8889f5bcbab01ad561c1504f89f47cf2cb88b47` |
| 134–150 | 사용자(소망)와 일하는 법 | [OPUS-WORKFLOW.md](OPUS-WORKFLOW.md#사용자소망와-일하는-법) | `73cf55faee70bf5a4df8a56c2d7e9e42baa894f3b19b48231121b4b85dba1a79` |
| 151–172 | 새 세션에서 처음 할 일 | [OPUS-WORKFLOW.md](OPUS-WORKFLOW.md#새-세션에서-처음-할-일) | `b573971e1227717c52021f941e950122324019f3afb67487e5a3833e6a641ea4` |
| 173–209 | 버전과 검증 | [OPUS-RELEASE-CHECKS.md](OPUS-RELEASE-CHECKS.md#버전과-검증) | `07988ad9ae3d50b482760a7b301be18021821f6aed1b2b46b13299fcc2939747` |
| 210–239 | 게임 지금 상태 — 0.9.89 | [OPUS-CURRENT-STATE.md](OPUS-CURRENT-STATE.md#게임-지금-상태--0989) | `cebff9bc8773ab8096752a1abc787e51d35533c28a68dc926a76c19dcef3cb3f` |
| 240–252 | 그림 도구 (`tools/art/`) | [OPUS-SPRITE-INTEGRATION.md](OPUS-SPRITE-INTEGRATION.md#그림-도구-toolsart) | `6092ce706f35619692d1b06c124c96d3e54227fe81acaf2dce21f198f619c40b` |
| 253–269 | 앉는 자리 잡기 (의자 외곽선·같이 앉기) | [OPUS-MAPS.md](OPUS-MAPS.md#앉는-자리-잡기-의자-외곽선같이-앉기) | `9fad4c491d4a111d8afae25062a31bfc2cd6068bd6e5dbe0d80e1e2494d6c437` |
| 270–292 | 가구에 몸 가리기 (테이블·탁자 앞에 앉은 다리 등) | [OPUS-MAPS.md](OPUS-MAPS.md#가구에-몸-가리기-테이블탁자-앞에-앉은-다리-등) | `71fea47752d96d5bee7c39df3797fa9d25c93e16fa8d9852e1c1434690acba60` |
| 293–301 | 동작 넣는 법 (아스트라 동작 묶음이 채택됐을 때) | [OPUS-SPRITE-INTEGRATION.md](OPUS-SPRITE-INTEGRATION.md#동작-넣는-법-아스트라-동작-묶음이-채택됐을-때) | `c088615d49ca512fdc40ef22b3d585a1a9e08a116386cb9ac6c4e137b13ecac5` |
| 302–313 | 다음 일 / 대기 | [OPUS-CURRENT-STATE.md](OPUS-CURRENT-STATE.md#다음-일--대기) | `b23e519d01b75740b660cd82c7c23dc840a6b07db0531c1e50009814bd833857` |
| 314–321 | 이 문서 관리 | [OPUS-CURRENT-STATE.md](OPUS-CURRENT-STATE.md#이-문서-관리) | `cb572d503095e2226dbc834041d1eff457084951105c62b3753a3cc651ff9533` |

원본 1–4행 제목·머리말은 OPUS-WORKFLOW의 “분리 전 머리말 · 보존 기록”에 그대로 보관했다. 옛 전체 필독 안내는 새 작업별 읽기 안내가 대체한다.

검사 결과: 14/14 H2 블록이 정확히 한 작업 파트에 원문 그대로 존재한다. 원문 머리말도 정확히 한 곳에 보존했다. 모든 원문 H2·H3 앵커는 허브의 명시적 앵커와 해당 파트 링크로 연결된다. 원본 상대 링크는 동일한 docs/ 단계에서 유지된다. 기존 링크가 가리키는 외부 파일의 존재 여부나 게임 동작을 이 텍스트 보존 검사로 검증했다고 주장하지 않는다.
