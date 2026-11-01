'use strict';
/* ぷらんと日記 - 育成ロジック(画面や3Dに依存しない) */
var Sim = (function () {
  var S = null;
  var KEY = 'purantonikki-v1';
  var rnd = function () { return Math.random(); };
  var clamp = function (x, a, b) { if (a === undefined) a = 0; if (b === undefined) b = 1; return Math.max(a, Math.min(b, x)); };
  var ri = function (a, b) { return a + Math.floor(rnd() * (b - a + 1)); };
  var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var SP = function (id) { return D.byId[id]; };
  function ok(msg, fx, extra) { var r = { ok: true, msg: msg, fx: fx || '' }; if (extra) for (var k in extra) r[k] = extra[k]; return r; }
  function no(msg) { return { ok: false, msg: msg }; }

  /* ---------- 状態 ---------- */
  function newState() {
    return {
      v: 1, day: 0, tod: .04, coins: 120, weather: 'sun', next: 'sun', speed: 1,
      plants: [], seeds: [], inv: { fert: 5, strong: 0, pest: 2, leaf: 2 },
      places: ['window'], pots: ['s', 'm'], soils: ['basic'], decor: [], can: 0,
      zukan: {}, reqs: [], reqId: 1, diary: [], pid: 1, rank: 0, rewardRank: 0,
      stats: { harvest: 0, blooms: 0, crosses: 0, done: 0, died: 0, obs: 0, days: 0, maxCoins: 120, gave: 0, got: 0 },
      cfg: { len: 45, snd: true, bgm: true }, flags: {}
    };
  }
  function startGame() {
    S = newState();
    var p = newPlant('mint', randGenes(.35, .6), 'window', 0, 'm', 'basic');
    p.stage = 2; p.prog = .3; p.w = .7; p.n = .5;
    S.plants.push(p); discover('mint', true);
    ['pansy', 'basil', 'pothos'].forEach(function (id) { S.seeds.push({ sp: id, genes: randGenes(.3, .6), gen: 0 }); discover(id, true); });
    S.weather = 'sun'; S.next = rollWeather(1);
    log('ぷらんと日記をはじめたよ。窓辺にミントの苗があるね。');
    return S;
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || o.v !== 1 || !Array.isArray(o.plants) || !o.zukan) return null;
      var base = newState();
      for (var k in base) if (o[k] === undefined) o[k] = base[k];
      for (var k2 in base.stats) if (o.stats[k2] === undefined) o.stats[k2] = base.stats[k2];
      for (var k3 in base.inv) if (o.inv[k3] === undefined) o.inv[k3] = base.inv[k3];
      for (var k4 in base.cfg) if (o.cfg[k4] === undefined) o.cfg[k4] = base.cfg[k4];
      o.plants = o.plants.filter(function (p) { return SP(p.sp) && D.PLACES[p.place]; });
      o.seeds = o.seeds.filter(function (s) { return SP(s.sp); });
      S = o; return S;
    } catch (e) { return null; }
  }
  var saveTimer = 0;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { return false; } }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 800); }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} }

  /* ---------- 遺伝 ---------- */
  function randGenes(lo, hi) {
    var f = function () { return [lo + rnd() * (hi - lo), lo + rnd() * (hi - lo)]; };
    var c = function () { return rnd() < .03 ? ri(3, 5) : ri(0, 2); };
    return { c: [c(), c()], sz: f(), sp: f(), hd: f(), yl: f() };
  }
  function gamete(g) {
    return { c: g.c[rnd() < .5 ? 0 : 1], sz: g.sz[rnd() < .5 ? 0 : 1], sp: g.sp[rnd() < .5 ? 0 : 1], hd: g.hd[rnd() < .5 ? 0 : 1], yl: g.yl[rnd() < .5 ? 0 : 1] };
  }
  function mut(v) { return rnd() < .1 ? clamp(v + (rnd() - .5) * .16) : v; }
  function combine(a, b) {
    var c = function (v) { return rnd() < .03 ? ri(3, 5) : v; };
    return { c: [c(a.c), c(b.c)], sz: [mut(a.sz), mut(b.sz)], sp: [mut(a.sp), mut(b.sp)], hd: [mut(a.hd), mut(b.hd)], yl: [mut(a.yl), mut(b.yl)] };
  }
  function phen(p) {
    var g = p.genes, m = function (x) { return (x[0] + x[1]) / 2; };
    return { col: Math.min(g.c[0], g.c[1]), hid: Math.max(g.c[0], g.c[1]), sz: m(g.sz), sp: m(g.sp), hd: m(g.hd), yl: m(g.yl) };
  }
  function geneScore(g) {
    var f = phen({ genes: g }), m = (f.sz + f.sp + f.hd + f.yl) / 4, r = f.col >= 3 ? (f.col - 2) / 3 : 0;
    return clamp(.85 * m + .15 * r);
  }
  function seedGrade(g) { var s = geneScore(g); return s < .4 ? 'ふつう' : s < .55 ? 'よい' : s < .7 ? 'とてもよい' : 'ぴかぴか'; }
  function addSeed(sp, genes) { discover(sp, true); if (S.seeds.length >= 60) { S.coins += 3; return; } S.seeds.push({ sp: sp, genes: genes, gen: 1 }); }

  /* ---------- 植物 ---------- */
  function Z(sp) { if (!S.zukan[sp]) S.zukan[sp] = { seen: false, obs: 0, harv: 0, best: 0, cols: [], bloom: 0 }; return S.zukan[sp]; }
  function zCount() { var n = 0; for (var k in S.zukan) if (S.zukan[k].seen) n++; return n; }
  function discover(sp, quiet) {
    var z = Z(sp); if (z.seen) return false;
    z.seen = true; reqEvent('collect');
    if (!quiet) log(SP(sp).n + 'が図鑑にのったよ。');
    return true;
  }
  function newPlant(sp, genes, place, slot, pot, soil) {
    var p = {
      id: S.pid++, sp: sp, place: place, slot: slot, genes: genes, stage: 0, prog: 0, w: .6, n: .4, hp: 80, pest: 0, dis: 0,
      pot: pot || 'm', soil: soil || 'basic', age: 0, cs: 0, cd: 0, cyc: 0, obs: 0, lastObs: -1, lastPrune: -9, lastHarvest: -9, lastPest: -9,
      lastDis: -9, lastCross: -9, immP: 0, immD: 0, boost: 0, mature: false, prev: 3, q: .5, end: '', bloomed: false, born: S.day
    };
    refreshQ(p); return p;
  }
  function refreshQ(p) {
    var avg = p.cd ? p.cs / p.cd : .6;
    var care = clamp((p.obs > 0 ? .4 : 0) + (p.lastPrune > -9 ? .3 : 0) + (p.cyc > 0 ? .3 : 0));
    p.q = clamp(.45 * avg + .45 * geneScore(p.genes) + .1 * care);
  }
  function stars(p) { var q = p.q; return q < .25 ? 1 : q < .42 ? 2 : q < .58 ? 3 : q < .74 ? 4 : 5; }
  function plantAt(place, slot) { for (var i = 0; i < S.plants.length; i++) if (S.plants[i].place === place && S.plants[i].slot === slot) return S.plants[i]; return null; }
  function plantById(id) { for (var i = 0; i < S.plants.length; i++) if (S.plants[i].id === id) return S.plants[i]; return null; }
  function freeSlot(place) { for (var i = 0; i < D.PLACES[place].slots; i++) if (!plantAt(place, i)) return i; return -1; }

  /* ---------- 時間・環境 ---------- */
  function dateInfo() { var d = S.day % D.YEAR, si = Math.floor(d / D.SLEN); return { season: si, sn: D.SEASONS[si], sd: d % D.SLEN + 1, year: Math.floor(S.day / D.YEAR) + 1 }; }
  function hour() { return (6 + S.tod * 24) % 24; }
  function todName() { var h = hour(); return h < 5 ? '夜' : h < 10 ? '朝' : h < 16 ? '昼' : h < 19 ? '夕方' : '夜'; }
  function baseTemp(day) { return 16.5 + 10.5 * Math.sin(2 * Math.PI * ((day % D.YEAR) - 3) / D.YEAR) + Math.sin(day * 1.7) * 1.5; }
  function rollWeather(day) {
    var si = Math.floor((day % D.YEAR) / D.SLEN), r = rnd();
    var t = [[.5, .25, .25, 0], [.55, .2, .25, 0], [.45, .3, .25, 0], [.5, .25, .1, .15]][si];
    var w = r < t[0] ? 'sun' : r < t[0] + t[1] ? 'cloud' : r < t[0] + t[1] + t[2] ? 'rain' : 'snow';
    if (w === 'snow' && baseTemp(day) > 9) w = 'rain';
    return w;
  }
  function envOf(place) {
    var P = D.PLACES[place], W = D.WEATHER[S.weather], b = baseTemp(S.day), si = dateInfo().season;
    var dl = [.85, 1, .8, .6][si], k = P.indoor ? .3 : 1;
    return {
      light: clamp(P.light * W.light * (.55 + .45 * dl)),
      temp: b * P.tm[0] + P.tm[1] + W.dt * k,
      hum: clamp(P.hum + W.hum * k),
      wind: clamp(P.wind + (P.indoor ? 0 : W.wind))
    };
  }
  function bell(v, ideal, tol) { var d = Math.abs(v - ideal) / tol; return clamp(1 - d * d); }
  function comfort(p, env) {
    var s = SP(p.sp), g = phen(p), soil = D.soil(p.soil), P = D.PLACES[p.place];
    var tTol = s.t[1] * .85 * (.9 + .3 * g.hd);
    var c = { w: P.water ? 1 : bell(p.w, s.w, .55), l: bell(env.light, s.l, .45), t: bell(env.temp, s.t[0], tTol), h: bell(env.hum, s.h, .7), n: bell(p.n, s.nu, .7), d: bell(soil.drain, s.d, .75), a: bell(env.wind, s.a, .8) };
    var wt = { w: 3, l: 3, t: 3, h: 1, n: 2, d: 1, a: 1 }, sum = 0, tw = 0;
    for (var k in c) { sum += c[k] * wt[k]; tw += wt[k]; }
    var total = clamp(Math.pow(sum / tw, 1.3) + .08 * g.hd);
    total *= (1 - .22 * p.pest - .22 * p.dis);
    if (!P.water && p.w > .95) total *= .92;
    return { c: c, total: clamp(total) };
  }

  /* ---------- 日記・イベント ---------- */
  function log(t) {
    var di = dateInfo();
    S.diary.unshift({ d: S.day, s: di.sn, sd: di.sd, y: di.year, t: t });
    if (S.diary.length > 240) S.diary.length = 240;
  }
  function ev(list, msg, fx, pid) { list.push({ msg: msg, fx: fx || '', pid: pid || 0 }); }

  /* ---------- 日が変わるとき ---------- */
  function nextStage(p, list) {
    var s = SP(p.sp), g = s.g, st = p.stage, nm = s.n;
    if (st === 0) { p.stage = 1; log(nm + 'が発芽したよ。'); ev(list, nm + 'が発芽したよ!', 'sprout', p.id); }
    else if (st === 1) { p.stage = 2; }
    else if (st === 2) { p.stage = 3; log(nm + 'が元気に育ちはじめたよ。'); }
    else if (st === 3) {
      if (g[4] > 0) { p.stage = 4; log(nm + 'につぼみがついたよ。'); ev(list, nm + 'につぼみがついたよ', 'sprout', p.id); }
      else { p.mature = true; p.prog = 0; log(nm + 'がしっかり育ったよ。'); ev(list, nm + 'がしっかり育ったよ。', 'sparkle', p.id); }
    }
    else if (st === 4) { p.stage = 5; bloomed(p, list); }
    else if (st === 5) { if (g[6] > 0) { p.stage = 6; log(nm + 'の実がなりはじめたよ。'); ev(list, nm + 'に実がなりはじめたよ', 'sparkle', p.id); } else afterCycle(p, list); }
    else if (st === 6) afterCycle(p, list);
  }
  function afterCycle(p, list) {
    var s = SP(p.sp);
    if (s.life === 'ann') complete(p, list);
    else { p.stage = 3; p.prog = 0; p.cyc++; p.mature = false; }
  }
  function bloomed(p, list) {
    var s = SP(p.sp), f = phen(p), z = Z(p.sp);
    if (z.cols.indexOf(f.col) < 0) { z.cols.push(f.col); if (z.cols.length > 1) ev(list, 'あたらしい色を発見! 図鑑に記録したよ', 'sparkle', p.id); }
    z.bloom++; S.stats.blooms++; p.bloomed = true;
    refreshQ(p); var bonus = 8 + 4 * stars(p); S.coins += bonus;
    log(s.n + 'の花がさいたよ。(+' + bonus + 'コイン)'); ev(list, s.n + 'の花がさいたよ!', 'bloom', p.id);
    reqEvent('bloom', { sp: p.sp });
  }
  function complete(p, list) {
    var s = SP(p.sp); p.stage = 8; p.end = 'done'; S.stats.done++;
    addSeed(p.sp, combine(gamete(p.genes), gamete(p.genes))); addSeed(p.sp, combine(gamete(p.genes), gamete(p.genes)));
    S.coins += 10;
    log(s.n + 'は精いっぱい育って、種を2つ残してくれたよ。');
    ev(list, s.n + 'が種を残したよ(+10コイン)', 'sparkle', p.id);
  }
  function worst(c) {
    var k = 'w', v = 2; ['w', 'l', 't', 'n'].forEach(function (x) { if (c[x] < v) { v = c[x]; k = x; } }); return k;
  }
  function die(p, list, c) {
    var s = SP(p.sp), why = { w: p.w > .8 ? 'お水が多すぎたみたい' : 'お水がたりなかったみたい', l: 'ひかりが合わなかったみたい', t: '気温が合わなかったみたい', n: '栄養がたりなかったみたい' }[worst(c.c)];
    p.stage = 8; p.end = 'rest'; p.why = why; S.stats.died++;
    addSeed(p.sp, combine(gamete(p.genes), gamete(p.genes)));
    S.coins += 10;
    log(s.n + 'はゆっくりおやすみしたよ。' + why + '。種と、たい肥(10コイン)を残してくれたよ。');
    ev(list, s.n + 'がおやすみしたよ。種が残ったから、また育てよう', 'rest', p.id);
  }
  function dayUpdate(p, list) {
    if (p.stage === 8) return;
    var s = SP(p.sp), env = envOf(p.place), P = D.PLACES[p.place], pot = D.pot(p.pot), soil = D.soil(p.soil), g = phen(p), W = D.WEATHER[S.weather], si = dateInfo().season;
    p.age++; if (p.boost > 0) p.boost--;
    if (s.dorm) {
      if (p.stage === 7) { if (env.temp >= s.dorm + 2) { p.stage = p.prev || 3; log(s.n + 'が目をさましたよ。'); } }
      else if (p.stage >= 3 && p.stage <= 6 && env.temp < s.dorm) { p.prev = p.stage; p.stage = 7; log(s.n + 'は冬ごもり(休眠)に入ったよ。'); ev(list, s.n + 'がお休みに入ったよ', '', p.id); }
    }
    var dormant = p.stage === 7;
    if (P.water) p.w = 1;
    else {
      var use = (.16 + .12 * env.light + .1 * clamp((env.temp - 16) / 14) + .05 * env.wind) * (.8 + .4 * soil.drain) / pot.ret * (.55 + .7 * s.w);
      if (dormant) use *= .3; if (p.stage === 0) use *= .7;
      p.w = clamp(p.w - use + W.rain * P.rain);
    }
    p.n = clamp(p.n - (.04 + (p.stage >= 3 ? .03 : 0)) * (dormant ? .3 : 1) + soil.fert * .03);
    var c = comfort(p, env);
    p.cs += c.total; p.cd++;
    if (dormant) p.hp = Math.min(100, p.hp + 1.5);
    else { var dh = (c.total - .5) * 22; if (p.hp < 25 && dh < 0) dh *= .5; p.hp = clamp(p.hp + dh, 0, 100); }
    if (!dormant && p.stage <= 6 && !(p.stage === 3 && p.mature)) {
      var gm = clamp((c.total - .2) / .65, .12, 1.15) * (.85 + .4 * g.sp) * (p.boost > 0 ? 1.1 : 1);
      var dur = s.g[p.stage];
      p.prog += dur > 0 ? gm / dur : 1;
      var guard = 0;
      while (p.prog >= 1 && p.stage <= 6 && !(p.stage === 3 && p.mature) && guard++ < 4) {
        p.prog -= 1; nextStage(p, list); if (p.stage === 8) break;
      }
      if (p.stage === 3 && p.mature) p.prog = 0;
    }
    if (p.stage === 8) return;
    if (p.immP > 0) p.immP--;
    else if (P.pest > 0 && p.stage > 0) {
      var ch = P.pest * (.06 + .24 * clamp(env.hum - .45) + .1 * (1 - env.wind)) * [1, 1.3, 1, .3][si];
      if (rnd() < ch) p.pest = clamp(p.pest + .3 + rnd() * .2); else if (env.wind > .6) p.pest = Math.max(0, p.pest - .04);
    }
    if (p.immD > 0) p.immD--;
    else if (P.pest > 0 && p.stage > 0) {
      var cd = P.pest * (.04 + .24 * clamp(env.hum - .5) + (p.w > .9 ? .08 : 0) + .06 * (1 - env.wind)) * [1, 1.2, 1, .3][si];
      if (rnd() < cd) p.dis = clamp(p.dis + .3 + rnd() * .2);
    }
    refreshQ(p);
    if (p.hp <= 0) die(p, list, c);
  }

  function beauty() {
    var v = 0, set = {};
    S.plants.forEach(function (p) {
      if (p.stage === 8) return;
      var base = (p.stage === 5 || p.stage === 6) ? 3 : p.stage >= 3 ? 1.5 : .4;
      v += base * (.6 + .2 * stars(p)); set[p.sp] = 1;
    });
    v += Object.keys(set).length * 2;
    S.decor.forEach(function (id) { D.DECOR.forEach(function (d) { if (d.id === id) v += d.b; }); });
    return Math.round(v);
  }
  function rankIdx() { var b = beauty(), r = 0; D.RANKS.forEach(function (x, i) { if (b >= x[0]) r = i; }); return r; }
  function checkRank(list) {
    var r = rankIdx();
    if (r > S.rewardRank) {
      S.rewardRank = r; S.rank = r; var gift = 40 * r; S.coins += gift;
      log('庭が「' + D.RANKS[r][1] + '」になったよ。(+' + gift + 'コイン)');
      ev(list, '庭が「' + D.RANKS[r][1] + '」になったよ! (+' + gift + 'コイン)', 'rank');
    }
  }

  function randomEvent(list) {
    if (rnd() > .28) return;
    var blooming = S.plants.filter(function (p) { return p.stage === 5 && !D.PLACES[p.place].indoor; });
    var pests = S.plants.filter(function (p) { return p.pest > .2; });
    var opts = [];
    if (blooming.length) opts.push('butterfly');
    if (S.weather === 'sun' && S.flags.lastRain === S.day - 1) opts.push('rainbow');
    opts.push('bird', 'neighbor', 'breeze', 'star');
    if (pests.length) opts.push('ladybug', 'ladybug');
    var e = pick(opts);
    if (e === 'butterfly') { S.coins += 12; log('花のまわりにちょうちょが来たよ。(+12コイン)'); ev(list, 'ちょうちょが遊びに来たよ(+12コイン)', 'butterfly'); }
    else if (e === 'rainbow') { S.coins += 25; log('雨あがりに虹が出たよ。(+25コイン)'); ev(list, '雨あがりの虹! いいことがありそう(+25コイン)', 'rainbow'); }
    else if (e === 'bird') {
      var pool = D.SPECIES.filter(function (s) { return s.rar === 1 && !Z(s.id).seen; });
      var s2 = pool.length ? pick(pool) : pick(D.SPECIES.filter(function (s) { return s.rar === 1; }));
      S.seeds.push({ sp: s2.id, genes: randGenes(.3, .65), gen: 0 }); discover(s2.id, true);
      log('小鳥が' + s2.n + 'の種をはこんできてくれたよ。'); ev(list, '小鳥が' + s2.n + 'の種をくれたよ', 'bird');
    }
    else if (e === 'neighbor') { S.inv.fert += 2; log('ご近所さんが肥料をおすそわけしてくれたよ。'); ev(list, 'ご近所さんが肥料をくれたよ(+2)', 'gift'); }
    else if (e === 'breeze') { S.plants.forEach(function (p) { p.dis = Math.max(0, p.dis - .25); }); log('やさしい風がふいて、葉っぱがさっぱりしたよ。'); ev(list, 'やさしい風で、葉っぱがさっぱりしたよ', 'breeze'); }
    else if (e === 'star') { if (hour() > 0) { S.coins += 8; log('ゆうべ、流れ星を見たよ。(+8コイン)'); ev(list, '流れ星を見たよ。いいことがあるかも(+8コイン)', 'star'); } }
    else if (e === 'ladybug') { pests.forEach(function (p) { p.pest = Math.max(0, p.pest - .45); }); log('てんとう虫が来て、虫をやっつけてくれたよ。'); ev(list, 'てんとう虫が虫退治を手伝ってくれたよ', 'ladybug'); }
  }

  function endDay() {
    var list = [];
    S.plants.forEach(function (p) { dayUpdate(p, list); });
    var prevSeason = dateInfo().season, wasRain = S.weather === 'rain';
    var wn = D.WEATHER[S.weather].n;
    S.day++; S.stats.days++;
    S.weather = S.next; S.next = rollWeather(S.day + 1);
    S.flags.lastRain = wasRain ? S.day - 1 : S.flags.lastRain;
    var di = dateInfo();
    if (di.season !== prevSeason) {
      var adv = ['あたたかい春。種まきにぴったり。', '日ざしの夏。水やりをこまめにね。', '実りの秋。収穫のチャンス。', '寒い冬。弱い植物は温室や窓辺へ。'][di.season];
      log(di.sn + 'になったよ。' + adv); ev(list, di.sn + 'になったよ。' + adv, 'season');
    }
    var gain = Math.floor(beauty() / 20);
    if (gain > 0) { S.coins += gain; S.flags.gain = gain; }
    randomEvent(list);
    var alive = S.plants.filter(function (p) { return p.stage !== 8; });
    if (alive.length) {
      alive.sort(function (a, b) { return b.hp - a.hp; });
      log(wn + 'の一日。' + SP(alive[0].sp).n + 'がいちばん元気だったよ。');
    }
    while (S.reqs.length < 3 && (S.flags.reqWait || 0) <= S.day) { S.reqs.push(genReq()); if (S.reqs.length >= 3) break; }
    checkRank(list);
    S.stats.maxCoins = Math.max(S.stats.maxCoins, S.coins);
    save();
    return list;
  }
  function tick(dt) {
    var list = [];
    S.tod += dt * S.speed / S.cfg.len;
    var g = 0;
    while (S.tod >= 1 && g++ < 3) { S.tod -= 1; list = list.concat(endDay()); }
    return list;
  }

  /* ---------- 依頼 ---------- */
  function genReq() {
    var seen = D.SPECIES.filter(function (s) { return Z(s.id).seen; });
    var types = ['harvest', 'star', 'collect', 'observe', 'bloom'];
    var t = pick(types), q = { id: S.reqId++, who: pick(D.REQ_FROM), type: t, n: 1, got: 0, sp: '', k: 0, base: 0, coins: 0, item: '' };
    if (t === 'harvest') { var c = seen.length ? pick(seen) : pick(D.SPECIES); q.sp = c.id; q.n = ri(1, 2); q.coins = 50 + q.n * 30 + c.rar * 15; }
    else if (t === 'star') { var c2 = seen.length ? pick(seen) : pick(D.SPECIES); q.sp = c2.id; q.k = ri(2, Z(c2.id).best >= 3 ? 4 : 3); q.coins = 70 + q.k * 35; }
    else if (t === 'collect') { q.n = ri(1, 2); q.base = zCount(); q.coins = 50 * q.n + 20; }
    else if (t === 'observe') { q.n = ri(3, 5); q.coins = 24 + q.n * 8; }
    else { var fl = seen.filter(function (s) { return D.hasFlower(s); }); var c3 = fl.length ? pick(fl) : pick(D.SPECIES.filter(function (s) { return D.hasFlower(s); })); q.sp = c3.id; q.coins = 80; }
    if (rnd() < .35) { q.item = pick(['fert', 'pest', 'leaf']); }
    return q;
  }
  function reqEvent(type, d) {
    if (!S) return;
    S.reqs.forEach(function (q) {
      if (q.got >= q.n) return;
      if (type === 'harvest' && q.type === 'harvest' && q.sp === d.sp) q.got++;
      else if (type === 'harvest' && q.type === 'star' && q.sp === d.sp && d.stars >= q.k) q.got = q.n;
      else if (type === 'collect' && q.type === 'collect') q.got = Math.min(q.n, zCount() - q.base);
      else if (type === 'observe' && q.type === 'observe') q.got++;
      else if (type === 'bloom' && q.type === 'bloom' && q.sp === d.sp) q.got++;
    });
  }
  function claimReq(i) {
    var q = S.reqs[i]; if (!q || q.got < q.n) return no('まだ達成していないよ');
    S.coins += q.coins; if (q.item) S.inv[q.item] += 2;
    log(q.who + 'の依頼をかなえたよ。(+' + q.coins + 'コイン)');
    S.reqs.splice(i, 1); S.flags.reqWait = S.day + 1;
    return ok('お礼に ' + q.coins + 'コインをもらったよ!', 'coin');
  }

  /* ---------- 世話のアクション ---------- */
  function water(p) {
    if (p.stage === 8) return no('いまはおやすみ中だよ');
    if (D.PLACES[p.place].water) return no('水槽の中は、いつもたっぷりだよ');
    var was = p.w; p.w = clamp(p.w + [.5, .65, .8][S.can]);
    var msg = 'ごくごく…。元気になるよ';
    if (was > .85) { msg = 'もうじゅうぶんみたい。あげすぎに気をつけてね'; p.dis = clamp(p.dis + .05); }
    saveSoon(); return ok(msg, 'water');
  }
  function fertilize(p, strong) {
    if (p.stage === 8 || p.stage === 7) return no('いまはお休み中だよ');
    var key = strong ? 'strong' : 'fert';
    if (p.n > .85) return no('もうおなかいっぱいみたい');
    if (S.inv[key] <= 0) return no('肥料がないよ。ショップで買えるよ');
    S.inv[key]--; p.n = clamp(p.n + (strong ? .7 : .45));
    saveSoon(); return ok('栄養をたっぷり、ありがとう', 'fert');
  }
  function prune(p) {
    if (p.stage < 3 || p.stage === 8) return no('もう少し大きくなってからにしよう');
    if (S.day - p.lastPrune < 3) return no('さっき整えたばかり。少し待ってね');
    p.lastPrune = S.day; p.pest = Math.max(0, p.pest - .15); p.dis = Math.max(0, p.dis - .2); p.boost = 3; refreshQ(p);
    saveSoon(); return ok('すっきり。風通しがよくなったよ', 'prune');
  }
  function pest(p, useItem) {
    if (p.stage === 8) return no('いまはおやすみ中だよ');
    if (useItem) {
      if (S.inv.pest <= 0) return no('虫よけがないよ。ショップで買えるよ');
      S.inv.pest--; p.pest = 0; p.immP = 4; saveSoon(); return ok('虫よけで、しばらく安心だよ', 'spray');
    }
    if (p.pest < .05) return no('虫はいないみたい');
    if (p.lastPest === S.day) return no('きょうはもう、じゅうぶん取ったよ');
    p.lastPest = S.day; p.pest = Math.max(0, p.pest - .5); saveSoon(); return ok('えいっ。虫を取ったよ', 'bug');
  }
  function disease(p, useItem) {
    if (p.stage === 8) return no('いまはおやすみ中だよ');
    if (useItem) {
      if (S.inv.leaf <= 0) return no('葉のくすりがないよ。ショップで買えるよ');
      S.inv.leaf--; p.dis = 0; p.immD = 4; saveSoon(); return ok('葉っぱがつやつやになったよ', 'spray');
    }
    if (p.dis < .05) return no('葉っぱはきれいだよ');
    if (p.lastDis === S.day) return no('きょうはもう、手入れしたよ');
    p.lastDis = S.day; p.dis = Math.max(0, p.dis - .5); saveSoon(); return ok('葉っぱを拭いてあげたよ', 'bug');
  }
  function observe(p) {
    if (p.lastObs === S.day) return no('きょうはもう、じっくり見たよ');
    p.lastObs = S.day; p.obs++; var z = Z(p.sp); var before = z.obs; z.obs++; S.stats.obs++; S.coins += 2;
    reqEvent('observe'); refreshQ(p);
    var extra = '';
    if (before < 1 && z.obs >= 1) extra = ' 図鑑に発見があったよ'; else if (before < 3 && z.obs >= 3) extra = ' 図鑑にあたらしい発見があったよ';
    log(SP(p.sp).n + 'をじっくり観察した。');
    saveSoon(); return ok(advice(p).msg + extra, 'look');
  }
  function ready(p) { return p.stage === 5 || p.stage === 6 || (p.stage === 3 && p.mature); }
  function canHarvest(p) {
    var s = SP(p.sp);
    if (p.stage === 8) return { can: false, why: 'もうおやすみ中だよ' };
    if (p.stage === 7) return { can: false, why: 'いまは休眠中だよ' };
    if (S.day - p.lastHarvest < 4) return { can: false, why: 'また4日くらいあとにしよう' };
    if (s.hv.rep) { if (p.stage > 3 || (p.stage === 3 && p.prog >= .5) || p.mature) return { can: true }; return { can: false, why: 'もう少し育ってからだよ' }; }
    if (D.hasFruit(s)) return p.stage === 6 ? { can: true } : { can: false, why: '実がなるまで待とう' };
    if (D.hasFlower(s)) return p.stage === 5 ? { can: true } : { can: false, why: '花がさくまで待とう' };
    return p.mature ? { can: true } : { can: false, why: 'しっかり育つまで待とう' };
  }
  function harvest(p) {
    var h = canHarvest(p); if (!h.can) return no(h.why);
    var s = SP(p.sp), st = stars(p), g = phen(p), z = Z(p.sp);
    var coins = Math.round(s.hv.v * (.35 + .15 * st) * (.8 + .6 * g.yl));
    S.coins += coins; z.harv++; S.stats.harvest++; p.lastHarvest = S.day;
    if (st > z.best) { z.best = st; if (st === 5) log(s.n + 'で、さいこうほうの★5が出たよ!'); }
    reqEvent('harvest', { sp: p.sp, stars: st });
    var extra = '';
    if (!s.hv.rep && rnd() < .15 + .05 * st) { addSeed(p.sp, combine(gamete(p.genes), gamete(p.genes))); extra = ' 種もとれたよ'; }
    log(s.n + 'の' + s.hv.n + 'で ' + coins + 'コイン。');
    if (s.hv.rep) { p.hp = Math.max(10, p.hp - 2); }
    else if (s.life === 'ann') { var l2 = []; complete(p, l2); extra += ' 種を残して役目を終えたよ'; }
    else { p.stage = 3; p.prog = 0; p.cyc++; p.mature = false; }
    refreshQ(p); save();
    return ok(s.hv.n + 'で ' + coins + 'コイン!' + extra, 'coin');
  }
  function repot(p, potId, soilId) {
    if (p.stage === 8) return no('いまはおやすみ中だよ');
    if (S.pots.indexOf(potId) < 0 || S.soils.indexOf(soilId) < 0) return no('その鉢や土はまだ持っていないよ');
    if (potId === p.pot && soilId === p.soil) return no('いまと同じだよ');
    p.pot = potId; p.soil = soilId; p.w = Math.max(p.w, .6); p.n = clamp(p.n + .2); p.hp = Math.max(8, p.hp - 3);
    saveSoon(); return ok('あたらしいお引っこし。すぐなじむよ', 'pot');
  }
  function move(p, place, slot) {
    if (S.places.indexOf(place) < 0) return no('その場所はまだ使えないよ');
    var s = SP(p.sp);
    if (s.places.indexOf(place) < 0) return no(s.n + 'は、' + D.PLACES[place].n + 'では育たないよ');
    if (place === p.place && slot === p.slot) return no('いまの場所だよ');
    if (plantAt(place, slot)) return no('そこはうまっているよ');
    p.place = place; p.slot = slot; saveSoon(); return ok(D.PLACES[place].n + 'に移したよ', 'move');
  }
  function plantSeed(seedIdx, place, slot, potId, soilId) {
    var sd = S.seeds[seedIdx]; if (!sd) return no('種が見つからないよ');
    var s = SP(sd.sp);
    if (S.places.indexOf(place) < 0) return no('その場所はまだ使えないよ');
    if (s.places.indexOf(place) < 0) return no(s.n + 'は、' + D.PLACES[place].n + 'では育たないよ');
    if (plantAt(place, slot)) return no('そこはうまっているよ');
    if (S.pots.indexOf(potId) < 0 || S.soils.indexOf(soilId) < 0) return no('その鉢や土はまだ持っていないよ');
    S.seeds.splice(seedIdx, 1);
    var p = newPlant(sd.sp, sd.genes, place, slot, potId, soilId); p.w = .65; S.plants.push(p);
    var first = discover(sd.sp, true); log(s.n + 'の種をまいたよ。');
    saveSoon(); return ok(s.n + 'の種をまいたよ', 'plant', { plant: p, first: first });
  }
  function clearPlant(p) {
    if (p.stage !== 8) return no('おやすみ中の植物だけ片づけられるよ');
    S.plants.splice(S.plants.indexOf(p), 1); saveSoon(); return ok('ありがとう。ここにまた植えられるよ', 'clear');
  }
  function cross(a, b) {
    if (!a || !b || a.id === b.id) return no('べつの2つをえらんでね');
    if (a.sp !== b.sp) return no('おなじ種類どうしでかけあわせるよ');
    if (!ready(a) || !ready(b)) return no('どちらも、花ざかりかしっかり育っているときにできるよ');
    if (S.day - a.lastCross < 3 || S.day - b.lastCross < 3) return no('少し休ませてあげよう(3日に1回までだよ)');
    a.lastCross = S.day; b.lastCross = S.day; S.stats.crosses++;
    addSeed(a.sp, combine(gamete(a.genes), gamete(b.genes))); addSeed(a.sp, combine(gamete(a.genes), gamete(b.genes)));
    S.coins += 5; log(SP(a.sp).n + 'をかけあわせて、種を2つ手に入れたよ。');
    save(); return ok('種が2つできたよ。どんな子が育つかな', 'cross');
  }

  /* ---------- アドバイス ---------- */
  function advice(p) {
    var s = SP(p.sp), env = envOf(p.place), P = D.PLACES[p.place], nm = s.n, soil = D.soil(p.soil);
    if (p.stage === 8) return { kind: 'rest', msg: p.end === 'done' ? nm + 'は精いっぱい咲いて、種を残したよ。ありがとう。' : nm + 'はおやすみ中。' + (p.why || '') + '。種が残ったから、また育てよう。' };
    if (p.stage === 7) return { kind: 'ok', msg: '冬ごもり(休眠)中。あたたかくなるまで、そっと見守ろう。' };
    var c = comfort(p, env), out = [];
    if (!P.water && p.w < .25) out.push('のどがかわいたみたい。水やりしてあげよう。');
    if (!P.water && p.w > .92) out.push('お水がたっぷり。しばらくそっとしておこう。');
    if (p.pest > .35) out.push('虫がいるみたい。「虫とり」をしてあげよう。');
    if (p.dis > .35) out.push('葉っぱが気になるよ。「葉の手入れ」や剪定が効くよ。');
    if (c.c.l < .4) out.push(env.light < s.l ? 'もっと明るい場所が好きみたい。置き場所を変えてみよう。' : 'ちょっとまぶしいかも。やわらかい光の場所へ移そう。');
    if (c.c.t < .4) out.push(env.temp < s.t[0] ? '寒そう。あたたかい温室や窓辺に移してあげよう。' : '暑そう。すずしい場所に移してあげよう。');
    if (p.n < .2 && p.stage >= 2) out.push('少し栄養がたりないかも。肥料をあげてみよう。');
    if (c.c.d < .35) out.push(s.d > soil.drain ? '水はけのよい土が合いそう。植え替えを考えてみよう。' : 'しっとりした土が合いそう。植え替えを考えてみよう。');
    if (canHarvest(p).can) out.push('収穫のタイミングだよ!');
    else if (ready(p)) out.push('かけあわせができる状態だよ。');
    if (out.length) return { kind: 'warn', msg: out[0] };
    return { kind: 'ok', msg: pick(['すくすく育っているよ。', 'いい調子! ごきげんみたい。', 'のんびり元気。そのまま見守ろう。']) };
  }

  /* ---------- ショップ ---------- */
  function buy(kind, id, tier) {
    var item;
    if (kind === 'seed') {
      var s = SP(id); if (!s) return no('その種はないよ');
      var sel = tier === 1; if (sel && Z(id).best < 3) return no('★3以上を育てると、えらばれた種が買えるよ');
      var price = sel ? s.price * 3 : s.price; if (S.coins < price) return no('コインがたりないよ');
      S.coins -= price; S.seeds.push({ sp: id, genes: sel ? randGenes(.4, .75) : randGenes(.2, .6), gen: 0 }); var f = discover(id, true);
      saveSoon(); return ok(s.n + (sel ? '(えらばれた種)' : 'の種') + 'を買ったよ', 'coin', { first: f });
    }
    if (kind === 'item') {
      var tbl = { fert: [30, 5, '肥料'], strong: [60, 3, 'ぐんぐん肥料'], pest: [45, 3, '虫よけ'], leaf: [45, 3, '葉のくすり'] };
      item = tbl[id]; if (!item) return no('そのどうぐはないよ'); if (S.coins < item[0]) return no('コインがたりないよ');
      S.coins -= item[0]; S.inv[id] += item[1]; saveSoon(); return ok(item[2] + 'を' + item[1] + 'こ買ったよ', 'coin');
    }
    if (kind === 'pot') { item = D.POTS.filter(function (x) { return x.id === id; })[0]; if (!item || S.pots.indexOf(id) >= 0) return no('もう持っているよ'); if (S.coins < item.cost) return no('コインがたりないよ'); S.coins -= item.cost; S.pots.push(id); saveSoon(); return ok(item.n + 'が使えるようになったよ', 'coin'); }
    if (kind === 'soil') { item = D.SOILS.filter(function (x) { return x.id === id; })[0]; if (!item || S.soils.indexOf(id) >= 0) return no('もう持っているよ'); if (S.coins < item.cost) return no('コインがたりないよ'); S.coins -= item.cost; S.soils.push(id); saveSoon(); return ok(item.n + 'が使えるようになったよ', 'coin'); }
    if (kind === 'decor') { item = D.DECOR.filter(function (x) { return x.id === id; })[0]; if (!item || S.decor.indexOf(id) >= 0) return no('もう飾っているよ'); if (S.places.indexOf('garden') < 0) return no('庭・畑を使えるようにしてから飾れるよ'); if (S.coins < item.cost) return no('コインがたりないよ'); S.coins -= item.cost; S.decor.push(id); log(item.n + 'を庭に飾ったよ。'); saveSoon(); return ok(item.n + 'を庭に飾ったよ', 'coin'); }
    if (kind === 'place') {
      var P = D.PLACES[id]; if (!P || S.places.indexOf(id) >= 0) return no('もう使えるよ');
      if (zCount() < P.need) return no('図鑑を' + P.need + '種類そろえると使えるよ'); if (S.coins < P.cost) return no('コインがたりないよ');
      S.coins -= P.cost; S.places.push(id); log(P.n + 'が使えるようになったよ。'); save(); return ok(P.n + 'が使えるようになったよ!', 'coin');
    }
    if (kind === 'can') { var nx = S.can + 1; item = D.CANS[nx]; if (!item) return no('これが最高のじょうろだよ'); if (S.coins < item.cost) return no('コインがたりないよ'); S.coins -= item.cost; S.can = nx; saveSoon(); return ok(item.n + 'になったよ', 'coin'); }
    return no('それは買えないよ');
  }

  /* ---------- こうかん(コードで見せ合い) ---------- */
  function exportCode(p) {
    var o = { v: 1, s: p.sp, g: p.genes, q: Math.round(p.q * 100) };
    return 'PD1-' + btoa(JSON.stringify(o));
  }
  function importCode(str) {
    try {
      str = String(str || '').trim();
      if (str.indexOf('PD1-') !== 0 || str.length > 700) return no('コードの形がちがうみたい');
      var o = JSON.parse(atob(str.slice(4)));
      if (!o || o.v !== 1 || !SP(o.s) || !o.g) return no('コードを読みとれなかったよ');
      var g = o.g, num = function (x) { return typeof x === 'number' && isFinite(x) ? clamp(x) : .4; };
      var pair = function (a) { return Array.isArray(a) && a.length === 2 ? [num(a[0]), num(a[1])] : [.4, .4]; };
      var cc = function (a) { if (!Array.isArray(a) || a.length !== 2) return [0, 0]; return [clamp(Math.round(+a[0] || 0), 0, 5), clamp(Math.round(+a[1] || 0), 0, 5)]; };
      var genes = { c: cc(g.c), sz: pair(g.sz), sp: pair(g.sp), hd: pair(g.hd), yl: pair(g.yl) };
      S.seeds.push({ sp: o.s, genes: genes, gen: 1 }); var first = discover(o.s, true); S.stats.got++;
      log('お友だちから' + SP(o.s).n + 'の種をもらったよ。'); save();
      return ok(SP(o.s).n + 'の種をもらったよ!', 'gift', { first: first });
    } catch (e) { return no('コードを読みとれなかったよ'); }
  }

  return {
    get S() { return S; }, startGame: startGame, load: load, save: save, saveSoon: saveSoon, wipe: wipe,
    tick: tick, endDay: endDay, dateInfo: dateInfo, hour: hour, todName: todName, envOf: envOf, comfort: comfort,
    plantAt: plantAt, plantById: plantById, freeSlot: freeSlot, stars: stars, phen: phen, geneScore: geneScore, seedGrade: seedGrade,
    zCount: zCount, Z: Z, beauty: beauty, rankIdx: rankIdx, advice: advice, ready: ready, canHarvest: canHarvest,
    water: water, fertilize: fertilize, prune: prune, pest: pest, disease: disease, observe: observe, harvest: harvest,
    repot: repot, move: move, plantSeed: plantSeed, clearPlant: clearPlant, cross: cross, buy: buy, claimReq: claimReq,
    exportCode: exportCode, importCode: importCode, log: log, checkRank: checkRank, rollWeather: rollWeather, genReq: genReq
  };
})();
if (typeof module !== 'undefined') module.exports = { Sim: Sim };
