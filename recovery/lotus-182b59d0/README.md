# Lotus recovery transfer

Base: 2e8323ff3a4231bdc2b80f34b29ddab1f475d464
Original source target: 182b59d07384f179daa4c4dacc7adab5b096b23b
Archive SHA-256: c8612498cd722dfa28f4d8090ad9d243a1aa6f48b8b8857d9ec429738dcd12e1
Archive bytes: 24118264

This transfer branch preserves base runtime files and adds only this recovery folder. It is not a release and does not approve design or runtime changes. Do not merge into main/release. Original PNGs, fonts and included runtime patch sections are byte-preserved.

## Automated restoration in an authorized coding environment

1. Create a new working branch from this transfer branch. Confirm the worktree is clean and base runtime is still the commit listed above.
2. Concatenate parts in numeric filename order (000 through 046) into a temporary ZIP outside the repository. Verify each part against transfer-manifest.json and the combined SHA-256 above. Each part Git blob SHA was verified against the local source during transfer.
3. Open the ZIP, check ZIP CRC, extract its four files to a temporary directory outside the repository and verify its SHA256SUMS.json.
4. From the repository root, run git apply --check /absolute/path/to/changes.patch, then git apply --index /absolute/path/to/changes.patch.
5. Run git rm -- data/art/ui/bond/bond-ui-manifest.json. This reproduces the original legacy-manifest deletion without redistributing its private reference metadata in patch context.
6. Verify all 103 files in payload-sha256.json against the restored files. Validate every other changed path against the included patch and run the relevant repository checks before any new game edits.

Private auxiliary review documentation is intentionally omitted. Therefore the full original target tree hash is not expected to match; its private review file is absent and this branch has the recovery folder. The original patch's remaining 238 file sections are unchanged. This sanitized patch has not been applied locally during packaging; actual restoration and runtime checks must be completed in the authorized coding environment. No game code was executed or edited during this transfer.

The ZIP contains changes.patch, original font LICENSE.txt, RESTORE.txt and SHA256SUMS.json. Fonts total 18,563,000 bytes. Duplicate standalone asset copies were omitted because the binary patch includes them. Two PNGs retain original C2PA provenance; asset bytes were not modified.
