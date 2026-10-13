#!/usr/bin/env python3
"""시장 새 아이템 53종 그림 의뢰 문서를 게임 데이터에서 만든다(값이 게임과 어긋나지 않게).

  python3 tools/art/market53-docs.py

읽는 것: data/items.json, data/market.json, data/recipes.json, data/festivals.json
쓰는 것: docs/MARKET-53-ITEM-ART-MANIFEST.json (A), docs/MARKET-53-ITEM-ART-GUIDE.md (B), docs/ITEMS-100.md (C)
ko, en, kind, price, about, 쓰임, 시장 조건은 데이터에서 뽑는다. 이 파일에 손으로 적는 것은 그림 설명(모습·색·세부)과 묶음뿐이다.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
D = lambda f: json.loads((ROOT / 'data' / f).read_text())
ITEMS = D('items.json')['items']
MARKET = D('market.json')
RECIPES = D('recipes.json')['recipes']
FEST = D('festivals.json')
OWN = sorted(p.stem for p in (ROOT / 'data/art/items').glob('*.png'))

PHASE1 = ['kyphi', 'frankincense', 'myrrh', 'lotus_oil', 'lily_oil', 'kohl', 'cumin', 'coriander', 'garlic', 'leek', 'lentils',
          'chickpeas', 'sesame', 'cucumber', 'watermelon', 'pomegranate', 'linen', 'oil_lamp', 'clay_bowl', 'reed_pen', 'blank_papyrus',
          'faience_beads', 'carnelian_ring', 'copper_bangle']
PHASE2 = ['doum_fruit', 'carob', 'grapes', 'milk', 'cheese', 'beer_jar', 'wine_jar', 'garlic_seed', 'cucumber_seed', 'watermelon_seed',
          'grape_vine', 'fine_linen', 'reed_mat', 'papyrus_sandals', 'scribe_palette', 'wooden_comb', 'palm_fan', 'lapis_beads',
          'gold_ornament', 'bes_amulet', 'taweret_amulet', 'senet_board', 'lotus_vase', 'small_chest', 'lentil_soup', 'sesame_bread',
          'pomegranate_sweets', 'cucumber_salad', 'watermelon_punch']

# 그림 설명: (모습, 색, 세부). 기존 47종과 헷갈리지 않게 다른 점을 적었다
ART = {
    'kyphi': ('손바닥만 한 짙은 갈색 원뿔형 향 덩이 셋이 작은 도기 받침 접시 위에 놓였다. 한 덩이 끝에서 가는 연기 한 줄.',
              ['#4a2c1a 짙은 갈색', '#7a4a2a 적갈색', '#c8a070 접시 황토', '#e8e0d0 연기'],
              ['덩이 표면에 건포도 알갱이 점', '접시 테두리 검은 선 한 줄', '연기는 위로 S자 한 줄만']),
    'frankincense': ('반투명한 노란 수지 알갱이 대여섯 개가 작은 천 조각 위에 모여 있다. 빛이 비치는 호박색 결정.',
                     ['#f2c94c 밝은 노랑', '#d9a520 호박', '#fff4c0 반사광', '#b89a70 천'],
                     ['알갱이마다 흰 하이라이트 한 점', '모양은 눈물방울·덩어리 섞임', '연기 없음(몰약·키피와 구별)']),
    'myrrh': ('붉은 갈색의 울퉁불퉁한 수지 덩이 두 개. 표면이 거칠고 군데군데 반짝인다.',
              ['#8a3a1a 적갈', '#b5562a 주황 갈색', '#e09060 밝은 면', '#3a1a0a 그림자'],
              ['유향보다 크고 어둡고 불투명', '깨진 단면이 매끈하게 반짝임']),
    'lotus_oil': ('흰 설화석고(알라바스터) 작은 병. 목이 짧고 입구가 넓으며, 병 몸에 푸른 연꽃이 그려졌다. 마개는 천을 감아 묶음.',
                  ['#f3ede0 설화석고', '#d9cfb8 결무늬', '#3a6fb0 연꽃 파랑', '#c99a5a 끈'],
                  ['병에 옅은 줄무늬 결', '연꽃 그림은 꽃 하나', '푸른 연꽃(작물) 그림과 달리 병이 주인공']),
    'lily_oil': ('키 큰 유리질 파이앙스 향유병(목이 가늘고 길다). 병 앞에 흰 백합 한 송이가 기대 있다.',
                 ['#7fc4c0 청록 유약', '#ffffff 백합', '#f2d36b 꽃술', '#2a5a58 윤곽'],
                 ['연꽃 향유 병과 모양이 다름(가늘고 김)', '병 어깨에 노란 띠']),
    'kohl': ('손가락만 한 검은 돌 콜 단지와 끝이 둥근 나무 막대. 단지 입구에 검은 가루.',
             ['#1a1a1a 콜 검정', '#5a5a60 회색 돌', '#9a6a3a 막대', '#c0c0c8 반사'],
             ['단지는 원통형, 뚜껑 없음', '막대는 단지에 꽂힌 채 비스듬히']),
    'cumin': ('목을 끈으로 묶은 작은 마대 주머니가 열려 갈색 길쭉한 씨가 쏟아져 나온다.',
              ['#8a6a3a 쿠민 갈색', '#c9b089 마대', '#5a3f20 그림자', '#e0cfa0 밝은 면'],
              ['씨는 쌀알처럼 길쭉하고 줄무늬', '주머니 끈은 붉은 실']),
    'coriander': ('작은 도기 접시에 담긴 둥근 연둣빛 씨 한 줌과 고수 잎 두 장.',
                  ['#a8b860 연두 씨', '#5f8f3a 잎', '#b5754a 접시', '#d9e0a0 하이라이트'],
                  ['씨는 동그랗고 세로 줄', '잎은 톱니 있는 고수잎']),
    'garlic': ('흰 마늘 세 통을 줄기째 묶은 다발. 껍질에 연보라 줄.',
               ['#f4efe4 흰 껍질', '#c9b6d6 연보라 줄', '#b8a27a 줄기', '#8a7a5a 뿌리'],
               ['양파(둥글고 갈색)와 구별되게 쪽 나뉨선', '뿌리털 짧게']),
    'leek': ('흰 밑동에서 초록 잎이 부채처럼 갈라지는 긴 리크 두 대를 끈으로 묶음.',
             ['#f0f0e0 흰 밑동', '#7fbf5a 연두', '#3f7f3a 짙은 초록', '#c9a060 끈'],
             ['대각선으로 길게 배치', '뿌리 수염 조금']),
    'lentils': ('넓은 도기 그릇에 수북한 붉은 주황 렌틸, 앞에 몇 알 흘림.',
                ['#d9663a 렌틸 주황', '#b5452a 그림자', '#8a5a3a 그릇', '#f0a070 하이라이트'],
                ['알은 납작한 원반', '그릇은 낮고 넓음(보리죽 그릇과 다르게 빈 그릇 테두리 보임)']),
    'chickpeas': ('작은 바구니에 담긴 둥글고 울퉁불퉁한 노란 병아리콩.',
                  ['#e0c070 병아리콩', '#b89a50 그림자', '#a0763a 바구니', '#f5e0a0 밝은 면'],
                  ['콩마다 뾰족한 부리 하나', '바구니 엮음 무늬']),
    'sesame': ('작은 흰 천 주머니가 열려 아이보리 깨알이 쏟아졌다. 옆에 마른 참깨 꼬투리 하나.',
               ['#f2ead2 깨', '#e0d6b8 천', '#9a8a60 꼬투리', '#6a5a3a 윤곽'],
               ['쿠민 주머니(마대·갈색)와 다르게 흰 천·흰 깨', '깨알은 아주 작은 점']),
    'cucumber': ('줄무늬가 있는 길쭉한 초록 오이 하나와 동그랗게 썬 조각 하나.',
                 ['#4f8f3a 초록', '#9fd07a 줄무늬', '#e6f2c8 속살', '#2f5f2a 그림자'],
                 ['단면에 씨 동그라미', '꼭지 끝에 노란 꽃 자국']),
    'watermelon': ('반으로 자른 수박. 붉은 속살과 검은 씨, 두꺼운 초록 줄무늬 껍질.',
                   ['#e0404a 속살', '#2f6f2a 껍질', '#8fcf6a 줄무늬', '#1a1a1a 씨'],
                   ['껍질 안쪽 흰 띠', '앞에 한 조각 썰어 둠']),
    'pomegranate': ('붉은 석류 하나, 위쪽이 갈라져 루비색 알이 보인다. 꼭지에 왕관 모양 꽃받침.',
                    ['#b0202a 껍질', '#e04050 알', '#ffb0b8 반사', '#6a1a1a 그림자'],
                    ['알은 반짝이는 각진 점', '꽃받침 뾰족 다섯']),
    'linen': ('둘둘 만 흰 아마천 한 필, 끝이 조금 풀려 늘어진다. 가장자리에 가는 파란 줄 두 개.',
              ['#f2efe6 흰 천', '#d6d0c0 접힘 그림자', '#3a6fb0 가장자리 줄', '#a09a8a 윤곽'],
              ['천 결이 보이는 가는 가로선', '고운 아마천보다 두껍고 불투명']),
    'oil_lamp': ('손바닥만 한 붉은 흙 등잔(앞이 뾰족한 신발 모양). 주둥이 끝 심지에 작은 불꽃.',
                 ['#b5603a 도기', '#7a3a1a 그림자', '#ffb030 불꽃', '#fff0a0 불빛'],
                 ['기름 고인 윗면 반짝임', '손잡이 고리 하나']),
    'clay_bowl': ('비어 있는 붉은 흙 그릇 하나, 입구 테두리에 검은 띠. 위에서 비스듬히 본 모습.',
                  ['#c0603a 붉은 흙', '#8a3a20 안쪽 그림자', '#2a1a10 검은 띠', '#e08a5a 하이라이트'],
                  ['안이 비어 있음(요리 그릇과 구별)', '바닥 굽 보임']),
    'reed_pen': ('끝을 비스듬히 깎은 가는 갈대 붓 두 자루가 X자로 겹쳤다. 한 자루 끝에 검은 먹.',
                 ['#c9b070 갈대', '#8a7040 마디', '#1a1a1a 먹', '#e8d8a0 하이라이트'],
                 ['마디 선 두세 개', '붓끝 비스듬한 단면']),
    'blank_papyrus': ('반쯤 펼친 깨끗한 연노랑 파피루스 두루마리. 글씨 없음, 가로세로 섬유 결만.',
                      ['#efe0b0 파피루스', '#d6c38a 결', '#b89a5a 말린 끝', '#8a7040 윤곽'],
                      ['젖은 파피루스·저승 두루마리와 달리 얼룩·글씨 없음', '끈 없이 말림']),
    'faience_beads': ('푸른 유약 원통 구슬과 동그란 구슬을 번갈아 꿴 목걸이를 둥글게 놓았다.',
                      ['#2fa0b0 파이앙스 청록', '#1f6f80 그림자', '#bfeef0 반사', '#c9a060 실'],
                      ['풍뎅이 부적(한 개)과 달리 여러 구슬이 고리 모양', '가운데 큰 구슬 하나']),
    'carnelian_ring': ('굵은 금빛 고리 위에 타원형 붉은 홍옥수가 박힌 반지.',
                       ['#c03a2a 홍옥수', '#ff8a6a 반사', '#d4a020 금', '#8a6a10 그림자'],
                       ['돌 안쪽이 반투명하게 밝음', '고리 옆면 보이게 비스듬히']),
    'copper_bangle': ('녹색 녹이 살짝 슨 굵은 구리 팔찌 고리. 겉에 새김 줄 세 개.',
                      ['#c06a3a 구리', '#e09a6a 반사', '#5fa08a 녹', '#6a3a1a 그림자'],
                      ['완전한 원이 아니라 끝이 살짝 벌어진 고리', '녹은 아래쪽에만']),
    'doum_fruit': ('반들반들한 적갈색 둠야자 열매 둘, 하나는 깨져 속의 황갈색 섬유질이 보인다.',
                   ['#8a4a2a 껍질', '#c08040 반사', '#d9b070 속', '#4a2a1a 그림자'],
                   ['열매는 둥근 사각형', '대추야자(송이·작은 알)와 구별']),
    'carob': ('검붉은 납작한 캐럽 꼬투리 세 개, 하나는 휘어 있다.',
              ['#4a2018 꼬투리', '#7a3a28 반사', '#2a100a 그림자', '#a06040 씨 자국'],
              ['꼬투리 표면에 씨 자리 볼록', '반질한 광택']),
    'grapes': ('짙은 보랏빛 포도 한 송이, 위에 초록 포도잎 한 장과 덩굴손.',
               ['#4a2a6a 포도', '#7a5aa0 반사', '#4f8f3a 잎', '#2a1a3a 그림자'],
               ['알마다 흰 분 하이라이트', '무화과(보라 단일 열매)와 구별되는 송이 모양']),
    'milk': ('목이 좁은 흰 우유 주전자(도기)와 앞에 작은 우유 대접. 대접 안은 하얀 우유.',
             ['#e8e0d0 도기', '#ffffff 우유', '#a08a6a 그림자', '#c9b6a0 무늬'],
             ['주전자 입에 우유 한 방울', '주전자 몸에 가는 갈색 띠']),
    'cheese': ('천 위에 놓인 둥근 흰 치즈 한 덩이, 한 조각을 잘라 단면이 보인다.',
               ['#f2ecd8 치즈', '#d6ccb0 껍질', '#b89a70 천', '#8a7a5a 그림자'],
               ['천 자국이 남은 겉면 결', '단면 작은 구멍 없음(염소 치즈)']),
    'beer_jar': ('어깨가 둥근 붉은 흙 단지에 진흙 마개를 대충 덮었다. 입구에 거품.',
                 ['#b5603a 단지', '#7a3a1a 그림자', '#e8d8a0 거품', '#9a7a5a 진흙 마개'],
                 ['봉인된 항아리(봉인 문양)와 달리 마개가 엉성하고 거품', '단지 옆에 빨대 하나']),
    'wine_jar': ('목이 길고 바닥이 뾰족한 암포라형 포도주 단지. 진흙 마개에 둥근 인장 자국, 몸에 검은 글씨 두 줄.',
                 ['#c08a5a 단지', '#8a2a3a 포도주 얼룩', '#4a2a1a 글씨', '#d9b08a 하이라이트'],
                 ['바닥 뾰족해서 받침대에 기대 세움', '봉인된 항아리보다 길쭉함']),
    'garlic_seed': ('흙 묻은 마늘 쪽 다섯 개를 작은 바구니에 담음. 쪽 끝에 초록 싹이 살짝.',
                    ['#efe6d6 마늘 쪽', '#7fbf5a 싹', '#8a6a4a 흙', '#a0763a 바구니'],
                    ['통마늘(마늘)과 달리 낱쪽', '흙 알갱이 몇 개']),
    'cucumber_seed': ('작은 천 위에 흩어진 납작한 흰 오이 씨와 씨앗 봉지 역할의 접은 잎.',
                      ['#f2ecd0 씨', '#c9b089 천', '#5f8f3a 잎', '#8a7a5a 그림자'],
                      ['씨는 길쭉 타원, 아주 작게 여러 개']),
    'watermelon_seed': ('작은 도기 종지에 담긴 까만 수박 씨 한 줌.',
                        ['#1a1a1a 씨', '#5a5a5a 반사', '#b5754a 종지', '#7a4a2a 그림자'],
                        ['씨는 납작 물방울 모양', '종지는 손바닥보다 작음']),
    'grape_vine': ('뿌리를 젖은 흙덩이와 천으로 싼 어린 포도나무 묘목. 잎 세 장과 덩굴손.',
                   ['#6a4a2a 줄기', '#5f9f3a 잎', '#8a6a4a 흙', '#c9b089 천'],
                   ['무화과 묘목(넓은 잎·곧은 줄기)과 달리 구불한 덩굴', '포도알 없음']),
    'fine_linen': ('빛이 비칠 만큼 얇은 흰 천을 접어 쌓았다. 끝단에 금실 술 장식.',
                   ['#fbf8f0 고운 천', '#e6dfcc 비침 그림자', '#d4a020 금실', '#a8a090 윤곽'],
                   ['아마포(두루마리)와 달리 반듯이 접힌 더미', '뒤 배경이 비치는 반투명 표현']),
    'reed_mat': ('갈대를 엮은 노란 돗자리를 반쯤 말아 끈으로 묶었다.',
                 ['#e0c060 갈대', '#b89a40 엮음 그림자', '#7a5a2a 끈', '#f5e090 하이라이트'],
                 ['엮음 격자무늬', '갈대 묶음(재료)과 달리 평평하게 엮인 판']),
    'papyrus_sandals': ('파피루스 줄기를 엮은 샌들 한 켤레, 앞 끝이 위로 살짝 말렸다.',
                        ['#d9c080 파피루스', '#a08a50 엮음', '#6a5a30 끈', '#f0e0a0 하이라이트'],
                        ['엄지 끈 하나와 발등 끈', '한 짝은 옆, 한 짝은 바닥 보이게']),
    'scribe_palette': ('길쭉한 나무 필경사 팔레트. 위쪽에 검정·빨강 먹 홈 둘, 가운데 홈에 갈대 붓 두 자루.',
                       ['#c9a070 나무', '#1a1a1a 검정 먹', '#c0302a 빨강 먹', '#8a6a3a 그림자'],
                       ['팔레트에 작은 상형문자 새김', '갈대 붓(낱개 아이템)과 구별되게 팔레트가 주인공']),
    'wooden_comb': ('한쪽은 굵은 빗살, 등에는 누운 영양이 새겨진 나무 빗.',
                    ['#a0703a 나무', '#6a4a20 새김', '#d9a060 하이라이트', '#3a2a10 윤곽'],
                    ['빗살 촘촘', '영양 실루엣은 단순하게']),
    'palm_fan': ('야자잎을 반원으로 엮어 짧은 나무 자루를 단 부채.',
                 ['#7fa040 야자잎', '#c9b060 마른 잎', '#8a5a2a 자루', '#4a6a2a 그림자'],
                 ['잎맥 방사선', '대추야자 나무(🌴)와 달리 손에 드는 부채']),
    'lapis_beads': ('짙은 파란 청금석 구슬 줄, 사이사이 작은 금 구슬. 금빛 점이 박힌 돌.',
                    ['#1f3f9a 청금석', '#3a5fc0 반사', '#d4a020 금 구슬·점', '#0f1f50 그림자'],
                    ['파이앙스 구슬(청록 유약)보다 진한 남색 돌', '돌 속 금색 점 몇 개']),
    'gold_ornament': ('얇게 두드린 금판 펜던트, 날개를 편 새(독수리) 문양. 작은 고리에 걸었다.',
                      ['#f0c030 금', '#c08a10 그림자', '#fff0a0 반사', '#3a6fb0 눈 상감'],
                      ['날개 깃 선 새김', '우제트·풍뎅이와 다른 넓은 날개 형태']),
    'bes_amulet': ('파이앙스로 만든 베스 신 부적: 혀를 내민 둥근 얼굴, 깃털 관, 짧은 다리. 위에 매다는 고리.',
                   ['#4fb0a0 청록 파이앙스', '#2a6a60 그림자', '#f0d060 깃털 끝', '#1a3a38 윤곽'],
                   ['정면, 손을 무릎에', '무섭기보다 귀엽게']),
    'taweret_amulet': ('하마 몸에 사자 다리, 불룩한 배로 선 타와렛 여신 부적. 파이앙스 연녹색.',
                       ['#8fc0a0 연녹', '#4a7a5a 그림자', '#c9a060 고리', '#2a4a3a 윤곽'],
                       ['옆모습, 두 발로 섬', '배에 둥근 하이라이트']),
    'senet_board': ('나무 상자 모양 세네트 놀이판, 위에 3×10 칸과 둥근·원뿔 말, 옆 서랍이 조금 열림.',
                    ['#a0703a 나무', '#e8d8a0 칸', '#1a3a7a 파란 말', '#f2ece0 흰 말'],
                    ['칸 몇 개에 작은 기호', '던지는 막대 두 개']),
    'lotus_vase': ('연꽃 봉오리 모양의 푸른 파이앙스 화병에 흰·푸른 연꽃 두 송이가 꽂혔다.',
                   ['#2f7fb0 화병', '#9fd0f0 반사', '#ffffff 흰 연꽃', '#3a6fb0 푸른 연꽃'],
                   ['화병 몸에 꽃잎 무늬 새김', '봉인된 항아리와 달리 입구 열린 꽃병']),
    'small_chest': ('흑단 틀에 상아 마름모 무늬를 박은 작은 상자, 둥근 뚜껑에 손잡이 단추와 끈.',
                    ['#2a1a10 흑단', '#f2ead2 상아', '#c9a060 끈', '#d4a020 금 단추'],
                    ['네 다리가 짧게', '뚜껑 살짝 열려 금빛 반짝임']),
    'lentil_soup': ('김이 오르는 깊은 그릇에 담긴 주황빛 렌틸 수프, 위에 초록 잎과 마늘 조각.',
                    ['#d9763a 수프', '#8a5a3a 그릇', '#5f9f3a 잎', '#f0f0e0 김'],
                    ['보리죽(흰 죽)·생선 스튜와 색이 다른 주황', '숟가락 없음']),
    'sesame_bread': ('둥글넓적한 갈색 납작빵 위에 흰 참깨가 촘촘히 뿌려졌다. 한쪽 조각을 찢음.',
                     ['#c08040 빵', '#8a5020 구운 자국', '#f2ead2 참깨', '#e0b070 속'],
                     ['빵(🍞 덩어리)·꿀빵과 달리 납작', '참깨 점이 잘 보이게']),
    'pomegranate_sweets': ('작은 접시에 석류알이 박힌 붉은 사각 과자 세 조각과 대추야자 하나.',
                           ['#b0303a 과자', '#e04050 석류알', '#7a4a2a 대추야자', '#c9a070 접시'],
                           ['무화과 과자(갈색 둥근)와 구별되게 붉은 사각', '윗면 윤기']),
    'cucumber_salad': ('얕은 그릇에 얇게 썬 오이 동그라미와 흰 치즈 덩이, 초록 고명.',
                       ['#7fbf5a 오이', '#e6f2c8 단면', '#f2ecd8 치즈', '#5a8ab0 그릇'],
                       ['시원해 보이게 파란 그릇', '물방울 하이라이트']),
    'watermelon_punch': ('투명한 물빛 그릇에 동그랗게 뜬 수박 알과 포도알이 떠 있는 화채.',
                         ['#e0404a 수박 알', '#4a2a6a 포도', '#bfe6f0 물', '#d9cfb8 그릇'],
                         ['얼음처럼 반짝이는 하이라이트', '그릇은 낮은 대접']),
}

# 그림 작업 묶음 (8~10종, 같은 재질·색끼리)
BATCHES = [
    ('1차-1 향·화장품·장신구', ['kyphi', 'frankincense', 'myrrh', 'lotus_oil', 'lily_oil', 'kohl', 'faience_beads', 'carnelian_ring', 'copper_bangle']),
    ('1차-2 식재료', ['cumin', 'coriander', 'garlic', 'leek', 'lentils', 'chickpeas', 'sesame', 'cucumber', 'watermelon', 'pomegranate']),
    ('1차-3 생활 잡화', ['linen', 'oil_lamp', 'clay_bowl', 'reed_pen', 'blank_papyrus']),
    ('2차-1 식재료·음료', ['doum_fruit', 'carob', 'grapes', 'milk', 'cheese', 'beer_jar', 'wine_jar']),
    ('2차-2 씨앗·직물·잡화', ['garlic_seed', 'cucumber_seed', 'watermelon_seed', 'grape_vine', 'fine_linen', 'reed_mat', 'papyrus_sandals', 'scribe_palette', 'wooden_comb', 'palm_fan']),
    ('2차-3 장신구·진귀품', ['lapis_beads', 'gold_ornament', 'bes_amulet', 'taweret_amulet', 'senet_board', 'lotus_vase', 'small_chest']),
    ('2차-4 새 요리', ['lentil_soup', 'sesame_bread', 'pomegranate_sweets', 'cucumber_salad', 'watermelon_punch']),
]

KIND_KO = {'find': '발견물', 'fish': '물고기', 'crop': '작물', 'seed': '씨앗', 'ingredient': '재료', 'spice': '향신료', 'material': '자재',
           'food': '음식', 'relic': '유물', 'record': '기록', 'incense': '향', 'cosmetic': '화장품', 'goods': '생활 잡화',
           'jewelry': '장신구', 'decor': '장식품'}
ko = lambda i: ITEMS[i]['ko']


def uses(id):
    i, out = ITEMS[id], []
    for r in RECIPES:
        if r['id'] == id:
            out.append('부엌 요리: ' + ' + '.join('/'.join(ko(x) for x in n['any']) if 'any' in n else ko(n['id']) if 'id' in n else n['kind'] for n in r['needs']))
        for n in r['needs']:
            if n.get('id') == id or id in n.get('any', []):
                alt = n.get('any', [])
                out.append(f"{ko(r['id'])} 재료" + (f" ({'/'.join(ko(x) for x in alt)} 중 하나)" if len(alt) > 1 else ''))
    if i.get('grow'):
        g = i['grow']; out.append(f"텃밭: 심고 {g['days']}일 뒤 {ko(g['gives'])} {g['count']}개")
    for k, x in ITEMS.items():
        if x.get('grow', {}).get('gives') == id:
            out.append(f'텃밭 수확({ko(k)})')
    f = i.get('food')
    if f and i['kind'] in ('food', 'ingredient'):
        eff = ' '.join(s for s in [f"회복 {f['heal']}" if f.get('heal') else '', f"공포 −{f['fear']}" if f.get('fear') else ''] if s)
        out.append(('두아트 음식' if i['kind'] == 'food' else '날로 먹기(두아트 챙김)') + f': {eff}' + ' · 거래 모험의 "음식 하나"')
    dd = i.get('duat')
    if dd:
        if dd.get('onEnter'):
            out.append('두아트 챙김, 들어갈 때 씀: ' + ' · '.join(s for s in [f"체력 최대·현재 +{dd['heal']}" if dd.get('heal') else '', f"처음 갈림길 {dd['fear']}곳 공포 안 오름" if dd.get('fear') else ''] if s))
        else:
            out.append(f"두아트 챙김, 싸움 중 {dd.get('verb', '쓰기')}: " + ' '.join(s for s in [f"체력 +{dd['heal']}" if dd.get('heal') else '', f"공포 −{dd['fear']}" if dd.get('fear') else ''] if s))
    o = i.get('offer')
    if o and i['kind'] == 'incense':
        out.append(f"제단 향 피우고 신전 일 돕기: 태양 기운 2→{o.get('sun', 2)}, 신앙 +1, 경험치 +{2 + o.get('xp', 0)}")
    elif o:
        out.append(f"제단 바치기(하루 한 번): 신앙 +{o.get('faith', 1)}" + (f", 경험치 +{o['xp']}" if o.get('xp') else ''))
    s = i.get('study')
    if s:
        out.append('필사실 공부: 한 장 쓰면 태양 기운 2→1' if s.get('use') else f"필사실 공부: 가방에 있으면 경험치 +{s['xp']}(안 닳음)")
    if i.get('rest'):
        out.append(f"앉아 쉬기: 태양 기운 +{i['rest']['sun']} 더(안 닳음)")
    if i.get('festival'):
        out.append(f"축제의 밤: 경험치 +{i['festival']['xp']}(안 닳음)")
    fests = []
    for fe in FEST['festivals']:
        for pr in fe['preps']:
            for o2 in pr.get('or', []):
                if id in o2.get('items', {}) or i['kind'] in o2.get('kind', {}):
                    fests.append(f"{fe['ko']} {pr['ko']}")
    if fests:
        out.append('축제 준비 대신 내기: ' + ', '.join(dict.fromkeys(fests)))
    if i['kind'] in ('jewelry', 'decor', 'incense', 'cosmetic'):
        out.append('도감 수집(' + {'jewelry': '장신구', 'decor': '진귀품', 'incense': '향·화장품', 'cosmetic': '향·화장품'}[i['kind']] + ')')
    out.append(f"팔기 {i['price'] // 2} 데벤")
    return list(dict.fromkeys(out))


def market(id):
    g = next((x for x in MARKET['goods'] if x['id'] == id), None)
    if not g:
        return '시장에 없음'
    cat = next(c['ko'] for c in MARKET['categories'] if c['id'] == g['cat'])
    price = max(1, round(ITEMS[id]['price'] * g.get('mul', 1)))
    cond = []
    if g.get('pool'):
        p = MARKET['daily']['pools'][g['pool']]
        cond.append(f"장신구 묶음: 하루 {round(p['chance'] * 100)}% 확률로 {p['n'][0]}~{p['n'][1]}종만")
    if g.get('rank'): cond.append(f"모험 등급 {g['rank']} 이상")
    if 'chance' in g: cond.append(f"그날 {round(g['chance'] * 100)}% 확률")
    if g.get('festival'): cond.append('축제 준비 기간에만')
    if g.get('parts'): cond.append('시간대 ' + '·'.join({'dawn': '새벽', 'day': '낮', 'evening': '저녁', 'night': '밤'}[x] for x in g['parts']))
    if g.get('stock'): cond.append(f"하루 {g['stock']}개")
    return f"{cat} · {price} 데벤" + (' · ' + ', '.join(cond) if cond else ' · 늘 있음')


def entry(id):
    i = ITEMS[id]
    a = ART[id]
    return {'id': id, 'filename': f'{id}.png', 'ko': i['ko'], 'en': i['en'], 'kind': i['kind'], 'price': i['price'], 'about': i['about'],
            'appearance': a[0], 'colors': a[1], 'details': a[2], 'usage': uses(id), 'market': market(id),
            'phase': 1 if id in PHASE1 else 2}


def main():
    ids = PHASE1 + PHASE2
    assert len(ids) == 53 and len(set(ids)) == 53 and set(ART) == set(ids) and all(i in ITEMS for i in ids)
    assert sorted(sum((b for _, b in BATCHES), [])) == sorted(ids)
    spec = {'size': '128×128 PNG RGBA, 투명 배경', 'style': '기존 승인 아이콘 47종(data/art/items/)과 같은 도트풍: 진한 윤곽선, 왼쪽 위 빛, 3~4단 명암, 테두리·배경 없음',
            'file': 'data/art/items/<id>.png, 받으면 오푸스가 src/ui/itemart.js OWN과 provenance.json에 넣는다'}
    man = {'about': '시장 새 아이템 53종 그림 의뢰서. 값·쓰임·시장 조건은 게임 데이터에서 뽑음(tools/art/market53-docs.py). 그림이 오기 전까지 게임은 이모지로 보인다.',
           'spec': spec, 'batches': [{'name': n, 'ids': b} for n, b in BATCHES], 'items': [entry(i) for i in ids]}
    (ROOT / 'docs/MARKET-53-ITEM-ART-MANIFEST.json').write_text(json.dumps(man, ensure_ascii=False, indent=1) + '\n')

    L = ['# 시장 새 아이템 53종 그림 안내', '',
         '게임에는 0.9.61부터 들어가 있고, 그림이 오기 전까지 이모지로 보인다. 값·쓰임·시장 조건은 게임 데이터에서 뽑았다(`tools/art/market53-docs.py`, 같은 내용의 JSON은 [MARKET-53-ITEM-ART-MANIFEST.json](MARKET-53-ITEM-ART-MANIFEST.json)).', '',
         '## 규격', '', f"- 크기: {spec['size']}", f"- 화풍: {spec['style']}", f"- 파일: {spec['file']}",
         '- 기존 47종과 헷갈리지 않게: 각 항목의 「세부」에 구별점을 적었다.', '',
         '## 권장 작업 묶음', '']
    for n, b in BATCHES:
        L.append(f"- **{n}** ({len(b)}종): " + ', '.join(f'`{x}` {ko(x)}' for x in b))
    for ph, lst in ((1, PHASE1), (2, PHASE2)):
        L += ['', f'## {ph}차 {len(lst)}종', '']
        for id in lst:
            e = entry(id)
            L += [f"### `{id}` {e['ko']} · {e['price']} 데벤 · {KIND_KO[e['kind']]}", '',
                  f"- 모습: {e['appearance']}", f"- 색: {', '.join(e['colors'])}", f"- 세부: {' / '.join(e['details'])}",
                  f"- 쓰임: {' · '.join(e['usage'])}", f"- 시장: {e['market']}", '']
    (ROOT / 'docs/MARKET-53-ITEM-ART-GUIDE.md').write_text('\n'.join(L).rstrip() + '\n')

    C = ['# 아이템 100종 목록', '', '`data/items.json` 전체. 그림: ✅ 승인 그림 적용(`data/art/items/<id>.png`), ⏳ 그림 대기(이모지로 보임). 이 파일은 `tools/art/market53-docs.py`가 만든다.', '',
         f"- 승인 그림 {len(OWN)}종, 그림 대기 {len(ITEMS) - len([i for i in ITEMS if i in OWN])}종", '',
         '| # | id | 이름 | 갈래 | 값 | 그림 | 차수 | 시장 |', '|---|---|---|---|---|---|---|---|']
    for n, (id, i) in enumerate(ITEMS.items(), 1):
        C.append(f"| {n} | `{id}` | {i.get('icon', '')} {i['ko']} | {KIND_KO.get(i['kind'], i['kind'])} | {i['price']} | {'✅ 승인' if id in OWN else '⏳ 대기'} | "
                 f"{'기존' if id not in ids else ('1차' if id in PHASE1 else '2차')} | {market(id)} |")
    (ROOT / 'docs/ITEMS-100.md').write_text('\n'.join(C) + '\n')
    print('items', len(ITEMS), 'approved art', len(OWN), 'new', len(ids))


main()
