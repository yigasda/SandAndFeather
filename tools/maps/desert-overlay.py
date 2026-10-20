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


def atlas(ids, out, fixtures, label, plans=None):
    """Full-resolution source plus a separate legend panel; never edits source art."""
    out.mkdir(parents=True, exist_ok=True)
    colors={'exit':'#ed5cff','feet':'#52ff8a','mate':'#54e6ff','gap':'#fff176','old':'#acb3bd'}
    for ident in ids:
        plan=(plans or {}).get(ident,{})
        data_path=ROOT/f'data/maps/{ident}.json';registered=data_path.exists()
        d=json.loads(data_path.read_text()) if registered else {'name':plan['name'],'source':{'art':'사막맵/'+plan['file'],'collision':'사막맵/충돌/'+plan['file']},'entries':{},'exits':[]}
        src=d['source'];art=Image.open(ROOT/src['art']).convert('RGB');w,h=art.size
        px=d['authoredCollision']['pixelWalk']['pixelsPerTile'] if registered else 52/1.55
        pending={}
        for candidate in plan.get('candidates',[]):
            name=candidate['id'];pending[name]=candidate
            existing=next((e for e in d['exits']if e['id']==name),None)
            if not existing:
                points=candidate['polygon'];xs,ys=zip(*points)
                d['exits'].append({'id':name,'polygon':[[x/px,y/px]for x,y in points],'x0':min(xs)/px,'y0':min(ys)/px,'x1':max(xs)/px,'y1':max(ys)/px,'to':candidate['to'],'at':candidate['at']})
            if candidate.get('landing'):
                x,y=candidate['landing'];d['entries'][name]={'x':x/px-.5,'y':y/px-.8,'dir':candidate.get('dir','up')}
            if candidate.get('follower'):
                x,y=candidate['follower'];fixtures.setdefault(ident,{})[name]={'follower':{'x':x/px-.5,'y':y/px-.8}}

        mask=np.asarray(Image.open(ROOT/src['collision']).convert('RGBA'))[...,3]>=128
        applied=walk_mask(d['authoredCollision']['pixelWalk']) if registered else mask;arr=np.asarray(art).copy();arr[edge(mask)]=[255,72,62]
        arr[mask!=applied]=[255,230,0]
        names=list(dict.fromkeys([e['id']for e in d['exits']]+list(d['entries'])))
        top=82;panel=w+48;H=max(h+top+30,260+len(names)*145)
        im=Image.new('RGB',(w+790,H),'#151e28');im.paste(Image.fromarray(arr),(24,top));g=ImageDraw.Draw(im)
        def txt(x,y,t,c='white',size=23):
            limit=(w-24) if x<panel else im.width-x-24
            while size>12 and g.textlength(t,font=font(size))>limit:size-=1
            assert g.textlength(t,font=font(size))<=limit, f'overlay text overflow: {t}'
            g.text((x,y),t,font=font(size),fill=c)
        short={'desert_buried_temple':'02 매몰 신전','desert_colonnade':'15 열주홀','desert_votive_hall':'T2 봉헌품 회랑','desert_forecourt_west':'T1W 서쪽 앞뜰','desert_forecourt_east':'T1E 동쪽 앞뜰','desert_guardian_gate':'T3 수호문 전당','desert_lightwell':'16 빛우물','desert_city_gate':'11 도시 출입구','desert_city_plaza':'17 지하 광장','desert_quiet_dunes':'03 고요한 사구'}
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
        incoming={}
        for source_file in (ROOT/'data/maps').glob('desert_*.json'):
            source_data=json.loads(source_file.read_text())
            for entry_exit in source_data.get('exits',[]):
                if entry_exit['to']==ident and isinstance(entry_exit.get('at'),str):incoming.setdefault(entry_exit['at'],[]).append((source_data['id'],entry_exit['id']))
        rows=[]
        for i,name in enumerate(names,1):
            e=next((e for e in d['exits']if e['id']==name),None);p=d['entries'].get(name);y=225+(i-1)*145
            color='#ffb84d' if name in pending else colors['exit']if e else colors['old'];txt(panel,y,f'{i}. {name}'+('  [결정 대기 / 후보]'if name in pending else '  [현재 출구]'if e else '  [현재 진입 착지]'if name in incoming else '  [보존 착지·출구 없음]'),color,size=23)
            shape=None
            if e:
                points=[(x*px,y*px)for x,y in e.get('polygon',[(e['x0'],e['y0']),(e['x1'],e['y0']),(e['x1'],e['y1']),(e['x0'],e['y1'])])];shape=Polygon(points)
                g.line([pt(*p)for p in points+[points[0]]],fill=color,width=4);tag(shape.centroid.x,shape.centroid.y,i,color)
                txt(panel,y+30,('현재 '+short.get(e['to'],e['to'])+' / '+str(e['at'])) if name in pending and pending[name].get('currentConflict') else '→ '+short.get(e['to'],e['to'])+' / '+str(e['at']),size=20)
            if not e and name in incoming:txt(panel,y+30,'← '+' · '.join(short.get(mid,mid)+'/'+eid for mid,eid in incoming[name]),size=20)
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
            else:txt(panel,y+58,pending.get(name,{}).get('sharedLandingNote','같은 이름 착지 없음: 목적지의 지정 착지 사용'),colors['old'],size=18)
            tested=(ident,name)in{('desert_buried_temple','temple'),('desert_colonnade','south'),('desert_colonnade','stair'),('desert_votive_hall','west')}
            tested = tested or name in plan.get('verified',[])
            txt(panel,y+112,pending[name]['note'] if name in pending else '실제 왕복 검증 완료'if tested else '현재 묶음 실보행 미검증 / 보존 상태', '#ffc66d'if name in pending else '#87e8ac'if tested else '#ffc66d',size=18)
            rows.append({'number':i,'name':name,'exit':e,'landing':p,'follower':f,'footGapPx':gap,'testedCurrentBundle':tested})
        txt(24,H-26,(f'충돌 원본/적용 차이 {int((mask!=applied).sum())}px' if registered else '미등록 후보: 원본 충돌 기준')+' · 주황=미적용 후보 / 후보 동행은 설계 좌표, 보행 검증 아님',size=18)
        im.save(out/f'{ident}-full-overlay.png');(out/f'{ident}-full-overlay.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')


