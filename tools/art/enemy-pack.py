# 두아트 하위몹 (고대장치), 10모션 (몹/하위몹/고대장치/10모션-2026-10-18/<kind>/NN-<motion>.png, user: "앞으로 다른 맵에서도
# 공통 10모션 구조"): 대기 0·1·2, 고유 방어, 준비 0·1, 고유 공격 0·1, 피격, 소멸 (소멸 is still the first approved
# 몹/하위몹/고대장치/<kind>-disappear.png, at its old size, user). Copied byte for byte to
# docs/art/enemies/mechanism-v2/png/<kind>/ with a manifest (sha256), packed into data/art/enemies/duat-mechanism[-small].png;
# sprites.json enemies.<kind> = {file, visible, height, frames{motion: [x, y, w, h, px, py]}, small{…}}.
# Nothing is redrawn and nothing is scaled one way. One scale per creature (its idle-0 picture is HEIGHT_K × a character's
# height); the anchor of every motion is the bottom middle of its body (the biggest piece; its bottom rows' middle), so
# the base stays put from picture to picture and the game floats it above its shadow. The ring's hit and broken
# pictures fly apart, so its middle is its round teal orb's and its bottom the lowest piece that is not a crumb.
#   python3 tools/art/enemy-pack.py
import hashlib, json, os, shutil
import numpy as np
from collections import deque
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = os.path.join(ROOT, '몹', '하위몹', '고대장치', '10모션-2026-10-18')
OLD = os.path.join(ROOT, '몹', '하위몹', '고대장치')   # 소멸 stays the first approved one (<kind>-disappear.png), user
OUT = os.path.join(ROOT, 'docs', 'art', 'enemies', 'mechanism-v2')
KINDS = ('hourglass', 'ring')
MOTIONS = ('idle-0', 'idle-1', 'idle-2', 'guard', 'prepare-0', 'prepare-1', 'attack-0', 'attack-1', 'hit', 'disappear')
VISIBLE, SMALL, HEIGHT_K, PAD = 256, 125, 1.1, 2      # atlas px of a character's height (as the character atlases)


ANCHOR = {'hourglass': 'base', 'ring': 'orb'}


def blobs(mask):
    """the 4-connected pieces of a mask, biggest first: arrays of (y, x)"""
    H, W = mask.shape; lab = np.zeros((H, W), bool); out = []
    for y0 in range(H):
        for x0 in np.flatnonzero(mask[y0] & ~lab[y0]):
            q, pts = deque([(y0, x0)]), []; lab[y0, x0] = True
            while q:
                cy, cx = q.popleft(); pts.append((cy, cx))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not lab[ny, nx]: lab[ny, nx] = True; q.append((ny, nx))
            out.append(np.array(pts))
    return sorted(out, key=len, reverse=True)


