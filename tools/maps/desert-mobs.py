"""사막 몹 등록표 (OPUS 사막 계획서 16절, 사용자 보완 지시 2·A-3): 몹/사막/의 채택 12종 × 10모션 = PNG 120장.

For each species: the folder manifest's files checked against the PNGs (sha256, canvas), the ten files mapped to the
common runtime slots (대기 3 · 특수 1 · 준비 2 · 공격 2 · 피격 1 · 소멸 1), what its special slot is (항아리 = 휴면,
the others = guard picture; a guard picture is not a guard rule), its attack family name from the file names, the zones
the plan gives it (사용자 보완 지시 1: 후보 종, 개체 수·좌표 아님), and reference measurements:
  - every frame's alpha box, recorded only. The frames share one canvas and one cell offset (folder manifest), so they
    are drawn at one scale and one pivot; the boxes (attack flashes included) never resize a frame.
  - a foot line candidate: the lowest opaque row of the three idle frames, and its middle. Pivot, movement collider,
    hurt box, attack box and launch socket stay null until they are set on the game screen (B3, then per species).
Separate effect pictures (not one of the ten frames, not counted in the 120): the sun mirror's attack beam
(docs/art/desert-sun-mirror-motion-revisions-2026-10-16/beam.png, user: "태양거울은 별도의 공격 광선 png가 있습니다").
The ancient devices (몹/하위몹/고대장치, ring and hourglass, 2 × 10) are a separate set and not counted here.
Writes docs/DESERT-MOBS.md, tools/maps/desert-mobs.json and docs/consult/desert/mobs/sheet.png. Stops on a mismatch.
  python3 tools/maps/desert-mobs.py"""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / '몹/사막'
SHEET = ROOT / 'docs/consult/desert/mobs'
SLOTS = ['idle_0', 'idle_1', 'idle_2', 'special', 'prepare_0', 'prepare_1', 'attack_0', 'attack_1', 'hit', 'defeat']
# folder, species id (meaning based, proposed), name, role, zones the plan lists it in (role zones; T1 = T1W·T1E, P3 = P3A·P3B)
SPECIES = [
    ('01_봉인항아리', 'desert_sealed_jar', '봉인 항아리', 'normal', ['T1', 'T2', '17']),
    ('02_가죽방패병', 'desert_leather_shield', '가죽 방패병', 'normal', ['T1', 'P1']),
    ('03_봉인방패병', 'desert_sealed_shield', '봉인 방패병', 'normal', ['P1', 'P2']),
    ('04_걸음비석', 'desert_walking_stela', '걸음 비석', 'normal', ['P1', 'P4', '10']),
    ('05_태양거울', 'desert_sun_mirror', '태양거울', 'normal', ['T2']),
    ('06_천칭파수꾼', 'desert_balance_sentinel', '천칭 파수꾼', 'normal', ['T3']),
    ('07_빈가면사제_장막형', 'desert_mask_priest_mantle', '빈 가면 사제 장막형', 'normal', ['T2']),
    ('08_빈가면사제_수의형', 'desert_mask_priest_shroud', '빈 가면 사제 수의형', 'normal', ['P3']),
    ('09_왕면수문장', 'desert_royal_mask_warden', '왕면 수문장', 'boss', ['P2']),
    ('10_신전수문장', 'desert_temple_warden', '신전 수문장', 'boss', ['T3']),
    ('11_왕좌수문장', 'desert_throne_warden', '왕좌 수문장', 'boss', ['P3']),
    ('12_파릉수문장', 'desert_broken_tomb_warden', '파릉 수문장', 'boss', ['P4']),
]
# effect pictures drawn on their own layer (EFFECTS[speciesId] = [(name, folder, manifest key)]): placed at the launch socket,
# turned to the attack direction, cut at the first wall; length, hit and display scale are set in the game
EFFECTS = {'desert_sun_mirror': [('beam', 'docs/art/desert-sun-mirror-motion-revisions-2026-10-16', 'beam')]}
ZONES = {'T1': 'T1W·T1E 제례 앞뜰', 'T2': 'T2 무너진 봉헌품 회랑', 'T3': 'T3 신전 수호문 전당', 'P1': 'P1 고대 장례 미궁',
         'P2': 'P2 왕면 열병 전실', 'P3': 'P3A·P3B 부왕 장례전', 'P4': 'P4 무너진 왕릉 하부실',
         # added by the user outside the seven combat zones (2026-10-19: "지하도시 광장에 항아리몹", "모래바람분지에 비석몹")
         '17': '17 지하 도시 광장(사용자 추가)', '10': '10 모래바람 분지(사용자 추가)'}
