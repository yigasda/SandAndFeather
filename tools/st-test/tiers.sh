#!/bin/bash
# 검사 묶음(사용자 10-19: 작은 변경마다 전체 회귀를 다시 돌리지 않는다). 시험 서버(127.0.0.1:8000)에 코드를 복사한 뒤 고른 묶음만 돌린다.
#   1. 빠른 검사: quick — 바뀐 JS 문법 + 그 변경을 직접 보는 검사 하나(아래 묶음에서 한 파일만 이름으로 줘도 됨)
#   2. 관련 묶음: 변경이 닿는 묶음만 (예: 궁 그림 → ult, 타격 판정 → hit)
#   3. 병합 전: full — 모든 묶음
# 시험 서버 코드를 갈아 끼우므로 다른 검사가 도는 동안 실행하지 않는다.
# 실패는 그 검사 파일부터 다시 돌리고, 다른 검사는 그 수정이 결과를 바꾸는지 보고 다시 돌릴지 정한다. 통과 기준은 낮추지 않는다.
#   bash tools/st-test/tiers.sh <묶음|검사이름>... [--out DIR]
#   예: quick desert-ult (문법 + 직접 관련 검사 하나) / ult hit (관련 묶음) / full --since origin/main (병합 전)
#   문법 파일 0개 + 검사 이름 없음이면 exit 3(통과 아님).
# 결과: DIR/summary.txt에 시작 시각·기준 코드(커밋, 커밋 안 한 수정은 +수정해시)·검사한 문법 파일 수·검사별 통과/실패/초,
#   DIR/<검사>.log·캡처. 같은 시험 서버에 둘을 동시에 돌리지 않는다(잠금, 두 번째는 바로 멈춤).
# 절차 전체(언제 어느 묶음, 결과 재사용, 실패 재검사, 진단 반복): docs/OPUS-RELEASE-CHECKS.md 「작업·검수 절차」
# 묶음(대략 걸리는 시간):
#   ult    궁 규칙·영상 desert-ult(2분), 표시 크기·타격 범위 캡처 ult-fx-view(1분)
#   hit    타격·조준 desert-strike(2분) desert-target(5분) desert-horus-leap(1분) duat-field(1분)
#   mob    몹 행동·안전구역 desert-entry-safe(3.5분) desert-b3(1분) desert-mob-hits(2분)
#   input  버튼·조이스틱 pad-tabs(2분)
#   map    출입·착지·동행·저장 이관 portal-walk 연결별(--connections, --temple-*; 기본값은 옛 02↔T1W라 쓰지 않음, 각 1~3분)
#          desert-maps(1분) desert-save-move(1분)
#   ui     화면 verify-cozy-ui(0.5분) verify-ui-themes(1분) verify-full-map(옴보스 낮밤·이동)
#   art    그림·메모리 desert-boss-view(0.5분) ult-memory(1.5분)
#   full   위 전부(약 30분) — 병합 전에만
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
EXT=/home/user/sillytavern/sillytavern/data/default-user/extensions/SandAndFeather
OUT=${OUT:-/tmp/st-tiers}
BASE=HEAD   # --since <커밋>: 그 커밋 이후 바뀐 JS의 문법을 본다(커밋까지 한 변경도 포함)
declare -A G=(
  [ult]="desert-ult ult-fx-view" [hit]="desert-strike desert-target desert-horus-leap duat-field"
  [mob]="desert-entry-safe desert-b3 desert-mob-hits" [input]="pad-tabs" [map]="portal-walk:--connections portal-walk:--temple-02-15 portal-walk:--temple-15-w portal-walk:--temple-15-t2 portal-walk:--temple-t2-e portal-walk:--temple-t2-t3 portal-walk:--temple-02-11 portal-walk:--temple-w-e portal-walk:--temple-t2-11 portal-walk:--temple-e-17 portal-walk:--city-dwelling portal-walk:--pair-file,docs/art/map-expansion/desert-connections-review/sanctuary-validated/pair.json desert-maps desert-save-move"
  [ui]="verify-cozy-ui verify-ui-themes verify-full-map" [art]="desert-boss-view ult-memory"
)
G[full]="${G[ult]} ${G[hit]} ${G[mob]} ${G[input]} ${G[map]} ${G[ui]} ${G[art]}"
want=()
while [ $# -gt 0 ]; do
  case $1 in --out) OUT=$2; shift ;; --since) BASE=$2; shift ;; quick) ;; *) if [ -n "${G[$1]}" ]; then want+=(${G[$1]}); else want+=("$1"); fi ;; esac
  shift