def city_review(out):
    """Review original 11/17 passages without proposing new runtime geometry."""
    out.mkdir(parents=True, exist_ok=True)
    maps=[json.loads((ROOT/f'data/maps/{ident}.json').read_text()) for ident in ('desert_city_gate','desert_city_plaza')]
    arts=[Image.open(ROOT/d['source']['art']).convert('RGB') for d in maps]
    offsets=[(24,210),(1080,210)]
    im=Image.new('RGB',(2878,1840),'#151e28');g=ImageDraw.Draw(im)
    def text(x,y,s,width,size=27,color='white'):
        # Wrap by measured glyph width; retain legibility rather than shrink long labels.
        line=''
        for char in s:
            if g.textlength(line+char,font=font(size))>width:
                g.text((x,y),line,font=font(size),fill=color);y+=size+10;line=''
            line+=char
        if line:g.text((x,y),line,font=font(size),fill=color);y+=size+10
        assert y<im.height-20, 'city review legend exceeds canvas'
        return y
    text(24,16,'11 · 17 원본 통로 비교 — 연결 결정용 / 런타임 변경 없음',2800,37)
    text(24,72,'현재 도시 길: 02 작은 문 → 11 바깥길 → 11-A 석문 → 17-A 계단',2800)
    text(24,112,'신규 신전 순환안: 02 큰 문 → 15 → T2 남쪽 → 같은 11-A 석문 → 11 바깥길 → 02 작은 문',2800,27,'#ffbc65')
    for art,(ox,oy),title in zip(arts,offsets,('11 매몰도시 출입구 · 원본 1024×1536','17 지하도시 광장 · 원본 1774×887')):
        im.paste(art,(ox,oy));text(ox,170,title,art.width,25)
    def mark(index,xy,label,color='#ffbc65'):
        ox,oy=offsets[index];x,y=xy[0]+ox,xy[1]+oy
        g.ellipse((x-28,y-28,x+28,y+28),fill='#151e28',outline=color,width=4)
        g.text((x-10,y-19),label,font=font(28),fill=color)
    mark(0,(715,330),'A');mark(1,(1740,470),'A','#ed5cff')
    for xy,label in [((180,355),'B'),((617,295),'C'),((1265,290),'D'),((885,205),'E')]:mark(1,xy,label,'#54e6ff')
    # These broad boundary boxes are historical values, not newly selected doors.
    d=maps[0];px=d['authoredCollision']['pixelWalk']['pixelsPerTile'];ox,oy=offsets[0]
    historical=[]
    for e in d['exits']:
        if e['id'] not in ('left','bottom'):continue
        x0,y0,x1,y1=[e[k]*px for k in ('x0','y0','x1','y1')]
        historical.append({'id':e['id'],'sourceBox':[x0,y0,x1,y1]})
        for x in np.arange(x0,x1,20):
            for y in (y0,y1):g.line((ox+x,oy+y,ox+min(x+10,x1),oy+y),fill='#aab2bb',width=4)
        for y in np.arange(y0,y1,20):
            for x in (x0,x1):g.line((ox+x,oy+y,ox+x,oy+min(y+10,y1)),fill='#aab2bb',width=4)
    x=1100;y=1125
    rows=[('11-A ↔ 17-A', '현재 한 쌍인 석문·오른쪽 계단. T2 남쪽도 11-A를 요청하여 목적지가 충돌합니다.', '#ffbc65'),
          ('11 회색 점선', '왼쪽 전체 범위·아래쪽 출구는 과거부터 보존된 경계값입니다. 새 문턱 승인이나 별도 석문을 뜻하지 않습니다.', '#aab2bb'),
          ('17-B / C / D', '그림상 왼쪽 작은 문 / 중앙 주거 문 / 오른쪽 기록보관소 문. 기존 주거·18 역할 확인 없이 외부 연결로 재지정하지 않습니다.', '#54e6ff'),
          ('17-E 뒤쪽 골목', '화면 위로 이어지는 독립 통로로 확정할 수 없습니다. 승인 충돌에서 위쪽 151개 행(y=0…150)에 걸을 수 있는 픽셀이 없습니다.', '#54e6ff'),
          ('남은 결정', '11-A의 도시 연결을 유지할지, T2 연결로 바꿀 경우 17 접근을 어디에 둘지 사용자 지정이 필요합니다. 새 통로·착지·문턱은 적용하지 않았습니다.', '#ffbc65')]
    for title,body,color in rows:
        y=text(x,y,title,1720,27,color);y=text(x,y,body,1720,25)+15
    text(24,1760,'원본 무수정 · 그림 표식은 통로 식별용이며 출구 트리거 후보 폴리곤이 아닙니다.',2800,25)
    im.save(out/'11-17-passage-review.png')
    mask=np.asarray(Image.open(ROOT/maps[1]['source']['collision']).convert('RGBA'))[...,3]>=128
    evidence={'runtimeCommit':'dea6fedbd6445e6902891658a7b60e490ff5bcc9','sourceSizes':[list(a.size)for a in arts], 'historicalBoundaries':historical,'plazaTop151RowsWalkablePixels':int(mask[:151].sum()),'runtimeChanged':False,'decision':'11-A current 17 vs proposed T2; no alternate external route approved'}
    (out/'11-17-passage-review.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')