# zones whose extra species is still open (user: "고대 장례 미궁에 몹추가(미정)")
OPEN = {'P1': 'P1 고대 장례 미궁: 몹 추가(종 미정, 사용자 2026-10-19)'}


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def alpha_box(a):
    ys, xs = np.nonzero(a >= 128)
    return [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]


def main():
    top = json.loads((SRC / 'manifest.json').read_text())
    assert top['count'] == 120 and len(top['monsters']) == 12, 'not 12 × 10'
    canv = {m['name']: m['canvas'] for m in top['monsters']}
    out = []
    for folder, sid, name, role, zones in SPECIES:
        fm = json.loads((SRC / folder / 'manifest.json').read_text())
        assert len(fm['frames']) == 10, folder
        frames, alphas = {}, []
        for slot, f in zip(SLOTS, fm['frames']):
            p = SRC / folder / f['file']
            assert sha(p) == f['sha256'], f'{folder}/{f["file"]}: sha does not match its manifest'
            im = Image.open(p); assert im.mode == 'RGBA' and list(im.size) == fm['canvas'] == canv[folder], f'{folder}/{f["file"]}: canvas'
            a = np.asarray(im)[..., 3]; alphas.append(a)
            frames[slot] = {'file': f['file'], 'state': f['state'], 'sha256': f['sha256'], 'alphaBox': alpha_box(a)}
        special = fm['frames'][3]['state']
        assert special in ('guard', 'dormant'), f'{folder}: slot 3 is {special}'
        attack = fm['frames'][6]['state'].rsplit('_', 1)[0]
        idle = np.maximum.reduce(alphas[:3]) >= 128
        ys = np.nonzero(idle.any(1))[0]; foot_y = int(ys.max()) + 1
        xs = np.nonzero(idle[foot_y - 6:foot_y].any(0))[0]
        effects = {}
        for ename, efolder, key in EFFECTS.get(sid, []):
            em = json.loads((ROOT / efolder / 'manifest.json').read_text())[key]
            ef = ROOT / efolder / em['file']; im = Image.open(ef)
            assert im.mode == 'RGBA', f'{ef}: not RGBA'
            effects[ename] = {'file': f'{efolder}/{em["file"]}', 'sha256': sha(ef), 'size': list(im.size), 'direction': em['direction'],
                              'originApproxNormalized': em['originApproxNormalized'], 'usage': em['usage'], 'applied': False}
        out.append({'folder': f'몹/사막/{folder}', 'speciesId': sid, 'name': name, 'role': role, 'zones': zones,
                    'canvas': fm['canvas'], 'sharedCellOffset': fm.get('sharedNominalCellOffset'),
                    'special': special, 'attackFamily': attack, 'frames': frames, 'effects': effects,
                    'measured': {'idleBox': alpha_box(np.maximum.reduce(alphas[:3])), 'footLineCandidate': foot_y,
                                 'footMiddleCandidate': int((xs.min() + xs.max() + 1) // 2)},
                    'runtime': {'pivot': None, 'moveCollider': None, 'hurtBox': None, 'attackBox': None, 'launchSocket': None,
                                'displayScale': None, 'guardRule': None, 'applied': False}})
    assert sum(len(s['frames']) for s in out) == 120
    (ROOT / 'tools/maps/desert-mobs.json').write_text(json.dumps({'species': out, 'slots': SLOTS, 'zones': ZONES}, ensure_ascii=False, indent=1) + '\n')

    # sheet: each species' ten frames on their own shared canvas, scaled together, the foot line candidate in green
    SHEET.mkdir(parents=True, exist_ok=True)
    F = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 18)
    CELL = 150; rows = []
    for s in out:
        cw, ch = s['canvas']; k = CELL / max(cw, ch)
        row = Image.new('RGB', (CELL * 10 + 220, CELL + 26), (236, 228, 212)); d = ImageDraw.Draw(row)
        d.text((6, CELL // 2), f"{s['name']}\n{s['special']} · {s['attackFamily']}", fill='black', font=F)
        for i, slot in enumerate(SLOTS):
            im = Image.open(ROOT / s['folder'] / s['frames'][slot]['file'])
            im = im.resize((round(cw * k), round(ch * k)), Image.LANCZOS)
            x0 = 220 + i * CELL; row.paste(im, (x0, 0), im)
            fy = s['measured']['footLineCandidate'] * k
            d.line([x0, fy, x0 + cw * k, fy], fill=(0, 160, 60), width=1)
            d.text((x0 + 4, CELL + 4), f'{i:02} {slot}', fill='black', font=F)
        rows.append(row)
    sheet = Image.new('RGB', (rows[0].width, sum(r.height for r in rows)), 'white'); y = 0
    for r in rows: sheet.paste(r, (0, y)); y += r.height
    sheet.save(SHEET / 'sheet.png')

    L = ['# 사막 몹 등록표', '', '`python3 tools/maps/desert-mobs.py`가 만든다(손으로 고치지 않는다). 기준: 몹/사막/manifest.json과 종별 manifest(12종 × 10 = PNG 120장, '
         '해시·캔버스 검사함), OPUS 사막 계획서 15·16절, 사용자 보완 지시 1·6·7. 고대장치(몹/하위몹/고대장치, 고리·모래시계 2종 × 10)는 별도 묶음이라 여기 넣지 않는다.', '',
         '게임 적용 전이다(`runtimeApplied: false`). 아래 피벗·충돌·피격·공격 범위·발사 소켓·표시 배율·가드 규칙은 비워 두고 게임 화면에서 정한다(B3 가죽 방패병부터).', '',
         '## 공통 슬롯', '', '| 슬롯 | 00 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 |', '|---|---|---|---|---|---|---|---|---|---|---|',
         '| 뜻 | 대기 0 | 대기 1 | 대기 2 | 특수(가드 그림, 항아리는 휴면) | 준비 0 | 준비 1 | 공격 0 | 공격 1 | 피격 | 소멸 |', '',
         '특수 칸이 가드 그림이라고 가드 규칙이 생기지 않는다. 가드는 종별 데이터로 따로 정한다(방패병 가드를 다른 종에 일괄 적용하지 않음).', '',
         '## 12종', '', '| 폴더 | 종 ID(제안) | 이름 | 역할 | 후보 구역 | 캔버스 | 특수 칸 | 공격 이름(파일) | 발 기준선 후보(대기 세 장 맨 아래 행, 가운데 x) |',
         '|---|---|---|---|---|---|---|---|---|']
    for s in out:
        L.append(f"| {s['folder'].split('/')[-1]} | `{s['speciesId']}` | {s['name']} | {'보스' if s['role'] == 'boss' else '일반'} | "
                 f"{', '.join(ZONES[z] for z in s['zones'])} | {s['canvas'][0]}×{s['canvas'][1]} | {s['special']} | {s['attackFamily']} | "
                 f"y {s['measured']['footLineCandidate']}, x {s['measured']['footMiddleCandidate']} |")
    L += ['', '사용자 추가 배치(2026-10-19): 봉인 항아리 → 17 지하 도시 광장, 걸음 비석 → 10 모래바람 분지. 7구역 밖이며 개체 수·좌표는 화면으로 확인받는다. '
          '미정: ' + '; '.join(OPEN.values()) + '.']
    L += ['', '## 별도 효과 그림 (10장에 들지 않음, 120장에 세지 않음)', '']
    for s in out:
        for ename, e in s['effects'].items():
            L.append(f"- {s['name']} {ename}: [`{e['file']}`](../{e['file']}) {e['size'][0]}×{e['size'][1]}, sha256 `{e['sha256'][:12]}…`, "
                     f"방향 {e['direction']}, 발사점 약 {e['originApproxNormalized']}(정규화). {e['usage']} "
                     '몸 프레임(06·07 light_attack)에는 근접 빛·발사점만 있고 긴 광선은 이 그림이다. 그림을 늘려 벽 뒤까지 보이게 하지 않고, 첫 벽에서 자른다(계획서 16절).')
    L += ['', '보스 4종: 신전 수문장(T3), 왕면 수문장(P2), 왕좌 수문장(P3, 추천안 P3B 한 개체), 파릉 수문장(P4). 전투 역할 구역 7곳 = 실제 공간 9곳'
          '(T1W·T1E, P3A·P3B 분할)이며 34공간에 다시 더하지 않는다. 후보 종은 개체 수·좌표가 아니다.', '',
          '## 프레임별 알파 상자 (기록만, 크기 조절에 쓰지 않음)', '',
          '같은 종의 10장은 한 캔버스·한 칸 기준(manifest `sharedNominalCellOffset`)이라 한 배율·한 피벗으로 그린다. 공격 섬광까지 들어간 알파 상자로 프레임마다 몸 크기를 바꾸지 않는다.', '']
    for s in out:
        L.append(f"- {s['name']}: " + ' · '.join(f"{i:02} {v['alphaBox']}" for i, v in enumerate(s['frames'].values())))
    L += ['', '## 확인 그림', '', '[`docs/consult/desert/mobs/sheet.png`](consult/desert/mobs/sheet.png): 종마다 10장을 같은 캔버스·같은 배율로, 초록 선 = 발 기준선 후보.']
    (ROOT / 'docs/DESERT-MOBS.md').write_text('\n'.join(L) + '\n')
    print(len(out), 'species,', sum(len(s['frames']) for s in out), 'frames, hashes OK')


if __name__ == '__main__':
    main()