done
export NODE_PATH=${NODE_PATH:-/opt/node-tools/node_modules}
mkdir -p "$OUT"
# one run at a time on the one test server: a second waits for none, it stops (the server's copy would be swapped under the first)
exec 9> /tmp/st-tiers.lock
flock -n 9 || { echo "다른 검사가 시험 서버를 쓰는 중 — 끝난 뒤 다시 실행 (/tmp/st-tiers.lock)"; exit 2; }
# which code this is: the commit and, if the tree is not clean, a hash of the uncommitted change (to tell results apart)
code() { (cd "$ROOT" && echo "$(git rev-parse --short HEAD)$(git diff HEAD --quiet || echo "+수정$(git diff HEAD | sha1sum | cut -c1-7)")"); }
C0=$(code)
echo "== $(date '+%F %T') 기준 코드 $C0 · 검사: ${want[*]:-문법만}" | tee -a "$OUT/summary.txt"
# 1. syntax of every JS file changed against the commit or new; how many were really checked (0 is not a pass)
n=0
for f in $(cd "$ROOT" && { git diff --name-only "$BASE" -- '*.js' '*.cjs'; git ls-files --others --exclude-standard -- '*.js' '*.cjs'; } | sort -u); do
  [ -f "$ROOT/$f" ] || continue
  case $f in *.cjs) node --check "$ROOT/$f" ;; *) node --experimental-default-type=module --check "$ROOT/$f" ;; esac || { echo "문법 오류 $f" | tee -a "$OUT/summary.txt"; exit 1; }
  n=$((n + 1))
done
B=$(cd "$ROOT" && git rev-parse --short "$BASE")
if [ $n -eq 0 ]; then echo "문법: 검사한 파일 0개 — 통과 아님, 검사 안 함 ($B 이후 바뀐 JS 없음; 이미 커밋한 변경은 --since <커밋>)" | tee -a "$OUT/summary.txt"
else echo "문법: $B 이후 바뀐 JS $n개 통과" | tee -a "$OUT/summary.txt"; fi
# nothing checked and no test named: not a pass (exit 3)
[ ${#want[@]} -eq 0 ] && exit $([ $n -eq 0 ] && echo 3 || echo 0)
# the code onto the test server (the 궁 size candidates rebuilt for ult-memory / ult-fx-view)
rm -rf "$EXT/src" "$EXT/data" && cp -r "$ROOT/src" "$ROOT/data" "$EXT/" && cp "$ROOT/style.css" "$ROOT/index.js" "$ROOT/manifest.json" "$EXT/"
case " ${want[*]} " in *" ult-memory "*|*" ult-fx-view "*) python3 "$ROOT/tools/art/ult-fx-candidates.py" "$EXT/data" > /dev/null ;; esac
bad=0
for t in "${want[@]}"; do
  # name:--flag,--flag → the script with those flags (portal-walk's connection sets)
  n=${t%%:*}; args=(); [ "$n" != "$t" ] && IFS=',' read -ra args <<< "${t#*:}"; t=${t//[:,/.]/_}
  f=$ROOT/tools/st-test/$n.cjs; [ -f "$f" ] || f=$ROOT/tools/st-test/$n.js; [ -f "$f" ] || f=$ROOT/tools/art/$n.cjs
  s=$(date +%s); (cd "$ROOT" && timeout 2400 node "$f" "$OUT/$t" "${args[@]}" > "$OUT/$t.log" 2>&1); e=$?
  printf '%-20s exit %s  통과 %s 실패 %s  %ss\n' "$t" "$e" "$(grep -c '^통과\|^PASS' "$OUT/$t.log")" "$(grep -c '^실패\|^FAIL' "$OUT/$t.log")" "$(( $(date +%s) - s ))" | tee -a "$OUT/summary.txt"
  [ $e -ne 0 ] && bad=1
done
C1=$(code)
[ "$C0" != "$C1" ] && echo "주의: 검사 도중 코드가 바뀜 ($C0 → $C1). 위 결과는 시작 때 복사한 $C0 기준이다." | tee -a "$OUT/summary.txt"
exit $bad
