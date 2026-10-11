# Checks for a multi-frame action against the final idle, per character and direction:
#   머리 크기  — fit-scale's head match: the scale at which this frame's head matches the idle's head (×1.00 = the
#               same size; ×1.20 = the head was drawn about a sixth smaller). A head drawn smaller to make a crouch or
#               a seat fit is the usual mistake. Approved crouches measure ×1.04–1.12 (the bowed head and spread hair).
#   키 흐름   — the visible height of each frame as a share of the idle's. Frame 0 is the way into the pose:
#               it should sit between the idle and the last frame, not already at the end.
#   프레임 차이 — how much of the silhouette changes from one frame to the next; two frames with almost the same
#               outline read as one frame in the game. Only judged for whole-body actions (the height moves);
#               a hand reaching out changes little by design.
#
#   외곽선    — whether neighbouring frames change their OUTLINE at all: a frame whose outline is the same and only the
#               inside was touched up (sleep 187's breathing) reads as one frame in the game.
#   중심선    — front and back views: where the top, middle and bottom of the figure sit sideways. A body lying or
#               sitting straight toward the viewer has them on one line; a body drifting to one side (sleep 187's
#               legs running off to the right) does not. Curled side poses (Somang 180) lean by design: look first.
#
#   python3 tools/art/action-check.py <png>...  [--out <folder>]
#   files are named <who>-<view>[-<seat or kind>]-<frame>.png or <who>-sleep[-side]-<frame>.png; grouped by everything
#   before the frame number. A name without front/back/left/right is compared with the front idle.
#   Single pictures (a seat) get the head and height lines only.
#
# Judged (each is a hint to look at, not a pass):
#   머리 작음   head match above ×1.15
#   0이 끝과 같음 frame 0's height step from the idle is over 80 % of the whole step to the last frame
#   0이 너무 급함 frame 0 drops more than 25 % of the idle height in one step while the last frame drops further
#   차이 없음   in a whole-body action, under 12 % of the silhouette and under 4 % of the height change between
#               neighbouring frames
#   외곽선 같음 neighbouring frames with the same bounding box and under 3 % of the silhouette changed
#   몸 쏠림     front/back: the bottom of the figure sits more than 12 % of the idle's width to one side of the top
#   (lying pictures: the head match is not reliable — compare with head-check.py / onion.py by eye)
# Calibrated on the approved Somang 181 and Horus 182 pickups (no notes) and Set 182 (head ×1.2–1.36, frames 0 and 1
# the same height, frame 0 already at the end).
import argparse, importlib.util, json, os, re
from collections import defaultdict
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
FINAL = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'final')
spec = importlib.util.spec_from_file_location('fit_scale', os.path.join(os.path.dirname(__file__), 'fit-scale.py'))
fs = importlib.util.module_from_spec(spec); spec.loader.exec_module(fs)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 16)
except OSError:
    FONT = ImageFont.load_default()
HEAD_MAX, FIRST_MAX, FIRST_STEP, DIFF_MIN, STEP_MIN = 1.15, 0.80, 0.25, 0.12, 0.04


def alpha(path):
    return np.asarray(Image.open(path).convert('RGBA'))[..., 3] > 128


def height(a):
    ys = np.nonzero(a.any(1))[0]
    return int(ys.max() - ys.min() + 1)


def head(path, who, view):
    """fit-scale's head match: × to scale this frame so its head matches the idle's"""
    im = Image.open(path).convert('RGBA')
    return fs.fit(im.crop(im.getbbox()), fs.idle(who, view))[2]['scale']  # cropped to the figure, as fit-scale.py does


def changed(p, q):
    a, b = alpha(p), alpha(q)
    return float((a ^ b).sum() / max(1, (a | b).sum()))


def axis(a):
    """sideways middle of the figure's top, middle and bottom fifth"""
    ys = np.nonzero(a.any(1))[0]; y0, y1 = ys.min(), ys.max(); hgt = y1 - y0
    def mid(f0, f1):
        xs = np.nonzero(a[int(y0 + f0 * hgt):int(y0 + f1 * hgt) + 1].any(0))[0]
        return (xs.min() + xs.max()) / 2
    return mid(0, 0.2), mid(0.4, 0.6), mid(0.8, 1.0)


