'use strict';
/* ぷらんと日記 - ゲームデータ(すべて自作) */
var D = {};
D.YEAR = 24; D.SLEN = 6;
D.SEASONS = ['春', '夏', '秋', '冬'];
D.STAGES = ['たね', '発芽', '幼苗', '成長期', 'つぼみ', '開花', '結実', '休眠', '枯死'];
D.CATS = ['観葉', '多肉', 'ハーブ', '野菜', '花', '樹木', '水草', 'コケ'];
D.PLACE_ORDER = ['window', 'balcony', 'garden', 'greenhouse', 'aquarium'];
D.PL = { w: 'window', b: 'balcony', g: 'garden', h: 'greenhouse', a: 'aquarium' };

/* 場所: tm=[気温の倍率, 足す値](外の気温から室温を作る) */
D.PLACES = {
  window: { n: '窓辺', slots: 3, light: .62, tm: [.5, 10], hum: .42, wind: .12, rain: 0, pest: .2, indoor: true, cost: 0, need: 0, desc: 'あたたかい室内。はじめの置き場所。' },
  balcony: { n: 'ベランダ', slots: 4, light: .85, tm: [1, .5], hum: .5, wind: .5, rain: .5, pest: .5, indoor: false, cost: 150, need: 3, desc: '日ざしと風がほどよく届く。雨も少し当たる。' },
  garden: { n: '庭・畑', slots: 6, light: 1, tm: [1, -.5], hum: .55, wind: .7, rain: 1, pest: .8, indoor: false, cost: 400, need: 6, desc: '広くて日あたり満点。雨や虫とも仲よくなろう。' },
  greenhouse: { n: '温室', slots: 4, light: .8, tm: [.5, 13], hum: .75, wind: .2, rain: 0, pest: .1, indoor: true, cost: 900, need: 12, desc: '一年中あたたかく、しっとり。' },
  aquarium: { n: '水槽', slots: 3, light: .7, tm: [.15, 20], hum: 1, wind: 0, rain: 0, pest: 0, indoor: true, water: true, cost: 600, need: 9, desc: '水草とコケのための、水の世界。' }
};

D.WEATHER = {
  sun: { n: '晴れ', light: 1, dt: 0, hum: 0, wind: 0, rain: 0 },
  cloud: { n: 'くもり', light: .6, dt: -1.5, hum: .1, wind: .05, rain: 0 },
  rain: { n: '雨', light: .3, dt: -2.5, hum: .35, wind: .1, rain: .5 },
  snow: { n: '雪', light: .35, dt: -4, hum: .2, wind: .05, rain: .1 }
};

