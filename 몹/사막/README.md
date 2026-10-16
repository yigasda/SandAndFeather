# 사막 채택 몹 — 개별 모션 PNG

일반몹 8종 + 4대 수문장 4종, 각 10장으로 총 **120장**. 채택 원본 시트에서 추출한 투명 RGBA PNG다.

원본 해상도·색·알파를 유지하며 재생성·확대·축소하지 않았다. 몹별 10장은 같은 캔버스를 사용한다. 각 manifest에 원본 경로·SHA-256·추출 좌표·파일 해시가 있다. 분리된 픽셀을 원본 좌표로 되돌려 모든 가시 RGBA가 일치하는지 검증했다.

| 폴더 | 원본 시트 |
|---|---|
| [01_봉인항아리](01_봉인항아리/) | [원본](../../docs/art/desert-sealed-jar-sheet-2026-10-16/sheet.png) |
| [02_가죽방패병](02_가죽방패병/) | [원본](../../docs/art/desert-leather-shield-motion-2026-10-16/sheet.png) |
| [03_봉인방패병](03_봉인방패병/) | [원본](../../docs/art/desert-sealed-shield-motion-2026-10-16/sheet.png) |
| [04_걸음비석](04_걸음비석/) | [원본](../../docs/art/desert-sandstone-stela-approved-2026-10-16/sheet.png) |
| [05_태양거울](05_태양거울/) | [원본](../../docs/art/desert-sun-mirror-unified-motion-2026-10-16/sheet.png) |
| [06_천칭파수꾼](06_천칭파수꾼/) | [원본](../../docs/art/desert-balance-sentinel-color-unified-2026-10-16/sheet.png) |
| [07_빈가면사제_장막형](07_빈가면사제_장막형/) | [원본](../../docs/art/desert-mask-priest-mantle-motion-2026-10-16/sheet.png) |
| [08_빈가면사제_수의형](08_빈가면사제_수의형/) | [원본](../../docs/art/desert-mask-priest-shroud-motion-2026-10-16/sheet.png) |
| [09_왕면수문장](09_왕면수문장/) | [원본](../../docs/art/desert-royal-sarcophagus-boss-motion-2026-10-16/sheet.png) |
| [10_신전수문장](10_신전수문장/) | [원본](../../docs/art/desert-temple-gate-boss-motion-2026-10-16/sheet.png) |
| [11_왕좌수문장](11_왕좌수문장/) | [원본](../../docs/art/desert-throne-tomb-boss-motion-2026-10-16/sheet.png) |
| [12_파릉수문장](12_파릉수문장/) | [원본](../../docs/art/desert-broken-vault-boss-motion-2026-10-16/sheet.png) |

## 파일 순서

`00_idle_0` · `01_idle_1` · `02_idle_2` / `03_guard`(항아리는 `dormant`) / `04_prepare_0` / `05_prepare_1` / `06_공격_0` · `07_공격_1` / `08_hit` / `09_defeat`.

공격명은 몹에 따라 attack, charge, slam, light_attack, seal_cast, punch_slam, crush, earth_press, grasp를 사용한다.

[태양거울 별도 광선 PNG](../../docs/art/desert-sun-mirror-motion-revisions-2026-10-16/beam.png) · [외형·실제 프롬프트](../../docs/ASTRA-MOB.md)

게임 적용은 별도다. 캔버스는 원본 시트 배치를 기준으로 정리했으며 runtimePivot은 미설정이다. 보스의 일반몹 대비 2.5배 목표는 게임 표시 배율로 조정한다.
