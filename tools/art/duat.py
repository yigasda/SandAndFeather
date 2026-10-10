"""Legacy grid fallback for Duat, in the game's native 16px tile scale.

The live Ombos entrance uses data/scene-art.json and data/art/*.png as of 0.8.9.
This generator retains the historical grids used by the full tile rebuild.

Individual overlapping rock silhouettes follow the supplied day/night study.
Broad lit caps, broken sides, unequal feet and light from upper left.
The existing doorway is painted separately in front of the central recess.
"""
from px import Pic, to_grid, preview

LINE = '#725338'
TOP = '#F7E4B9'
RIM = '#FFEECB'
FACE = '#D4AC72'
LIGHT = '#E6C58C'
SIDE = '#B2895C'
FOOT = '#AC8054'


def polygon(p, points, color):
    """Integer scanline fill, with no antialiasing or new pixel scale."""
    for y in range(min(v[1] for v in points), max(v[1] for v in points) + 1):
        hits = []
        for (x1, y1), (x2, y2) in zip(points, points[1:] + points[:1]):
            if min(y1, y2) <= y + .5 < max(y1, y2):
                hits.append(x1 + (y + .5 - y1) * (x2 - x1) / (y2 - y1))
        hits.sort()
        for a, b in zip(hits[::2], hits[1::2]):
            for x in range(int(a), int(b) + 1): p.put(x, y, color)


def cliff():
    # Reference coordinates are retained so the silhouette is not regenerated
    # from a shared cylinder template. Scale: 0.28 native pixels per study pixel.
    p = Pic(112, 84)
    def pts(values):
        return [(round((x - 245) * .28), round((y - 60) * .28)) for x, y in values]
    def mass(body, cap, side, facets=(), faults=()):
        q = Pic(p.w, p.h)
        polygon(q, pts(body), '#DFB477')
        if side: polygon(q, pts(side), '#B88853')
        for shape, color in facets: polygon(q, pts(shape), color)
        polygon(q, pts(cap), '#FFE5B0')
        for shape in faults: polygon(q, pts(shape), '#A37749')
        q.outline('#725033')
        p.paste(q, 0, 0)
    # Back saddle, with an uneven low left shoulder.
    mass([(301,139),(313,128),(340,127),(349,145),(354,211),(337,269),(298,294),(283,278),(284,202)],
         [(302,140),(314,130),(338,130),(347,146),(326,158),(296,160)],
         [(340,142),(348,149),(350,213),(331,270),(320,279),(326,207)])
    mass([(328,123),(345,112),(384,111),(395,115),(423,119),(436,140),(437,238),(419,281),(330,289),(314,244),(319,170)],
         [(329,122),(346,114),(383,113),(396,118),(418,120),(425,131),(401,140),(353,143),(323,138)],
         [(418,134),(431,138),(435,238),(417,280),(395,282),(402,186)],
         [([(326,146),(341,147),(334,225),(322,254),(318,223)], '#EDC78E')])
    mass([(393,95),(405,82),(440,79),(472,91),(485,126),(476,209),(397,214),(388,167)],
         [(396,95),(406,84),(439,82),(469,93),(475,106),(446,115),(397,114)],
         [(469,104),(482,126),(474,206),(449,214),(451,128)])
    # Dominant high rock. Its sloping right face continues behind the doorway.
    mass([(441,80),(448,63),(477,62),(494,64),(505,62),(535,67),(554,76),(562,111),(567,137),(558,185),(570,215),(570,279),(546,307),(485,298),(438,263),(431,194),(433,122)],
         [(445,79),(449,65),(477,64),(494,67),(505,65),(534,70),(550,77),(551,89),(535,101),(506,102),(481,108),(444,101),(437,94)],
         [(538,98),(553,84),(558,112),(563,137),(552,181),(558,211),(566,216),(567,278),(545,302),(526,298),(518,248),(526,208),(516,163),(530,138)],
         [([(445,103),(462,106),(454,156),(459,182),(448,203),(442,253),(435,226),(435,158)], '#EBC48A'),
          ([(508,109),(523,105),(521,125),(509,138),(504,134)], '#C79960')],
         [[(520,172),(535,178),(545,190),(539,188),(530,181),(518,177)]])
    # Right rear mass joins the map edge; a shorter foreground boulder hides its foot.
    mass([(570,145),(581,134),(609,133),(619,139),(628,148),(638,152),(655,179),(659,306),(636,338),(582,329),(557,281),(558,206)],
         [(572,145),(583,136),(608,136),(618,142),(625,151),(618,160),(597,164),(570,159)],
         [(624,160),(639,155),(655,180),(654,303),(635,335),(620,321),(626,255)],
         [([(567,168),(578,166),(574,223),(566,244),(559,231)], '#EDC78E')])
    # The two feet have different widths, slopes and ground levels.
    mass([(244,211),(252,198),(276,198),(299,204),(308,216),(303,243),(308,272),(299,300),(284,309),(260,304),(250,281),(246,253)],
         [(247,211),(254,201),(275,200),(295,207),(304,216),(299,226),(278,234),(248,229)],
         [(294,231),(304,219),(300,246),(305,272),(296,298),(283,305),(283,278),(290,259)],
         [([(250,232),(261,232),(257,268),(265,287),(258,291),(251,276)], '#F0CC94')])
    mass([(498,251),(511,235),(539,225),(568,225),(599,234),(611,250),(614,279),(606,304),(616,325),(605,353),(573,356),(542,347),(507,338),(494,307),(492,279)],
         [(501,252),(513,238),(540,229),(567,228),(595,237),(607,252),(596,261),(576,263),(561,270),(528,268),(498,264)],
         [(586,265),(608,253),(611,279),(602,304),(612,326),(601,350),(576,352),(568,330),(575,304)],
         [([(502,271),(516,274),(508,300),(515,325),(506,330),(498,307)], '#EDC58C')],
         [[(534,286),(542,289),(545,300),(541,297),(538,291),(532,290)]])
    # A few broad chips tie the cliff to the sand, without filling it with gravel.
    for body, cap in [
        ([(271,312),(277,300),(292,296),(305,305),(300,320),(283,322)], [(277,305),(292,299),(301,306),(292,312),(275,312)]),
        ([(317,302),(324,290),(341,293),(347,306),(338,318),(322,315)], [(322,300),(327,293),(340,296),(342,304),(328,309)]),
        ([(460,322),(462,306),(474,301),(483,311),(480,326),(469,330)], [(465,308),(473,304),(480,312),(473,318),(463,316)])]:
        q=Pic(p.w,p.h);polygon(q,pts(body),'#CDA16A');polygon(q,pts(cap),'#F2D49D');q.outline('#A77D50');p.paste(q,0,0)
    return p


