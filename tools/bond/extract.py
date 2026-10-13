#!/usr/bin/env python3
"""Reproducible source crops only. No drawing, resampling, or generated pixels."""
from pathlib import Path
import hashlib
import json
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'data/art/ui/bond'
REF = ROOT / 'docs/bond-ui/reference'
m = json.loads((OUT / 'bond-ui-manifest.json').read_text())
m['assets'] = [a for a in m['assets'] if not a.get('derived')]
for a in m['assets']:
    a['source_type'] = 'sprite-sheet (provided extraction)'
    a['source_file'] = 'SOURCE_ORIGINAL_UNCHANGED.png (not supplied)'
    a['verification'] = 'provided file SHA256 checked; full source unavailable'
m['references'] = {
    'desktop.jpg': 'https://drive.google.com/file/d/1IJz97PWR1LsuOvjy4Dia0tkHEx9jh4ZS/view',
    'mobile-a.jpg': 'https://drive.google.com/file/d/131O_SuhA6cLGgyQhXwFAN5MvyTLKcah2/view',
    'mobile-b.jpg': 'https://drive.google.com/file/d/1oTqJWlPJh2Ks8O6l6IO7hbPWBeFcS0Lz/view',
}
def crop(name, source, rect, mask=None, supplied=False):
    im = Image.open((OUT if supplied else REF) / source).convert('RGBA').crop(rect)
    if mask:
        a = np.array(im)
        # Background removal only. RGB is always original; JPEG softness remains.
        rgb = a[:, :, :3].astype(float)
        if mask == 'dark':
            keep = rgb.mean(2) < 150
        elif mask == 'cream':
            keep = (rgb[:, :, 0] > 200) & (rgb[:, :, 1] > 175) & (rgb[:, :, 2] > 135)
        else:
            keep = (rgb[:, :, 0] > rgb[:, :, 2] * 1.35) & (rgb[:, :, 0] > 120) & (rgb[:, :, 1] > 90)
        a[:, :, 3] = np.where(keep, a[:, :, 3], 0)
        im = Image.fromarray(a)
    if supplied and (name.startswith('activity_') or name == 'memory_book_icon'):
        from scipy.ndimage import binary_fill_holes
        a = np.array(im)
        rgb = a[:, :, :3].astype(float)
        if name == 'memory_book_icon':
            keep = (rgb[:, :, 0] > 125) & (rgb[:, :, 1] > 90)
        else:
            background = (rgb[:, :, 0] > 218) & (rgb[:, :, 1] > 171) & (rgb[:, :, 2] > 100)
            keep = binary_fill_holes(~background)
        a[:, :, 3] = np.where(keep, a[:, :, 3], 0)
        im = Image.fromarray(a)
        mask = 'foreground mask; enclosed source colors preserved'
    file = OUT / (name + '.png')
    im.save(file)
    m['assets'].append({'name': name, 'file': 'data/art/ui/bond/' + file.name,
        'width': im.width, 'height': im.height, 'source_type': 'provided PNG subcrop' if supplied else 'preview',
        'source_file': source, 'source_xyxy': rect, 'alpha_mask': mask or 'unchanged',
        'rgb_preserved': True, 'derived': True, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})

