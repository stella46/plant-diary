'use strict';
/* ぷらんと日記 - 効果音とBGM(ブラウザの音声合成で自作。音源ファイルは使いません) */
var Snd = (function () {
  var ctx = null, master, sfxG, bgmG, delay, fb, timer = 0, nextT = 0, step = 0, mood = { shift: 0, slow: 1, night: false };
  var enabled = true, bgmOn = true, started = false;
  var PENTA = [0, 2, 4, 7, 9];
  var CHORDS = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];
  function hz(semi) { return 261.63 * Math.pow(2, semi / 12); }
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
      sfxG = ctx.createGain(); sfxG.gain.value = .55; sfxG.connect(master);
      bgmG = ctx.createGain(); bgmG.gain.value = .5; bgmG.connect(master);
      delay = ctx.createDelay(1.5); delay.delayTime.value = .42; fb = ctx.createGain(); fb.gain.value = .38;
      delay.connect(fb); fb.connect(delay); var dg = ctx.createGain(); dg.gain.value = .5; delay.connect(dg); dg.connect(bgmG);
    } catch (e) { ctx = null; return; }
    started = true; if (bgmOn) startBgm();
  }
  function tone(f, t, dur, type, vol, dest, attack) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    var a = attack || .008; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + .05); return g;
  }
  function noise(t, dur, f0, f1, vol, type) {
    if (!ctx) return;
    var n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = ctx.createBufferSource(); s.buffer = buf; var fl = ctx.createBiquadFilter(); fl.type = type || 'bandpass';
    fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(sfxG); s.start(t); s.stop(t + dur + .02);
  }
  function arp(notes, gap, type, vol, dur) { var t = ctx.currentTime; notes.forEach(function (n, i) { tone(hz(n), t + i * gap, dur || .35, type || 'sine', vol || .18); }); }
  function sfx(name) {
    if (!ctx || !enabled || !name) return; var t = ctx.currentTime;
    switch (name) {
      case 'tap': tone(660, t, .08, 'sine', .12); break;
      case 'water': noise(t, .55, 2400, 900, .22, 'bandpass'); tone(520, t + .25, .12, 'sine', .08); tone(640, t + .38, .1, 'sine', .07); break;
      case 'fert': tone(330, t, .12, 'triangle', .16); tone(494, t + .09, .16, 'triangle', .14); break;
      case 'coin': tone(988, t, .1, 'square', .08); tone(1319, t + .08, .22, 'square', .08); break;
      case 'bloom': arp([12, 16, 19, 24], .09, 'sine', .16, .5); break;
      case 'sparkle': case 'look': case 'sprout': arp([19, 24], .08, 'sine', .12, .3); break;
      case 'bug': noise(t, .09, 3000, 1500, .12); noise(t + .13, .09, 3000, 1500, .12); break;
      case 'spray': noise(t, .35, 5000, 2500, .12, 'highpass'); break;
      case 'prune': noise(t, .06, 4000, 3000, .2); noise(t + .1, .06, 4000, 3000, .2); break;
      case 'plant': case 'pot': tone(260, t, .12, 'sine', .2); tone(180, t + .06, .14, 'sine', .16); break;
      case 'move': case 'clear': tone(440, t, .08, 'sine', .1); tone(550, t + .06, .08, 'sine', .1); break;
      case 'cross': case 'gift': arp([7, 12, 16, 19, 24], .08, 'sine', .14, .4); break;
      case 'rest': tone(262, t, .5, 'sine', .12); tone(196, t + .2, .6, 'sine', .1); break;
      case 'rank': case 'rainbow': arp([0, 4, 7, 12, 16, 19, 24], .1, 'triangle', .16, .6); break;
      case 'season': case 'butterfly': case 'bird': case 'star': arp([12, 19, 24], .12, 'sine', .12, .5); break;
      case 'ng': tone(220, t, .14, 'sine', .1); break;
      case 'open': tone(520, t, .06, 'sine', .08); break;
      default: tone(600, t, .06, 'sine', .08);
    }
  }
  /* ---- BGM: ゆっくりした即興のアルペジオ ---- */
  function sched() {
    if (!ctx || !bgmOn) return;
    while (nextT < ctx.currentTime + 1.4) {
      var len = .78 * mood.slow, bar = Math.floor(step / 8) % 4, ch = CHORDS[bar], root = mood.shift;
      if (step % 8 === 0) { ch.forEach(function (c) { tone(hz(root + c - 12), nextT, 4.6 * mood.slow, 'sine', .05, bgmG, 1.2); }); }
      if (Math.random() < (mood.night ? .45 : .7)) {
        var nn = ch[0] + PENTA[Math.floor(Math.random() * 5)] + (Math.random() < .5 ? 12 : 0) + (mood.night ? -12 : 0);
        tone(hz(root + nn), nextT, 1.3, 'triangle', .05, bgmG, .02);
      }
      nextT += len; step++;
    }
  }
  function startBgm() { if (!ctx || timer) return; nextT = ctx.currentTime + .2; timer = setInterval(sched, 300); sched(); }
  function stopBgm() { clearInterval(timer); timer = 0; }
  function setMood(season, night) { mood.shift = [0, 2, -2, -5][season] || 0; mood.slow = night ? 1.25 : (season === 1 ? .9 : 1); mood.night = !!night; }
  function setSfx(v) { enabled = !!v; }
  function setBgm(v) { bgmOn = !!v; if (!ctx) return; if (bgmOn) startBgm(); else stopBgm(); }
  document.addEventListener('visibilitychange', function () { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (started) ctx.resume(); });
  return { init: init, sfx: sfx, setSfx: setSfx, setBgm: setBgm, setMood: setMood };
})();
