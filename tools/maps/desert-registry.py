"""사막 등록표 (docs/OPUS desert plan 2·3·18·20절, ASTRA-DESERT-05-20-GUIDE 1장 연결표).

34 places / 40 approved PNGs (사막맵/manifest.json), each with:
  - the planning number and the runtime map id. Runtime ids are meaning-based (plan 2절); the four big maps first
    shipped as desert_01..04 run under their meaning ids now, saves standing on the old ids move (src/core/state.js);
  - every approved picture of the place (state pictures are not places), its size and sha256, checked against the file;
  - the collision source: the user's picture in 사막맵/충돌/ (sha256, size checked against the art), or none;
  - its links from the guide's table, each with the guide's status (기획 / 채택 / 제안 / 미채택) and whether a portal
    is built and walked;
  - the separate production states (plan 2절): artAccepted, collisionApproved, portalValidated, assetReady, logicReady,
    saveReady, playtestReady. A picture being approved does not set the others.
Writes docs/DESERT-REGISTRY.md and tools/maps/desert-registry.json. Stops on a hash or size mismatch.
  python3 tools/maps/desert-registry.py"""
import hashlib, json, unicodedata
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / '사막맵'

# planning no, runtime id (proposed, meaning based), shipped id (if any), name, pictures (first = base), collision file
PLACES = [
    ('01', 'desert_golden_dunes', 'desert_01', '황금 사구해', ['01_황금사구해_닫힘.png', '01_황금사구해_입구열림.png'], '01.png'),
    ('02', 'desert_buried_temple', 'desert_02', '매몰 신전 사막', ['02_매몰신전사막.png'], '02_매몰신전사막.png'),
    ('03', 'desert_quiet_dunes', 'desert_03', '고요한 사구 (06 통합)', ['03_고요한사구_06통합.png'], '03_고요한사구_06통합.png'),
    ('04', 'desert_dry_flats', 'desert_04', '메마른 모래벌판', ['04_메마른모래벌판.png'], '04_메마른모래벌판.png'),
    ('05', 'desert_pyramid_base', None, '피라미드 기단과 진입로', ['05_피라미드기단.png'], '05_피라미드기단.png'),
    ('07', 'desert_oasis', None, '고요한 오아시스 물가', ['07_고요한오아시스.png'], '07_고요한오아시스.png'),
    ('08', 'desert_caravan_rest', None, '사막 대상의 쉼터', ['08_대상의쉼터.png'], '08_대상의쉼터.png'),
    ('09', 'desert_old_sanctuary', None, '모래에 잠긴 옛 성소', ['09_옛성소.png'], '09_옛성소.png'),
    ('10', 'desert_wind_basin', None, '모래바람 분지', ['10_모래바람분지.png'], '10_모래바람분지.png'),
    ('11', 'desert_city_gate', None, '매몰 도시의 출입구', ['11_매몰도시출입구.png'], '11_매몰도시출입구.png'),
    ('12A', 'desert_descent_upper', None, '첫째 하강 회랑', ['12_1_피라미드하강회랑.png'], '12_1_피라미드하강회랑.png'),
    ('12B', 'desert_descent_lower', None, '둘째 하강 회랑', ['12_2_피라미드하강회랑.png'], '12_2_피라미드하강회랑.png'),
    ('13', 'desert_royal_records', None, '왕의 기록 회랑', ['13_왕의기록회랑.png'], '13_왕의기록회랑.png'),
    ('14', 'desert_pyramid_heart', None, '피라미드 중심실', ['14_피라미드중심실.png'], '14_피라미드중심실.png'),
    ('15', 'desert_colonnade', None, '매몰 신전의 열주홀', ['15_열주홀.png'], '15_열주홀.png'),
    ('16', 'desert_lightwell', None, '신전의 빛 우물', ['16_빛우물.png'], '16_빛우물.png'),
    ('17', 'desert_city_plaza', None, '잊힌 지하 도시의 광장', ['17_지하도시광장.png'], '17_지하도시광장.png'),
    ('17-주거', 'desert_city_dwelling', None, '지하 도시 부속 주거실', ['17_추가_주거실.png'], '17_추가_주거실.png'),
    ('18', 'desert_city_archive', None, '지하 도시의 옛 기록고', ['18_옛기록고.png'], '18_옛기록고.png'),
    ('19', 'desert_star_room', None, '모래 아래 별 관측실', ['19_별관측실.png'], '19_별관측실.png'),
    ('20', 'desert_hidden_spring', None, '바람이 드러낸 지하 샘', ['20_지하샘.png'], '20_지하샘.png'),
    ('추가-보물방', 'desert_treasure_grotto', None, '지하 보물방 (상자 5개)',
     ['추가_보물방/00_상자모두닫힘.png', '추가_보물방/01_C1_왼쪽위_열림.png', '추가_보물방/02_C2_오른쪽위_열림.png',
      '추가_보물방/03_C3_왼쪽아래_열림.png', '추가_보물방/04_C4_오른쪽아래안쪽_열림.png', '추가_보물방/05_C5_오른쪽아래바깥쪽_열림.png'],
     '추가_보물방/00_상자모두닫힘.png'),
    ('추가-전망', 'desert_sky_overlook', None, '오벨리스크 전망맵', ['추가_전망맵_오벨리스크최종.png'], '추가_전망맵_오벨리스크최종.png'),
    ('T1W', 'desert_forecourt_west', None, '서쪽 제례 앞뜰', ['T1W_서쪽제례앞뜰.png'], 'T1W_서쪽제례앞뜰.png'),
    ('T1E', 'desert_forecourt_east', None, '동쪽 제례 앞뜰', ['T1E_동쪽제례앞뜰.png'], 'T1E_동쪽제례앞뜰.png'),
    ('T2', 'desert_votive_hall', None, '무너진 봉헌품 회랑', ['T2_무너진봉헌품회랑.png'], 'T2_무너진봉헌품회랑.png'),
    ('T3', 'desert_guardian_gate', None, '신전 수호문 전당', ['T3_신전수호문전당.png'], 'T3_신전수호문전당.png'),
    ('P1', 'desert_funerary_maze', None, '고대 장례 미궁', ['P1A_고대장례미궁_세로.png'], 'P1A_고대장례미궁_세로.png'),
    ('P2', 'desert_royal_procession', None, '왕면 열병 전실', ['P2_왕면열병전실.png'], 'P2_왕면열병전실.png'),
    ('P3A', 'desert_barque_shrine', None, '부왕 장례전 장례선 봉안실', ['P3A_부왕장례전_장례선봉안실.png'], 'P3A_부왕장례전_장례선봉안실.png'),
    ('P3B', 'desert_sarcophagus_hall', None, '부왕 장례전 석관 안치전', ['P3B_부왕장례전_석관안치전.png'], 'P3B_부왕장례전_석관안치전.png'),
    ('P4', 'desert_collapsed_crypt', None, '무너진 왕릉 하부실', ['P4_무너진왕릉하부실.png'], 'P4_무너진왕릉하부실.png'),
    ('추가-운반로', 'desert_burial_passage', None, '매몰된 부장품 운반로', ['추가_매몰된부장품운반로.png'], '추가_매몰된부장품운반로.png'),
    ('추가-부장고', 'desert_golden_vault', None, '황금 부장고', ['추가_황금부장고.png'], '추가_황금부장고.png'),
]
# collision pictures not drawn by the user (tools/maps/desert-collision.py, fixed and approved by the user)
MADE = {'03_고요한사구_06통합.png', '04_메마른모래벌판.png'}