def check(who, view, frames, lying=False, side=False):
    idle = os.path.join(FINAL, who, 'idle', f'{who}-{view}.png')
    ia = alpha(idle); H0 = height(ia); xs = np.nonzero(ia.any(0))[0]; W0 = xs.max() - xs.min()
    rows, notes = [], []
    for k, p in frames:
        a = alpha(p)
        h = height(a); sc = head(p, who, view)
        row = {'frame': k, 'height': round(h / H0, 3), 'head': round(sc, 3)}
        if view in ('front', 'back') and not side:
            top, mid, bot = axis(a); row['axis'] = [round(top), round(mid), round(bot)]
            if abs(bot - top) > 0.12 * W0: notes.append(f'{k}: 몸 쏠림 (위 가운데 x{top:.0f} → 아래 가운데 x{bot:.0f})')
        rows.append(row)
        if lying: continue
        # past ×1.8 the head match has lost the head (a back view of long hair has little to hold on to): look instead
        if sc > 1.8: notes.append(f'{k}: 머리 측정 안 됨 (×{sc:.2f}, 눈으로 볼 것)')
        elif sc > HEAD_MAX: notes.append(f'{k}: 머리 작음 (머리 맞춤 ×{sc:.2f})')
    if len(frames) >= 2:
        hs = [1.0] + [r['height'] for r in rows]
        whole = hs[0] - hs[-1]
        first = hs[0] - hs[1]
        # a lying (looping) pose has no way in from the idle: only the frame-to-frame lines apply
        if lying: pass
        elif whole > 0.05 and first / whole > FIRST_MAX: notes.append(f'0이 끝과 같음 (정지→0이 전체 내려감의 {first / whole:.0%})')
        elif whole > first + 0.03 and first > FIRST_STEP: notes.append(f'0이 너무 급함 (정지→0에 키 {first:.0%} 줄어듦)')
        for i, ((k1, p1), (k2, p2)) in enumerate(zip(frames, frames[1:])):
            d = changed(p1, p2)
            if d < 0.03 and Image.open(p1).getbbox() == Image.open(p2).getbbox():
                notes.append(f'{k1}→{k2}: 외곽선 같음 (윤곽 {d:.1%}, 안쪽만 바뀜)')
            rows[i + 1]['changedFromPrev'] = round(d, 3)
            if whole > 0.10 and d < DIFF_MIN and abs(rows[i]['height'] - rows[i + 1]['height']) < STEP_MIN:
                notes.append(f'{k1}→{k2}: 차이 없음 (윤곽 {d:.0%}, 키 차이 {abs(rows[i]["height"] - rows[i + 1]["height"]):.0%})')
    return {'who': who, 'view': view, 'idleHeight': H0, 'frames': rows, 'notes': notes, 'verdict': '볼 것 없음' if not notes else ' · '.join(notes)}


def sheet(r, frames, out):
    idle = Image.open(os.path.join(FINAL, r['who'], 'idle', f"{r['who']}-{r['view']}.png")).convert('RGBA')
    pics = [idle] + [Image.open(p).convert('RGBA') for _, p in frames]
    W, H = idle.size
    s = Image.new('RGB', (W * len(pics), H + 60), (245, 239, 227)); d = ImageDraw.Draw(s)
    for i, pic in enumerate(pics):
        s.paste(pic, (i * W, 60), pic)
        d.line([(i * W, 60 + 662), ((i + 1) * W, 60 + 662)], fill=(0, 110, 230), width=2)
        lab = '정지' if i == 0 else f"{frames[i - 1][0]} · 키 {r['frames'][i - 1]['height']:.0%} · 머리 ×{r['frames'][i - 1]['head']:.2f}"
        d.text((i * W + 8, 36), lab, fill=(40, 30, 20), font=FONT)
    d.text((8, 8), f"{r['who']} {r['view']} · {r['verdict']}", fill=(150, 30, 20) if r['notes'] else (30, 90, 30), font=FONT)
    s.save(os.path.join(out, f"{r['who']}-{r['key']}-action.png"))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('png', nargs='+'); ap.add_argument('--out')
    a = ap.parse_args()
    groups = defaultdict(list)
    for p in a.png:
        m = re.match(r'(set|somang|horus)-([a-z-]+?)-(\d+)\.png$', os.path.basename(p))
        if m: groups[(m.group(1), m.group(2))].append((int(m.group(3)), p))
    res = []
    for (who, key), fr in sorted(groups.items()):
        fr.sort()
        view = next((v for v in key.split('-') if v in ('front', 'back', 'left', 'right')), 'front')
        r = check(who, view, fr, lying='sleep' in key, side='side' in key); r['key'] = key; res.append(r)
        print(f"{who} {key}: " + ' / '.join(f"{x['frame']}: 키 {x['height']:.0%} 머리 ×{x['head']:.2f}" + (f" 윤곽 차이 {x['changedFromPrev']:.0%}" if 'changedFromPrev' in x else '') for x in r['frames']) + f"  → {r['verdict']}")
        if a.out:
            os.makedirs(a.out, exist_ok=True); sheet(r, fr, a.out)
    if a.out:
        json.dump(res, open(os.path.join(a.out, 'action.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
