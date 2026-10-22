# 17 광장 ↔ 18 옛 기록고: bounded doorway implementation

Base: main `35b8f3d4caf41c28878ab0e57818d345c5f299ce`. Work branch only, not a release.

This completes the already approved right-house branch, not a new map or a new temple route.
T1E ↔ 17, the dwelling, and the 02 → 15 → T2 → 11 → 02 loop are unchanged.
T3 → 16 remains pending its separate north-door opening decision.

## Source-pixel measurements

- Approved archive art: `사막맵/18_옛기록고.png`, SHA-256 `9b94310e04a93a9dc9e1230ed51e073d6cfc4611c3ce4b2967a48b252509d1ab`.
- Original collision PNG is unchanged, SHA-256 `84975e2b0aea877d62af70ffec5ab0fa2ba5be9160f369931576e008e9f43d32`.
- At alpha >=128, the room and the doorway/exterior were disconnected by the overhead wooden lintel.
- Runtime-only half-open rectangle [779,627,993,663) adds exactly 7,013 floor pixels. Posts remain solid.
- The foreground redraw is only the measured wooden beam x744..1028/y627..662, foot line802. It does not redraw the open doorway or floor.
- Archive south threshold: [(779,782),(993,782),(993,802),(779,802)]. Landing feet center (887,590), facing up, on the entry continuation just inside the beam.
- Plaza right-house threshold: [(1228,300),(1333,300),(1333,315),(1220,315)]. Landing (1278,415), facing down on clear paving. The polygon follows the original floor's perspective.
- Existing scale, camera, speed, touch handling, companion logic and all previously validated portals are unchanged.

## Verification

Run the generator, bounded pixel/geometry assertions, then actual mobile touch widths:
`python tools/maps/desert.py --review-only desert_city_archive desert_city_plaza`
`python tools/maps/check-archive-connection.py`
`node tools/st-test/portal-walk.cjs /tmp/st-archive-17-18 --pair-file tools/st-test/pairs/archive-17-18.json --widths --independent-tiles 1.7472`

The existing real-CDP timing fix and 0.02-tile precision are unchanged.
The pair order ends in the archive so save/reload exercises the newly registered map.
Runtime capture must verify exact initial feet, follower clearance, input neutrality/no bounce, three doorway lanes, intentional return and save/load.
## Verified result (2026-10-22)

- Tested runtime commit: `87eaf760017d59386cb4052f1b43a73219d76114`.
- [Targeted GitHub Actions run](https://github.com/yigasda/SandAndFeather/actions/runs/39742290516): success. Generator reproduction of the four committed runtime files is exact; strengthened pixel/portal invariants pass; one changed JS file passes module-mode syntax checking.
- Actual mobile touch walk: **130 pass / 0 fail in 117 seconds**, exactly six transitions across left/center/right lanes in both directions. The existing 0.02-tile precision, held-input/neutral lifecycle and all assertions are unchanged.
- First-frame positions match each destination entry. Every first arrival retains a companion separation of 1.26 tiles. All six post-excursion full-foot checks pass for player and companion, outside exit triggers.
- Independent front/back/left/right excursions target 1.7472 tiles from the same landing, with real walks back to the origin. Intentional return works; no bounce or unintended extra transition occurs.
- Save/reload ends in `desert_city_archive`, around (27.68,16.79), within the test's 0.05-tile position tolerance and outside the trigger. The final screenshot shows both characters standing separately on clear floor.
- The full 131.48-second video decodes normally. Settled arrival/reload screenshots and sampled motion frames were visually checked: the player passes beneath the actual wooden beam in both directions; only the beam silhouette occludes the body. No doorway clipping or wrong landing was observed.
- Runtime/map/test SHA-256 stayed `12cbb4364aae290bf453e315d887b80ee3ddcdb81ddec084d1c48a8801f12212` from start to finish (124 files).
- Evidence artifact: ID `12409129355`, SHA-256 `cf8777cce35f6c9ee364d9af4dca67ac2beffeab4c8b9994843a9802bcf7102d`. Contains generated-file hashes, invariants, six transition records, screenshots, full video and result logs.

The first run exhausted its job time because a redundant full-history Git fetch took about 13 minutes, not because of map generation or a failed game assertion. Its 84 recorded assertions passed before interruption. The successful run used known shallow ancestry and the explicit baseline SHA, without relaxing tests.

**Handoff:** feature branch `fix/archive-17-18-doorway-20261022` only. Main/release were not modified, no version was bumped and no new PR was opened. This route is functionally verified, not published. The existing temple loops and dwelling route remain untouched; T3 → 16 still needs its independent north-door opening decision.
