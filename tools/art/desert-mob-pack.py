"""사막 몹 그림을 게임 아틀라스로 (B3부터 한 종씩): 몹/사막/<폴더>의 채택 10장(tools/maps/desert-mobs.json에 등록, 해시 검사)을
data/art/enemies/desert-<kind>[-small].png에 넣고 data/sprites.json enemies.<speciesId>를 쓴다(두아트 종은 그대로).
  - 종마다 배율 하나: 대기 세 장을 합친 몸 높이 = HEIGHT_K × 캐릭터 키(atlas의 visible px).
  - 기준점 하나: 10장이 같은 캔버스·같은 칸(manifest)이라 몸 프레임마다 다시 재지 않고, 등록표의 발 기준선 후보(대기 세 장 맨 아래 행,
    그 가운데 x)를 모든 프레임에 쓴다. 공격 섬광이 든 알파 상자로 프레임 크기를 바꾸지 않는다(사용자 보완 지시 A-3).
  - 그림은 다시 그리지 않고 같은 비율로만 줄인다. 슬롯: 00 대기0 · 01 대기1 · 02 대기2 · 03 특수(guard, 항아리는 dormant) ·
    04·05 준비 · 06·07 공격 · 08 피격 · 09 소멸 → idle-0 … disappear(두아트 field.js 이름).
  python3 tools/art/desert-mob-pack.py [speciesId …]   (기본: PACK)"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
REG = json.load(open(os.path.join(ROOT, 'tools', 'maps', 'desert-mobs.json')))
MOTION = {'idle_0': 'idle-0', 'idle_1': 'idle-1', 'idle_2': 'idle-2', 'special': 'guard', 'prepare_0': 'prepare-0', 'prepare_1': 'prepare-1',
          'attack_0': 'attack-0', 'attack_1': 'attack-1', 'hit': 'hit', 'defeat': 'disappear'}
VISIBLE, SMALL, PAD = 256, 125, 2
# body height in characters' heights (the game draws a character 31.2 px × zoom high); normal mobs first, bosses later
HEIGHT_K = {'desert_leather_shield': 1.15}
PACK = ['desert_leather_shield']


def main(ids):
    sprites_path = os.path.join(ROOT, 'data', 'sprites.json'); sprites = json.load(open(sprites_path))
    for sid in ids:
        sp = next(s for s in REG['species'] if s['speciesId'] == sid)
        folder = os.path.join(ROOT, sp['folder'])
        idle = np.maximum.reduce([np.asarray(Image.open(os.path.join(folder, sp['frames'][k]['file'])).getchannel('A')) for k in ('idle_0', 'idle_1', 'idle_2')]) >= 128
        ys = np.nonzero(idle.any(1))[0]; body_h = ys.max() + 1 - ys.min()
        foot = [sp['measured']['footMiddleCandidate'], sp['measured']['footLineCandidate']]
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
            W = sum(p.width + PAD for _, p, _ in pieces); H = max(p.height for _, p, _ in pieces)
            atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = 0; frames = {}
            for mo, piece, pv in pieces:
                atlas.paste(piece, (x, 0)); frames[mo] = [x, 0, piece.width, piece.height, *pv]; x += piece.width + PAD
            file = f'art/enemies/{sid.replace("_", "-")}{suffix}.png'
            os.makedirs(os.path.join(ROOT, 'data', 'art', 'enemies'), exist_ok=True)
            atlas.save(os.path.join(ROOT, 'data', file), optimize=True)
            out[suffix] = {'file': file, 'visible': vis, 'frames': frames}
            print(sid, file, atlas.size)
        sprites.setdefault('enemies', {})[sid] = {**out[''], 'height': HEIGHT_K[sid], 'small': out['-small'], 'source': sp['folder']}
    import importlib.util
    spec = importlib.util.spec_from_file_location('ptm', os.path.join(ROOT, 'tools', 'art', 'pack-trio-motion.py')); ptm = importlib.util.module_from_spec(spec); spec.loader.exec_module(ptm)
    with open(sprites_path, 'w') as fh: fh.write(ptm.compact(json.dumps(sprites, ensure_ascii=False, indent=1)) + '\n')


if __name__ == '__main__':
    main(sys.argv[1:] or PACK)