def guardian():
    # Seated, left-facing Anubis with upright ears and a pale stone plinth.
    p = Pic(24, 38)
    p.rect(1, 28, 22, 9, '#A98B62')
    p.rect(2, 28, 19, 2, '#F1DBAE')
    p.rect(3, 31, 17, 5, '#D8BB88')
    p.rect(3, 31, 17, 1, '#EDD4A5')
    p.rect(20, 30, 2, 6, '#A17D51')
    p.rect(3, 26, 18, 3, '#2D2723')
    polygon(p, [(8,12),(14,12),(16,17),(16,22),(20,25),(19,28),(6,28),(6,22),(8,19)], '#252321')
    p.rect(8, 15, 2, 8, '#494640')
    p.rect(6, 22, 3, 5, '#161719')
    p.rect(12, 22, 3, 5, '#171719')
    p.rect(6, 26, 4, 1, '#D7AD4E')
    p.rect(12, 26, 4, 1, '#D7AD4E')
    polygon(p, [(8,5),(14,5),(16,9),(13,13),(9,14),(4,12),(3,10),(8,9)], '#202022')
    polygon(p, [(8,8),(8,1),(9,0),(10,4),(10,8)], '#202022')
    polygon(p, [(12,7),(13,0),(14,1),(15,8)], '#202022')
    p.rect(9, 3, 1, 4, '#B98F3F')
    p.rect(13, 3, 1, 3, '#E4BC59')
    p.put(9, 9, '#FBE098')
    p.rect(4, 11, 4, 1, '#DAB552')
    p.rect(8, 14, 7, 2, '#D5A94F')
    p.rect(9, 14, 5, 1, '#F4D780')
    p.rect(8, 20, 2, 3, '#E8C25E')
    p.rect(12, 20, 2, 3, '#C59A42')
    p.outline('#4B3B2C')
    return p


def build_all():
    return {'duat_cliff': cliff(), 'duat_guardian': guardian()}


if __name__ == '__main__':
    import argparse
    import json
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--write', type=Path)
    mode.add_argument('--check', type=Path)
    parser.add_argument('--preview', type=Path)
    args = parser.parse_args()
    picture = cliff()
    if args.write:
        data = json.loads(args.write.read_text())
        data['things'].update({k: to_grid(v) for k, v in build_all().items()})
        args.write.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
    if args.check:
        assert all(json.loads(args.check.read_text())['things'][k] == to_grid(v) for k, v in build_all().items())
        print('Duat cliff and guardian match the generator')
    if args.preview: preview([picture], args.preview, z=4)
