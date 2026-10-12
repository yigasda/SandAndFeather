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
#   이어 보기    the final walk 0·1·2, the idle, the new frames and the idle again side by side at one scale (feet line
#               drawn), and the same as a GIF at game size and at full size: do the proportions and the motion carry on
#               from walking and standing without a jump? (by eye; sleeping is special, look only)
#   머리색      the hair's dark, middle and light tones against the same direction's final idle and walk (the closest
#               one), ΔE: up to 3 같음, up to 6 조금 다름, beyond 다름 (Set front sleep 193 measured 7.7, its walk 0.4)
#   새로 그림    frame 1 made from frame 0 (copied, then stretched, shifted or recoloured) instead of drawn again: the share
#               of the figure's pixels identical in both (best of small shifts). Over 50 % is a copied frame (sleep
#               194/195: 67-83 %); frames drawn separately share under 30 % (sleep 191: 21-27 %, pickup 182: 6-12 %).
#               Not for actions where only a hand or foot moves (HAND_ONLY: interact)
#   붙여넣기     poses that are not standing: is the final idle's head pasted in unchanged (90 %+ of its pixels
#               identical) instead of drawn for the pose? Drawn heads score under 20 %.
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
# actions where only a hand or foot moves between frames: the rest of the body may stay pixel for pixel
HAND_ONLY = {'interact'}
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


def pasted(path, who, view):
    """share of the final idle head's opaque pixels found unchanged somewhere in the picture: a head cut from the idle
    and pasted on scores 90 % and more, a head drawn for the pose under 20 %"""
    import numpy as np
    from PIL import Image
    idle = os.path.join(ART, 'final', who, 'idle', f'{who}-{view}.png')
    a = np.asarray(Image.open(path).convert('RGBA')).astype(np.int16)
    b = np.asarray(Image.open(idle).convert('RGBA')).astype(np.int16)
    x0, y0, x1, y1 = Image.open(idle).getbbox()
    head = b[y0:y0 + int(0.45 * (y1 - y0)), x0:x1]; m = head[..., 3] > 200; n = m.sum()
    H, W = a.shape[:2]; h, w = head.shape[:2]
    def score(dx, dy):
        return ((np.abs(a[dy:dy + h, dx:dx + w] - head).max(-1) <= 2) & m).sum() / n
    best, at = 0.0, (0, 0)
    for dy in range(0, H - h + 1, 6):
        for dx in range(0, W - w + 1, 6):
            s = score(dx, dy)
            if s > best: best, at = s, (dx, dy)
    for dy in range(max(0, at[1] - 5), min(H - h, at[1] + 5) + 1):
        for dx in range(max(0, at[0] - 5), min(W - w, at[0] + 5) + 1):
            best = max(best, score(dx, dy))
    return float(best)