crop('section_book', 'mobile-b.jpg', (79, 428, 129, 470), 'dark')
crop('section_plant', 'mobile-b.jpg', (77, 711, 124, 753), 'dark')
crop('section_gift', 'mobile-b.jpg', (81, 916, 124, 960), 'dark')
crop('section_branch', 'mobile-b.jpg', (78, 1097, 133, 1145), 'dark')
crop('footer_feather', 'mobile-b.jpg', (91, 1271, 138, 1336), 'dark')
crop('header_birds', 'mobile-a.jpg', (85, 200, 209, 276), 'gold')
crop('tab_paw', 'mobile-b.jpg', (249, 339, 297, 382), 'cream')
crop('title_lotus', 'header_lotus_banner.png', (57, 27, 150, 96), 'gold', supplied=True)
crop('tab_bird', 'mobile-a.jpg', (595, 328, 649, 372), 'dark')
crop('header_close', 'mobile-b.jpg', (778, 152, 845, 221))
# Text-free corners, border and paper from the approved preview record; inner blank strip tiles vertically.
crop('record_paper', 'mobile-b.jpg', (209, 486, 579, 500))
crop('record_corner_tl', 'mobile-b.jpg', (69, 479, 87, 497))
crop('record_corner_tr', 'mobile-b.jpg', (777, 479, 795, 497))
crop('record_corner_bl', 'mobile-b.jpg', (69, 557, 87, 575))
crop('record_corner_br', 'mobile-b.jpg', (777, 557, 795, 575))
# Original extracted activity art; remove surrounding card via alpha, retaining its existing RGB.
crop('activity_fishing_icon', 'activity_card_fishing.png', (43, 16, 137, 105), supplied=True)
crop('activity_cooking_icon', 'activity_card_cooking.png', (79, 16, 178, 105), supplied=True)
crop('activity_study_icon', 'activity_card_study.png', (72, 15, 180, 107), supplied=True)
crop('activity_explore_icon', 'activity_card_explore.png', (72, 12, 207, 112), supplied=True)
crop('memory_book_icon', 'button_memory_book.png', (56, 22, 157, 98), supplied=True)
# Keep parent frame decorations fixed; strips below contain no icons/text.
crop('paper_tile', 'main_window_frame.png', (100, 100, 280, 280), supplied=True)
crop('header_texture', 'header_lotus_banner.png', (260, 24, 346, 95), supplied=True)
crop('record_texture', 'parchment_record_frame.png', (90, 60, 260, 120), supplied=True)
crop('memory_texture', 'button_memory_book.png', (180, 28, 300, 92), supplied=True)
crop('tab_active_frame', 'character_tab_brown.png', (0, 0, 262, 88), supplied=True)
crop('tab_idle_frame', 'character_tab_papyrus.png', (0, 0, 250, 84), supplied=True)
for name, source, cuts in [('header_border', 'header_lotus_banner.png', (30, 20)), ('memory_border', 'button_memory_book.png', (20, 20))]:
    im = Image.open(OUT / source).convert('RGBA')
    a = np.array(im); x, y = cuts
    a[y:-y, x:-x, 3] = 0
    im = Image.fromarray(a); file = OUT / (name + '.png'); im.save(file)
    m['assets'].append({'name': name, 'file': 'data/art/ui/bond/' + file.name, 'width': im.width, 'height': im.height,
        'derived': True, 'source_type': 'provided PNG subcrop', 'source_file': source, 'alpha_mask': 'interior removed for separate texture/ornaments',
        'rgb_preserved': True, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
# Reassemble the disconnected original strips underneath the original corners.
src = Image.open(OUT / 'main_window_frame.png').convert('RGBA')
frame = Image.new('RGBA', src.size)
pieces = [(90, 0, 120, 38), (90, 351, 120, 389), (0, 90, 38, 120), (351, 90, 389, 120)]
for i, rect in enumerate(pieces):
    tile = src.crop(rect)
    for at in range(0, 389, tile.width if i < 2 else tile.height):
        frame.alpha_composite(tile, (at, 0 if i == 0 else 351) if i < 2 else (0 if i == 2 else 351, at))
for x, y in [(0, 0), (335, 0), (0, 335), (335, 335)]:
    frame.alpha_composite(src.crop((x, y, x + 54, y + 54)), (x, y))
file = OUT / 'window_border.png'; frame.save(file)
m['assets'].append({'name': 'window_border', 'file': 'data/art/ui/bond/window_border.png', 'width':389,'height':389,
    'derived':True,'source_type':'provided PNG assembly','source_file':'main_window_frame.png','source_rectangles':pieces,
    'method':'original strips tiled under original corner pixels; no resizing or painting', 'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
m['limitations'] = ['Full original sprite sheet was absent from the ZIP and was not found in Drive by filename.',
    'Drive previews are JPEG files despite .png names; small extracted ornaments retain source antialiasing/compression.',
    'No AI image generation, repainting, color quantization or synthetic sharpening.']
(OUT / 'bond-ui-manifest.json').write_text(json.dumps(m, ensure_ascii=False, indent=2) + '\n')
print(f'{len(m["assets"])} PNGs catalogued; {sum(bool(a.get("derived")) for a in m["assets"])} additional crops')
