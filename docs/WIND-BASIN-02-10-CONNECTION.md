# 02 outer path / 10 wind basin connection

Base: archive feature commit `c593e326fb3e26e939dd95aa737b7d52d9fc2729`. Separate branch `fix/wind-basin-02-10-20261022`; no main/release publication or version change.

## Source-backed scope

- `OPUS-DESERT-MAPS.md` lists 02 ↔ 10; the current generator explicitly reserved 02's right side for 10.
- The adopted 10 candidate describes a broad lower-left return gap. Its main art guide requires a stable 02 return independent of the 20 discovery state.
- Only the outer-ground connection is added. The 02 small stone door still leads to 11, its temple door still leads to 15, and the west edge still leads to 03. Their full existing runtime records and the original 02 floor are preserved exactly.
- 10's stone stairs remain inactive. Discovery, wind effects, monsters, 10 ↔ 20 and T3's north gate are outside this change.

## Measured source-pixel geometry

Both original images are 1774 × 887. Their original collision PNGs are used unchanged, with no runtime floor additions.

| Place | Exit polygon | Arrival feet | Facing |
|---|---|---|---|
| 02 lower-right outer path | (1760,785), (1773,785), (1773,886), (1760,886) | (1689,850), on the paving | left |
| 10 lower-left sandy gap | (3,443), (24,443), (24,566), (3,566) | (210,594), along the gap's center | right |

The initial 02 overlay used x1754 for the inner threshold edge. The final depth uses x1760, the existing big-map edge convention, without shrinking the usable vertical width or moving the paving landing. This retains the generator's existing three-actor-width safety gap (71 px versus 70.85 px required), rather than weakening its assertion.

10 inherits existing detail-map values: 52/1.55 source pixels per tile, camera 0.8, actor 1.4, walkSpeed 1.6. 02 retains its existing big-map values. No approved proportion is retuned.

Original SHA-256:
- 02 art: `8e8e2dc22bbad1dc4afb9e206d424f0b787798cc9cb24b270c521ac67c679d13`
- 02 mask: `2414c66d1313151e1ea47509fa80fdefd886703296a371007ce9ba1a86ab1aee`
- 10 art: `02254c2ec30e9c845a70aef6e2365b5ed4046dff94e4d9ee34d186d134b819e6`
- 10 mask: `85aed5e5dd6b185a57918663b4e01f0288b54440ee5d81c89c7ede828487bb44`

## Verification contract

```sh
python tools/maps/desert.py --review-only desert_buried_temple desert_wind_basin
python tools/maps/check-wind-basin-connection.py
python tools/maps/check-archive-connection.py
node tools/st-test/portal-walk.cjs /tmp/st-wind-basin-02-10 --pair-file tools/st-test/pairs/wind-basin-02-10.json --widths --independent-tiles 1.7472
node tools/st-test/portal-walk.cjs /tmp/st-wind-adjacent-02-15 --temple-02-15
node tools/st-test/portal-walk.cjs /tmp/st-wind-adjacent-02-11 --temple-02-11
```

The new pair runs three lanes in both directions, held/neutral input, exact first-frame arrival, independent short walks, companion safety, deliberate return and save/reload in the newly registered basin. The two existing 02 door routes receive focused unchanged-harness regression; the strict checker also compares every old 02 record and every old scene. No test precision or controller is changed.

## Verified runtime result (2026-10-22)

- [Focused CI run 39746555721](https://github.com/yigasda/SandAndFeather/actions/runs/39746555721): generation, both strict invariant checkers, and changed-JS syntax passed. Official SillyTavern was pinned to `06bde939fb1e9c4c8d8641d810f0a916b5bce127`; only an isolated test save was used.
- New 02 ↔ 10: **130 passed / 0 failed**, six continuous transitions across three lanes in both directions, 119 seconds. Existing 02 ↔ 15 and 02 ↔ 11: **60 passed / 0 failed each**, 58 and 62 seconds. Total: **250 passed / 0 failed**.
- All 24 independent 1.7472-tile excursions reached 1.7367–1.7393 tiles, with no collision-blocked substitutions. The unchanged target tolerance passed; no controller timing or precision was relaxed.
- Initial companion separation was 1.44 tiles on 02 and 1.26 tiles on 10, on all six arrivals. Full-foot floor, companion-outside-trigger, held/neutral input, intentional return and exact synchronous first-frame landing assertions passed.
- Save/reload remained in `desert_wind_basin` near (7.4971,16.9058), within 0.05 tile of the saved position and outside its trigger.
- Settled arrival and reload screenshots were visually inspected, including both unchanged 02 doorway routes. All three videos decode completely. Sampled frames across the new route's 133.72-second recording show the intended paved edge and sandy return gap with no new collision or foreground-clipping defect.

The run used source `ccf7d3dcb7e26f89c73e3a220e85f6918b33a1aa` plus its generated outputs. Those exact four outputs were imported at **`c213224d865466a0252bc94bdc72785192e760a7`**. All four remote Git blob IDs match the reviewed artifact. The existing adopted PNG blob was reused without re-encoding.

All three walks had the same start/end runtime-and-test SHA-256 over 125 files:
`3f81c4f174d7c9694adc8dcd4787a7714101ea5138d76bdaf54d8d035c53a8be`.

| Generated path | SHA-256 |
|---|---|
| data/maps/desert_buried_temple.json | `60c2b41501f9c77f0f47a0beb05752e7989d698cea0e6bc9bed577433a760060` |
| data/maps/desert_wind_basin.json | `9e807f1068f9431a4d0762e8479961d6363cca7b292cb691de1709bef6ce09fa` |
| data/scene-art.json | `8db4131089fe686788bde03084bdb9e0d05759fc0a444253bbbde818ba46b74e` |
| docs/art/map-expansion/desert-10.png | `02254c2ec30e9c845a70aef6e2365b5ed4046dff94e4d9ee34d186d134b819e6` |

[Final reproduction run 39749836791](https://github.com/yigasda/SandAndFeather/actions/runs/39749836791) passed on `c213224d865466a0252bc94bdc72785192e760a7`: regeneration changed no committed runtime/art outputs, both invariant checkers passed, and the 125-file runtime/test hash above matched before and after. The already-passed walks were not repeated. This feature branch includes the completed 17 ↔ 18 archive work, but neither branch has been merged or released. No new PR or version change was made. 10 ↔ 20/discovery/wind/monsters and T3 north-gate conditions remain deliberately deferred.

