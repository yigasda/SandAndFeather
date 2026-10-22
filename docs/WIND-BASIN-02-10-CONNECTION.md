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

Source-pixel planning checks pass. Generated runtime assets and actual walking are pending CI; this is not yet a validated or published route.