def city_reroute_review(out):
    """Latest user route proposal: drawings and static checks only."""
    out.mkdir(parents=True, exist_ok=True)
    px=52/1.55
    specs=[('desert_forecourt_east','T1E-C · 중앙 남쪽 → 17-A',[(800,860),(1210,860),(1230,886),(780,886)],(1000,780),'up',(970,810)),
           ('desert_city_plaza','17-A · 오른쪽 계단 → T1E-C',[(1754,430),(1773,430),(1773,515),(1754,515)],(1623,570),'left',(1593,600))]
    im=Image.new('RGB',(3620,1320),'#151e28');g=ImageDraw.Draw(im);results=[]
    def text(x,y,t,width=1740,size=25,color='white'):
        line=''
        for ch in t:
            if g.textlength(line+ch,font=font(size))>width:
                g.text((x,y),line,font=font(size),fill=color);y+=size+9;line=''
            line+=ch
        g.text((x,y),line,font=font(size),fill=color)
        assert y+size<im.height
        return y+size+12
    text(24,15,'최신 도시 접근안: T1E-C ↔ 17-A / 후보 검토만 · 게임 연결 미변경',3500,35)
    text(24,65,'빨강: 수동 충돌 경계 · 주황: 문턱 후보 · 초록: 착지 발/진입방향 · 하늘: 동행 후보 · 보라: 17 기존 출구',3500)
    for i,(ident,title,poly,landing,direction,mate) in enumerate(specs):
        d=json.loads((ROOT/f'data/maps/{ident}.json').read_text());art=Image.open(ROOT/d['source']['art']).convert('RGB')
        mask=np.asarray(Image.open(ROOT/d['source']['collision']).convert('RGBA'))[...,3]>=128
        arr=np.asarray(art).copy();arr[edge(mask)]=[255,65,65];ox=24+i*1810;oy=160
        im.paste(Image.fromarray(arr),(ox,oy));text(ox,115,title)
        g.line([(ox+x,oy+y)for x,y in poly+[poly[0]]],fill='#ffb84d',width=4)
        if i==1:
            g.rectangle((ox+1760,oy+402,ox+1773,oy+537),outline='#ed5cff',width=2)
            for x,y in [(180,355),(885,205)]:
                g.line((ox+x-20,oy+y-20,ox+x+20,oy+y+20),fill='#ff6060',width=5)
                g.line((ox+x-20,oy+y+20,ox+x+20,oy+y-20),fill='#ff6060',width=5)
            for x,y,t in [(617,295,'C 세부맵 보존'),(1265,290,'D 세부맵 보존')]:
                g.text((ox+x-80,oy+y-50),t,font=font(23),fill='white',stroke_width=3,stroke_fill='black')
        def feet(c,color):
            x,y=c;b=(x-.28*px,y-.18*px,x+.28*px,y+.16*px)
            g.rectangle(tuple(v+(ox if j%2==0 else oy)for j,v in enumerate(b)),outline=color,width=3)
            return bool(mask[int(b[1]):int(b[3])+1,int(b[0]):int(b[2])+1].all()),b
        clear,b=feet(landing,'#52ff8a');mateclear,_=feet(mate,'#54e6ff')
        ax,ay=ARROW[direction];x,y=landing;end=(x+ax*65,y+ay*65)
        g.line((ox+x,oy+y,ox+end[0],oy+end[1]),fill='#52ff8a',width=5)
        g.polygon([(ox+end[0],oy+end[1]),(ox+end[0]-ax*15+ay*9,oy+end[1]-ay*15-ax*9),(ox+end[0]-ax*15-ay*9,oy+end[1]-ay*15+ax*9)],fill='#52ff8a')
        shape=Polygon(poly);pm=Image.new('1',art.size);ImageDraw.Draw(pm).polygon(poly,fill=1)
        blocked=int((np.asarray(pm)&~mask).sum());gap=shape.distance(shape_box(*b))
        target=(1000,865)if i==0 else (1763,475)
        pathclear=True
        for t in np.linspace(0,1,301):
            xx=x+(target[0]-x)*t;yy=y+(target[1]-y)*t
            if not mask[int(yy-.18*px):int(yy+.16*px)+1,int(xx-.28*px):int(xx+.28*px)+1].all():pathclear=False
        ytext=text(ox,1070,f'착지 ({x}, {y}) {direction} / 발↔문턱 {gap:.1f}px / 문턱 내부 막힌 픽셀 {blocked}',size=25)
        ytext=text(ox,ytext,('중앙 열린 길에서 안쪽 광장으로 진입. 이전 후보 좌표 유지.'if i==0 else '사용자 기존 착지 유지. 기존 출구의 막힌 모서리를 피한 문턱 후보.'),size=25)
        text(ox,ytext,'동행·착지 발 정합 및 직선 발 경로는 정적 검사. 실제 왕복·카메라·입력 유지·저장 검증 전.',size=24)
        results.append({'map':ident,'polygon':poly,'landing':landing,'dir':direction,'followerCandidate':mate,'landingFeetClear':clear,'followerFeetClear':mateclear,'polygonBlockedPixels':blocked,'footGapPx':gap,'straightFootPathClear':pathclear})
    im.save(out/'T1E-C-17-A-candidates.png')
    (out/'checks.json').write_text(json.dumps({'runtimeChanged':False,'candidates':results},ensure_ascii=False,indent=2)+'\n')
    # Expanded route strips repeat a map only to keep every connection legible.
    # All ports use source-image coordinates; originals are uniformly scaled to 50%.
    im=Image.new('RGB',(6500,5250),'#151e28');g=ImageDraw.Draw(im)
    files={'02':'02_매몰신전사막.png','15':'15_열주홀.png','T2':'T2_무너진봉헌품회랑.png','11':'11_매몰도시출입구.png','T1W':'T1W_서쪽제례앞뜰.png','T1E':'T1E_동쪽제례앞뜰.png','17':'17_지하도시광장.png','T3':'T3_신전수호문전당.png','16':'16_빛우물.png'}
    ports={'02':{'A':(935,328),'B':(1500,676)},'15':{'A':(1720,615),'C':(10,420),'D':(995,875)},'T2':{'A':(887,85),'B':(10,550),'C':(1763,550),'D':(885,875)},'11':{'A':(715,332),'바깥길':(300,1450)},'T1W':{'A':(1515,117),'B':(1230,880)},'T1E':{'A':(1700,295),'B':(310,760),'C':(1000,875)},'17':{'A':(1763,475)},'T3':{'A':(512,1520),'N':(512,420)},'16':{'A':(512,1520)}}
    strips=[('필수 신전 순환 · 11은 전체 신전 출구', ['02','15','T2','11','02'], [('A','D'),('C','B'),('D','A'),('바깥길','B')], '#e4b95f'),
            ('앞뜰 순환 · 민트 하나만 유지', ['15','T1W','T1E','T2'], [('A','A'),('B','B'),('A','C')], '#62e5ca'),
            ('도시 분기 · 기존 11↔17 대체', ['T1E','17'], [('C','A')], '#65baff'),
            ('빛우물 경로 · T3 북문 잠금 조건 미정', ['T2','T3','16'], [('A','A'),('N','A')], '#aaaabb')]
    g.text((60,25),'신전 + 도시 최신 연결 검토도',font=font(50),fill='white')
    g.text((60,95),'모든 선은 왕복 · 같은 이름의 반복 그림은 같은 맵 · 실제 포트 표식 / 그림 50% 동일 배율 · 런타임 미적용',font=font(30),fill='white')
    for r,(title,names,links,color) in enumerate(strips):
        top=300+r*1200;g.text((60,top-140),title,font=font(38),fill=color)
        placed=[]
        for j,name in enumerate(names):
            art=Image.open(ROOT/'사막맵'/files[name]).convert('RGB');art=art.resize((art.width//2,art.height//2),Image.Resampling.LANCZOS)
            ox=200+j*1250;oy=top;im.paste(art,(ox,oy));placed.append((ox,oy,art.width,art.height))
            g.text((ox,oy-55),name,font=font(36),fill='white')
        def point(j,key):
            ox,oy,w,h=placed[j];sx,sy=ports[names[j]][key];return (ox+sx*.5,oy+sy*.5)
        # Alternating outside lanes separate incoming and outgoing segments.
        for j,(pa,pb)in enumerate(links):
            start=point(j,pa);end=point(j+1,pb);lane=top+850 if j%2==0 else top-85
            # Each connector reaches a dedicated gutter by the shortest horizontal
            # segment to the nearest picture side, then stays in dark canvas.
            pts=[]
            for idx,pnt in [(j,start),(j+1,end)]:
                ox,oy,w,h=placed[idx];side=ox-45 if pnt[0]<ox+w/2 else ox+w+45
                if idx==j and names[idx] in ('T1W','T3'):side=ox-85
                pts.append((pnt,(side,pnt[1]),(side,lane)))
            path=list(pts[0])+list(reversed(pts[1]));g.line(path,fill=color,width=5)
            label=f'{names[j]}-{pa} ↔ {names[j+1]}-{pb}'
            if names[j]=='T3':label+=' / 잠금 미정'
            xx=(pts[0][-1][0]+pts[1][-1][0])/2;tw=g.textlength(label,font=font(29))
            g.rectangle((xx-tw/2-14,lane-24,xx+tw/2+14,lane+24),fill='#151e28');g.text((xx-tw/2,lane-21),label,font=font(29),fill=color)
            for pnt,key in [(start,pa),(end,pb)]:
                x,y=pnt;g.ellipse((x-21,y-21,x+21,y+21),fill='#151e28',outline=color,width=4)
                if key=='바깥길':key='길'
                g.text((x-g.textlength(key,font=font(25))/2,y-17),key,font=font(25),fill=color)
        if r==2:
            for k,line in enumerate(['17-C·D: 기존 세부맵 연결 보존','17-B·E: 사용자 X 제외 / 대체 출구로 사용하지 않음','폐기: T1E-C ↔ T1W-B 노란 연결 및 W-B 좌우 분할안']):
                g.text((2900,top+150+k*65),line,font=font(32),fill='white')
    g.text((60,5120),'11 왼쪽·아래 출구는 과거 보존 경계값. 그림의 길 표식은 대표 위치이며 새 문턱 승인이 아닙니다.',font=font(30),fill='white')
    im.save(out/'route-review.png')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('ids', nargs='*')
    parser.add_argument('--out', type=Path, default=OUT)
    parser.add_argument('--label', default='DATA OVERLAY (not a game capture)')
    parser.add_argument('--proposal', type=Path, help='Review-only JSON: map, exit, source-pixel polygon and landing')
    parser.add_argument('--atlas-fixtures', type=Path, help='Full source + separate legend with runtime initial follower fixtures')
    parser.add_argument('--atlas-plans', type=Path, help='Review-only unresolved routes, never writes runtime data')
    parser.add_argument('--city-review', action='store_true', help='Side-by-side original 11/17 passage decision review only')
    parser.add_argument('--city-reroute-review', action='store_true', help='Review latest T1E-C to 17-A proposal without runtime edits')
    args = parser.parse_args()
    if args.city_reroute_review:
        city_reroute_review(args.out)
        sys.exit(0)
    if args.city_review:
        city_review(args.out)
        sys.exit(0)
    if args.atlas_fixtures:
        atlas(args.ids, args.out, json.loads(args.atlas_fixtures.read_text()), args.label, json.loads(args.atlas_plans.read_text()) if args.atlas_plans else None)
        sys.exit(0)
    main(args.ids or sorted(p.stem for p in (ROOT / 'data/maps').glob('desert_*.json')), args.out, args.label, json.loads(args.proposal.read_text()) if args.proposal else None)
