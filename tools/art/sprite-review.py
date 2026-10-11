# One review for a new pose delivery: every check at once, one report.
#
#   python3 tools/art/sprite-review.py <동작 폴더 or png들> --out <폴더> [--no-head]
#
# Takes the folder's png/ (or the pictures given), named <who>-<view>[-<seat or kind>]-<frame>.png or
# <who>-sleep[-side]-<frame>.png, and runs:
#   피부색      skin-check.py — base, shadow and light tones against the same direction's final idle and walk
#   동작        action-check.py — head size (head match), height per frame, frame 0 as a way in, outline change
#               between frames, body drifting to one side (front/back)
#   0↔1        onion.py — the frames laid on each other: the outline must move, not only the inside
#   좌우        onion.py — the left view against the flipped right view of the same pose (arms, hands, legs: by eye)
#   기준 그림    onion.py — each picture on the approved reference of the same action (REFERENCES) at their anchors
#   머리        head-check.py — lying pictures: the idle head's outline laid on the drawing (by eye)
# and writes <out>/report.md: 볼 것 at the top, then one line per character and pose with the sheets beside it.
# Every line is a hint to look at; "볼 것 없음" is not a pass and the sheets are what to judge by.
#
# The single scripts still work alone; this only calls them.
import argparse, glob, importlib.util, json, os, re
from collections import defaultdict

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, '..', '..')
ART = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh')


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(HERE, name + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m


skin, action, onion, headc = load('skin-check'), load('action-check'), load('onion'), load('head-check')

# the approved picture each new one of the same action is laid on: action → (file, anchor); {view} is filled in
REFERENCES = {
    'pickup': (os.path.join(ART, 'pickup-somang-v178', 'png', 'somang-{view}-1.png'), (310, 662)),
    'sleep': (os.path.join(ART, 'sleep-somang-v180', 'png', 'somang-sleep-0.png'), (310, 450)),
    'sit': (os.path.join(ART, 'sit-somang-v179', 'png', 'somang-left-0.png'), (330, 642)),
    'interact': (os.path.join(ART, 'interaction-somang-v172', 'png', 'somang-{view}-1.png'), (310, 662)),
}
# poses that lean by design (a curled sleeper): no 몸 쏠림 line
CURLED = {('somang', 'sleep')}
NAME = re.compile(r'(set|somang|horus)-([a-z-]+?)-(\d+)\.png$')
VIEWS = ('front', 'back', 'left', 'right')


def anchors(folder):
    """file name → anchor from the folder's manifest (per file, else the manifest's), feet by default"""
    out, man = {}, os.path.join(folder, 'manifest.json')
    if os.path.exists(man):
        m = json.load(open(man))
        top = (m.get('anchor') or {}).get('position')
        for f in m.get('files', []):
            a = (f.get('anchor') or {}).get('position') or top
            if a: out[os.path.basename(f['path'])] = tuple(a)
        out['_action'] = m.get('action', '')
    return out


def action_of(folder, names):
    a = anchors(folder).get('_action') or os.path.basename(os.path.normpath(folder))
    for k in REFERENCES:
        if a.startswith(k) or k in a: return k
    if any('sleep' in n for n in names): return 'sleep'
    return ''


def label(s):
    for k, ko in (('-action', '동작'), ('-onion-', '0↔1'), ('-mirror-', '좌우'), ('-reference', '기준'), ('-head', '머리')):
        if k in s: return ko
    return s


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src', nargs='+'); ap.add_argument('--out', required=True)
    ap.add_argument('--no-head', action='store_true', help='누운 그림의 머리 겹침을 건너뛴다(오래 걸림)')
    o = ap.parse_args()
    pngs, folder = [], None
    for s in o.src:
        if os.path.isdir(s):
            folder = s
            pngs += sorted(glob.glob(os.path.join(s, 'png', '*.png')) or glob.glob(os.path.join(s, '*.png')))
        else:
            pngs.append(s); folder = folder or os.path.dirname(os.path.dirname(os.path.abspath(s)))
    os.makedirs(o.out, exist_ok=True)
    anc = anchors(folder) if folder else {}
    act = action_of(folder or '.', [os.path.basename(p) for p in pngs])
    groups = defaultdict(list)
    for p in pngs:
        m = NAME.match(os.path.basename(p))
        if m: groups[(m.group(1), m.group(2))].append((int(m.group(3)), p))
    look, lines, skins = [], [], []

    # 피부색
    for p in pngs:
        m = NAME.match(os.path.basename(p))
        if not m: continue
        view = next((v for v in m.group(2).split('-') if v in VIEWS), 'all')
        r = skin.check(p, m.group(1), view, os.path.join(o.out, 'skin'))
        skins.append(r)
        if r['verdict'] != '같음': look.append(f"피부색 {r['file']}: {r['verdict']}")

    for (who, key), fr in sorted(groups.items()):
        fr.sort()
        view = next((v for v in key.split('-') if v in VIEWS), 'front')
        lying, side = 'sleep' in key, 'side' in key
        sheets = []
        # 동작
        r = action.check(who, view, fr, lying=lying, side=side or (who, key) in CURLED); r['key'] = key
        action.sheet(r, fr, o.out); sheets.append(f'{who}-{key}-action.png')
        notes = list(r['notes'])
        # 0↔1
        for (k1, p1), (k2, p2) in zip(fr, fr[1:]):
            name = f'{who}-{key}-onion-{k1}{k2}.png'
            c = onion.compare(p1, p2, os.path.join(o.out, name), anchor_a=anc.get(os.path.basename(p1), (310, 662)), anchor_b=anc.get(os.path.basename(p2)))
            sheets.append(name)
            if c['sameOutline'] and not any('외곽선 같음' in n for n in notes): notes.append(f'{k1}→{k2}: 외곽선 같음 (윤곽 {c["silhouette"]:.1%})')
        # 좌우: this left view against the flipped right view of the same pose
        if 'left' in key.split('-'):
            rk = key.replace('left', 'right')
            other = dict(groups.get((who, rk), []))
            for k, p in fr:
                if k in other:
                    name = f'{who}-{key}-mirror-{k}.png'
                    onion.compare(p, other[k], os.path.join(o.out, name), flip_b=True,
                                  anchor_a=anc.get(os.path.basename(p), (310, 662)), anchor_b=anc.get(os.path.basename(other[k])))
                    sheets.append(name)
        # 기준 그림
        if act in REFERENCES:
            ref, ra = REFERENCES[act]
            ref = ref.format(view=view)
            # a reference drawn in one direction only (sitting: Somang facing left) is laid on that direction only
            if '{view}' not in REFERENCES[act][0] and act == 'sit' and view != 'left': ref = ''
            if ref and os.path.exists(ref) and os.path.abspath(ref) != os.path.abspath(fr[-1][1]):
                k, p = fr[-1]
                name = f'{who}-{key}-reference.png'
                onion.compare(ref, p, os.path.join(o.out, name), anchor_a=ra, anchor_b=anc.get(os.path.basename(p), ra))
                sheets.append(name)
        # 머리 (누운 그림)
        if lying and not o.no_head:
            k, p = fr[0]
            hr = headc.find(__import__('PIL.Image', fromlist=['Image']).open(p).convert('RGBA'), who, 'right' if side else 'front', lying=True)
            hr['verdict'] = headc.verdict(hr)
            headc.sheet(p, who, 'right' if side else 'front', hr, o.out)
            sheets.append(os.path.splitext(os.path.basename(p))[0] + '-head.png')
        verdict = '볼 것 없음' if not notes else ' · '.join(notes)
        if notes: look += [f'{who} {key} — {n}' for n in notes]
        heights = ' / '.join(f"{x['frame']}: 키 {x['height']:.0%}" + ('' if lying else f" 머리 ×{x['head']:.2f}") for x in r['frames'])
        if lying: heights += ' (누운 그림: 머리는 머리 시트로)'
        lines.append(f"| {who} {key} | {heights} | {verdict} | " + ' · '.join(f'[{label(s)}]({s})' for s in sheets) + ' |')
        print(f'{who} {key}: {verdict}')

    rep = [f'# 스프라이트 검토 — {os.path.basename(os.path.normpath(folder)) if folder else ""}', '',
           f'기준 그림: {act or "없음"} · 그림 {len(pngs)}장', '',
           f'## 볼 것 {len(look)}개', ''] + ([f'- {x}' for x in look] or ['- 없음 (숫자로 걸린 것만 없다는 뜻이다. 시트를 직접 본다)']) + [
           '', '## 캐릭터·자세별', '', '| 그림 | 프레임별 키·머리 맞춤 | 판정 | 시트 |', '|---|---|---|---|'] + lines + [
           '', '## 피부색', '', '| 파일 | 판정 | 기본 / 그림자 / 밝은 쪽 ΔE |', '|---|---|---|'] + [
           f"| {r['file']} | {r['verdict']} | " + (' / '.join(str(r['toneDeltaE'][k]) for k in ('base', 'shadow', 'light')) if 'toneDeltaE' in r else '') + ' |' for r in skins] + [
           '', '시트 읽는 법: action = 정지 | 0 | 1(파란 선 = 발 기준선), onion = 겹친 윤곽(빨강 A, 파랑 B) · 바뀐 픽셀 · 윤곽만 다른 곳, '
           'mirror = 왼쪽과 뒤집은 오른쪽(팔 길이·손 크기), reference = 채택된 기준 그림과 겹침(구도·원근·머리 위치), head = 정지 머리 윤곽(빨강).',
           '머리 맞춤 ×1.00 = 정지와 같은 크기. 채택된 쪼그린·앉은 그림도 ×1.03~1.11로 재진다.']
    open(os.path.join(o.out, 'report.md'), 'w').write('\n'.join(rep) + '\n')
    print('→', os.path.join(o.out, 'report.md'), f'· 볼 것 {len(look)}개')


if __name__ == '__main__':
    main()