# links: a, b, guide status, note. Physical moves only; information links (18 → 01 disc → 19) are listed apart.
LINKS = [
    ('옴보스', '01', '사용자 지정', '옴보스 동쪽 끝(강가 야자수 오른쪽) ↔ 01 서쪽 끝 포석길 (사용자 사진)'),
    ('01', '04', '기획', '가장자리 이동, 길 그림 추가 없음'),
    ('04', '03', '기획', '가장자리 이동, 길 그림 추가 없음'),
    ('03', '02', '기획', '가장자리 이동, 길 그림 추가 없음'),
    ('01', '05', '기획', '05 아래쪽 01 귀환 (05.S)'),
    ('05', '12A', '기획 + 두 회랑 채택', '05.N ↔ 12A.N'),
    ('12A', 'P1', '확장 주경로', '12A.S ↔ P1.N'),
    ('P1', '12B', '확장 주경로', 'P1.S ↔ 12B.N'),
    ('12B', '13', '확장 주경로', '12B.S ↔ 13.NW'),
    ('13', 'P2', '확장 주경로', '13.NE ↔ P2.S, 13 문양 봉인 해제 뒤'),
    ('P2', '14', '확장 주경로', 'P2.N ↔ 14.S, 왕면 필수 여부 미정'),
    ('P1', 'P3A', '분기 제안', 'P1.E ↔ P3A.SW'),
    ('P3A', 'P3B', '분기 제안', 'P3A.NE ↔ P3B.SW'),
    ('P3B', 'P4', '분기 제안', 'P3B.E ↔ P4.S'),
    ('P3B', '추가-운반로', '사용자 채택', 'P3B.S ↔ 운반로.NW'),
    ('추가-운반로', '추가-부장고', '사용자 채택', '운반로.NE ↔ 부장고.S'),
    ('04', '07', '기획', '오아시스 분기'),
    ('04', '08', '기획', '쉼터 분기'),
    ('01', '09', '기획', '01 좌상단 성소'),
    ('01', '19', '채택 (발견 후)', '01 원판 열림 상태의 왼쪽 좁은 하강 계단 ↔ 19 왼쪽 곡선 계단'),
    ('02', 'T1W', '확장 주경로', '02 신전 → 서쪽 앞뜰'),
    ('T1W', 'T1E', '채택', '서쪽 오른쪽 문 ↔ 동쪽 왼쪽 아래 계단'),
    ('T1E', '15', '채택', '동쪽 오른쪽 문 ↔ 15'),
    ('15', 'T2', '확장 주경로', ''),
    ('T2', '16', '확장 주경로', '16에 새 출구를 뚫지 않음'),
    ('T2', 'T3', '선택 분기', '같은 길 귀환, T3 뒤 문은 출구 아님'),
    ('02', '11', '기획', '02 우하단 오래된 석조 출구 ↔ 11 외부 쪽'),
    ('11', '17', '기획', '11 계단 아래 ↔ 17 우측 계단 (좌표는 적용 시 확정)'),
    ('17', '17-주거', '채택', '광장 왼쪽 집 입구 ↔ 실내 출구'),
    ('17', '18', '채택', '광장 오른쪽 집 입구 ↔ 기록고 출구'),
    ('02', '10', '기획', '02 오른쪽 출구(풍화 합성)'),
    ('10', '20', '기획 (발견 후)', '분지의 발견 입구 ↔ 샘의 위쪽 계단'),
    ('20', '추가-보물방', '공간 채택, 문턱 미확정', '20 아래쪽 사용자 지정 구역 ↔ 보물방 아래쪽 열린 바닥 가장자리(제안)'),
    ('추가-보물방', '추가-전망', '채택', '보물방 위 계단 ↔ 전망맵 바위 동굴 출입구'),
    ('추가-전망', '워프', '목적지 미확정', '오른쪽 오벨리스크'),
    ('15', '17', '미채택 제안', '기본 그래프에 넣지 않음'),
]
INFO = ['18의 기록 → 01 원판 조사 → 19 개방 (18↔19 직통 문 없음)']

