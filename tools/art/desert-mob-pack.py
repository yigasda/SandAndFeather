"""사막 몹 그림을 게임 아틀라스로 (B3부터 한 종씩): 몹/사막/<폴더>의 채택 10장(tools/maps/desert-mobs.json에 등록, 해시 검사)을
data/art/enemies/desert-<kind>[-small].png에 넣고 data/sprites.json enemies.<speciesId>를 쓴다(두아트 종은 그대로).
  - 종마다 배율 하나: 대기 세 장을 합친 몸 높이 = HEIGHT_K × 캐릭터 키(atlas의 visible px).
  - 기준점 하나: 10장이 같은 캔버스·같은 칸(manifest)이라 몸 프레임마다 다시 재지 않고, 등록표의 발 기준선 후보(대기 세 장 맨 아래 행,
    그 가운데 x)를 모든 프레임에 쓴다. 공격 섬광이 든 알파 상자로 프레임 크기를 바꾸지 않는다(사용자 보완 지시 A-3).
  - 그림은 다시 그리지 않고 같은 비율로만 줄인다. 슬롯: 00 대기0 · 01 대기1 · 02 대기2 · 03 특수(guard, 항아리는 dormant) ·
    04·05 준비 · 06·07 공격 · 08 피격 · 09 소멸 → idle-0 … disappear(두아트 field.js 이름).
  python3 tools/art/desert-mob-pack.py [--hit] [speciesId …]   (기본: PACK; --hit: 시트는 두고 피격 도형만)"""
import glob, hashlib, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
REG = json.load(open(os.path.join(ROOT, 'tools', 'maps', 'desert-mobs.json')))
MOTION = {'idle_0': 'idle-0', 'idle_1': 'idle-1', 'idle_2': 'idle-2', 'special': 'guard', 'prepare_0': 'prepare-0', 'prepare_1': 'prepare-1',
          'attack_0': 'attack-0', 'attack_1': 'attack-1', 'hit': 'hit', 'defeat': 'disappear'}
VISIBLE, SMALL, PAD = 256, 125, 2
# body height in characters' heights (the game draws a character 31.2 px × zoom high). 사용자 10-19 "몹 크기 다 늘리셈,
# 방패병은 더 커야, 4대 수문장은 ㅈㄴ 커야": 제안 값(화면 비교 docs/consult/desert/mobs/hit-sheet.png로 검수)
HEIGHT_K = {
    'desert_sealed_jar': 0.95, 'desert_leather_shield': 1.5, 'desert_sealed_shield': 1.6, 'desert_walking_stela': 1.4,
    'desert_sun_mirror': 1.3, 'desert_balance_sentinel': 1.3, 'desert_mask_priest_mantle': 1.45, 'desert_mask_priest_shroud': 1.45,
    'desert_royal_mask_warden': 4.2, 'desert_temple_warden': 4.2, 'desert_throne_warden': 4.2, 'desert_broken_tomb_warden': 4.2,
}
# the shape a 기술 sees (사용자 10-19: 호루스 C안·세트 A안, 몹별 수치는 직접 정하고 묶어서 검수), measured by eye on the
# standing picture idle_0 in its own pixels (the pictures face left): the torso's middle x and half width, without
# weapons, hanging weights, flowing cloth, flashes or empty margin; front: the left edge of what it holds out (shield
# family: the shield, a guard surface; bosses: the fists, body). The same for every frame (one pivot, one scale a kind).
# The atlases are made smaller without loss afterwards (oxipng): the pixels stay the same.
HIT = {
    'desert_sealed_jar': (255, 140, None), 'desert_leather_shield': (375, 48, 150), 'desert_sealed_shield': (365, 50, 118),
    'desert_walking_stela': (215, 130, None), 'desert_sun_mirror': (237, 150, None), 'desert_balance_sentinel': (290, 45, None),
    'desert_mask_priest_mantle': (255, 95, None), 'desert_mask_priest_shroud': (250, 90, None),
    # wardens: front to the middle of the fists, not their leading edge (사용자 10-19: 수문장에게는 더 가깝게 다가가야)
    'desert_royal_mask_warden': (240, 90, 150), 'desert_temple_warden': (235, 95, 100), 'desert_throne_warden': (285, 115, 125),
    'desert_broken_tomb_warden': (265, 70, 100),
}
PACK = list(HEIGHT_K)
# one kind's 10 motions to its own sheets (사용자 10-19): rows within MAX × MAX; what does not fit goes on the kind's next
# sheet — nothing is made smaller to fit. The source PNGs (몹/사막/…) stay as they are; the game loads a kind's sheets
# only when that kind is drawn (data.js spriteFile).
MAX = 4096
# the torso on the floor is an ellipse DEPTH of its width deep (src/packs/duat/field.js DEPTH). A warden's feet's middle
# is the front of its fists on the ground; its torso stands behind them (사용자 10-19: 위쪽에서 너무 멀다): the
# ellipse's front edge at the torso's lowest pixel down its middle column, `back` behind the feet's middle
DEPTH = 0.4


def shape(sid, sp, idle, body_h, foot):
    """the shape in characters' heights: picture px × HEIGHT_K / the standing body's height"""
    cx, hw, front = HIT[sid]; per = HEIGHT_K[sid] / body_h
    hit = {'body': round(float(hw * per), 3)}
    if front is not None: hit.update(front=round(float((foot[0] - front) * per), 3), frontKind='body' if 'warden' in sid else 'shield')
    if 'warden' in sid:
        base = int(np.median([np.nonzero(idle[:, x])[0].max() for x in range(cx - 8, cx + 9)]))
        hit['back'] = round(float((foot[1] - base) * per + hw * per * DEPTH), 3)
    return hit


