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
`node tools/st-test/portal-walk.cjs --pair-file tools/st-test/pairs/archive-17-18.json --widths --independent-tiles 1.7472`

The existing real-CDP timing fix and 0.02-tile precision are unchanged.
The pair order ends in the archive so save/reload exercises the newly registered map.
Runtime capture must verify exact initial feet, follower clearance, input neutrality/no bounce, three doorway lanes, intentional return and save/load.
Generated data, screenshots and actual-walk results are pending CI; do not describe this branch as validated or released until those results are recorded.
