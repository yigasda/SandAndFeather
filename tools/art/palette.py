# The colour table of the final idle and walk: every part's base colour and its shading steps, picked once from the
# approved pixels so nobody has to eyedrop them again.
#
#   python3 tools/art/palette.py            → docs/art/chibi-refresh/palette/{palette.json, palette.md, palette-<who>.png, eyes.png}
#
# For each character, direction and part (피부, 머리, 외곽선, 신발, 금장, 옷) it takes the opaque pixels of that
# direction's final idle and 3 walks, rounds them a little (4 levels), and names:
#   기본       the most used colour (the flat fill)
#   그림자 1   the most used colour 4–14 lighter-units (CIE L) darker than the base
#   그림자 2   the most used colour more than 14 darker (but not the outline)
#   밝은 쪽    the most used colour lighter than the base
# with how much of the part each covers. Shading steps keep the base's colour family (a belt is not a shadow).
# One table per direction because the approved directions are not painted quite alike.
import importlib.util, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, '..', '..')
FINAL = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'final')
OUT = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'palette')
spec = importlib.util.spec_from_file_location('check_sprite', os.path.join(HERE, 'check-sprite.py'))
cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 18)
except OSError:
    FONT = ImageFont.load_default()
WHO = {'set': '세트', 'horus': '호루스', 'somang': '소망'}
VIEWS = ('front', 'back', 'left', 'right')
PARTS = [('skin', '피부'), ('hair', '머리'), ('brow', '눈썹'), ('outline', '외곽선'), ('shoe', '신발'), ('gold', '금장'), ('cloth', '옷')]
STEPS = [('base', '기본'), ('shadow1', '그림자 1'), ('shadow2', '그림자 2'), ('light', '밝은 쪽')]


def files(who):
    out = []
    for v in VIEWS:
        out.append((v, os.path.join(FINAL, who, 'idle', f'{who}-{v}.png')))
        out += [(v, os.path.join(FINAL, who, 'walk', f'{who}-{v}-{i}.png')) for i in (0, 1, 2)]
    return [(v, p) for v, p in out if os.path.exists(p)]


def masks(path, who):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
    p = cs.parts(im, who)
    h, s, v = cs.hsv(im[..., :3] / 255)
    solid = im[..., 3] >= 250
    skin = p['skin'] & ~p['outline'] & (s > (0.08 if who == 'horus' else 0.14))  # as skin-check: not the ivory cloth
    gold = (h > 0.08) & (h < 0.17) & (s > 0.45) & (v > 0.35) & ~p['hair'] & ~skin & ~p['shoe']
    cloth = p['cloth'] & ~gold & ~skin
    # the cloth's own colour family: Set's charcoal skirt, Horus's white kilt, Somang's ivory dress (eye whites,
    # blush and stray hair pixels fall outside)
    cloth &= ((s < 0.35) & (v < 0.4)) if who == 'set' else ((s < 0.2) & (v > 0.6))
    m = {'skin': skin, 'hair': p['hair'], 'outline': p['outline'], 'shoe': p['shoe'], 'gold': gold, 'cloth': cloth}
    return im, {k: x & solid for k, x in m.items()}


# eyebrows: Horus's thick navy brows sit in these boxes of the final idle (x0, y0, x1, y1); Set's are found as the
# first dark band inside the face; Somang's are hidden under her see-through bangs (see the table note)
HORUS_BROWS = {'front': [(190, 288, 280, 313), (325, 288, 412, 313)], 'left': [(180, 288, 258, 310)], 'right': [(365, 288, 442, 310)]}


def brows(who, v):
    path = os.path.join(FINAL, who, 'idle', f'{who}-{v}.png')
    if who == 'somang' or v == 'back' or not os.path.exists(path): return None
    im = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
    P = cs.parts(im, who); solid = im[..., 3] >= 250
    skin = P['skin'] & (np.arange(im.shape[0])[:, None] < P['top'] + 0.55 * P['H'])
    M = np.zeros_like(skin)
    if who == 'horus':
        L = cs.lab(im[..., :3].reshape(-1, 3)).reshape(im.shape[:2] + (3,))[..., 0]
        for x0, y0, x1, y1 in HORUS_BROWS[v]: M[y0:y1, x0:x1] = True
        M &= solid & ~skin & (L < 50)
    else:
        ys, _ = np.nonzero(skin); y0, y1 = ys.min(), ys.max()
        up = np.zeros_like(skin); dn = np.zeros_like(skin)
        for d in range(1, 14): up |= np.roll(skin, d, 0); dn |= np.roll(skin, -d, 0)
        E = solid & ~skin & up & dn; E[:y0] = False; E[y0 + int(0.6 * (y1 - y0)):] = False
        rows = np.nonzero(E.sum(1) > 3)[0]
        if not len(rows): return None
        band = [rows[0]]
        for r in rows[1:]:
            if r - band[-1] > 2: break
            band.append(r)
        M[band[0]:band[-1] + 1] = E[band[0]:band[-1] + 1]
    px = im[..., :3][M]
    return px if len(px) >= 40 else None


