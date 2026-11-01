'use strict';
/* ぷらんと日記 - 起動とメインループ */
(function () {
  function fatal() { var f = document.getElementById('fatal'); if (f) f.style.display = 'flex'; }
  if (typeof THREE === 'undefined') { fatal(); return; }
  var loaded = false;
  try { loaded = Sim.load(); } catch (e) { loaded = false; }
  if (!loaded || !Sim.S) Sim.startGame();
  var S = Sim.S;
  try {
    World.init(document.getElementById('gl'));
  } catch (e) { console.error(e); fatal(); return; }
  World.onTap(UI.onTap);
  Sheets.init(); UI.init();
  Snd.setSfx(S.cfg.snd); Snd.setBgm(S.cfg.bgm);
  World.setPlace(S.places[0]); World.sync(); UI.refresh();

  var last = performance.now(), acc = 0, topT = 0, playMs = 0, restShown = false;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    if (document.hidden) return;
    if (!UI.paused()) {
      var ev = Sim.tick(dt);
      if (ev.length) UI.handleEvents(ev);
      playMs += dt * 1000;
      if (playMs > 25 * 60000 && !restShown) { restShown = true; UI.say('ずいぶん遊んだね。ちょっと目を休めて、のびをしよう。', 12000); Snd.sfx('rest'); }
    }
    World.update(dt);
    topT += dt; if (topT > .4) { topT = 0; UI.refreshTop(); }
  }
  requestAnimationFrame(function (t) { last = t; frame(t); });
  window.addEventListener('resize', function () { World.resize(); UI.fitCamera(); });
  document.addEventListener('pointerdown', function () { Snd.init(); }, { once: true });
  function sv() { if (!window.__noSave) Sim.save(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) sv(); else last = performance.now(); });
  window.addEventListener('pagehide', sv);
  setInterval(sv, 30000);
})();
