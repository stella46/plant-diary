'use strict';
/* ぷらんと日記 - メニュー類(ショップ・図鑑・依頼・日記・こうかん・記録・せってい) */
var Sheets = (function () {
  var cur = null, st = {};
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sw(c) { return '<i class="sw" style="background:' + c + '"></i>'; }
  function S() { return Sim.S; }
  function alive() { return S().plants.filter(function (p) { return p.stage !== 8; }); }
  function seedLine(sd) {
    var s = D.byId[sd.sp], f = Sim.phen({ genes: sd.genes });
    return sw(s.pal[f.col]) + '<b>' + s.n + '</b><small>' + Sim.seedGrade(sd.genes) + (sd.gen ? ' ・ ' + (sd.gen + 1) + '代目' : '') + '</small>';
  }
  function row(inner, act, extra, dis) { return '<button class="row' + (dis ? ' off' : '') + '" data-a="' + act + '" ' + (extra || '') + '>' + inner + '</button>'; }
  function res(r, p) { UI.afterAction(r, p); return r; }

  /* ---------- 各シート ---------- */
  var SH = {};

  SH.menu = {
    title: 'メニュー',
    html: function () {
      var items = [['shop', 'ショップ', '種・どうぐ・場所'], ['bag', 'たねぶくろ', S().seeds.length + 'こ'], ['zukan', '図鑑', Sim.zCount() + '/' + D.SPECIES.length],
        ['reqs', '依頼', S().reqs.length + '件'], ['diary', '日記', ''], ['trade', 'こうかん', 'コードで見せ合い'], ['rec', '記録', D.RANKS[Sim.rankIdx()][1]], ['fb', '感想・不具合', '文章にして共有'], ['conf', 'せってい', '']];
      return '<div class="grid">' + items.map(function (x) { return '<button class="bigbtn" data-a="go" data-v="' + x[0] + '"><b>' + x[1] + '</b><small>' + x[2] + '</small></button>'; }).join('') + '</div>' +
        '<p class="note">時間はこの画面をひらいているあいだ止まっているよ。ゆっくりどうぞ。</p>';
    },
    on: function (a, el) { if (a === 'go') SheetsAPI.open(el.dataset.v, el.dataset.v === 'shop' ? 'seed' : undefined); }
  };

  /* ショップ */
  SH.shop = {
    title: 'ショップ',
    html: function () {
      var tab = st.tab || 'seed', s = S(), h = '<div class="subtabs">';
      [['seed', 'たね'], ['item', 'どうぐ'], ['pot', '鉢と土'], ['decor', 'かざり'], ['place', '場所']].forEach(function (t) { h += '<button class="st' + (tab === t[0] ? ' on' : '') + '" data-a="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; });
      h += '</div><div class="coinline">コイン <b>' + s.coins + '</b></div>';
      if (tab === 'seed') {
        D.SPECIES.forEach(function (sp) {
          var z = Sim.Z(sp.id), unlocked = sp.rar <= 1 || Sim.zCount() >= sp.rar * 3 - 3;
          h += '<div class="card2"><div class="rl"><b>' + sw(sp.leaf) + sp.n + '</b><small>' + sp.cat + ' ・ ' + sp.places.map(function (p) { return D.PLACES[p].n; }).join('・') + '</small></div>' +
            '<div class="rl">' + D.likes(sp).join(' / ') + '</div>' +
            (unlocked ? '<div class="btns">' + row('たね ' + sp.price + 'コイン', 'buy', 'data-k="seed" data-id="' + sp.id + '" data-t="0"') +
              (z.best >= 3 ? row('えらばれた種 ' + sp.price * 3, 'buy', 'data-k="seed" data-id="' + sp.id + '" data-t="1"') : '') + '</div>' :
              '<div class="lock">図鑑を' + (sp.rar * 3 - 3) + '種類そろえると並ぶよ</div>') + '</div>';
        });
      } else if (tab === 'item') {
        [['fert', '肥料', '30コイン / 5こ', '栄養をふやす'], ['strong', 'ぐんぐん肥料', '60コイン / 3こ', '成長が少し早まる'], ['pest', '虫よけ', '45コイン / 3こ', 'しばらく虫がつかない'], ['leaf', '葉のくすり', '45コイン / 3こ', '葉をすこやかに保つ']].forEach(function (x) {
          h += '<div class="card2"><div class="rl"><b>' + x[1] + '</b><small>もっている ' + s.inv[x[0]] + '</small></div><div class="rl">' + x[3] + '</div><div class="btns">' + row(x[2], 'buy', 'data-k="item" data-id="' + x[0] + '"') + '</div></div>';
        });
        var nx = D.CANS[s.can + 1];
        h += '<div class="card2"><div class="rl"><b>' + D.CANS[s.can].n + '</b><small>いまのじょうろ</small></div>' + (nx ? '<div class="btns">' + row(nx.n + ' ' + nx.cost + 'コイン', 'buy', 'data-k="can" data-id="x"') + '</div>' : '<div class="rl">最高のじょうろだよ</div>') + '</div>';
      } else if (tab === 'pot') {
        D.POTS.concat(D.SOILS).forEach(function (x) {
          var isPot = x.cap !== undefined, own = (isPot ? s.pots : s.soils).indexOf(x.id) >= 0;
          h += '<div class="card2"><div class="rl"><b>' + sw(x.col) + x.n + '</b><small>' + (isPot ? '鉢' : '土') + '</small></div><div class="rl">' + (isPot ? (x.cap > 1 ? '根がのびのび。水もちがよい。' : x.cap < 1 ? 'コンパクト。かわきやすい。' : 'ほどよい大きさ。') : x.desc) + '</div>' +
            '<div class="btns">' + (own ? '<span class="tag">もっている</span>' : row(x.cost + 'コイン', 'buy', 'data-k="' + (isPot ? 'pot' : 'soil') + '" data-id="' + x.id + '"')) + '</div></div>';
        });
      } else if (tab === 'decor') {
        if (s.places.indexOf('garden') < 0) h += '<p class="note">庭・畑が使えるようになると飾れるよ。</p>';
        D.DECOR.forEach(function (x) {
          h += '<div class="card2"><div class="rl"><b>' + x.n + '</b><small>庭の美しさ +' + x.b + '</small></div><div class="btns">' + (s.decor.indexOf(x.id) >= 0 ? '<span class="tag">飾っている</span>' : row(x.cost + 'コイン', 'buy', 'data-k="decor" data-id="' + x.id + '"')) + '</div></div>';
        });
      } else {
        D.PLACE_ORDER.forEach(function (id) {
          var P = D.PLACES[id], own = s.places.indexOf(id) >= 0;
          h += '<div class="card2"><div class="rl"><b>' + P.n + '</b><small>' + P.slots + 'か所</small></div><div class="rl">' + P.desc + '</div><div class="btns">' +
            (own ? '<span class="tag">使えるよ</span>' : '<small class="need">図鑑 ' + Sim.zCount() + '/' + P.need + '種類</small>' + row(P.cost + 'コイン', 'buy', 'data-k="place" data-id="' + id + '"')) + '</div></div>';
        });
      }
      return h;
    },
    on: function (a, el) {
      if (a === 'tab') { st.tab = el.dataset.v; render(); }
      else if (a === 'buy') { var r = Sim.Z && Sim.buy(el.dataset.k, el.dataset.id, +el.dataset.t || 0); UI.afterAction(r); if (r.ok && el.dataset.k === 'decor') World.refreshDecor(); render(); }
    }
  };

  /* たねぶくろ */
  SH.bag = {
    title: 'たねぶくろ',
    html: function () {
      var s = S(); if (!s.seeds.length) return '<p class="note">種はまだないよ。ショップで買ったり、かけあわせで増やそう。</p>';
      return '<p class="note">' + s.seeds.length + ' / 60 こ。まきたいときは、あいている場所をタップして「たねをまく」。</p>' + s.seeds.map(function (sd) { return '<div class="card2"><div class="rl">' + seedLine(sd) + '</div></div>'; }).join('');
    },
    on: function () {}
  };

  /* 種まき */
  SH.sow = {
    title: 'たねをまく',
    init: function (arg) { var pl = World.place, sl = arg && arg.slot >= 0 && !Sim.plantAt(pl, arg.slot) ? arg.slot : Sim.freeSlot(pl); st = { place: pl, slot: sl, seed: -1, pot: 'm', soil: 'basic' }; },
    html: function () {
      var s = S(), P = D.PLACES[st.place], h;
      if (st.slot < 0) return '<p class="note">' + P.n + 'はいっぱいだよ。別の場所を見てみよう。</p>';
      h = '<p class="note">' + P.n + ' ・ ' + (st.slot + 1) + '番目の場所にまくよ。</p><h4>たね</h4>';
      var any = false;
      s.seeds.forEach(function (sd, i) {
        if (D.byId[sd.sp].places.indexOf(st.place) < 0) return; any = true;
        h += row(seedLine(sd), 'seed', 'data-i="' + i + '"', false).replace('class="row', 'class="row' + (st.seed === i ? ' on' : ''));
      });
      if (!any) h += '<p class="note">この場所に合う種がないよ。</p>';
      h += '<h4>鉢</h4><div class="chips">' + s.pots.map(function (id) { var x = D.pot(id); return '<button class="chipb' + (st.pot === id ? ' on' : '') + '" data-a="pot" data-v="' + id + '">' + sw(x.col) + x.n + '</button>'; }).join('') + '</div>';
      if (!P.water) h += '<h4>土</h4><div class="chips">' + s.soils.map(function (id) { var x = D.soil(id); return '<button class="chipb' + (st.soil === id ? ' on' : '') + '" data-a="soil" data-v="' + id + '">' + sw(x.col) + x.n + '</button>'; }).join('') + '</div>';
      if (st.seed >= 0 && s.seeds[st.seed]) { var sp = D.byId[s.seeds[st.seed].sp]; h += '<p class="note">' + sp.n + ':' + D.likes(sp).join(' / ') + '</p>'; }
      return h + '<div class="btns end"><button class="btn" data-a="go" ' + (st.seed < 0 ? 'disabled' : '') + '>まく</button></div>';
    },
    on: function (a, el) {
      if (a === 'seed') { st.seed = +el.dataset.i; render(); }
      else if (a === 'pot') { st.pot = el.dataset.v; render(); }
      else if (a === 'soil') { st.soil = el.dataset.v; render(); }
      else if (a === 'go') {
        var r = Sim.plantSeed(st.seed, st.place, st.slot, st.pot, D.PLACES[st.place].water ? 'moist' : st.soil);
        if (!r.ok) { UI.toast(r.msg, 'warn'); Snd.sfx('ng'); return; }
        close(); UI.afterAction(r, r.plant); World.sync(); UI.select(r.plant.id, -1);
      }
    }
  };

  /* 植え替え */
  SH.repot = {
    title: '植え替え',
    init: function (arg) { var p = Sim.plantById(arg.id); st = { id: arg.id, pot: p ? p.pot : 'm', soil: p ? p.soil : 'basic' }; },
    html: function () {
      var s = S(), p = Sim.plantById(st.id); if (!p) return '';
      var h = '<p class="note">' + D.byId[p.sp].n + ' の鉢と土をえらぼう。</p><h4>鉢</h4><div class="chips">' + s.pots.map(function (id) { var x = D.pot(id); return '<button class="chipb' + (st.pot === id ? ' on' : '') + '" data-a="pot" data-v="' + id + '">' + sw(x.col) + x.n + '</button>'; }).join('') + '</div>';
      if (!D.PLACES[p.place].water) h += '<h4>土</h4><div class="chips">' + s.soils.map(function (id) { var x = D.soil(id); return '<button class="chipb' + (st.soil === id ? ' on' : '') + '" data-a="soil" data-v="' + id + '">' + sw(x.col) + x.n + '</button>'; }).join('') + '</div>';
      return h + '<div class="btns end"><button class="btn" data-a="go">植え替える</button></div>';
    },
    on: function (a, el) {
      if (a === 'pot') { st.pot = el.dataset.v; render(); } else if (a === 'soil') { st.soil = el.dataset.v; render(); }
      else if (a === 'go') { var p = Sim.plantById(st.id), r = Sim.repot(p, st.pot, st.soil); if (!r.ok) { UI.toast(r.msg, 'warn'); Snd.sfx('ng'); return; } close(); UI.afterAction(r, p); }
    }
  };

  /* 移動 */
  SH.move = {
    title: '場所をうつす',
    init: function (arg) { st = { id: arg.id }; },
    html: function () {
      var p = Sim.plantById(st.id), s = S(), sp = D.byId[p.sp], h = '<p class="note">' + sp.n + ' をどこに置く?</p>';
      s.places.forEach(function (pl) {
        if (sp.places.indexOf(pl) < 0) { h += '<div class="card2 dim"><div class="rl"><b>' + D.PLACES[pl].n + '</b><small>' + sp.n + 'には合わない場所</small></div></div>'; return; }
        var free = []; for (var i = 0; i < D.PLACES[pl].slots; i++) if (!Sim.plantAt(pl, i)) free.push(i);
        h += '<div class="card2"><div class="rl"><b>' + D.PLACES[pl].n + '</b><small>あき ' + free.length + '</small></div><div class="btns">' + (free.length ? free.map(function (i) { return row((i + 1) + '番目', 'to', 'data-p="' + pl + '" data-i="' + i + '"'); }).join('') : '<small>いっぱいだよ</small>') + '</div></div>';
      });
      return h;
    },
    on: function (a, el) {
      if (a !== 'to') return; var p = Sim.plantById(st.id), r = Sim.move(p, el.dataset.p, +el.dataset.i);
      if (!r.ok) { UI.toast(r.msg, 'warn'); Snd.sfx('ng'); return; }
      close(); UI.toast(r.msg); Snd.sfx('move'); World.setPlace(el.dataset.p); World.sync(); UI.select(p.id, -1); UI.refresh();
    }
  };

  /* かけあわせ */
  SH.cross = {
    title: 'かけあわせ',
    init: function (arg) { st = { first: arg.first }; },
    html: function () {
      var a = Sim.plantById(st.first); if (!a) return '';
      var list = alive().filter(function (b) { return b.id !== a.id && b.sp === a.sp && Sim.ready(b); });
      var h = '<p class="note">' + D.byId[a.sp].n + ' と かけあわせる相手をえらんでね。おなじ種類で、花ざかりか、しっかり育ったものどうしだよ。種が2つできるよ。</p>';
      if (!list.length) return h + '<p class="note">いまは相手がいないみたい。同じ種類をもう1つ育ててみよう。</p>';
      return h + list.map(function (b) { return row('<b>' + D.PLACES[b.place].n + ' ' + (b.slot + 1) + '番目</b><small>' + UI.stars(Sim.stars(b)) + '</small>', 'with', 'data-id="' + b.id + '"'); }).join('');
    },
    on: function (a, el) {
      if (a !== 'with') return; var r = Sim.cross(Sim.plantById(st.first), Sim.plantById(+el.dataset.id));
      if (!r.ok) { UI.toast(r.msg, 'warn'); Snd.sfx('ng'); return; } close(); UI.afterAction(r, Sim.plantById(st.first)); World.event('butterfly');
    }
  };

  /* 図鑑 */
  SH.zukan = {
    title: '図鑑',
    html: function () {
      if (st.detail) return zDetail(D.byId[st.detail]);
      var h = '<p class="note">' + Sim.zCount() + ' / ' + D.SPECIES.length + ' 種類。観察すると、くわしくなるよ。</p><div class="zgrid">';
      D.CATS.forEach(function (c) {
        D.SPECIES.filter(function (s) { return s.cat === c; }).forEach(function (s) {
          var z = Sim.Z(s.id);
          h += '<button class="zc' + (z.seen ? '' : ' un') + '" data-a="d" data-id="' + s.id + '">' + (z.seen ? sw(s.leaf) + '<b>' + s.n + '</b><small>' + c + '</small>' : '<b>？？？</b><small>' + c + '</small>') + '</button>';
        });
      });
      return h + '</div>';
    },
    on: function (a, el) { if (a === 'd') { st.detail = el.dataset.id; render(); } else if (a === 'back') { st.detail = null; render(); } }
  };
  function zDetail(s) {
    var z = Sim.Z(s.id);
    if (!z.seen) return '<button class="back" data-a="back">‹ もどる</button><p class="note">まだ出会っていない植物だよ。</p>';
    var h = '<button class="back" data-a="back">‹ もどる</button><h3>' + sw(s.leaf) + s.n + '</h3><p class="note">' + s.cat + ' ・ ' + (s.life === 'ann' ? '一年草タイプ' : '何年も育つタイプ') + '</p>';
    h += '<p>' + s.tips[0] + '</p>';
    h += z.obs >= 1 ? '<p>好み:' + D.likes(s).join(' / ') + '</p><p>育つ場所:' + s.places.map(function (p) { return D.PLACES[p].n; }).join('・') + '</p>' : '<p class="lock">観察すると、好みがわかるよ。(' + z.obs + '/1)</p>';
    h += z.obs >= 3 ? '<p>' + s.tips[1] + '</p><p>ちょうどいい気温:' + (s.t[0] - s.t[1] / 2).toFixed(0) + '〜' + (s.t[0] + s.t[1] / 2).toFixed(0) + '℃くらい</p>' : '<p class="lock">もっと観察すると、ひみつがわかるよ。(' + Math.min(z.obs, 3) + '/3)</p>';
    h += '<p>見つけた色:' + s.pal.map(function (c, i) { return z.cols.indexOf(i) >= 0 ? sw(c) : '<i class="sw un"></i>'; }).join('') + ' (' + z.cols.length + '/6)</p>';
    h += '<p>最高の品質:' + (z.best ? UI.stars(z.best) : '—') + ' ・ 収穫 ' + z.harv + '回</p>';
    return h + '<p class="note small">※ゲームのための表現で、実際の植物の効能・食べられるかどうか・安全性を示すものではありません。</p>';
  }

  /* 依頼 */
  SH.reqs = {
    title: '依頼',
    html: function () {
      var s = S(); if (!s.reqs.length) return '<p class="note">いまは依頼がないよ。日がたつと、そっと届くよ。</p>';
      return s.reqs.map(function (q, i) {
        var t = q.type, sp = q.sp ? D.byId[q.sp].n : '', txt = t === 'harvest' ? sp + 'を' + q.n + '回収穫してほしい' : t === 'star' ? sp + 'の★' + q.k + '以上を収穫してほしい' : t === 'collect' ? '図鑑に新しい植物を' + q.n + '種類のせてほしい' : t === 'observe' ? '植物を' + q.n + '回、じっくり観察してほしい' : sp + 'の花が咲くところを見たい';
        var done = q.got >= q.n;
        return '<div class="card2"><div class="rl"><b>' + esc(q.who) + '</b><small>' + Math.min(q.got, q.n) + '/' + q.n + '</small></div><div class="rl">' + txt + '</div><div class="btns"><small>お礼 ' + q.coins + 'コイン' + (q.item ? '+どうぐ' : '') + '</small>' + (done ? row('うけとる', 'claim', 'data-i="' + i + '"') : '') + '</div></div>';
      }).join('');
    },
    on: function (a, el) { if (a === 'claim') { UI.afterAction(Sim.claimReq(+el.dataset.i)); World.event('star'); render(); } }
  };

  /* 日記 */
  SH.diary = {
    title: '日記',
    html: function () {
      var d = S().diary; if (!d.length) return '<p class="note">まだ何も書かれていないよ。</p>';
      return d.slice(0, 80).map(function (e) { return '<div class="dl"><small>' + e.y + '年目 ' + e.s + ' ' + e.sd + '日</small><span>' + esc(e.t) + '</span></div>'; }).join('');
    },
    on: function () {}
  };

  /* こうかん(コードで見せ合い) */
  SH.trade = {
    title: 'こうかん',
    init: function () { st = { tab: 'give', code: '' }; },
    html: function () {
      var h = '<div class="subtabs"><button class="st' + (st.tab === 'give' ? ' on' : '') + '" data-a="tab" data-v="give">おくる</button><button class="st' + (st.tab === 'get' ? ' on' : '') + '" data-a="tab" data-v="get">うけとる</button></div>';
      h += '<p class="note small">お友だちと「コード」を見せ合って、種をおくりあう仕組みだよ。サーバーは使わないので、個人情報は何も送られないよ。コードは、信頼できる人とだけ交換してね。</p>';
      if (st.tab === 'give') {
        var l = alive(); if (!l.length) return h + '<p class="note">育っている植物がないよ。</p>';
        h += l.map(function (p) { return row('<b>' + D.byId[p.sp].n + '</b><small>' + UI.stars(Sim.stars(p)) + '</small>', 'mk', 'data-id="' + p.id + '"'); }).join('');
        if (st.code) h += '<textarea id="code" readonly rows="4">' + esc(st.code) + '</textarea><div class="btns end"><button class="btn" data-a="copy">コピー</button></div>';
      } else {
        h += '<textarea id="code" rows="4" placeholder="ここにコードをはりつけ"></textarea><div class="btns end"><button class="btn" data-a="imp">うけとる</button></div>';
      }
      return h;
    },
    on: function (a, el) {
      if (a === 'tab') { st.tab = el.dataset.v; st.code = ''; render(); }
      else if (a === 'mk') { st.code = Sim.exportCode(Sim.plantById(+el.dataset.id)); S().stats.gave++; render(); }
      else if (a === 'copy') {
        var ta = $('#code'); ta.focus(); ta.select();
        var okc = false; try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(ta.value); okc = true; } else okc = document.execCommand('copy'); } catch (e) { try { okc = document.execCommand('copy'); } catch (e2) {} }
        UI.toast(okc ? 'コピーしたよ' : '文字を長押ししてコピーしてね');
      } else if (a === 'imp') { var r = Sim.importCode($('#code').value); UI.afterAction(r); if (r.ok) { $('#code').value = ''; World.event('butterfly'); } }
    }
  };

  /* 記録 */
  SH.rec = {
    title: '記録',
    html: function () {
      var s = S(), t = s.stats, di = Sim.dateInfo(), h = '<div class="rank"><small>庭のランク</small><b>' + D.RANKS[Sim.rankIdx()][1] + '</b><small>美しさ ' + Sim.beauty() + '</small></div>';
      var nx = D.RANKS[Sim.rankIdx() + 1]; if (nx) h += '<p class="note">次の「' + nx[1] + '」まで あと ' + (nx[0] - Sim.beauty()) + '</p>';
      var rows = [['遊んだ日数', s.day + '日(' + di.year + '年目)'], ['図鑑', Sim.zCount() + '/' + D.SPECIES.length], ['収穫', t.harvest + '回'], ['花を咲かせた', t.blooms + '回'], ['かけあわせ', t.crosses + '回'], ['育てきった', t.done + '本'], ['観察', t.obs + '回'], ['おやすみした子', t.died + '本'], ['最高のコイン', t.maxCoins], ['おくった種', t.gave + 'こ'], ['もらった種', t.got + 'こ']];
      return h + rows.map(function (r) { return '<div class="kv"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('');
    },
    on: function () {}
  };

  /* 感想・不具合(チェック+自由記入 → 文章にして、コピー・共有) */
  var FB_GROUPS = [
    ['good', 'よかったところ', ['3Dの見た目', 'BGM・音', '育てる楽しさ', 'かけあわせ', '図鑑', '5つの場所', '季節・天気', '依頼・庭のランク']],
    ['bad', 'わかりにくい・不満', ['操作がわかりにくい', '説明が足りない', '字やボタンが小さい', 'テンポが遅い', 'コインのバランス', '成長の速さ', '何をすればいいかわからない']],
    ['bug', '不具合', ['画面が止まる・進まない', 'ボタンが押せない', '数字がおかしい', '表示が崩れる・はみ出す', 'セーブがおかしい・消えた', '音がおかしい', '3Dが表示されない']],
    ['want', 'ほしいもの', ['もっと植物', 'もっと場所', 'もっとかざり', '友達と見せ合えるもの', 'やりこみ要素', 'わかりやすい説明']]
  ];
  var FB_SCREENS = ['ホーム(3D画面)', 'ショップ', 'たねぶくろ・種まき', '図鑑', '依頼', 'こうかん', 'せってい'];
  function fbGrab() {
    FB_GROUPS.forEach(function (g) { var t = $('#fb_' + g[0]); if (t) st.t[g[0]] = t.value; });
    ['other', 'name'].forEach(function (k) { var t = $('#fb_' + k); if (t) st[k] = t.value; });
  }
  function fbText() {
    var L = ['【ぷらんと日記 感想】'];
    if (st.name.trim()) L.push('名前:' + st.name.trim());
    if (st.star) L.push('楽しさ:' + '★'.repeat(st.star) + '☆'.repeat(5 - st.star));
    FB_GROUPS.forEach(function (g) {
      var c = st.c[g[0]], t = (st.t[g[0]] || '').trim(), line = [];
      if (c.length) line.push(c.join('、')); if (g[0] === 'bug' && st.scr.length) line.push('場所:' + st.scr.join('、')); if (t) line.push(t);
      if (line.length) L.push('■' + g[1] + '\n' + line.join('\n'));
    });
    if (st.other.trim()) L.push('■そのほか\n' + st.other.trim());
    if (st.info) L.push('(端末:画面' + window.innerWidth + 'x' + window.innerHeight + ' / ' + S().day + '日め)');
    return L.join('\n');
  }
  function fbEmpty() { return !st.star && !st.other.trim() && FB_GROUPS.every(function (g) { return !st.c[g[0]].length && !(st.t[g[0]] || '').trim(); }); }
  SH.fb = {
    title: '感想・不具合',
    init: function () { st = { star: 0, name: '', other: '', info: true, scr: [], c: { good: [], bad: [], bug: [], want: [] }, t: { good: '', bad: '', bug: '', want: '' }, out: '' }; },
    html: function () {
      if (st.out) {
        return '<p>できあがり。コピーして、書いた内容を作者に送ったり、SNSやメモに貼ったりできます。</p><textarea id="fbout" readonly rows="10">' + esc(st.out) + '</textarea>' +
          '<div class="btns end"><button class="btn ghost" data-a="back">直す</button>' + (navigator.share ? '<button class="btn ghost" data-a="share">共有</button>' : '') + '<button class="btn" data-a="copy">コピー</button></div>';
      }
      var h = '<p class="note small">全部書かなくて大丈夫。チェックを入れるだけでもOKです。名前やメールなど、個人がわかる情報は書かないでね。</p>';
      h += '<h4>楽しさ(任意)</h4><div class="chips">' + [1, 2, 3, 4, 5].map(function (i) { return '<button class="chipb' + (st.star === i ? ' on' : '') + '" data-a="star" data-v="' + i + '">' + '★'.repeat(i) + '</button>'; }).join('') + '</div>';
      FB_GROUPS.forEach(function (g) {
        h += '<h4>' + g[1] + '</h4><div class="chips">' + g[2].map(function (x) { return '<button class="chipb' + (st.c[g[0]].indexOf(x) >= 0 ? ' on' : '') + '" data-a="chk" data-g="' + g[0] + '" data-v="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>';
        if (g[0] === 'bug') h += '<p class="note small" style="margin-top:8px">起きた画面</p><div class="chips">' + FB_SCREENS.map(function (x) { return '<button class="chipb' + (st.scr.indexOf(x) >= 0 ? ' on' : '') + '" data-a="scr" data-v="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>';
        h += '<textarea id="fb_' + g[0] + '" rows="2" maxlength="500" placeholder="自由に書いてね">' + esc(st.t[g[0]]) + '</textarea>';
      });
      h += '<h4>そのほか</h4><textarea id="fb_other" rows="2" maxlength="500">' + esc(st.other) + '</textarea>';
      h += '<h4>名前(任意)</h4><input id="fb_name" maxlength="20" placeholder="ニックネームなど" value="' + esc(st.name) + '" style="width:100%;border:2px solid var(--line);border-radius:12px;padding:9px;font-size:14px;background:#fff;color:var(--ink)">';
      h += '<div class="chips" style="margin-top:10px"><button class="chipb' + (st.info ? ' on' : '') + '" data-a="info">端末の画面サイズと遊んだ日数もそえる</button></div>';
      return h + '<div class="btns end"><button class="btn" data-a="make">文章にする</button></div>';
    },
    on: function (a, el) {
      if (a === 'copy') {
        var ta = $('#fbout'); ta.focus(); ta.select();
        var okc = false; try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(ta.value); okc = true; } else okc = document.execCommand('copy'); } catch (e) { try { okc = document.execCommand('copy'); } catch (e2) {} }
        UI.toast(okc ? 'コピーしたよ' : '文字を長押ししてコピーしてね'); return;
      }
      if (a === 'share') { try { navigator.share({ title: 'ぷらんと日記 感想', text: st.out }).catch(function () {}); } catch (e) {} return; }
      if (a === 'back') { st.out = ''; render(); return; }
      fbGrab();
      if (a === 'star') { var v = +el.dataset.v; st.star = st.star === v ? 0 : v; }
      else if (a === 'chk') { var arr = st.c[el.dataset.g], i = arr.indexOf(el.dataset.v); if (i >= 0) arr.splice(i, 1); else arr.push(el.dataset.v); }
      else if (a === 'scr') { var j = st.scr.indexOf(el.dataset.v); if (j >= 0) st.scr.splice(j, 1); else st.scr.push(el.dataset.v); }
      else if (a === 'info') st.info = !st.info;
      else if (a === 'make') { if (fbEmpty()) { UI.toast('どこか1つチェックするか書いてね', 'warn'); return; } st.out = fbText(); }
      render();
    }
  };

  /* せってい */
  SH.conf = {
    title: 'せってい',
    html: function () {
      var c = S().cfg, h = '<h4>1日の長さ</h4><div class="chips">' + [[30, 'はやめ'], [45, 'ふつう'], [75, 'ゆっくり'], [120, 'のんびり']].map(function (x) { return '<button class="chipb' + (c.len === x[0] ? ' on' : '') + '" data-a="len" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
      h += '<p class="note small">画面をとじている間は、時間は止まるよ。いつ戻ってきても大丈夫。</p>';
      h += '<h4>音</h4><div class="chips"><button class="chipb' + (c.snd ? ' on' : '') + '" data-a="snd">効果音 ' + (c.snd ? 'ON' : 'OFF') + '</button><button class="chipb' + (c.bgm ? ' on' : '') + '" data-a="bgm">BGM ' + (c.bgm ? 'ON' : 'OFF') + '</button></div>';
      h += '<h4>データ</h4><p class="note small">セーブは、この端末のブラウザの中にだけ保存されるよ。ブラウザのデータを消すと、なくなるので注意してね。</p>';
      h += st.wipe ? '<p class="note">本当に最初からにする?もとには戻せないよ。</p><div class="btns"><button class="btn danger" data-a="wipe2">消して最初から</button><button class="btn ghost" data-a="wipe0">やめる</button></div>' : '<div class="btns"><button class="btn ghost" data-a="wipe1">最初からやり直す</button></div>';
      h += '<h4>クレジット</h4><p class="note small">ぷらんと日記。絵(3D)・音・文章・データは、すべてこのゲームのために自作したものです。3D表示に three.js(MIT License)を使っています。植物の説明はゲーム用の表現で、実在の植物の効能・食用・毒性・安全性を保証するものではありません。</p>';
      return h;
    },
    on: function (a, el) {
      var c = S().cfg;
      if (a === 'len') { c.len = +el.dataset.v; Sim.saveSoon(); render(); }
      else if (a === 'snd') { c.snd = !c.snd; Snd.setSfx(c.snd); Sim.saveSoon(); render(); }
      else if (a === 'bgm') { c.bgm = !c.bgm; Snd.setBgm(c.bgm); Sim.saveSoon(); render(); }
      else if (a === 'wipe1') { st.wipe = true; render(); } else if (a === 'wipe0') { st.wipe = false; render(); }
      else if (a === 'wipe2') { Sim.wipe(); window.__noSave = true; location.reload(); }
    }
  };

  /* ---------- 共通の開閉 ---------- */
  function render() {
    if (!cur) return; var sh = SH[cur], box = $('#sheet');
    box.querySelector('.sh-title').textContent = sh.title;
    var body = box.querySelector('.sh-body'), top = body.scrollTop;
    body.innerHTML = sh.html(); body.scrollTop = top;
    box.querySelector('.sh-back').hidden = cur === 'menu';
  }
  function open(name, arg) {
    var sh = SH[name]; if (!sh) return;
    if (cur && cur !== name) { /* シートの切り替え */ }
    cur = name; st = {};
    if (name === 'shop') st.tab = arg || 'seed';
    if (sh.init) sh.init(arg);
    UI.setSheet(true); $('#sheet').hidden = false; render(); $('#sheet').querySelector('.sh-body').scrollTop = 0;
  }
  function close() { cur = null; $('#sheet').hidden = true; UI.setSheet(false); UI.refresh(); }
  function init() {
    var box = $('#sheet');
    box.innerHTML = '<div class="sh-back-drop" data-close="1"></div><div class="sh-panel"><div class="sh-head"><button class="sh-back" data-a="menu">‹</button><b class="sh-title"></b><button class="sh-x" data-close="1">×</button></div><div class="sh-body"></div></div>';
    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { Snd.sfx('tap'); close(); return; }
      var b = e.target.closest('[data-a]'); if (!b || b.disabled || !cur) return; Snd.sfx('tap');
      if (b.dataset.a === 'menu') { open('menu'); return; }
      SH[cur].on(b.dataset.a, b);
    });
  }
  var SheetsAPI = { init: init, open: open, close: close, isOpen: function () { return !!cur; } };
  return SheetsAPI;
})();