# what is built in the game (runtime) and what was actually walked in the game, per link (a, b) → state
BUILT = {('옴보스', '01'): '걸어서 확인 (0.9.83)', ('01', '04'): '걸어서 확인 (0.9.84)', ('04', '03'): '걸어서 확인 (0.9.84)',
         ('03', '02'): '걸어서 확인 (0.9.84)', ('02', '11'): '데이터만 (작업 브랜치, 걷기 확인 전)', ('11', '17'): '데이터만 (작업 브랜치, 걷기 확인 전)'}


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def nfc(s): return unicodedata.normalize('NFC', s)


def main():
    manifest = {nfc(f['file']): f for f in json.loads((SRC / 'manifest.json').read_text())['files']}
    out, used = [], set()
    shipped = json.loads((ROOT / 'src/core/data.js').read_text().split('export const DESERT = ')[1].split(';')[0].replace("'", '"'))
    for no, rid, old, name, pics, coll in PLACES:
        pictures = []
        for p in pics:
            m = manifest[p]; used.add(p)
            h = sha(SRC / p); size = list(Image.open(SRC / p).size)
            assert h == m['sha256'], f'{p}: sha does not match manifest'
            assert size == m['size'], f'{p}: size does not match manifest'
            pictures.append({'file': f'사막맵/{p}', 'size': size, 'sha256': h, 'source': m['source'], 'note': m.get('note', '')})
        c = SRC / '충돌' / coll
        collision = None
        if c.exists():
            csize = list(Image.open(c).size)
            assert csize == pictures[0]['size'], f'{coll}: collision {csize} is not the art size'
            collision = {'file': f'사막맵/충돌/{coll}', 'sha256': sha(c), 'size': csize,
                         'by': 'Opus (desert-collision.py) + 사용자 수정·승인' if coll in MADE else '사용자'}
        runtime = old if old in shipped else (rid if rid in shipped else None)
        built = {'desert_11': '11', 'desert_17': '17'}
        if not runtime:
            for k, v in built.items():
                if v == no and k in shipped: runtime = k
        out.append({'no': no, 'id': rid, 'shippedAs': runtime, 'name': name, 'pictures': pictures, 'collision': collision,
                    'state': {'artAccepted': True,
                              'collisionApproved': bool(collision),   # 03·04 too (user: "03 04 충돌 승인")
                              'portalValidated': any(no in k and v.startswith('걸어서') for k, v in BUILT.items()),
                              'assetReady': False, 'logicReady': False, 'saveReady': False, 'playtestReady': False}})
    assert len(out) == 34, len(out)
    assert used == set(manifest), f'manifest pictures not registered: {set(manifest) - used}'
    links = [{'a': a, 'b': b, 'guide': st, 'note': n, 'built': BUILT.get((a, b), '없음')} for a, b, st, n in LINKS]
    (ROOT / 'tools/maps/desert-registry.json').write_text(json.dumps({'places': out, 'links': links, 'info': INFO}, ensure_ascii=False, indent=1) + '\n')

    L = ['# 사막 등록표', '', '`python3 tools/maps/desert-registry.py`가 만든다(손으로 고치지 않는다). 기준: 사막맵/manifest.json(34곳·PNG 40장), '
         'ASTRA-DESERT-05-20-GUIDE 1장 연결표, OPUS 사막 계획서 2·3·18·20절. 원본 해시·크기와 충돌 PNG 크기는 만들 때 검사한다.', '',
         '실행 ID는 의미 기반이다. 처음 `desert_01`~`04`로 나간 대형맵 네 곳은 의미 ID로 바뀌었고, 옛 ID에 서 있던 저장 위치(`s.pos.map`)는 저장 13판에서 옮긴다(src/core/state.js).', '',
         '## 공간 34곳', '', '| 번호 | 이름 | 실행 ID(제안) | 현재 게임 | 그림(크기) | 충돌 | 충돌 승인 | 출입 걷기 확인 |', '|---|---|---|---|---|---|---|---|']
    for p in out:
        pic = p['pictures'][0]; extra = f" +상태 {len(p['pictures']) - 1}장" if len(p['pictures']) > 1 else ''
        col = p['collision']['by'] if p['collision'] else '없음'
        L.append(f"| {p['no']} | {p['name']} | `{p['id']}` | {('`' + p['shippedAs'] + '`') if p['shippedAs'] else '—'} | "
                 f"{pic['size'][0]}×{pic['size'][1]}{extra} | {col} | {'○' if p['state']['collisionApproved'] else '×'} | {'○' if p['state']['portalValidated'] else '×'} |")
    L += ['', '충돌 PNG 뜻(35장 모두 같은 방식, 검사함): 그림과 같은 크기, 칠한 곳(한 색) = 바닥, 투명 = 막힘, 경계 1px 부드러움. '
          '게임은 알파 128 이상을 바닥으로 읽어 원본 픽셀 그대로 `pixelWalk`(원본 1px 단위 행별 구간)로 넣는다. 축소·팽창·단순화 없음.', '',
          '모든 공간: artAccepted ○. assetReady·logicReady·saveReady·playtestReady는 전부 ×(상자 패치·장치·퍼즐·저장 미구현).', '',
          '## 연결', '', '| A | B | 문서 상태 | 내용 | 게임 |', '|---|---|---|---|---|']
    for k in links: L.append(f"| {k['a']} | {k['b']} | {k['guide']} | {k['note']} | {k['built']} |")
    L += ['', '정보 연결: ' + '; '.join(INFO), '',
          '## 현재 코드 경로 (조사, 기준 커밋은 등록표를 만든 시점의 HEAD)', '',
          '- 맵 등록: `src/core/data.js` `MAPS`(사막은 `DESERT` 목록) → `data/maps/<id>.json` 로드, 그림은 `data/scene-art.json`의 `<id>` 항목(`fullMap`, `scale` = 16/원본px당 칸, `lazy`). 사막 맵 JSON은 `tools/maps/desert.py`가 만든다(손으로 고치지 않음).',
          '- 이동→충돌: `src/ui/window.js` `frame()`이 0.05초 단위로 `stepPlayer`(`src/world/player.js`) 호출 → 발 상자 `FOOT`(칸 기준 x 0.22–0.78, y 0.62–0.96)를 `GameMap.solidRect`(`src/world/map.js`)로 검사 → pixelWalk 행 구간 안이어야 통과. 맵별 `walkSpeed`·`cameraScale`·`actorScale`.',
          '- 화면: `src/world/render.js` `fitZoom()`(기본 배율 × `cameraScale`), 캐릭터 크기 × `actorScale`. 배경은 `reference-scene.js`가 원본을 `scale`로 그림.',
          '- 출입: 발 중심(`feet()` = x+0.5, y+0.8)이 `exits`의 사각형(칸) 안에 들어가면 `useExit` → `travel(to, at)`. `doorArmed`: 출구 밖으로 한 번 나와야 다시 발동(왕복 루프 방지). `at`은 도착 맵 `entries`의 이름.',
          '- 저장: `src/core/state.js` `getState()` = `ctx().chatMetadata[MODULE]`(채팅별), `saveState()` = `ctx().saveMetadata()`. 위치는 `s.pos {map,x,y,dir}`; `travel`이 이동 전 저장. 없는 맵 ID면 `enterMap`이 옴보스로 되돌림. `STATE_VERSION` 12.',
          '- 사막 맵 ID를 쓰는 곳: `s.pos.map`, `data/scene-art.json`, `data/maps/*.json`의 `exits.to`, `ombos.json` 출구. 다른 저장 필드는 없음(퍼즐·상자 저장은 아직 없음).', '',
          '## 아직 정하지 않은 것 (임의로 채우지 않음)', '',
          '- 세부맵(05~20·T·P·추가) 표시 배율. 대형맵(01~04)은 사용자가 정함: 두아트 대비 44 %, 카메라 60 %, 캐릭터 ×1.6, 걷기 1.4배.',
          '- 실행 ID 교체 시점(옛 ID 별칭·저장 위치 이동).',
          '- 03·04 충돌: Opus 제작 + 사용자 칠한 사구. 사용자 승인 전(현재 0.9.84 배포본에 들어가 있음).',
          '- 20↔보물방 문턱, 전망맵 워프 목적지, P2 왕면 필수 여부, P3 A/B 보스 배치.',
          '- 보물방 상자 열림 상태별 충돌(C4 열림 충돌 PNG만 있음).', '']
    (ROOT / 'docs/DESERT-REGISTRY.md').write_text('\n'.join(L))
    print('34 places,', sum(len(p['pictures']) for p in out), 'pictures,', sum(1 for p in out if p['collision']), 'with collision')


if __name__ == '__main__':
    main()