D.POTS = [
  { id: 's', n: '小さな鉢', cap: .85, ret: .8, cost: 0, col: '#e6dccb' },
  { id: 'm', n: 'ふつうの鉢', cap: 1, ret: 1, cost: 0, col: '#cf8f6c' },
  { id: 'l', n: '大きな鉢', cap: 1.15, ret: 1.3, cost: 80, col: '#8fb0a8' }
];
D.SOILS = [
  { id: 'basic', n: 'ふつうの土', drain: .5, fert: .3, cost: 0, col: '#5b4636', desc: 'どんな植物にもほどよい。' },
  { id: 'sand', n: '水はけのよい土', drain: .85, fert: .15, cost: 40, col: '#8a7a60', desc: 'かわき気味を好む植物に。' },
  { id: 'rich', n: 'ふかふかの土', drain: .4, fert: .6, cost: 50, col: '#3f3026', desc: '栄養たっぷり。野菜や花に。' },
  { id: 'moist', n: 'しっとり土', drain: .2, fert: .3, cost: 40, col: '#4a3b2f', desc: '水もちがよい。コケや水辺の植物に。' }
];
D.CANS = [
  { n: 'ふつうのじょうろ', amt: .5, cost: 0 },
  { n: 'ひろい口のじょうろ', amt: .65, cost: 100 },
  { n: 'ゆったりじょうろ', amt: .8, cost: 300 }
];
D.DECOR = [
  { id: 'stones', n: '飛び石', cost: 40, b: 5 },
  { id: 'bench', n: '木のベンチ', cost: 60, b: 8 },
  { id: 'chime', n: '風鈴', cost: 70, b: 8 },
  { id: 'lantern', n: 'ランタン', cost: 80, b: 10 },
  { id: 'bath', n: '小鳥の水のみ場', cost: 120, b: 14 },
  { id: 'cart', n: '花の台車', cost: 150, b: 16 },
  { id: 'lights', n: '星あかり', cost: 200, b: 20 },
  { id: 'pond', n: '小さな池', cost: 300, b: 28 }
];
D.RANKS = [
  [0, 'はじまりの庭'], [15, 'ひなたの庭'], [45, 'そよ風の庭'], [100, '花ざかりの庭'],
  [190, 'みんなが来る庭'], [330, 'ゆめのような庭'], [550, '伝説の庭']
];
D.TIPS = [
  '植物は、かわいた日と、うるおう日があると元気になるよ。',
  '葉っぱの色や向きが、ようすを教えてくれるよ。',
  '雨の日は、外の植物にお水がとどくよ。',
  '寒い日は、温室や窓辺がやさしい場所。',
  '観察すると、図鑑にあたらしい発見があるかも。',
  '花が咲いたら、かけあわせにチャレンジしてみよう。',
  'あせらなくて大丈夫。植物はゆっくり育つよ。',
  '剪定すると風通しがよくなって、虫がつきにくくなるよ。'
];
D.REQ_FROM = ['ご近所のパン屋さん', 'となりの花屋さん', '旅の絵描きさん', '図書室の先生', '朝のさんぽ仲間', '郵便屋さん', '喫茶店のマスター', '通りすがりの旅人'];

/* 植物26種。g=[たね,発芽,幼苗,成長期,つぼみ,開花,結実]の日数。
   pk: パレットが花の色('f')か葉の色合い('l')か。pal[3..5]はめずらしい色。 */