def orb_x(path, dark):
    """middle (source px, across) of the largest teal blob (the broken picture's dark one), on a half-size copy"""
    im = Image.open(path).convert('RGBA'); q = im.resize((im.width // 2, im.height // 2), Image.NEAREST)
    a = np.asarray(q).astype(int); r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    mask = (al > 200) & (b > g - 10) & (g > r + 15) & (r < 70) & (b < 120) if dark else (al > 200) & (g > 150) & (b > 150) & (r < 160) & (g - r > 50)
    return round(float(blobs(mask)[0][:, 1].mean()) * 2 + 1, 1)


def anchor(path, kind, motion):
    """bottom middle (source px). hourglass: the biggest piece's lowest 12 % of rows. ring: its orb across, and the
    lowest piece that is not a crumb"""
    ps = blobs(np.asarray(Image.open(path).getchannel('A')) >= 128)
    if ANCHOR[kind] == 'orb' or motion == 'disappear':   # the broken one flies apart: its dark orb across
        big = [p for p in ps if len(p) >= 0.03 * len(ps[0])]
        return [orb_x(path, motion == 'disappear'), float(max(p[:, 0].max() for p in big) + 1)]
    p = ps[0]; top, bot = p[:, 0].min(), p[:, 0].max()
    low = p[p[:, 0] >= bot - 0.12 * (bot - top)]
    return [round(float(low[:, 1].mean()), 1), float(bot + 1)]


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    rows, frames = [], []
    old_sha = {f['file']: f['sha256'] for f in json.load(open(os.path.join(OLD, 'manifest.json')))['files']}
    for kind in KINDS:
        os.makedirs(os.path.join(OUT, 'png', kind), exist_ok=True)
        names = {f[3:-4]: f for f in os.listdir(os.path.join(SRC, kind)) if f.endswith('.png')}
        assert sorted(names) == sorted(MOTIONS), (kind, sorted(names))
        ib = Image.open(os.path.join(SRC, kind, names['idle-0'])).getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()
        scale = HEIGHT_K * VISIBLE / (ib[3] - ib[1])
        for mo in MOTIONS:
            src = os.path.join(SRC, kind, names[mo]); dst = os.path.join(OUT, 'png', kind, names[mo]); k = scale
            if mo == 'disappear':   # the old picture, at the size it had beside the old idle picture
                src = os.path.join(OLD, f'{kind}-disappear.png'); dst = os.path.join(OUT, 'png', kind, f'{kind}-disappear.png')
                assert hashlib.sha256(open(src, 'rb').read()).hexdigest() == old_sha[f'{kind}-disappear.png'], src
                ob = Image.open(os.path.join(OLD, f'{kind}-idle.png')).getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()
                k = HEIGHT_K * VISIBLE / (ob[3] - ob[1])
            shutil.copyfile(src, dst)
            o = anchor(src, kind, mo)
            rows.append({'file': os.path.relpath(dst, OUT), 'kind': kind, 'motion': mo, 'size': list(Image.open(dst).size), 'anchor': o,
                         'sha256': hashlib.sha256(open(dst, 'rb').read()).hexdigest()})
            frames.append({'kind': kind, 'state': mo, 'path': dst, 'scale': k, 'anchor': o})
    json.dump({'about': 'tools/art/enemy-pack.py — 몹/하위몹/고대장치/10모션-2026-10-18 그대로(바이트 같음). 공통 10모션: 대기 0·1·2, 고유 방어(휴면), 준비 0·1, 고유 공격 0·1, 피격, 소멸(소멸만 몹/하위몹/고대장치/<kind>-disappear.png 첫 채택본, 사용자). anchor = 몸(가장 큰 조각) 아래끝 가운데',
               'source': '몹/하위몹/고대장치/10모션-2026-10-18', 'heightOfCharacter': HEIGHT_K, 'motions': list(MOTIONS), 'files': rows},
              open(os.path.join(OUT, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)
    sprites_path = os.path.join(ROOT, 'data', 'sprites.json'); sprites = json.load(open(sprites_path))
    tables = {}
    for vis, suffix in ((VISIBLE, ''), (SMALL, '-small')):
        pieces = []
        for f in frames:
            k = f['scale'] * vis / VISIBLE
            im = Image.open(f['path']).convert('RGBA')
            a = np.asarray(im).astype(np.float32); a[..., :3] *= a[..., 3:4] / 255
            w, h = round(im.width * k), round(im.height * k)
            sm = np.stack([np.asarray(Image.fromarray(a[..., c], 'F').resize((w, h), Image.LANCZOS)) for c in range(4)], -1).clip(0, 255)
            rgb = np.where(sm[..., 3:4] > 0, sm[..., :3] * 255 / np.maximum(sm[..., 3:4], 1e-3), 0)
            im = Image.fromarray(np.dstack([rgb.clip(0, 255), sm[..., 3]]).round().astype(np.uint8), 'RGBA')
            bb = im.getbbox(); bx0, by0 = max(0, bb[0] - PAD), max(0, bb[1] - PAD)
            piece = im.crop((bx0, by0, min(im.width, bb[2] + PAD), min(im.height, bb[3] + PAD)))
            pieces.append((f, piece, [round(f['anchor'][0] * k - bx0, 2), round(f['anchor'][1] * k - by0, 2)]))
        W = 0; y = 0; place = []
        for kind in KINDS:
            x = 0; rh = 0
            for f, piece, pv in pieces:
                if f['kind'] != kind: continue
                place.append((f, piece, pv, x, y)); x += piece.width + PAD; rh = max(rh, piece.height); W = max(W, x)
            y += rh + PAD
        atlas = Image.new('RGBA', (W, y), (0, 0, 0, 0))
        for f, piece, pv, x, yy in place: atlas.paste(piece, (x, yy))
        file = f'art/enemies/duat-mechanism{suffix}.png'
        os.makedirs(os.path.join(ROOT, 'data', 'art', 'enemies'), exist_ok=True)
        atlas.save(os.path.join(ROOT, 'data', file), optimize=True)
        print('atlas', file, atlas.size)
        for f, piece, pv, x, yy in place:
            t = tables.setdefault(suffix, {}).setdefault(f['kind'], {'file': file, 'visible': vis, 'frames': {}})
            t['frames'][f['state']] = [x, yy, piece.width, piece.height, *pv]
    # only its own kinds: the desert ones (tools/art/desert-mob-pack.py) stay
    sprites['enemies'] = {**{k: v for k, v in sprites.get('enemies', {}).items() if k not in KINDS},
                          **{kind: {**tables[''][kind], 'height': HEIGHT_K, 'small': tables['-small'][kind]} for kind in KINDS}}
    import importlib.util
    spec = importlib.util.spec_from_file_location('ptm', os.path.join(ROOT, 'tools', 'art', 'pack-trio-motion.py')); ptm = importlib.util.module_from_spec(spec); spec.loader.exec_module(ptm)
    with open(sprites_path, 'w') as fh: fh.write(ptm.compact(json.dumps(sprites, ensure_ascii=False, indent=1)) + '\n')


if __name__ == '__main__':
    main()
