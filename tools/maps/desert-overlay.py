"""맵별 검수 그림 (OPUS 사막 계획서 18절 '맵별 검수'): 채택 배경 위에
  빨강 = 사용자 충돌 원본의 경계(알파 128 이상 = 바닥), 파랑 = 게임에 들어간 경계(data/maps의 pixelWalk),
  보라 사각형 = 출입 트리거(발 중심이 들어가면 이동, → 목적지:착지), 초록 = 착지점의 발 상자(FOOT)와 바라보는 방향.
두 경계가 1px이라도 다르면 노랑으로 칠하고 개수를 적는다. 착지마다 발 상자가 바닥 안인지, 발 중심이 출구 트리거
밖인지(도착하자마자 다시 이동하지 않는지) 검사한다.
Writes docs/art/map-expansion/desert-connections-review/<id>-overlay.png and prints a table.
  python3 tools/maps/desert-overlay.py [map id …]"""
import argparse, json, sys, unicodedata
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd
from shapely.geometry import Point, Polygon, box as shape_box
from shapely.ops import nearest_points

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/art/map-expansion/desert-connections-review'
FOOT = {'x0': 0.22, 'x1': 0.78, 'y0': 0.62, 'y1': 0.96}   # src/world/player.js
def font(size=22):
    for f in ('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'):
        if Path(f).exists(): return ImageFont.truetype(f, size)
    return ImageFont.load_default()


ARROW = {'up': (0, -1), 'down': (0, 1), 'left': (-1, 0), 'right': (1, 0)}


def walk_mask(pw):
    m = np.zeros((pw['height'], pw['width']), bool)
    for y, row in enumerate(pw['rows']):
        for i in range(0, len(row), 2): m[y, row[i]:row[i + 1]] = True
    return m


def edge(m): return m ^ nd.binary_erosion(m)