D.SPECIES = [
  { id: 'pothos', n: 'ポトス', cat: '観葉', form: 'vine', rar: 1, price: 30, pl: 'wh', t: [24, 13], w: .45, l: .35, h: .6, nu: .35, d: .5, a: .35, g: [1, 2, 3, 10, 0, 0, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#4f9a5a', '#62ad5d', '#7fbf62', '#b4d86a', '#d6e58a', '#eef0b0'], leaf: '#4f9a5a', hv: { n: 'さし芽', v: 25 }, tips: ['つるをのばして、たれ下がる姿が人気。', '明るい日かげでも、のびのび育つよ。'] },
  { id: 'monstera', n: 'モンステラ', cat: '観葉', form: 'bigleaf', rar: 2, price: 90, pl: 'wh', t: [25, 12], w: .5, l: .4, h: .7, nu: .45, d: .5, a: .4, g: [1, 3, 4, 12, 0, 0, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#2f7d4f', '#3c8c58', '#4fa06a', '#8cc77a', '#c3dd8c', '#e9efb4'], leaf: '#2f7d4f', hv: { n: '株分け', v: 60 }, tips: ['切れこみの入った大きな葉が特徴。', '葉っぱの穴は、風や光を通すためともいわれているよ。'] },
  { id: 'ficus', n: 'ゴムの木', cat: '観葉', form: 'tree', rar: 2, price: 110, pl: 'wh', t: [24, 12], w: .4, l: .55, h: .5, nu: .4, d: .5, a: .4, g: [1, 3, 4, 14, 0, 0, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#2e6b43', '#3a7a4c', '#4a8a55', '#8a4a5a', '#b66a74', '#d9a0a6'], leaf: '#2e6b43', hv: { n: '葉つみ', v: 70 }, tips: ['つやのある厚い葉がトレードマーク。', 'ゆっくり育って、どっしりした姿になるよ。'] },
  { id: 'sansevieria', n: 'サンスベリア', cat: '観葉', form: 'blade', rar: 1, price: 50, pl: 'wh', t: [24, 13], w: .2, l: .45, h: .35, nu: .25, d: .8, a: .35, g: [1, 3, 4, 12, 0, 0, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#3b7a4f', '#4a8a58', '#5a9a62', '#c8d86a', '#e6e68a', '#f3f0b8'], leaf: '#3b7a4f', hv: { n: '株分け', v: 40 }, tips: ['葉をまっすぐ空へのばす、すらりとした姿。', '水やりは、ひかえめがコツだよ。'] },
  { id: 'echeveria', n: 'エケベリア', cat: '多肉', form: 'rosette', rar: 2, price: 80, pl: 'wbh', t: [20, 14], w: .2, l: .75, h: .3, nu: .25, d: .85, a: .5, g: [1, 3, 4, 12, 3, 4, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#8fc2a5', '#a9d1b8', '#bcd6a8', '#c9a7c8', '#e3a4b8', '#f0b6a0'], leaf: '#8fc2a5', fl: '#f2a65a', hv: { n: '葉さし', v: 55 }, tips: ['葉が重なって、バラの花のような形になる。', '日なたが大好きで、水は少なめ。'] },
  { id: 'aloe', n: 'アロエ', cat: '多肉', form: 'spike', rar: 1, price: 55, pl: 'wbh', t: [22, 14], w: .25, l: .7, h: .3, nu: .3, d: .8, a: .45, g: [1, 3, 4, 12, 3, 4, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#4e9c6a', '#5aa874', '#6eb482', '#8fc8a0', '#b4dcb0', '#d8eec4'], leaf: '#4e9c6a', fl: '#f08a4b', hv: { n: '子株分け', v: 50 }, tips: ['ぎざぎざの縁を持つ、肉厚の葉っぱ。', '寒さには少し弱いので、冬はあたたかい場所へ。'] },
  { id: 'cactus', n: 'サボテン', cat: '多肉', form: 'cactus', rar: 1, price: 40, pl: 'wbh', t: [24, 15], w: .12, l: .8, h: .25, nu: .2, d: .9, a: .5, g: [1, 4, 5, 16, 3, 3, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#5a9a62', '#66a66a', '#74b073', '#8bc27a', '#b0d68a', '#d4e8a0'], leaf: '#5a9a62', fl: '#f2a0c0', hv: { n: '子株分け', v: 45 }, tips: ['水をたくわえるからだで、かわいた土地にも強い。', 'トゲは、葉っぱが変化したものだよ。'] },
  { id: 'basil', n: 'バジル', cat: 'ハーブ', form: 'herb', rar: 1, price: 25, pl: 'wbgh', t: [24, 9], w: .6, l: .7, h: .55, nu: .55, d: .5, a: .55, g: [1, 2, 2, 6, 2, 3, 0], life: 'ann', dorm: 0, pk: 'l', pal: ['#3f9a4c', '#4aa856', '#58b660', '#7a4f9c', '#9a6cb8', '#c49ad8'], leaf: '#3f9a4c', fl: '#f5f2f0', hv: { n: '葉つみ', v: 12, rep: true }, tips: ['あたたかい季節にぐんぐん育つハーブ。', '先をつんであげると、わき芽がふえるよ。'] },
  { id: 'mint', n: 'ミント', cat: 'ハーブ', form: 'herb', rar: 1, price: 20, pl: 'wbgh', t: [20, 11], w: .7, l: .55, h: .6, nu: .4, d: .45, a: .55, g: [1, 2, 2, 5, 2, 3, 0], life: 'per', dorm: 5, pk: 'l', pal: ['#4fa857', '#5cb460', '#6cc06a', '#b5d86a', '#d6e68a', '#a8c8e0'], leaf: '#4fa857', fl: '#d9c2f0', hv: { n: '葉つみ', v: 10, rep: true }, tips: ['すっとする香りで、たくさんの種類がある。', 'ふえる力が強いから、鉢で育てるのがおすすめ。'] },
  { id: 'rosemary', n: 'ローズマリー', cat: 'ハーブ', form: 'needle', rar: 2, price: 70, pl: 'bgh', t: [18, 12], w: .3, l: .8, h: .35, nu: .3, d: .8, a: .65, g: [1, 3, 3, 9, 3, 4, 0], life: 'per', dorm: 0, pk: 'f', pal: ['#8fb5f0', '#a9c8f5', '#c4d8f8', '#f0a8d0', '#ffffff', '#b890e8'], leaf: '#5d8f63', hv: { n: '枝つみ', v: 18, rep: true }, tips: ['針のような葉に、さわやかな香り。', '日なたと風通しのよさが好き。'] },
  { id: 'lavender', n: 'ラベンダー', cat: 'ハーブ', form: 'spikeh', rar: 2, price: 85, pl: 'bg', t: [17, 11], w: .3, l: .85, h: .3, nu: .3, d: .85, a: .7, g: [1, 3, 3, 10, 3, 4, 0], life: 'per', dorm: 3, pk: 'f', pal: ['#9a78d8', '#b090e8', '#c8a8f0', '#f0b8d8', '#ffffff', '#6a58c8'], leaf: '#8fae8a', hv: { n: '切り花', v: 60 }, tips: ['すっと伸びた穂に、紫の小花がつく。', '雨が続くのは少し苦手。'] },
  { id: 'tomato', n: 'ミニトマト', cat: '野菜', form: 'tomato', rar: 2, price: 60, pl: 'bgh', t: [24, 10], w: .55, l: .85, h: .5, nu: .65, d: .55, a: .6, g: [1, 2, 3, 8, 3, 3, 5], life: 'ann', dorm: 0, pk: 'f', pal: ['#e0463a', '#f0663a', '#f2c744', '#e8883a', '#b03a54', '#7a3a8a'], leaf: '#4a9a4a', fl: '#ffd84d', hv: { n: '実の収穫', v: 70 }, tips: ['夏の日ざしと、たくさんの水で実をつける。', '花が咲いたあと、緑の実が赤く色づくよ。'] },
  { id: 'strawberry', n: 'イチゴ', cat: '野菜', form: 'berry', rar: 2, price: 75, pl: 'bgh', t: [18, 10], w: .6, l: .7, h: .55, nu: .5, d: .5, a: .5, g: [1, 2, 3, 7, 3, 3, 4], life: 'per', dorm: 5, pk: 'f', pal: ['#e8344f', '#f0546a', '#f5d68a', '#ffffff', '#c8345a', '#9a3a8a'], leaf: '#4a9a4a', fl: '#ffffff', hv: { n: '実の収穫', v: 75 }, tips: ['白い花のあと、ふくらんだ部分が実になる。', '実のなる姿は、ほのぼのかわいい。'] },
  { id: 'lettuce', n: 'レタス', cat: '野菜', form: 'rosetteL', rar: 1, price: 22, pl: 'bgh', t: [17, 9], w: .65, l: .55, h: .6, nu: .5, d: .5, a: .5, g: [1, 2, 2, 6, 0, 0, 0], life: 'ann', dorm: 0, pk: 'l', pal: ['#7fc060', '#8ccc66', '#9ad870', '#c0a0d8', '#b05a7a', '#d8d070'], leaf: '#7fc060', hv: { n: 'しゅうかく', v: 35 }, tips: ['すずしい季節が得意な葉野菜。', 'まるくまとまる葉っぱが育つよ。'] },
  { id: 'sunflower', n: 'ひまわり', cat: '花', form: 'sun', rar: 1, price: 30, pl: 'bg', t: [26, 9], w: .6, l: 1, h: .5, nu: .5, d: .55, a: .6, g: [1, 2, 3, 8, 2, 5, 4], life: 'ann', dorm: 0, pk: 'f', pal: ['#f7c92c', '#f4b32a', '#f08d2a', '#d5502b', '#f2e27a', '#ffffff'], leaf: '#4c9a45', hv: { n: 'たねの収穫', v: 45 }, tips: ['お日さまの方に顔を向けて育つ。', '夏の青空がよく似合う花。'] },
  { id: 'tulip', n: 'チューリップ', cat: '花', form: 'tulip', rar: 1, price: 35, pl: 'bgh', t: [14, 9], w: .5, l: .7, h: .45, nu: .4, d: .65, a: .5, g: [1, 2, 2, 5, 2, 5, 0], life: 'per', dorm: 0, pk: 'f', pal: ['#e8465a', '#f2c533', '#f08bb0', '#ffffff', '#7b3fa0', '#3a3a8a'], leaf: '#4c9a50', hv: { n: '切り花', v: 40 }, tips: ['球根からすっと伸びて、カップ形の花を咲かせる。', '春の花壇の主役。'] },
  { id: 'rose', n: 'バラ', cat: '花', form: 'rose', rar: 3, price: 160, pl: 'bgh', t: [20, 10], w: .55, l: .8, h: .5, nu: .65, d: .55, a: .65, g: [1, 3, 4, 10, 3, 6, 0], life: 'per', dorm: 6, pk: 'f', pal: ['#d6334a', '#f08aa0', '#f6d6dc', '#f2c84b', '#e87a2d', '#7a2fa0'], leaf: '#3f8d4d', hv: { n: '切り花', v: 120 }, tips: ['重なる花びらと、ふんわり広がる香り。', '風通しと日あたりを大切にすると元気。'] },
  { id: 'cosmos', n: 'コスモス', cat: '花', form: 'cosmos', rar: 1, price: 28, pl: 'bg', t: [21, 10], w: .45, l: .85, h: .4, nu: .3, d: .6, a: .7, g: [1, 2, 2, 7, 2, 5, 0], life: 'ann', dorm: 0, pk: 'f', pal: ['#f08fb4', '#f7c5d8', '#ffffff', '#e8467a', '#c05a9a', '#f2b84a'], leaf: '#5aa850', hv: { n: '切り花', v: 30 }, tips: ['細い葉と、ゆれる花が秋の景色に似合う。', 'やせた土でも育つことで知られているよ。'] },
  { id: 'pansy', n: 'パンジー', cat: '花', form: 'pansy', rar: 1, price: 22, pl: 'wbg', t: [13, 10], w: .55, l: .65, h: .5, nu: .5, d: .55, a: .5, g: [1, 2, 2, 5, 2, 6, 0], life: 'ann', dorm: 0, pk: 'f', pal: ['#7a3fb0', '#f2c533', '#ffffff', '#e8613a', '#2a2a6a', '#d0558a'], leaf: '#4f9a52', hv: { n: '切り花', v: 25 }, tips: ['寒い季節にも花を咲かせる強い味方。', '色や模様が多くて、集める楽しみがある。'] },
  { id: 'lemon', n: 'レモン', cat: '樹木', form: 'treeF', rar: 3, price: 180, pl: 'bgh', t: [20, 11], w: .5, l: .85, h: .5, nu: .6, d: .6, a: .5, g: [1, 3, 5, 14, 3, 4, 6], life: 'per', dorm: 0, pk: 'f', pal: ['#fff7e6', '#fdeef0', '#ffffff', '#f6c8d8', '#e8f0c0', '#f7e27a'], leaf: '#3d8a47', fr: '#f4d03f', hv: { n: '実の収穫', v: 140 }, tips: ['白い花のあとに、黄色い実がなる。', '日あたりとあたたかさが好き。'] },
  { id: 'olive', n: 'オリーブ', cat: '樹木', form: 'treeO', rar: 3, price: 200, pl: 'bgh', t: [19, 13], w: .3, l: .85, h: .3, nu: .3, d: .8, a: .6, g: [1, 3, 5, 18, 3, 4, 6], life: 'per', dorm: 0, pk: 'f', pal: ['#f7f2e0', '#ffffff', '#f2eed0', '#f4e8a8', '#e8e0c0', '#e8d0e0'], leaf: '#8aa383', fr: '#6e7f3c', hv: { n: '実の収穫', v: 150 }, tips: ['銀色がかった細い葉がすてき。', '乾燥と日ざしに強い木。'] },
  { id: 'sakura', n: 'サクラ', cat: '樹木', form: 'treeS', rar: 3, price: 260, pl: 'g', t: [14, 10], w: .5, l: .8, h: .5, nu: .45, d: .55, a: .6, g: [1, 3, 5, 20, 3, 5, 0], life: 'per', dorm: 8, pk: 'f', pal: ['#f6b8cf', '#fbd8e4', '#ffffff', '#e9769c', '#c24f7a', '#9be0b8'], leaf: '#5b9a4f', hv: { n: '花びら集め', v: 60 }, tips: ['春にいっせいに咲いて、散る姿も人気。', '花が終わると、葉がしげるよ。'] },
  { id: 'anubias', n: 'アヌビアス', cat: '水草', form: 'aqua', rar: 1, price: 50, pl: 'a', t: [25, 9], w: .5, l: .3, h: .9, nu: .3, d: .5, a: .1, g: [1, 3, 4, 12, 0, 0, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#2f6f48', '#3a7f52', '#4a8f5c', '#6aa86a', '#9acc84', '#c4e0a0'], leaf: '#2f6f48', hv: { n: '株分け', v: 40 }, tips: ['水の中で、しっかりした葉を広げる。', '弱い光でも育つ水草として知られているよ。'] },
  { id: 'waterlily', n: 'スイレン', cat: '水草', form: 'lily', rar: 3, price: 150, pl: 'a', t: [24, 9], w: .5, l: .8, h: .9, nu: .4, d: .5, a: .1, g: [1, 3, 4, 8, 3, 5, 0], life: 'per', dorm: 0, pk: 'f', pal: ['#f6b8d4', '#ffffff', '#f7e27a', '#e07aa8', '#9d7ad8', '#6fd3e0'], leaf: '#3f9a5a', hv: { n: '花つみ', v: 40 }, tips: ['水面に浮かぶ丸い葉と、すっと咲く花。', '朝に開いて、夕方に閉じる種類もあるよ。'] },
  { id: 'sunagoke', n: 'スナゴケ', cat: 'コケ', form: 'moss', rar: 1, price: 35, pl: 'wbgh', t: [18, 12], w: .5, l: .6, h: .65, nu: .15, d: .6, a: .5, g: [1, 3, 4, 16, 0, 0, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#7fae4f', '#8cba58', '#9ac662', '#b4d870', '#d0e68a', '#e6f0a8'], leaf: '#7fae4f', hv: { n: '株分け', v: 40 }, tips: ['明るい場所を好む、日なたのコケ。', 'しっとりした日が続くと、いきいきするよ。'] },
  { id: 'haigoke', n: 'ハイゴケ', cat: 'コケ', form: 'moss', rar: 1, price: 30, pl: 'wbgha', t: [18, 12], w: .6, l: .4, h: .75, nu: .15, d: .45, a: .4, g: [1, 3, 4, 16, 0, 0, 0], life: 'per', dorm: 0, pk: 'l', pal: ['#5f9a4a', '#6aa654', '#76b25e', '#94c46a', '#b8d884', '#d8ea9e'], leaf: '#5f9a4a', hv: { n: '株分け', v: 35 }, tips: ['地面をはうように広がる、やわらかなコケ。', '少ししめった場所が好き。'] }
];
D.byId = {};
D.SPECIES.forEach(function (s) { D.byId[s.id] = s; s.places = s.pl.split('').map(function (c) { return D.PL[c]; }); });
D.pot = function (id) { return D.POTS.filter(function (p) { return p.id === id; })[0] || D.POTS[1]; };
D.soil = function (id) { return D.SOILS.filter(function (p) { return p.id === id; })[0] || D.SOILS[0]; };

/* 好みのことば(図鑑・ショップ用) */
D.likes = function (s) {
  var a = [];
  a.push(s.w < .3 ? 'かわいた土' : s.w < .6 ? 'ほどよい水' : 'たっぷりの水');
  a.push(s.l < .45 ? '明るい日かげ' : s.l < .75 ? 'やわらかい日ざし' : 'しっかり日なた');
  a.push(s.t[0] >= 22 ? 'あたたかさ' : s.t[0] <= 16 ? 'すずしさ' : 'おだやかな気温');
  return a;
};
D.hasFlower = function (s) { return s.g[4] > 0; };
D.hasFruit = function (s) { return s.g[6] > 0; };
