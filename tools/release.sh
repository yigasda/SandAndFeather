#!/bin/sh
# Build the `release` branch: only what SillyTavern runs (index.js, style.css, manifest.json, src/, data/ and the
# pictures data/*.json point to in docs/). Users install the extension from this branch, so SillyTavern's install
# and auto update (git pull on every start) move ~40 MB instead of the whole art history (GBs).
#   sh tools/release.sh            # commit a new snapshot on top of the local `release` branch
#   git push origin release        # then publish it
set -e
cd "$(dirname "$0")/.."
SRC=$(git rev-parse HEAD)
TMP=$(mktemp -d)
# runtime files tracked in git
git ls-files index.js style.css manifest.json README.md src data > "$TMP/list"
# pictures in docs/ that data/*.json refers to ("../docs/...")
grep -rhoE '"\.\./docs/[^"]+"' data | tr -d '"' | sed 's#^\.\./##' | sort -u > "$TMP/docs"
while read -r f; do git ls-files --error-unmatch "$f" >/dev/null 2>&1 || { echo "missing in git: $f" >&2; exit 1; }; done < "$TMP/docs"
cat "$TMP/docs" >> "$TMP/list"
# a separate index, so the working tree and main are left alone
export GIT_INDEX_FILE="$TMP/index"
git read-tree --empty
xargs -a "$TMP/list" -d '\n' git update-index --add --
TREE=$(git write-tree)
unset GIT_INDEX_FILE
VER=$(sed -n 's/.*"version": "\(.*\)".*/\1/p' manifest.json)
if git rev-parse -q --verify refs/heads/release >/dev/null; then
    [ "$(git rev-parse release^{tree})" = "$TREE" ] && { echo "release is already $VER"; rm -rf "$TMP"; exit 0; }
    C=$(git commit-tree "$TREE" -p release -m "release $VER (main $SRC)")
else
    C=$(git commit-tree "$TREE" -m "release $VER (main $SRC)")
fi
git update-ref refs/heads/release "$C"
echo "release $VER: $(wc -l < "$TMP/list") files"
rm -rf "$TMP"