def main(ids, out=OUT, label="DATA OVERLAY (not a game capture)", proposal=None):
    out.mkdir(parents=True, exist_ok=True)
    for ident in ids:
        d = json.loads((ROOT / f'data/maps/{ident}.json').read_text())
        src = d['source']
        art = Image.open(ROOT / unicodedata.normalize('NFC', src['art'])).convert('RGB')
        user = np.asarray(Image.open(ROOT / unicodedata.normalize('NFC', src['collision'])).convert('RGBA'))[..., 3] >= src['floorAlphaAtLeast']
        pw = d['authoredCollision']['pixelWalk']; applied = walk_mask(pw); PX = pw['pixelsPerTile']
        # Review-only source-pixel proposal; never writes runtime map data.
        if proposal and ident == proposal['map']:
            e = next(e for e in d['exits'] if e['id'] == proposal['exit'])
            e['polygon'] = [[x / PX, y / PX] for x, y in proposal['polygon']]
            xs, ys = zip(*e['polygon'])
            e.update(x0=min(xs), y0=min(ys), x1=max(xs), y1=max(ys))
            x, y = proposal['landing']
            d['entries'][proposal['exit']].update(x=x / PX - .5, y=y / PX - .8)
        diff = user != applied
        im = np.asarray(art).astype(float) * 0.75
        im[edge(user)] = [255, 40, 40]
        im[edge(applied) & ~edge(user)] = [40, 120, 255]
        im[diff] = [255, 230, 0]
        img = Image.fromarray(im.astype('uint8')); g = ImageDraw.Draw(img); F = font()
        for e in d['exits']:
            box = [e['x0'] * PX, e['y0'] * PX, e['x1'] * PX, e['y1'] * PX]
            if e.get('polygon'):
                points = [(x * PX, y * PX) for x, y in e['polygon']]
                g.line(points + [points[0]], fill=(220, 0, 255), width=3)
            else:
                g.rectangle(box, outline=(220, 0, 255), width=3)
            g.text((box[0] + 4, box[1] + 4), f"출구 {e['id']} → {e['to']}:{e['at']}", fill=(255, 255, 255), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
        rows = []
        for k, p in d['entries'].items():
            fx0, fx1 = (p['x'] + FOOT['x0']) * PX, (p['x'] + FOOT['x1']) * PX
            fy0, fy1 = (p['y'] + FOOT['y0']) * PX, (p['y'] + FOOT['y1']) * PX
            clear = bool(applied[int(fy0):int(fy1) + 1, int(fx0):int(fx1) + 1].all())
            cx, cy = (p['x'] + 0.5), (p['y'] + 0.8)
            inside = [e['id'] for e in d['exits'] if (Polygon(e['polygon']).covers(Point(cx, cy)) if e.get('polygon') else e['x0'] <= cx <= e['x1'] and e['y0'] <= cy <= e['y1'])]
            # Circle = landing; the small rectangle inside it is the actual collision foot.
            g.ellipse([cx * PX - 17, cy * PX - 17, cx * PX + 17, cy * PX + 17], outline=(0, 255, 90), width=2)
            g.rectangle([fx0, fy0, fx1, fy1], outline=(0, 255, 90), width=3)
            ax, ay = ARROW[p['dir']]; mx, my = (fx0 + fx1) / 2, (fy0 + fy1) / 2
            g.line([mx, my, mx + ax * PX, my + ay * PX], fill=(0, 255, 90), width=3)
            g.text((fx1 + 4, fy0), f'착지 {k}', fill=(0, 255, 90), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
            rows.append(f"  착지 {k}: 발 상자 {'바닥 안' if clear else '막힌 곳에 걸림'}, 출구 트리거 {'안: ' + ','.join(inside) if inside else '밖'}")
        g.text((12, 12), label, fill='white', font=F, stroke_width=2, stroke_fill='black')
        img.save(out / f'{ident}-overlay.png')
        print(f"{ident}: 원본 {user.shape[1]}×{user.shape[0]} / 적용 {pw['width']}×{pw['height']}, 경계 차이 {int(diff.sum())}px, 출구 {len(d['exits'])}개")
        print('\n'.join(rows))


def atlas(ids, out, fixtures, label):
    """Full-resolution source plus a separate legend panel; never edits source art."""
    out.mkdir(parents=True, exist_ok=True)
    colors={'exit':'#ed5cff','feet':'#52ff8a','mate':'#54e6ff','gap':'#fff176','old':'#acb3bd'}
    for ident in ids:
        d=json.loads((ROOT/f'data/maps/{ident}.json').read_text());src=d['source']
        art=Image.open(ROOT/src['art']).convert('RGB');w,h=art.size;px=d['authoredCollision']['pixelWalk']['pixelsPerTile']
        mask=np.asarray(Image.open(ROOT/src['collision']).convert('RGBA'))[...,3]>=128
        applied=walk_mask(d['authoredCollision']['pixelWalk']);arr=np.asarray(art).copy();arr[edge(mask)]=[255,72,62]
        arr[mask!=applied]=[255,230,0]
        names=list(dict.fromkeys([e['id']for e in d['exits']]+list(d['entries'])))
        top=82;panel=w+48;H=max(h+top+30,260+len(names)*145)
        im=Image.new('RGB',(w+790,H),'#151e28');im.paste(Image.fromarray(arr),(24,top));g=ImageDraw.Draw(im)
        def txt(x,y,t,c='white',size=23):g.text((x,y),t,font=font(size),fill=c)
        def pt(x,y):return (x+24,y+top)
        def tag(x,y,t,c):
            x=max(39,min(w+9,x+24));y=max(top+15,min(h+top-15,y+top))
            g.ellipse((x-16,y-16,x+16,y+16),fill='#10151d',outline=c,width=3);g.text((x-8,y-14),str(t),font=font(21),fill=c)
        def foot(p,c):
            b=[(p['x']+.22)*px,(p['y']+.62)*px,(p['x']+.78)*px,(p['y']+.96)*px]
            g.rectangle((b[0]+24,b[1]+top,b[2]+24,b[3]+top),outline=c,width=3)
            return b
        txt(24,13,d['name']+' / '+ident,size=26);txt(24,47,f'원본 {w}×{h} · 전체 그림 유지 · '+label,size=18)
        txt(panel,18,'출입구·착지 정밀 오버레이',size=27)
        for j,(c,t) in enumerate([('#ff483e','빨강: 승인 충돌 경계'),(colors['exit'],'보라: 실제 출구 / 녹색: 착지 발·진입 방향'),(colors['mate'],'하늘: 동행 발 / 노랑: 발↔출구 최소 간격')]):txt(panel,58+j*30,t,c,size=21)
        txt(panel,151,'번호: 출구 / L: 착지 / F: 초기 동행 (세트→호루스)',size=18)
        txt(panel,177,'동행은 실제 초기배치 fixture. 보행 검증 여부는 각 항목 표시.',size=17)
        rows=[]
        for i,name in enumerate(names,1):
            e=next((e for e in d['exits']if e['id']==name),None);p=d['entries'].get(name);y=225+(i-1)*145
            color=colors['exit']if e else colors['old'];txt(panel,y,f'{i}. {name}'+('  [현재 출구]'if e else '  [보존 착지·출구 없음]'),color,size=23)
            shape=None
            if e:
                points=[(x*px,y*px)for x,y in e.get('polygon',[(e['x0'],e['y0']),(e['x1'],e['y0']),(e['x1'],e['y1']),(e['x0'],e['y1'])])];shape=Polygon(points)
                g.line([pt(*p)for p in points+[points[0]]],fill=color,width=4);tag(shape.centroid.x,shape.centroid.y,i,color)
                txt(panel,y+30,'→ '+e['to']+' / '+str(e['at']),size=20)
            gap=None;f=fixtures.get(ident,{}).get(name,{}).get('follower')
            if p:
                b=foot(p,colors['feet']);cx=(p['x']+.5)*px;cy=(p['y']+.8)*px;ax,ay=ARROW[p['dir']]
                end=(cx+ax*38,cy+ay*38);g.line([pt(cx,cy),pt(*end)],fill=colors['feet'],width=3)
                g.polygon([pt(*end),pt(end[0]-ax*10+ay*6,end[1]-ay*10-ax*6),pt(end[0]-ax*10-ay*6,end[1]-ay*10+ax*6)],fill=colors['feet'])
                g.text(pt(cx+13,cy-23),f'{i}L',font=font(18),fill=colors['feet'],stroke_width=2,stroke_fill='black')
                if f:
                    foot(f,colors['mate']);g.text(pt((f['x']+.5)*px-25,(f['y']+.8)*px+8),f'{i}F',font=font(18),fill=colors['mate'],stroke_width=2,stroke_fill='black')
                if shape:
                    a,z=nearest_points(shape_box(*b),shape);gap=a.distance(z);g.line([pt(a.x,a.y),pt(z.x,z.y)],fill=colors['gap'],width=2)
                txt(panel,y+58,f'착지 발 중심 ({cx:.0f}, {cy:.0f}) / {p["dir"]}',colors['feet'],size=20)
                txt(panel,y+85,('발↔짝 출구 '+f'{gap:.1f}px')if gap is not None else '짝 출구 없음 / 기존 시험·저장 착지 보존',colors['gap']if gap is not None else colors['old'],size=19)
            else:txt(panel,y+58,'같은 이름 착지 없음: 목적지의 지정 착지 사용',colors['old'],size=18)
            tested=(ident,name)in{('desert_buried_temple','temple'),('desert_colonnade','south'),('desert_colonnade','stair'),('desert_votive_hall','west')}
            txt(panel,y+112,'실제 왕복 검증 완료'if tested else '현재 묶음 실보행 미검증 / 보존 상태', '#87e8ac'if tested else '#ffc66d',size=18)
            rows.append({'number':i,'name':name,'exit':e,'landing':p,'follower':f,'footGapPx':gap,'testedCurrentBundle':tested})
        txt(24,H-26,f'충돌 원본/적용 차이 {int((mask!=applied).sum())}px · 원본 좌표 기준 · 잠금/미구현 연결을 임의 활성화하지 않음',size=18)
        im.save(out/f'{ident}-full-overlay.png');(out/f'{ident}-full-overlay.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('ids', nargs='*')
    parser.add_argument('--out', type=Path, default=OUT)
    parser.add_argument('--label', default='DATA OVERLAY (not a game capture)')
    parser.add_argument('--proposal', type=Path, help='Review-only JSON: map, exit, source-pixel polygon and landing')
    parser.add_argument('--atlas-fixtures', type=Path, help='Full source + separate legend with runtime initial follower fixtures')
    args = parser.parse_args()
    if args.atlas_fixtures:
        atlas(args.ids, args.out, json.loads(args.atlas_fixtures.read_text()), args.label)
        sys.exit(0)
    main(args.ids or sorted(p.stem for p in (ROOT / 'data/maps').glob('desert_*.json')), args.out, args.label, json.loads(args.proposal.read_text()) if args.proposal else None)