def main(ids, hit_only=False):
    sprites_path = os.path.join(ROOT, 'data', 'sprites.json'); sprites = json.load(open(sprites_path))
    for sid in ids:
        sp = next(s for s in REG['species'] if s['speciesId'] == sid)
        folder = os.path.join(ROOT, sp['folder'])
        idle = np.maximum.reduce([np.asarray(Image.open(os.path.join(folder, sp['frames'][k]['file'])).getchannel('A')) for k in ('idle_0', 'idle_1', 'idle_2')]) >= 128
        ys = np.nonzero(idle.any(1))[0]; body_h = ys.max() + 1 - ys.min()
        # the pivot (사용자 10-19): across, the middle of the body standing on the ground (the torso's middle, HIT); down, the
        # registry's foot line. One pivot a kind, so turning round (mirrored about it) does not shove the body sideways.
        foot = [HIT[sid][0], sp['measured']['footLineCandidate']]
        if hit_only:   # --hit: the shape alone, the sheets as they are
            sprites['enemies'][sid]['hit'] = shape(sid, sp, idle, body_h, foot); print(' ', sid, sprites['enemies'][sid]['hit']); continue
        for old in glob.glob(os.path.join(ROOT, 'data', 'art', 'enemies', sid.replace('_', '-') + '*.png')): os.remove(old)   # its sheets made again
        out = {}
        for vis, suffix in ((VISIBLE, ''), (SMALL, '-small')):
            k = HEIGHT_K[sid] * vis / body_h
            pieces = []
            for slot, f in sp['frames'].items():
                path = os.path.join(folder, f['file'])
                assert hashlib.sha256(open(path, 'rb').read()).hexdigest() == f['sha256'], path
                im = Image.open(path).convert('RGBA')
                a = np.asarray(im).astype(np.float32); a[..., :3] *= a[..., 3:4] / 255   # premultiplied, so edges do not darken
                w, h = round(im.width * k), round(im.height * k)
                sm = np.stack([np.asarray(Image.fromarray(a[..., c], 'F').resize((w, h), Image.LANCZOS)) for c in range(4)], -1).clip(0, 255)
                rgb = np.where(sm[..., 3:4] > 0, sm[..., :3] * 255 / np.maximum(sm[..., 3:4], 1e-3), 0)
                im = Image.fromarray(np.dstack([rgb.clip(0, 255), sm[..., 3]]).round().astype(np.uint8), 'RGBA')
                bb = im.getbbox(); bx0, by0 = max(0, bb[0] - PAD), max(0, bb[1] - PAD)
                piece = im.crop((bx0, by0, min(im.width, bb[2] + PAD), min(im.height, bb[3] + PAD)))
                pieces.append((MOTION[slot], piece, [round(foot[0] * k - bx0, 2), round(foot[1] * k - by0, 2)]))
            # shelves: left to right, a new row when the width runs out, a new sheet when the height does
            sheets, frames, x = [[]], {}, 0
            y = row_h = 0
            for mo, piece, pv in pieces:
                assert piece.width <= MAX and piece.height <= MAX, (sid, mo, piece.size)
                if x + piece.width > MAX: x, y, row_h = 0, y + row_h + PAD, 0
                if y + piece.height > MAX: sheets.append([]); x = y = row_h = 0
                sheets[-1].append((mo, piece, pv, x, y)); x += piece.width + PAD; row_h = max(row_h, piece.height)
            files = []
            for n, sheet in enumerate(sheets):
                W = max(px + p.width for _, p, _, px, _ in sheet); H = max(py + p.height for _, p, _, _, py in sheet)
                atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
                for mo, piece, pv, px, py in sheet:
                    atlas.paste(piece, (px, py)); frames[mo] = [px, py, piece.width, piece.height, *pv, n]
                file = f'art/enemies/{sid.replace("_", "-")}{suffix}{"" if len(sheets) == 1 else f"-{n}"}.png'
                atlas.save(os.path.join(ROOT, 'data', file), optimize=True); files.append(file)
                try:
                    import oxipng; oxipng.optimize(os.path.join(ROOT, 'data', file), level=4)   # lossless: same pixels, fewer bytes
                except ImportError: pass
                print(sid, file, atlas.size)
            out[suffix] = {'file': files[0], 'sheets': files, 'visible': vis, 'frames': frames}
        hit = shape(sid, sp, idle, body_h, foot)
        sprites.setdefault('enemies', {})[sid] = {**out[''], 'height': HEIGHT_K[sid], 'small': out['-small'], 'hit': hit, 'source': sp['folder']}
        print(' ', sid, hit)
    import importlib.util
    spec = importlib.util.spec_from_file_location('ptm', os.path.join(ROOT, 'tools', 'art', 'pack-trio-motion.py')); ptm = importlib.util.module_from_spec(spec); spec.loader.exec_module(ptm)
    with open(sprites_path, 'w') as fh: fh.write(ptm.compact(json.dumps(sprites, ensure_ascii=False, indent=1)) + '\n')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--hit']
    main(args or PACK, '--hit' in sys.argv)
