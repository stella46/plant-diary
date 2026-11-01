'use strict';
/* ぷらんと日記 - 5つの場所の3D(すべて図形から自作) */
var Places = (function () {
  var PI = Math.PI;
  function B(m, w, h, d, x, y, z, col, ry) { m.add(P3.G.box, col, x, y, z, w, h, d, 0, ry || 0, 0); }
  function C(m, r, h, x, y, z, col) { m.add(P3.G.cyl0, col, x, y, z, r, h, r); }
  function S(m, r, x, y, z, col, sx, sy, sz) { m.add(P3.G.sph, col, x, y, z, r * (sx || 1), r * (sy || 1), r * (sz || 1)); }
  function mk(m) { return m.mesh(); }
  function glass(w, h, d, x, y, z, color, op) {
    var g = new THREE.BoxGeometry(w, h, d); g.translate(x, y + h / 2, z);
    var me = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: color, transparent: true, opacity: op, roughness: .15, depthWrite: false }));
    return me;
  }
  function glow(r, x, y, z, color) {
    var me = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: color })); me.position.set(x, y, z); return me;
  }
  var SLOTS = {
    window: [{ x: -1.6, y: .8, z: -.2 }, { x: 0, y: .8, z: -.2 }, { x: 1.6, y: .8, z: -.2 }],
    balcony: [{ x: -1.3, y: .02, z: -.9 }, { x: 1.3, y: .02, z: -.9 }, { x: -1.3, y: .02, z: .9 }, { x: 1.3, y: .02, z: .9 }],
    garden: [{ x: -1.3, y: .02, z: -1.9 }, { x: 1.3, y: .02, z: -1.9 }, { x: -1.3, y: .02, z: 0 }, { x: 1.3, y: .02, z: 0 }, { x: -1.3, y: .02, z: 1.9 }, { x: 1.3, y: .02, z: 1.9 }],
    greenhouse: [{ x: -1.3, y: .02, z: -1 }, { x: 1.3, y: .02, z: -1 }, { x: -1.3, y: .02, z: 1 }, { x: 1.3, y: .02, z: 1 }],
    aquarium: [{ x: -1.4, y: .5, z: -.3 }, { x: 1.4, y: .5, z: -.3 }, { x: 0, y: .5, z: .7 }]
  };

  function window_(ctx) {
    var g = new THREE.Group(), m = new P3.Mesher(11);
    B(m, 9, .3, 7, 0, -.3, 0, '#c9a77c');
    for (var i = -4; i <= 4; i++) B(m, .04, .01, 7, i, 0, 0, '#b8956a');
    B(m, 2.3, 4.6, .2, -3.35, 0, -3, '#ebe4d6'); B(m, 2.3, 4.6, .2, 3.35, 0, -3, '#ebe4d6');
    B(m, 4.4, 1.5, .2, 0, 0, -3, '#ebe4d6'); B(m, 4.4, .6, .2, 0, 4.0, -3, '#ebe4d6');
    B(m, 4.8, .12, .5, 0, 1.45, -2.85, '#f7f3ea'); B(m, .08, 2.5, .1, 0, 1.5, -2.95, '#f7f3ea'); B(m, 4.4, .08, .1, 0, 2.7, -2.95, '#f7f3ea');
    B(m, .08, 2.5, .1, -2.2, 1.5, -2.95, '#f7f3ea'); B(m, .08, 2.5, .1, 2.2, 1.5, -2.95, '#f7f3ea');
    B(m, .8, 2.9, .14, -2.45, 1.2, -2.78, '#f0d6d0'); B(m, .8, 2.9, .14, 2.45, 1.2, -2.78, '#f0d6d0');
    B(m, .2, 4.6, 7, -4.5, 0, 0, '#e5ddcf');
    C(m, 2.3, .03, 0, 0, .9, '#b9d1c8');
    B(m, 5, .1, 1.5, 0, .7, -.2, '#c08f5a');
    [-2.3, 2.3].forEach(function (x) { [-.8, .4].forEach(function (z) { B(m, .12, .7, .12, x, 0, z, '#a8794a'); }); });
    B(m, .8, .06, .8, 3.5, .6, -2.0, '#c08f5a'); B(m, .08, .6, .08, 3.5, 0, -2.0, '#a8794a');
    B(m, .12, .7, .12, 3.5, .66, -2.0, '#6b5a4a'); S(m, .3, 3.5, 1.45, -2.0, '#f3e4c0', 1, .9, 1);
    g.add(mk(m)); g.add(glow(.14, 3.5, 1.45, -2.0, '#ffe9a8'));
    return { group: g, slots: SLOTS.window, lampAt: [3.5, 1.6, -1.9] };
  }
  function balcony_(ctx) {
    var g = new THREE.Group(), m = new P3.Mesher(12);
    B(m, 6.4, .3, 5, 0, -.3, 0, '#a77e56');
    for (var i = 0; i < 11; i++) B(m, .5, .02, 5, -2.75 + i * .55, 0, 0, i % 2 ? '#b48a60' : '#c19668');
    [-3, -1.5, 0, 1.5, 3].forEach(function (x) { B(m, .12, 1.1, .12, x, 0, -2.4, '#f2eee4'); });
    B(m, 6.4, .1, .18, 0, 1.1, -2.4, '#f2eee4'); B(m, 6.4, .06, .08, 0, .35, -2.4, '#f2eee4');
    for (var k = -2.9; k <= 3; k += .5) B(m, .04, .8, .04, k, .3, -2.4, '#f2eee4');
    B(m, .25, 3.4, 5, -3.3, 0, 0, '#ece6dc');
    [[-7, 5, 1.6, -11, '#d9dde0'], [-3, 7, 1.4, -13, '#cfd6da'], [2, 4.5, 1.8, -12, '#dde0e2'], [6, 8, 1.6, -14, '#c9d2d8'], [9, 5.5, 1.5, -10, '#d6dce0']].forEach(function (b) { B(m, b[2], b[1], 1.4, b[0], 0, b[3], b[4]); });
    g.add(mk(m));
    return { group: g, slots: SLOTS.balcony };
  }
  function garden_(ctx) {
    var g = new THREE.Group();
    var gm = new P3.Mesher(13);
    gm.add(P3.G.cyl0, '#ffffff', 0, -.12, 0, 7.5, .12, 7.5, 0, 0, 0, .05);
    for (var i = 0; i < 40; i++) { var a = Math.random() * PI * 2, d = 1.2 + Math.random() * 5.5; gm.add(P3.G.cone, '#e6ffe0', Math.cos(a) * d, 0, Math.sin(a) * d, .06, .14 + Math.random() * .1, .06); }
    var ground = gm.mesh(); ground.material = ctx.mats.grass; g.add(ground);
    var m = new P3.Mesher(14);
    for (var x = -3.2; x <= 3.3; x += 1.07) B(m, .14, 1, .14, x, 0, -3.4, '#c9a47a');
    B(m, 6.8, .1, .08, 0, .3, -3.4, '#d9b88a'); B(m, 6.8, .1, .08, 0, .7, -3.4, '#d9b88a');
    g.add(mk(m));
    var fm = new P3.Mesher(15);
    [[-4.5, -5.5, 1.5], [1.2, -6.5, 1.9], [5.2, -5, 1.4], [-6.5, -2, 1.3]].forEach(function (t) {
      fm.add(P3.G.cyl, '#7a5a40', t[0], 0, t[1], .16, t[2] * .9, .16);
      fm.add(P3.G.ico, '#ffffff', t[0], t[2] * .8, t[1], t[2] * .9, t[2] * .75, t[2] * .9);
      fm.add(P3.G.ico, '#f2fff0', t[0] + .4, t[2] * 1.2, t[1] + .1, t[2] * .6, t[2] * .55, t[2] * .6);
    });
    var fol = fm.mesh(); fol.material = ctx.mats.leaves; g.add(fol);
    return { group: g, slots: SLOTS.garden, ground: ground };
  }
  function greenhouse_(ctx) {
    var g = new THREE.Group(), m = new P3.Mesher(16);
    B(m, 6.4, .3, 5.8, 0, -.3, 0, '#d9ded8');
    for (var i = -3; i <= 3; i++) B(m, .03, .01, 5.8, i * .9, 0, 0, '#c4cac2');
    [[-3.1, -2.8], [3.1, -2.8], [-3.1, 2.8], [3.1, 2.8], [0, -2.8]].forEach(function (p) { B(m, .12, 3.3, .12, p[0], 0, p[1], '#f4f6f2'); });
    B(m, 6.4, .12, .12, 0, 3.3, -2.8, '#f4f6f2'); B(m, .12, .12, 5.8, -3.1, 3.3, 0, '#f4f6f2'); B(m, .12, .12, 5.8, 3.1, 3.3, 0, '#f4f6f2');
    B(m, 6.4, .08, .08, 0, 1.6, -2.8, '#f4f6f2'); B(m, .08, .08, 5.8, -3.1, 1.6, 0, '#f4f6f2'); B(m, .08, .08, 5.8, 3.1, 1.6, 0, '#f4f6f2');
    B(m, 4.6, .1, .8, 0, .7, -2.35, '#c08f5a');
    [-1.5, -.5, .5, 1.5].forEach(function (x, j) { C(m, .17, .22, x * 1.3, .8, -2.35, ['#cf8f6c', '#e6dccb', '#8fb0a8', '#cf8f6c'][j]); S(m, .2, x * 1.3, 1.1, -2.35, ['#6fb36a', '#8fc27a', '#5ea35e', '#7fb870'][j]); });
    g.add(mk(m));
    g.add(glass(6.4, 3.3, .04, 0, 0, -2.8, '#cfeee8', .2)); g.add(glass(.04, 3.3, 5.8, -3.1, 0, 0, '#cfeee8', .2)); g.add(glass(.04, 3.3, 5.8, 3.1, 0, 0, '#cfeee8', .2));
    g.add(glow(.12, 0, 3.0, -.5, '#fff0c0'));
    return { group: g, slots: SLOTS.greenhouse, lampAt: [0, 2.9, -.5] };
  }
  function aquarium_(ctx) {
    var g = new THREE.Group(), m = new P3.Mesher(17);
    B(m, 7, .9, 3.6, 0, -.9, 0, '#7a5a40');
    B(m, 6, .5, 3, 0, 0, 0, '#cdbb92');
    B(m, 6.2, 2.4, .12, 0, 0, -1.55, '#2a6f8f');
    B(m, .12, 2.4, 3.1, -3.05, 0, 0, '#233a44'); B(m, .12, 2.4, 3.1, 3.05, 0, 0, '#233a44');
    B(m, 6.3, .12, 3.2, 0, 2.4, 0, '#233a44'); B(m, 6.3, .1, .1, 0, .5, 1.55, '#233a44');
    [[-2.2, .3], [2.4, .8], [.3, -.9]].forEach(function (r, i) { m.add(P3.G.ico, ['#8a8f94', '#9aa1a8', '#7b8288'][i], r[0], .5, r[1], .35, .28, .3); });
    g.add(mk(m));
    var wm = new THREE.Mesh(new THREE.BoxGeometry(6, .6, 3), new THREE.MeshStandardMaterial({ color: '#7fd0e8', transparent: true, opacity: .28, roughness: .1, depthWrite: false }));
    wm.position.set(0, 1.1 - .3 + .5 - .5 + .0, 0); wm.position.y = .8; g.add(wm);
    var wm2 = new THREE.Mesh(new THREE.BoxGeometry(6, 1.3, 3), new THREE.MeshStandardMaterial({ color: '#7fd0e8', transparent: true, opacity: .1, roughness: .1, depthWrite: false }));
    wm2.position.y = 1.75; g.add(wm2);
    var fish = [];
    [['#f29a4a', .0], ['#6fa8e8', 2.1], ['#f2d65a', 4.2]].forEach(function (f, i) {
      var fm = new P3.Mesher(30 + i);
      fm.add(P3.G.sph, f[0], 0, 0, 0, .16, .09, .07); fm.add(P3.G.cone, f[0], -.14, 0, 0, .08, .12, .02, 0, 0, PI / 2 * -1 + PI);
      var fo = fm.mesh(); fo.userData = { ph: f[1] }; g.add(fo); fish.push(fo);
    });
    var N = 14, bp = new Float32Array(N * 3), bv = [];
    for (var i = 0; i < N; i++) { bp[i * 3] = -2.5 + Math.random() * 5; bp[i * 3 + 1] = .6 + Math.random() * .8; bp[i * 3 + 2] = -1 + Math.random() * 1.6; bv.push(.2 + Math.random() * .3); }
    var bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    var bubbles = new THREE.Points(bg, new THREE.PointsMaterial({ color: '#e8fbff', size: .07, transparent: true, opacity: .7, depthWrite: false }));
    g.add(bubbles);
    function update(t, dt) {
      fish.forEach(function (f) {
        var a = t * .4 + f.userData.ph, rx = 2.3, rz = .9;
        f.position.set(Math.cos(a) * rx, .75 + Math.sin(a * 1.7 + f.userData.ph) * .22 + .35, Math.sin(a) * rz + .2);
        f.rotation.y = -a + PI;
        f.rotation.z = Math.sin(t * 6 + f.userData.ph) * .08;
      });
      var arr = bubbles.geometry.attributes.position.array;
      for (var i = 0; i < N; i++) { arr[i * 3 + 1] += bv[i] * dt; if (arr[i * 3 + 1] > 1.55) { arr[i * 3 + 1] = .55; arr[i * 3] = -2.5 + Math.random() * 5; } }
      bubbles.geometry.attributes.position.needsUpdate = true;
    }
    return { group: g, slots: SLOTS.aquarium, update: update, lampAt: [0, 2.2, 0] };
  }

  /* ---- 庭のかざり(買ったものだけ見える) ---- */
  function buildDecor(owned) {
    var g = new THREE.Group(), m = new P3.Mesher(40);
    function has(id) { return owned.indexOf(id) >= 0; }
    if (has('stones')) for (var i = 0; i < 6; i++) C(m, .27, .04, (i % 2 ? .12 : -.12), 0, -2.7 + i * 1.08, '#a9a79e');
    if (has('bench')) { B(m, .6, .1, 1.7, -3.1, .45, 0, '#b88a5a'); B(m, .1, .5, 1.7, -3.4, .5, 0, '#b88a5a'); [-.7, .7].forEach(function (z) { B(m, .1, .45, .1, -3.1, 0, z, '#8a6540'); }); }
    if (has('chime')) { B(m, .06, 2.3, .06, 3.0, 0, -2.6, '#8a6540'); B(m, .7, .05, .05, 3.0, 2.25, -2.6, '#8a6540'); ['#8fd0e0', '#e8a0c0', '#f2d870', '#a0d8a0'].forEach(function (c, j) { C(m, .025, .5 + j * .05, 2.82 + j * .12, 1.6 - j * .03, -2.6, c); }); }
    if (has('bath')) { C(m, .12, .8, 3.0, 0, -1.0, '#cfd6d4'); m.add(P3.G.sph, '#d9dfdd', 3.0, .85, -1.0, .4, .12, .4); C(m, .3, .04, 3.0, .92, -1.0, '#8fd0e8'); }
    if (has('cart')) { B(m, .9, .3, .6, 3.0, .35, 1.2, '#c9a06a'); C(m, .22, .06, 2.6, .22, 1.55, '#8a6540'); C(m, .22, .06, 3.4, .22, 1.55, '#8a6540'); [['#e8708a', -.25], ['#f2c533', 0], ['#fff', .25]].forEach(function (c) { S(m, .13, 3.0 + c[1], .72, 1.2, c[0]); }); }
    if (has('pond')) { C(m, 1.05, .05, 0, 0, 3.4, '#8a8f94'); C(m, .92, .07, 0, 0, 3.4, '#6bb7d8'); S(m, .18, -.3, .08, 3.3, '#6fbf6a', 1, .12, 1); S(m, .15, .4, .08, 3.6, '#6fbf6a', 1, .12, 1); S(m, .06, -.3, .13, 3.3, '#f6b8d4'); }
    if (has('lantern')) { B(m, .1, 1, .1, -3.0, 0, -2.6, '#5a5a5e'); B(m, .34, .06, .34, -3.0, 1.0, -2.6, '#5a5a5e'); B(m, .34, .06, .34, -3.0, 1.34, -2.6, '#5a5a5e'); }
    g.add(m.mesh());
    if (has('lantern')) g.add(glow(.14, -3.0, 1.2, -2.6, '#ffdc90'));
    if (has('lights')) for (var k = 0; k < 14; k++) { var x = -3.2 + k * .5; g.add(glow(.045, x, 1.3 - Math.sin(k / 13 * PI) * .25, -3.3, k % 3 === 0 ? '#ffe9a8' : k % 3 === 1 ? '#ffc6d9' : '#c6f0ff')); }
    return g;
  }
  return { build: function (id, ctx) { return { window: window_, balcony: balcony_, garden: garden_, greenhouse: greenhouse_, aquarium: aquarium_ }[id](ctx); }, buildDecor: buildDecor, SLOTS: SLOTS };
})();