def steps(rgb):
    """group the part's pixels into a few tones (k-means in Lab, k=6, weighted by use), then name them: the biggest
    group is the base, the biggest darker one within 4–14 L is shadow 1, below that shadow 2, above the base the light.
    Each tone is the most used real colour of its group, so it is a colour the approved art actually has."""
    q = (rgb // 4 * 4).astype(np.int32) + 2
    cols, counts = np.unique(q, axis=0, return_counts=True)
    lab = cs.lab(cols.astype(np.float32)); n = counts.sum()
    k = min(6, len(cols))
    cent = lab[np.argsort(-counts)[:k]].copy()
    for _ in range(20):
        g = np.argmin(((lab[:, None] - cent[None]) ** 2).sum(-1), 1)
        for j in range(k):
            w = counts[g == j]
            if w.sum(): cent[j] = (lab[g == j] * w[:, None]).sum(0) / w.sum()
    groups = []
    for j in range(k):
        sel = np.flatnonzero(g == j)
        if not len(sel): continue
        top = sel[np.argmax(counts[sel])]
        groups.append((counts[sel].sum() / n, cols[top], lab[top]))
    groups = [x for x in groups if x[0] >= 0.015]  # highlights are small
    share, c0, l0 = max(groups, key=lambda x: x[0])
    out = {'base': (c0, share)}
    fam = lambda l: np.sqrt(((l[1:] - l0[1:]) ** 2).sum()) < 30  # a belt or strap of another colour is not a shadow
    for key, ok in (('shadow1', lambda L: l0[0] - 14 <= L < l0[0] - 4), ('shadow2', lambda L: 14 < L < l0[0] - 14), ('light', lambda L: L > l0[0] + 4)):
        cand = [x for x in groups if ok(x[2][0]) and (fam(x[2]) or key == 'light' and np.sqrt(((x[2][1:] - l0[1:]) ** 2).sum()) < 50)]
        if cand:
            f, c, _ = max(cand, key=lambda x: x[0]); out[key] = (c, f)
    return out


def hexc(c): return '#%02x%02x%02x' % tuple(int(x) for x in c)


KO_VIEW = {'front': '정면', 'back': '뒤', 'left': '왼쪽', 'right': '오른쪽'}


def main():
    os.makedirs(OUT, exist_ok=True)
    # one table per character and direction: the approved directions are not all painted alike (Horus's front hair is
    # bluer than his back), so a new drawing takes the colours of the direction it is drawn in
    table = {}
    for who in WHO:
        pix = {v: {k: [] for k, _ in PARTS} for v in VIEWS}
        for v, path in files(who):
            im, m = masks(path, who)
            for k, _ in PARTS:
                if k != 'brow': pix[v][k].append(im[..., :3][m[k]])
        for v in VIEWS:
            b = brows(who, v)
            pix[v]['brow'].append(b if b is not None else np.zeros((0, 3), np.float32))
        table[who] = {}
        for v in VIEWS:
            table[who][v] = {}
            for k, _ in PARTS:
                px = np.concatenate(pix[v][k])
                if len(px) < (40 if k == 'brow' else 150): continue
                st = steps(px)
                if k == 'brow': st.pop('light', None)  # a brow's lighter pixels are its edge blending into the skin
                table[who][v][k] = {s: {'hex': hexc(c), 'rgb': [int(x) for x in c], 'share': round(float(f), 3)} for s, (c, f) in st.items()}
    json.dump({'source': 'final idle 1 + walk 3 per character and direction', 'steps': dict(STEPS), 'parts': dict(PARTS),
               'colours': table}, open(os.path.join(OUT, 'palette.json'), 'w'), ensure_ascii=False, indent=1)

    md = ['# 셋소호 색 표 — 최종 정지·걷기에서 뽑은 색', '',
          '`python3 tools/art/palette.py`가 캐릭터·방향마다 최종 정지 1장 + 걷기 3장의 픽셀에서 만든다. **새 그림은 그리는 방향의 이 표 색만 쓴다.** '
          '스포이트로 다시 뽑지 않는다. 누운 그림처럼 방향이 애매하면 정면 표. 표에 없는 단계가 필요하면 새로 만들지 말고 사용자에게 묻는다.', '',
          '- 기본 = 가장 많이 쓴 색(평평한 면). 그림자 1 = 기본보다 조금 어두운 색, 그림자 2 = 더 어두운 색(외곽선 제외), 밝은 쪽 = 하이라이트.',
          '- 괄호 안 % = 그 부위에서 그 색이 차지하는 비율. 작은 %는 작은 점·선에만 쓴다.',
          '- **눈썹:** 세트·호루스는 표에 있다(정지에서 뽑음). **소망 눈썹은 시스루뱅에 가려 표에 없다:** 앞머리 사이로 비치는 가는 선으로, 소망 머리의 그림자 1색으로 그린다. 눈썹 색을 머리 기본색이나 검정으로 칠하지 않는다.',
          '- **눈은 표에 없다**(작은 칸에 색이 너무 많다). [eyes.png](eyes.png)의 정지 눈을 쓴다: 뜬 눈은 같은 방향 정지 눈 픽셀을 그대로 옮겨도 된다, 표정이 바뀐 눈은 그 그림에 있는 색만. 볼 홍조, 입, 리본도 그 방향 최종 정지에서 그대로.',
          '- 같은 캐릭터라도 방향마다 조금 다르게 칠해져 있다(채택본 그대로). 다른 방향 색을 섞지 않는다.', '']
    for who, ko in WHO.items():
        md += [f'## {ko}', '', f'![{ko} 색 표](palette-{who}.png)', '']
        for v in VIEWS:
            md += [f'**{ko} {KO_VIEW[v]}**', '', '| 부위 | ' + ' | '.join(n for _, n in STEPS) + ' |', '|---' * (len(STEPS) + 1) + '|']
            for k, kn in PARTS:
                row = table[who][v].get(k)
                if not row: continue
                md.append(f'| {kn} | ' + ' | '.join(f"`{row[s]['hex']}` ({row[s]['share']:.0%})" if s in row else '—' for s, _ in STEPS) + ' |')
            md.append('')
    open(os.path.join(OUT, 'palette.md'), 'w').write('\n'.join(md) + '\n')

    # one swatch sheet per character: rows = parts, column groups = directions, 4 steps each
    cw, ch, lw = 96, 46, 80
    for who, ko in WHO.items():
        parts = [k for k, _ in PARTS if any(k in table[who][v] for v in VIEWS)]
        W = lw + len(VIEWS) * (cw * len(STEPS) + 16)
        img = Image.new('RGB', (W, 70 + (ch + 6) * len(parts)), (245, 239, 227)); d = ImageDraw.Draw(img)
        d.text((6, 6), f'{ko} — 방향마다 기본 · 그림자1 · 그림자2 · 밝은 쪽', fill=(150, 30, 20), font=FONT)
        for j, v in enumerate(VIEWS):
            d.text((lw + j * (cw * len(STEPS) + 16) + 4, 38), KO_VIEW[v], fill=(40, 30, 20), font=FONT)
        for r, k in enumerate(parts):
            y = 64 + r * (ch + 6)
            d.text((6, y + ch // 2 - 9), dict(PARTS)[k], fill=(40, 30, 20), font=FONT)
            for j, v in enumerate(VIEWS):
                row = table[who][v].get(k, {})
                for i, (st, _) in enumerate(STEPS):
                    c = row.get(st)
                    if not c: continue
                    x = lw + j * (cw * len(STEPS) + 16) + i * cw
                    d.rectangle([x, y, x + cw - 4, y + ch], fill=tuple(c['rgb']))
                    txt = (255, 255, 255) if cs.lab(np.array([c['rgb']], np.float32))[0][0] < 55 else (20, 20, 20)
                    d.text((x + 3, y + ch - 20), c['hex'], fill=txt, font=FONT)
        img.save(os.path.join(OUT, f'palette-{who}.png'))
    eyes()
    print('→', os.path.relpath(OUT))


def eyes():
    """eyes.png: each character's face band (brows, eyes, ears) from the final idle, front / left / right, enlarged
    without smoothing. Eyes have too many colours for the table: an open eye is taken from here as it is."""
    cell_w, cell_h, lab_h = 420, 300, 30
    img = Image.new('RGB', (cell_w * 3 + 20, (cell_h + lab_h) * len(WHO) + 10), (245, 239, 227)); d = ImageDraw.Draw(img)
    for r, (who, ko) in enumerate(WHO.items()):
        for c, v in enumerate(('front', 'left', 'right')):
            I = Image.open(os.path.join(FINAL, who, 'idle', f'{who}-{v}.png')).convert('RGBA')
            im = np.asarray(I).astype(np.float32); P = cs.parts(im, who)
            sk = P['skin'].copy(); sk[P['top'] + int(0.55 * P['H']):] = False
            ys, xs = np.nonzero(sk)
            pad = int(0.25 * (ys.max() - ys.min()))  # the face band can stop at the eyes: show a little below
            cr = I.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1 + pad))
            k = max(1, min(cell_w // cr.width, cell_h // cr.height)) if min(cell_w // cr.width, cell_h // cr.height) >= 1 else 1
            cr = cr.resize((cr.width * k, cr.height * k), Image.NEAREST)
            if cr.width > cell_w or cr.height > cell_h: cr.thumbnail((cell_w, cell_h), Image.NEAREST)
            x, y = 10 + c * cell_w, r * (cell_h + lab_h) + lab_h
            bg = Image.new('RGBA', cr.size, (245, 239, 227, 255)); bg.alpha_composite(cr)
            img.paste(bg.convert('RGB'), (x, y))
            d.text((x, y - 24), f'{ko} {KO_VIEW[v]}', fill=(40, 30, 20), font=FONT)
    img.save(os.path.join(OUT, 'eyes.png'))


if __name__ == '__main__':
    main()
