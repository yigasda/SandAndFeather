# The colour table of the final idle and walk: every part's base colour and its shading steps, picked once from the
# approved pixels so nobody has to eyedrop them again.
#
#   python3 tools/art/palette.py            → docs/art/chibi-refresh/palette/{palette.json, palette.md, palette-<who>.png}
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
PARTS = [('skin', '피부'), ('hair', '머리'), ('outline', '외곽선'), ('shoe', '신발'), ('gold', '금장'), ('cloth', '옷')]
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
            for k, _ in PARTS: pix[v][k].append(im[..., :3][m[k]])
        table[who] = {}
        for v in VIEWS:
            table[who][v] = {}
            for k, _ in PARTS:
                px = np.concatenate(pix[v][k])
                if len(px) < 150: continue
                table[who][v][k] = {s: {'hex': hexc(c), 'rgb': [int(x) for x in c], 'share': round(float(f), 3)} for s, (c, f) in steps(px).items()}
    json.dump({'source': 'final idle 1 + walk 3 per character and direction', 'steps': dict(STEPS), 'parts': dict(PARTS),
               'colours': table}, open(os.path.join(OUT, 'palette.json'), 'w'), ensure_ascii=False, indent=1)

    md = ['# 셋소호 색 표 — 최종 정지·걷기에서 뽑은 색', '',
          '`python3 tools/art/palette.py`가 캐릭터·방향마다 최종 정지 1장 + 걷기 3장의 픽셀에서 만든다. **새 그림은 그리는 방향의 이 표 색만 쓴다.** '
          '스포이트로 다시 뽑지 않는다. 누운 그림처럼 방향이 애매하면 정면 표. 표에 없는 단계가 필요하면 새로 만들지 말고 사용자에게 묻는다.', '',
          '- 기본 = 가장 많이 쓴 색(평평한 면). 그림자 1 = 기본보다 조금 어두운 색, 그림자 2 = 더 어두운 색(외곽선 제외), 밝은 쪽 = 하이라이트.',
          '- 괄호 안 % = 그 부위에서 그 색이 차지하는 비율. 작은 %는 작은 점·선에만 쓴다.',
          '- 볼 홍조, 눈동자, 입, 리본처럼 작은 곳은 표에 없다. 그 방향 최종 정지에서 그대로 가져온다.',
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
    print('→', os.path.relpath(OUT))


if __name__ == '__main__':
    main()
