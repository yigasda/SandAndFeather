#!/bin/bash
# 검사 묶음(사용자 10-19: 작은 변경마다 전체 회귀를 다시 돌리지 않는다). 시험 서버(127.0.0.1:8000)에 코드를 복사한 뒤 고른 묶음만 돌린다.
#   1. 빠른 검사: quick — 바뀐 JS 문법 + 그 변경을 직접 보는 검사 하나(아래 묶음에서 한 파일만 이름으로 줘도 됨)
#   2. 관련 묶음: 변경이 닿는 묶음만 (예: 궁 그림 → ult, 타격 판정 → hit)
#   3. 병합 전: full — 모든 묶음
# 시험 서버 코드를 갈아 끼우므로 다른 검사가 도는 동안 실행하지 않는다.
# 실패는 그 검사 파일부터 다시 돌리고, 다른 검사는 그 수정이 결과를 바꾸는지 보고 다시 돌릴지 정한다. 통과 기준은 낮추지 않는다.
#   bash tools/st-test/tiers.sh <묶음|검사이름>... [--out DIR]
# 묶음(대략 걸리는 시간):
#   ult    궁 규칙·영상 desert-ult(2분), 표시 크기·타격 범위 캡처 ult-fx-view(1분)
#   hit    타격·조준 desert-strike(2분) desert-target(5분) desert-horus-leap(1분) duat-field(1분)
#   mob    몹 행동·안전구역 desert-entry-safe(3.5분) desert-b3(1분) desert-mob-hits(2분)
#   input  버튼·조이스틱 pad-tabs(2분)
#   map    출입·착지·동행 portal-walk(1분) desert-maps(1분)
#   ui     화면 verify-cozy-ui(0.5분) verify-ui-themes(1분)
#   art    그림·메모리 desert-boss-view(0.5분) ult-memory(1.5분)
#   full   위 전부(약 30분) — 병합 전에만
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
EXT=/home/user/sillytavern/sillytavern/data/default-user/extensions/SandAndFeather
OUT=${OUT:-/tmp/st-tiers}
declare -A G=(
  [ult]="desert-ult ult-fx-view" [hit]="desert-strike desert-target desert-horus-leap duat-field"
  [mob]="desert-entry-safe desert-b3 desert-mob-hits" [input]="pad-tabs" [map]="portal-walk desert-maps"
  [ui]="verify-cozy-ui verify-ui-themes" [art]="desert-boss-view ult-memory"
)
G[full]="${G[ult]} ${G[hit]} ${G[mob]} ${G[input]} ${G[map]} ${G[ui]} ${G[art]}"
want=()
while [ $# -gt 0 ]; do
  case $1 in --out) OUT=$2; shift ;; quick) ;; *) if [ -n "${G[$1]}" ]; then want+=(${G[$1]}); else want+=("$1"); fi ;; esac
  shift
done
export NODE_PATH=${NODE_PATH:-/opt/node-tools/node_modules}
mkdir -p "$OUT"
# 1. syntax of every changed or new JS file
for f in $(cd "$ROOT" && git diff --name-only HEAD -- '*.js' '*.cjs'; git ls-files --others --exclude-standard -- '*.js' '*.cjs'); do
  case $f in *.cjs) node --check "$ROOT/$f" ;; *) node --experimental-default-type=module --check "$ROOT/$f" ;; esac || { echo "문법 오류 $f"; exit 1; }
done
[ ${#want[@]} -eq 0 ] && { echo "문법 통과 (검사 묶음 없음)"; exit 0; }
# the code onto the test server (the 궁 size candidates rebuilt for ult-memory / ult-fx-view)
rm -rf "$EXT/src" "$EXT/data" && cp -r "$ROOT/src" "$ROOT/data" "$EXT/" && cp "$ROOT/style.css" "$ROOT/index.js" "$ROOT/manifest.json" "$EXT/"
case " ${want[*]} " in *" ult-memory "*|*" ult-fx-view "*) python3 "$ROOT/tools/art/ult-fx-candidates.py" "$EXT/data" > /dev/null ;; esac
bad=0
for t in "${want[@]}"; do
  f=$ROOT/tools/st-test/$t.cjs; [ -f "$f" ] || f=$ROOT/tools/st-test/$t.js; [ -f "$f" ] || f=$ROOT/tools/art/$t.cjs
  s=$(date +%s); (cd "$ROOT" && timeout 2400 node "$f" "$OUT/$t" > "$OUT/$t.log" 2>&1); e=$?
  printf '%-20s exit %s  통과 %s 실패 %s  %ss\n' "$t" "$e" "$(grep -c '^통과\|^PASS' "$OUT/$t.log")" "$(grep -c '^실패\|^FAIL' "$OUT/$t.log")" "$(( $(date +%s) - s ))" | tee -a "$OUT/summary.txt"
  [ $e -ne 0 ] && bad=1
done
exit $bad