def chain(who, view, fr, out, key):
    """walk 0·1·2 → idle → the new frames → idle, as one sheet and two GIFs (game size, full size)"""
    from PIL import Image, ImageDraw
    F = os.path.join(ART, 'final', who)
    walk = [os.path.join(F, 'walk', f'{who}-{view}-{i}.png') for i in (0, 1, 2)]
    idle = os.path.join(F, 'idle', f'{who}-{view}.png')
    seq = [(f'걷기 {i}', p) for i, p in enumerate(walk) if os.path.exists(p)] + [('정지', idle)] + \
          [(f'새 {k}', p) for k, p in fr] + [('정지', idle)]
    def canvas(p):
        # walks are drawn smaller (360×400, feet 180,370, figure 330 px): put them on the idle's scale and feet
        im = Image.open(p).convert('RGBA')
        if im.size == (620, 720): return im
        k = 576 / 330
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        out = Image.new('RGBA', (620, 720), (0, 0, 0, 0))
        out.alpha_composite(im, (310 - round(180 * k), 662 - round(370 * k)))
        return out
    pics = [(t, canvas(p)) for t, p in seq if os.path.exists(p)]
    W, H = pics[0][1].size
    s = Image.new('RGB', (W * len(pics), H + 40), (245, 239, 227)); d = ImageDraw.Draw(s)
    for i, (t, im) in enumerate(pics):
        s.paste(im, (i * W, 40), im)
        d.line([(i * W, 40 + 662), ((i + 1) * W, 40 + 662)], fill=(0, 110, 230), width=2)
        d.text((i * W + 8, 10), t, fill=(150, 30, 20) if t.startswith('새') else (40, 30, 20), font=onion.FONT)
    name = f'{who}-{key}-chain'
    s.save(os.path.join(out, name + '.png'))
    # GIF: walk cycle twice, idle, the new frames (held a little longer), idle
    frames = [im for t, im in pics if t.startswith('걷기')]
    frames = (frames + frames[1:2]) * 2 if len(frames) == 3 else frames
    idle_im = next(im for t, im in pics if t == '정지')
    news = [im for t, im in pics if t.startswith('새')]
    frames += [idle_im] + news + [idle_im]
    ms = [180] * (len(frames) - len(news) - 2) + [400] + [500] * len(news) + [600]
    def flat(im, k):
        bg = Image.new('RGBA', im.size, (245, 239, 227, 255)); bg.alpha_composite(im)
        bg = bg.convert('RGB')
        return bg.resize((max(1, W * k // H), k), Image.NEAREST) if k else bg
    for suf, k in (('', 0), ('-game', 39)):  # a 39px tall canvas puts the 576px figure at the game's 31px
        fs = [flat(im, k) for im in frames]
        fs[0].save(os.path.join(out, name + suf + '.gif'), save_all=True, append_images=fs[1:], duration=ms, loop=0)
    return name + '.png'


def hair_tones(path, who):
    import numpy as np
    from PIL import Image
    im = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
    m = skin.cs.parts(im, who)['hair'] & (im[..., 3] >= 250)
    lab = skin.cs.lab(im[..., :3][m]); L = lab[:, 0]
    out = []
    for q in (15, 50, 85):  # dark, middle, light: the median colour around that lightness percentile
        lo, hi = np.percentile(L, [max(0, q - 7), min(100, q + 7)])
        out.append(np.median(lab[(L >= lo) & (L <= hi)], 0))
    return np.array(out)


def hair(path, who, view, out):
    """hair tones against the closest final idle / walk frame of the same direction (all directions for lying)"""
    import numpy as np
    from PIL import Image, ImageDraw
    F = os.path.join(ART, 'final', who)
    views = [view] if view in VIEWS else list(VIEWS)
    refs = [os.path.join(F, 'idle', f'{who}-{v}.png') for v in views] + \
           [os.path.join(F, 'walk', f'{who}-{v}-{i}.png') for v in views for i in (0, 1, 2)]
    t = hair_tones(path, who)
    best = min(((np.sqrt(((hair_tones(r, who) - t) ** 2).sum(-1)), r) for r in refs if os.path.exists(r)), key=lambda x: x[0].max())
    de, ref = best
    worst = float(de.max())
    verdict = '같음' if worst <= 3 else '조금 다름' if worst <= 6 else '다름'
    # swatches: reference tones above, the picture's below
    rt = hair_tones(ref, who)
    def rgb(lab):
        L, a, b = lab; fy = (L + 16) / 116; fx = fy + a / 500; fz = fy - b / 200
        f = lambda v: v ** 3 if v ** 3 > 0.008856 else (v - 16 / 116) / 7.787
        X, Y, Z = 0.95047 * f(fx), f(fy), 1.08883 * f(fz)
        r, g, b_ = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z
        c = lambda v: 255 * (12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055)
        return tuple(int(max(0, min(255, c(v)))) for v in (r, g, b_))
    sw = Image.new('RGB', (3 * 170, 2 * 60 + 30), (245, 239, 227)); d = ImageDraw.Draw(sw)
    for i in range(3):
        d.rectangle([i * 170, 30, i * 170 + 169, 89], fill=rgb(rt[i])); d.rectangle([i * 170, 90, i * 170 + 169, 149], fill=rgb(t[i]))
    d.text((4, 6), f'머리색 위 정지·걷기 / 아래 새 그림 · ΔE {de.round(1).tolist()}', fill=(40, 30, 20), font=onion.FONT)
    name = os.path.splitext(os.path.basename(path))[0] + '-hair.png'
    sw.save(os.path.join(out, name))
    return {'file': os.path.basename(path), 'verdict': verdict, 'deltaE': [round(float(x), 1) for x in de],
            'ref': os.path.basename(ref), 'sheet': name}


def copied(p0, p1):
    """share of the two frames' figure pixels that are identical, at the best shift of up to 4 px"""
    import numpy as np
    from PIL import Image
    a = np.asarray(Image.open(p0).convert('RGBA')).astype(np.int16)
    b = np.asarray(Image.open(p1).convert('RGBA')).astype(np.int16)
    if a.shape != b.shape: return 0.0
    m = (a[..., 3] > 200) | (b[..., 3] > 200); n = max(1, m.sum()); best = 0.0
    for dy in range(-4, 5):
        for dx in range(-4, 5):
            bb = np.roll(np.roll(b, dy, 0), dx, 1)
            best = max(best, float(((np.abs(a - bb).max(-1) <= 3) & m).sum() / n))
    return best


def label(s):
    for k, ko in (('-chain', '이어 보기'), ('-action', '동작'), ('-onion-', '0↔1'), ('-mirror-', '좌우'), ('-reference', '기준'), ('-head', '머리')):
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

    # 머리색
    hairs = []
    for p in pngs:
        m = NAME.match(os.path.basename(p))
        if not m: continue
        view = next((v for v in m.group(2).split('-') if v in VIEWS), 'all')
        r = hair(p, m.group(1), view, o.out); hairs.append(r)
        if r['verdict'] != '같음': look.append(f"머리색 {r['file']}: {r['verdict']} (어둠·중간·밝음 ΔE {r['deltaE']}, 기준 {r['ref']})")

    for (who, key), fr in sorted(groups.items()):
        fr.sort()
        view = next((v for v in key.split('-') if v in VIEWS), 'front')
        lying, side = 'sleep' in key, 'side' in key
        sheets = []
        # 동작
        r = action.check(who, view, fr, lying=lying, side=side or (who, key) in CURLED); r['key'] = key
        action.sheet(r, fr, o.out); sheets.append(f'{who}-{key}-action.png')
        notes = list(r['notes'])
        # 이어 보기: walking and standing into the new frames
        if view in VIEWS and not side:
            sheets.append(chain(who, view, fr, o.out, key))
        # 새로 그림: a frame copied from the one before and only warped or recoloured
        for (k1, p1), (k2, p2) in zip(fr, fr[1:]):
            if act in HAND_ONLY: break  # only a hand or foot moves: the body stays the same by design
            c = copied(p1, p2)
            if c > 0.5: notes.append(f'{k2}: {k1}에서 복사해 변형한 프레임 (같은 픽셀 {c:.0%}, 새로 그린 프레임은 30 % 아래)')
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
        # a head cut out of the idle and pasted on (Horus sleep 189): only for poses that are not standing
        if lying or act in ('sit', 'pickup', 'sleep') or any(x['height'] < 0.95 for x in r['frames']):
            for k, p in fr:
                s = pasted(p, who, view if view in VIEWS and not side else ('right' if side else 'front'))
                if s > 0.5: notes.append(f'{k}: 정지 머리를 잘라 붙임 (정지 머리 픽셀 {s:.0%}가 그대로)')
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
           '', '## 머리색', '', '| 파일 | 판정 | 어둠 / 중간 / 밝음 ΔE | 기준 | 견본 |', '|---|---|---|---|---|'] + [
           f"| {r['file']} | {r['verdict']} | {' / '.join(map(str, r['deltaE']))} | {r['ref']} | [견본]({r['sheet']}) |" for r in hairs] + [
           '', '시트 읽는 법: chain = 걷기 0·1·2 → 정지 → 새 프레임 → 정지(같은 배율, 파란 선 = 발), 같은 이름의 .gif(큰 크기)와 -game.gif(게임 크기)로 이어 재생해 비율·동작이 툭 끊기지 않는지 본다. action = 정지 | 0 | 1(파란 선 = 발 기준선), onion = 겹친 윤곽(빨강 A, 파랑 B) · 바뀐 픽셀 · 윤곽만 다른 곳, '
           'mirror = 왼쪽과 뒤집은 오른쪽(팔 길이·손 크기), reference = 채택된 기준 그림과 겹침(구도·원근·머리 위치), head = 정지 머리 윤곽(빨강).',
           '머리 맞춤 ×1.00 = 정지와 같은 크기. 채택된 쪼그린·앉은 그림도 ×1.03~1.11로 재진다.']
    open(os.path.join(o.out, 'report.md'), 'w').write('\n'.join(rep) + '\n')
    print('→', os.path.join(o.out, 'report.md'), f'· 볼 것 {len(look)}개')


if __name__ == '__main__':
    main()
