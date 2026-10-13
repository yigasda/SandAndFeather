#!/usr/bin/env python3
"""Read-only comparison layout; source artwork is never changed."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[2]/'docs/bond-ui'
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',10)
for width, ref, rect in [(320,'mobile-a.jpg',(33,149,844,1393)),(412,'mobile-b.jpg',(34,152,846,1373)),(1280,'desktop.jpg',(180,185,1359,1016))]:
    for view in ['popup','viewport']:
        actual=Image.open(root/'screenshots'/ (f'{width}-full-content.png' if view=='popup' else f'{width}-light-game.png')).convert('RGB')
        reference=Image.open(root/'reference'/ref).convert('RGB')
        if view=='popup':reference=reference.crop(rect)
        reference=reference.resize((actual.width,round(reference.height*actual.width/reference.width)),Image.Resampling.LANCZOS)
        gap=18; top=61
        sheet=Image.new('RGB',(actual.width*2+gap, max(reference.height,actual.height)+top+22),'#e8e5df')
        d=ImageDraw.Draw(sheet)
        d.text((8,8),f'REFERENCE / {width}px',font=font,fill='#252019')
        d.text((actual.width+gap+8,8),'ACTUAL GAME / test fixture',font=font,fill='#252019')
        d.text((8,31),'Same panel width; aspect ratios preserved.',font=small,fill='#51483d')
        d.text((actual.width+gap+8,31),'Full-content tall viewport' if view=='popup' else 'Original viewport capture',font=small,fill='#51483d')
        sheet.paste(reference,(0,top));sheet.paste(actual,(actual.width+gap,top))
        sheet.save(root/f'comparison-{width}-{view}.png')
print('Six source/game comparisons written; game captures kept at native pixels.')
