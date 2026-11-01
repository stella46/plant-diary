'use strict';
/* ぷらんと日記 - 画面(上のバー・植物カード・どうぐ・場所タブ・ドラッグ操作) */
var UI = (function () {
  var $ = function (s) { return document.querySelector(s); };
  var sel = { plant: 0, slot: -1 }, sheetOn = false, bubbleTimer = 0, hintSeen = {}, insetKey = '';
  var TOOLS = [['water', '水やり', '#5aa9d6'], ['fert', '肥料', '#78b84e'], ['prune', '剪定', '#d9a441'], ['bug', '虫とり', '#c0654f'], ['leaf', '葉の手入れ', '#4fb59a'], ['look', '観察', '#9a7ad0']];
  var stars = function (n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); };

  function toast(msg, kind) {
    var box = $('#toasts'); if (!box) return;
    var t = document.createElement('div'); t.className = 'toast' + (kind ? ' ' + kind : ''); t.textContent = msg; box.appendChild(t);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
  }
  function say(text, ms) {
    var b = $('#bubble'); b.querySelector('span').textContent = text; b.hidden = false;
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(function () { b.hidden = true; }, ms || 7000);
  }
  function hint(key, text) { var S = Sim.S; if (S.flags['h_' + key]) return; S.flags['h_' + key] = 1; say(text, 9000); }
  function selPlant() { return sel.plant ? Sim.plantById(sel.plant) : null; }
  function select(pid, slot) {
    sel.plant = pid || 0; sel.slot = slot === undefined ? -1 : slot;
    World.select(sel.plant, sel.slot); refreshCard();
  }
  function afterAction(r, p) {
    if (!r.ok) { toast(r.msg, 'warn'); Snd.sfx('ng'); return r; }
    toast(r.msg); Snd.sfx(r.fx); if (p && r.fx) World.burst(r.fx, p.id);
    if (r.first) toast('図鑑に新しい植物がのったよ!');
    World.sync(); refresh(); return r;
  }

  /* ---- 上のバー ---- */
  function refreshTop() {
    var S = Sim.S, di = Sim.dateInfo();
    $('#coins b').textContent = S.coins;
    $('#d1').textContent = di.year + '年目 ' + di.sn + ' ' + di.sd + '日 ・' + Sim.todName();
    $('#d2').textContent = D.WEATHER[S.weather].n + ' → あした' + D.WEATHER[S.next].n;
    $('#dbar i').style.width = (S.tod * 100).toFixed(1) + '%';
    $('#spd').textContent = '×' + S.speed;
    Snd.setMood(di.season, Sim.hour() < 5.5 || Sim.hour() > 19);
  }

  /* ---- 植物カード ---- */
  function bar(label, v, cls) { return '<div class="bar ' + cls + '"><span>' + label + '</span><div><i style="width:' + Math.round(clampN(v) * 100) + '%"></i></div></div>'; }
  function clampN(v) { return Math.max(0, Math.min(1, v)); }
  function refreshCard() {
    var S = Sim.S, el = $('#card'), place = World.place, P = D.PLACES[place];
    if (sel.plant && !Sim.plantById(sel.plant)) sel.plant = 0;
    if (!sel.plant && sel.slot < 0) { el.hidden = true; el.innerHTML = ''; return fitCamera(); }
    el.hidden = false;
    if (!sel.plant) {
      var n = S.seeds.filter(function (sd) { return D.byId[sd.sp].places.indexOf(place) >= 0; }).length;
      el.innerHTML = '<div class="c-head"><b>あいている場所</b><span class="chip dim">' + P.n + '</span></div>' +
        '<p class="c-adv">' + (n ? 'ここに種をまけるよ。(' + n + 'こ)' : 'この場所に合う種がないよ。ショップで買ってみよう。') + '</p>' +
        '<div class="c-actions"><button class="btn" data-act="sow">たねをまく</button><button class="btn ghost" data-act="shop">ショップへ</button></div>';
      return fitCamera();
    }
    var p = Sim.plantById(sel.plant), s = D.byId[p.sp], st = Sim.stars(p), adv = Sim.advice(p), pot = D.pot(p.pot);
    var dead = p.stage === 8, g = Sim.phen(p);
    var stg = D.STAGES[p.stage] + (p.stage === 3 && p.mature ? '(成熟)' : '');
    var chips = '<span class="chip">' + stg + '</span>' + (p.pest > .35 ? '<span class="chip bad">虫</span>' : '') + (p.dis > .35 ? '<span class="chip bad">葉に元気なし</span>' : '') + (p.cyc > 0 ? '<span class="chip dim">' + (p.cyc + 1) + '巡目</span>' : '');
    var acts = '';
    if (dead) acts = '<button class="btn" data-act="clear">片づけて、また植える</button>';
    else {
      var hv = Sim.canHarvest(p);
      acts = (hv.can ? '<button class="btn gold" data-act="harvest">' + s.hv.n + '</button>' : '') + (Sim.ready(p) ? '<button class="btn ghost" data-act="cross">かけあわせ</button>' : '') +
        '<button class="btn ghost" data-act="repot">植え替え</button><button class="btn ghost" data-act="move">移動</button>';
    }
    el.innerHTML = '<div class="c-head"><b>' + s.n + '</b>' + chips + '<span class="stars" title="品質">' + stars(st) + '</span></div>' +
      '<div class="c-sub">' + P.n + ' ・ ' + pot.n + ' ・ ' + D.soil(p.soil).n + '</div>' +
      (dead ? '' : '<div class="bars">' + (P.water ? '' : bar('みず', p.w, 'b-w')) + bar('えいよう', p.n, 'b-n') + bar('げんき', p.hp / 100, 'b-h') + bar('つぎの段階', p.stage === 3 && p.mature ? 1 : p.prog, 'b-g') + '</div>') +
      '<p class="c-adv ' + adv.kind + '">' + adv.msg + '</p><div class="c-actions">' + acts + '</div>';
    fitCamera();
  }
  function fitCamera() {
    requestAnimationFrame(function () {
      var t = $('#top').offsetHeight + ($('#bubble').hidden ? 0 : 0), b = $('#bottom').offsetHeight, key = t + '/' + b;
      if (key !== insetKey) { insetKey = key; World.setInsets(t, b); }
    });
  }

  /* ---- どうぐ・タブ ---- */
  function refreshTools() {
    var S = Sim.S, html = '';
    TOOLS.forEach(function (t) {
      var sub = t[0] === 'fert' ? '×' + S.inv.fert : t[0] === 'bug' && S.inv.pest ? '薬' + S.inv.pest : t[0] === 'leaf' && S.inv.leaf ? '薬' + S.inv.leaf : '';
      html += '<button class="tool" data-tool="' + t[0] + '"><i style="background:' + t[2] + '"></i><span>' + t[1] + '</span><small>' + sub + '</small></button>';
    });
    if (S.inv.strong > 0) html += '<button class="tool" data-tool="strong"><i style="background:#3f8a3a"></i><span>強い肥料</span><small>×' + S.inv.strong + '</small></button>';
    $('#tools').innerHTML = html;
  }
  function refreshTabs() {
    var S = Sim.S, html = '';
    D.PLACE_ORDER.forEach(function (id) {
      var open = S.places.indexOf(id) >= 0, on = World.place === id;
      html += '<button class="tab' + (on ? ' on' : '') + (open ? '' : ' lock') + '" data-place="' + id + '">' + D.PLACES[id].n + (open ? '' : '<small>未開放</small>') + '</button>';
    });
    $('#tabs').innerHTML = html;
  }
  function refresh() { refreshTop(); refreshCard(); refreshTools(); refreshTabs(); }

  /* ---- どうぐを使う ---- */
  function useTool(tool, p) {
    if (!p) { toast('先に植物をタップしてね', 'warn'); return; }
    var r;
    if (tool === 'water') r = Sim.water(p);
    else if (tool === 'fert') r = Sim.fertilize(p, false);
    else if (tool === 'strong') r = Sim.fertilize(p, true);
    else if (tool === 'prune') r = Sim.prune(p);
    else if (tool === 'bug') { r = Sim.pest(p, false); if (!r.ok && p.pest > .05 && p.lastPest === Sim.S.day && Sim.S.inv.pest > 0) r = Sim.pest(p, true); }
    else if (tool === 'leaf') { r = Sim.disease(p, false); if (!r.ok && p.dis > .05 && p.lastDis === Sim.S.day && Sim.S.inv.leaf > 0) r = Sim.disease(p, true); }
    else r = Sim.observe(p);
    afterAction(r, p);
  }
  function bindTools() {
    var drag = null, ghost = $('#ghost');
    $('#tools').addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.tool'); if (!b) return; Snd.init();
      drag = { tool: b.dataset.tool, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId, label: b.querySelector('span').textContent, col: b.querySelector('i').style.background };
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) { drag.moved = true; ghost.hidden = false; ghost.textContent = drag.label; ghost.style.background = drag.col; }
      if (drag.moved) ghost.style.transform = 'translate(' + (e.clientX - 30) + 'px,' + (e.clientY - 64) + 'px)';
    });
    function end(e, cancel) {
      if (!drag || e.pointerId !== drag.id) return; var d = drag; drag = null; ghost.hidden = true;
      if (cancel) return;
      if (d.moved) {
        var hit = World.pick(e.clientX, e.clientY);
        if (hit && hit.type === 'plant') { select(hit.id, -1); useTool(d.tool, Sim.plantById(hit.id)); } else toast('植物の上ではなしてね');
      } else useTool(d.tool, selPlant());
    }
    window.addEventListener('pointerup', function (e) { end(e, false); });
    window.addEventListener('pointercancel', function (e) { end(e, true); });
  }

  /* ---- カードのボタン・タブ・上のボタン ---- */
  function bindMisc() {
    $('#card').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return; Snd.init();
      var p = selPlant(), a = b.dataset.act;
      if (a === 'sow') Sheets.open('sow', { slot: sel.slot });
      else if (a === 'shop') Sheets.open('shop', 'seed');
      else if (!p) return;
      else if (a === 'harvest') afterAction(Sim.harvest(p), p);
      else if (a === 'clear') { var sl = p.slot; afterAction(Sim.clearPlant(p), p); select(0, sl); }
      else if (a === 'repot') Sheets.open('repot', { id: p.id });
      else if (a === 'move') Sheets.open('move', { id: p.id });
      else if (a === 'cross') Sheets.open('cross', { first: p.id });
    });
    $('#tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-place]'); if (!b) return; Snd.init(); Snd.sfx('tap');
      var id = b.dataset.place;
      if (Sim.S.places.indexOf(id) < 0) { Sheets.open('shop', 'place'); return; }
      World.setPlace(id); select(0, -1); refresh();
    });
    $('#spd').addEventListener('click', function () { Snd.init(); var S = Sim.S; S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; Snd.sfx('tap'); refreshTop(); });
    $('#menu').addEventListener('click', function () { Snd.init(); Snd.sfx('open'); Sheets.open('menu'); });
    $('#bubble').addEventListener('click', function () { $('#bubble').hidden = true; });
  }

  /* ---- 3Dのタップ ---- */
  function onTap(hit) {
    Snd.init();
    if (!hit) { select(0, -1); return; }
    Snd.sfx('tap');
    if (hit.type === 'plant') { select(hit.id, -1); hint('tool', '水やりなどのボタンは、タップするか、植物にドラッグして使えるよ。'); }
    else { select(0, hit.idx); }
  }

  /* ---- 一日が進んだときのお知らせ ---- */
  function handleEvents(list) {
    var worldFx = { butterfly: 1, rainbow: 1, bird: 1, star: 1 };
    list.slice(0, 4).forEach(function (e, i) {
      setTimeout(function () {
        toast(e.msg); Snd.sfx(e.fx);
        if (worldFx[e.fx]) World.event(e.fx); else if (e.fx === 'season' || e.fx === 'rank') { World.event('season'); World.burst('rank', 0); } else if (e.pid) World.burst(e.fx, e.pid);
      }, i * 700);
    });
    World.sync(); refresh();
  }

  function init() {
    bindTools(); bindMisc(); refresh();
    var S = Sim.S;
    if (!S.flags.h_welcome) { S.flags.h_welcome = 1; say('ようこそ、ぷらんと日記へ。窓辺のミントをタップして、ようすを見てみよう。', 11000); }
    else say(D.TIPS[Math.floor(Math.random() * D.TIPS.length)], 6000);
    fitCamera();
  }
  return {
    init: init, refresh: refresh, refreshTop: refreshTop, refreshCard: refreshCard, onTap: onTap, handleEvents: handleEvents, toast: toast, say: say, hint: hint,
    afterAction: afterAction, select: select, selPlant: selPlant, useTool: useTool, stars: stars, fitCamera: fitCamera,
    setSheet: function (v) { sheetOn = v; }, paused: function () { return sheetOn; }
  };
})();
