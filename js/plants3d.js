'use strict';
/* ぷらんと日記 - 植物の3D(すべて図形から自作したローポリ) */
var P3 = (function () {
  var PI = Math.PI;
  var rng = function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  var clamp = function (x, a, b) { if (a === undefined) a = 0; if (b === undefined) b = 1; return Math.max(a, Math.min(b, x)); };

  /* ---- 基本図形(底が y=0) ---- */
  var G = {};
  function initGeo() {
    G.sph = new THREE.SphereGeometry(1, 7, 5);
    G.ico = new THREE.IcosahedronGeometry(1, 0);
    G.cyl = new THREE.CylinderGeometry(.7, 1, 1, 7, 1); G.cyl.translate(0, .5, 0);
    G.cyl0 = new THREE.CylinderGeometry(1, 1, 1, 8, 1); G.cyl0.translate(0, .5, 0);
    G.cone = new THREE.ConeGeometry(1, 1, 7, 1); G.cone.translate(0, .5, 0);
    G.box = new THREE.BoxGeometry(1, 1, 1); G.box.translate(0, .5, 0);
    G.leaf = new THREE.SphereGeometry(1, 6, 4); G.leaf.translate(0, 0, 1);
  }
  var MAT = null;
  var _m, _q, _e, _v, _s, _up, _d;
  var colCache = {};
  function toColor(c) {
    if (c && c.isColor) return c;
    var k = String(c); if (!colCache[k]) colCache[k] = new THREE.Color(c); return colCache[k];
  }
  function mix(a, b, t) { var c = new THREE.Color(); c.copy(toColor(a)); c.lerp(toColor(b), clamp(t)); return c; }
  function init() {
    if (G.sph) return;
    initGeo();
    _m = new THREE.Matrix4(); _q = new THREE.Quaternion(); _e = new THREE.Euler(); _v = new THREE.Vector3(); _s = new THREE.Vector3(); _up = new THREE.Vector3(0, 1, 0); _d = new THREE.Vector3();
    MAT = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .85, metalness: 0 });
  }

  /* ---- 形を1つにまとめる道具 ---- */
  function Mesher(seed) { this.p = []; this.c = []; this.r = rng(seed || 1); }
  Mesher.prototype.put = function (geo, col, mat4, jit) {
    var g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(mat4);
    var pos = g.attributes.position.array, c = toColor(col), j = jit === undefined ? .07 : jit, r = this.r;
    for (var i = 0; i + 8 < pos.length; i += 9) {
      var f = 1 + (r() - .5) * 2 * j;
      for (var k = 0; k < 9; k += 3) { this.p.push(pos[i + k], pos[i + k + 1], pos[i + k + 2]); this.c.push(c.r * f, c.g * f, c.b * f); }
    }
    g.dispose();
  };
  Mesher.prototype.add = function (geo, col, x, y, z, sx, sy, sz, rx, ry, rz, jit) {
    _e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); _q.setFromEuler(_e);
    _v.set(x || 0, y || 0, z || 0); _s.set(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz);
    _m.compose(_v, _q, _s); this.put(geo, col, _m, jit);
  };
  Mesher.prototype.stem = function (x0, y0, z0, x1, y1, z1, r, col) {
    _d.set(x1 - x0, y1 - y0, z1 - z0); var len = _d.length(); if (len < 1e-4) return;
    _d.normalize(); _q.setFromUnitVectors(_up, _d); _v.set(x0, y0, z0); _s.set(r, len, r);
    _m.compose(_v, _q, _s); this.put(G.cyl, col, _m, .04);
  };
  Mesher.prototype.leaf = function (x, y, z, yaw, tilt, w, l, col) { this.add(G.leaf, col, x, y, z, w, Math.max(.012, w * .16), l / 2, -tilt, yaw, 0); };
  Mesher.prototype.ball = function (r, x, y, z, col, sx, sy, sz) { this.add(G.sph, col, x, y, z, r * (sx || 1), r * (sy || 1), r * (sz || 1)); };
  Mesher.prototype.blob = function (r, x, y, z, col) { this.add(G.ico, col, x, y, z, r, r * .85, r); };
  Mesher.prototype.cone = function (r, h, x, y, z, col, rx, rz) { this.add(G.cone, col, x, y, z, r, h, r, rx || 0, 0, rz || 0); };
  Mesher.prototype.cyl = function (r, h, x, y, z, col) { this.add(G.cyl0, col, x, y, z, r, h, r); };
  Mesher.prototype.mesh = function () {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals();
    var me = new THREE.Mesh(g, MAT); return me;
  };

  /* ---- 花の部品 ---- */
  function daisy(m, x, y, z, r, col, ctr, n, tilt) {
    n = n || 8;
    for (var i = 0; i < n; i++) {
      var a = i / n * PI * 2;
      m.leaf(x + Math.cos(a) * r * .22, y, z + Math.sin(a) * r * .22, PI / 2 - a, tilt === undefined ? .15 : tilt, r * .2, r * .8, col);
    }
    m.cyl(r * .22, r * .12, x, y - r * .02, z, ctr || '#f2b43a');
  }
  function cup(m, x, y, z, r, col, open) {
    for (var i = 0; i < 5; i++) {
      var a = i / 5 * PI * 2;
      m.leaf(x + Math.cos(a) * r * .15, y, z + Math.sin(a) * r * .15, PI / 2 - a, 1.2 - open * .5, r * .3, r * 1.1, col);
    }
  }
  function spray(m, R, cx, cy, cz, n, rad, r, col) {
    for (var i = 0; i < n; i++) {
      var a = R() * PI * 2, d = Math.sqrt(R()) * rad;
      m.ball(r * (.7 + R() * .6), cx + Math.cos(a) * d, cy + (R() - .5) * rad * .6, cz + Math.sin(a) * d, col);
    }
  }

  /* ---- 植物の種類ごとの形 ---- */
  var F = {};
  function rosetteBase(m, I, R, spiky, leafy) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), layers = leafy ? 4 : 3 + (T > .6 ? 1 : 0), dr = I.d;
    for (var ring = 0; ring < layers; ring++) {
      var n = (leafy ? 6 : 5) + ring * 3, rad = (.03 + .08 * ring) * S0 * 1.3;
      var tilt = (spiky ? 1.25 - .18 * ring : 1.15 - .28 * ring) - dr * (.5 + .25 * ring);
      var l = (spiky ? .46 + .1 * ring : .2 + .075 * ring) * S0 * (leafy ? 1.4 : 1), w = (spiky ? .05 : (leafy ? .11 : .085)) * S0 * (leafy ? 1.3 : 1);
      var col = mix(I.lc, I.lc2, ring / layers);
      for (var i = 0; i < n; i++) {
        var a = i / n * PI * 2 + ring * .4 + R() * .15;
        m.leaf(Math.cos(a) * rad, .02 + (layers - ring) * .012, Math.sin(a) * rad, PI / 2 - a, tilt, w, l * (.9 + R() * .2), col);
      }
    }
    return S0;
  }
  function flowerStalk(m, I, R, S0, h) {
    if (!(I.bud || I.bloom)) return;
    var x = .05, hh = h * S0;
    m.stem(0, .1, 0, x, hh, 0, .018, I.lc);
    if (I.bud) { for (var i = 0; i < 4; i++) m.ball(.03, x + (R() - .5) * .08, hh - i * .05, (R() - .5) * .08, I.lc2); }
    else { for (var j = 0; j < 6; j++) { var a = j / 6 * PI * 2; m.ball(.035, x + Math.cos(a) * .07, hh - .03 * (j % 3), Math.sin(a) * .07, I.flower); } }
  }
  F.rosette = function (m, I, R) { var S0 = rosetteBase(m, I, R, false, false); flowerStalk(m, I, R, S0, 1.1); };
  F.spike = function (m, I, R) { var S0 = rosetteBase(m, I, R, true, false); flowerStalk(m, I, R, S0, 1.5); };
  F.rosetteL = function (m, I, R) { rosetteBase(m, I, R, false, true); };
  F.blade = function (m, I, R) {
    var T = I.t, n = 4 + Math.floor(5 * T), S0 = I.sc * (.25 + .75 * T);
    for (var i = 0; i < n; i++) {
      var a = R() * PI * 2, r = R() * .1 * S0, hgt = (.45 + R() * .55) * S0 * 1.2, lean = .1 + R() * .25 + I.d * .5;
      m.leaf(Math.cos(a) * r, .02, Math.sin(a) * r, PI / 2 - a, 1.45 - lean, .065 * S0 + .01, hgt, mix(I.lc, I.lc2, R()));
      m.leaf(Math.cos(a) * r, .02, Math.sin(a) * r, PI / 2 - a, 1.45 - lean, .02, hgt * .97, '#d6d070');
    }
  };
  F.cactus = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), bh = .5 * S0;
    m.ball(.22 * S0, 0, bh * .55, 0, I.lc, 1, 1.5, 1);
    for (var i = 0; i < 12; i++) { var a = R() * PI * 2, y = .1 + R() * .8; m.cone(.012, .05, Math.cos(a) * .2 * S0, bh * y, Math.sin(a) * .2 * S0, '#f2efe0', 0, 0); }
    if (T > .75) { m.stem(.16 * S0, bh * .35, 0, .3 * S0, bh * .5, 0, .06 * S0, I.lc2); m.stem(.3 * S0, bh * .5, 0, .3 * S0, bh * .85, 0, .06 * S0, I.lc2); }
    if (I.bloom) daisy(m, 0, bh * 1.12, 0, .22, I.flower, '#f6d25a', 8, .5);
    else if (I.bud) m.ball(.05, 0, bh * 1.1, 0, I.flower);
  };
  F.vine = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 4 + Math.floor(6 * T);
    for (var i = 0; i < n; i++) {
      var a = i / n * PI * 2 + R(), reach = (.25 + R() * .5) * S0 * 1.6, up = (.25 + R() * .4) * S0, px = 0, py = .05, pz = 0, steps = 3 + Math.floor(3 * T);
      for (var k = 1; k <= steps; k++) {
        var t = k / steps, nx = Math.cos(a) * reach * t, nz = Math.sin(a) * reach * t, ny = .05 + up * Math.sin(t * 2.2) * (1 - .35 * t) - I.d * .3 * t - .12 * t * t * 2;
        m.stem(px, py, pz, nx, ny, nz, .012, '#6a9a52');
        m.leaf(nx, ny, nz, R() * PI * 2, .5 - I.d * 1.1 + (R() - .5) * .6, .075 * S0 + .02, .2 * S0 + .03, mix(I.lc, I.lc2, R()));
        px = nx; py = ny; pz = nz;
      }
    }
  };
  F.bigleaf = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 2 + Math.floor(4 * T);
    for (var i = 0; i < n; i++) {
      var a = i / n * PI * 2 + R() * .5, lean = .12 + R() * .2, h = (.35 + R() * .45) * S0 * 1.5, tx = Math.cos(a) * h * lean * 2, tz = Math.sin(a) * h * lean * 2;
      m.stem(0, .05, 0, tx, .05 + h, tz, .022, '#5f8f4f');
      m.leaf(tx, .05 + h, tz, PI / 2 - a + (R() - .5) * .5, .45 - I.d * 1.2, .2 * S0 + .04, .46 * S0 + .06, mix(I.lc, I.lc2, R() * .6));
      m.leaf(tx, .05 + h, tz, PI / 2 - a + (R() - .5) * .5, .45 - I.d * 1.2, .02, .4 * S0 + .05, I.lc2);
    }
  };
  function canopy(m, I, R, top, rad, kind) {
    var T = I.t, n = 4 + Math.floor(7 * T), blossom = kind === 'S' && I.bloom, budd = kind === 'S' && I.bud;
    for (var i = 0; i < n; i++) {
      var a = R() * PI * 2, d = Math.sqrt(R()) * rad * (.4 + .6 * T), y = top + (R() - .3) * rad * .8;
      var col = blossom ? mix(I.flower, '#ffffff', R() * .35) : budd ? mix(I.lc, I.flower, .35 + R() * .3) : mix(I.lc, I.lc2, R());
      m.blob(rad * (.4 + .25 * R()) * (.6 + .4 * T), Math.cos(a) * d, y, Math.sin(a) * d, col);
    }
    if (kind === 'F' || kind === 'O') {
      if (I.bloom) spray(m, R, 0, top, 0, 10, rad * .9, .03, I.flower);
      if (I.fruit) spray(m, R, 0, top - rad * .1, 0, 8, rad * .9, kind === 'F' ? .065 : .04, I.fruitCol);
    }
  }
  function treeBase(m, I, R, kind) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), h = (.3 + .95 * T) * S0 * 1.1, rad = .34 * S0 * 1.2;
    var trunk = kind === 'S' ? '#6a4a3c' : '#8a6a4a';
    m.stem(0, .02, 0, (R() - .5) * .06, h, (R() - .5) * .06, .045 * (.6 + .6 * T), trunk);
    if (T > .5) { m.stem(0, h * .6, 0, .12 * S0, h * .9, 0, .02, trunk); m.stem(0, h * .65, 0, -.1 * S0, h * .95, .05, .02, trunk); }
    canopy(m, I, R, h + rad * .15, rad, kind);
    if (kind === 'S' && I.bloom) for (var i = 0; i < 6; i++) m.ball(.015, (R() - .5) * rad * 2, .05 + R() * .15, (R() - .5) * rad * 2, I.flower);
  }
  F.tree = function (m, I, R) { treeBase(m, I, R, 'T'); };
  F.treeF = function (m, I, R) { treeBase(m, I, R, 'F'); };
  F.treeO = function (m, I, R) { treeBase(m, I, R, 'O'); };
  F.treeS = function (m, I, R) { treeBase(m, I, R, 'S'); };
  F.herb = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 4 + Math.floor(5 * T);
    for (var i = 0; i < n; i++) {
      var a = R() * PI * 2, r = R() * .12 * S0, h = (.3 + R() * .5) * S0 * 1.2, lx = Math.cos(a) * r, lz = Math.sin(a) * r, bend = (R() - .5) * .12 + I.d * .12;
      m.stem(lx, .03, lz, lx + Math.cos(a) * bend, h, lz + Math.sin(a) * bend, .012, '#6a9a52');
      for (var k = 1; k <= 3; k++) {
        var y = h * k / 3.2, ya = R() * PI * 2;
        m.leaf(lx, y, lz, ya, .55 - I.d, .07 * S0 + .02, .17 * S0 + .03, mix(I.lc, I.lc2, R()));
        m.leaf(lx, y, lz, ya + PI, .55 - I.d, .07 * S0 + .02, .17 * S0 + .03, mix(I.lc, I.lc2, R()));
      }
      if (I.bloom) m.ball(.03, lx, h + .02, lz, I.flower, 1, 1.3, 1);
      else if (I.bud) m.ball(.022, lx, h + .02, lz, I.lc2);
    }
  };
  F.needle = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 18 + Math.floor(30 * T);
    for (var i = 0; i < n; i++) {
      var a = R() * PI * 2, r = R() * .16 * S0, h = (.1 + R() * .6) * S0 * 1.2;
      m.leaf(Math.cos(a) * r, h, Math.sin(a) * r, a, .7 - I.d * .8 + R() * .5, .016, .17 * S0 + .04, mix(I.lc, I.lc2, R()));
      if (I.bloom && R() < .25) m.ball(.025, Math.cos(a) * r * 1.4, h + .05, Math.sin(a) * r * 1.4, I.flower);
    }
    for (var j = 0; j < 4; j++) { var b = j * 1.6; m.stem(0, .03, 0, Math.cos(b) * .05, .45 * S0, Math.sin(b) * .05, .012, '#7a6a52'); }
  };
  F.spikeh = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 10 + Math.floor(14 * T);
    for (var i = 0; i < n; i++) { var a = R() * PI * 2, r = R() * .08 * S0; m.leaf(Math.cos(a) * r, .02, Math.sin(a) * r, PI / 2 - a, .9 - I.d, .02, (.25 + R() * .3) * S0, mix(I.lc, I.lc2, R())); }
    if (I.bud || I.bloom) for (var k = 0; k < 5; k++) {
      var b = k / 5 * PI * 2, sx = Math.cos(b) * .06 * S0, sz = Math.sin(b) * .06 * S0, hh = (.7 + R() * .3) * S0 * 1.1;
      m.stem(sx, .03, sz, sx * 1.3, hh, sz * 1.3, .01, '#8fae8a');
      for (var q = 0; q < 5; q++) m.ball(.032, sx * 1.3, hh - q * .05, sz * 1.3, I.bud ? mix(I.lc, I.flower, .4) : I.flower, 1, 1.3, 1);
    }
  };
  function stemWithLeaves(m, I, R, h, nLeaf, lw, ll, lean) {
    m.stem(0, .02, 0, lean || 0, h, 0, .03 * Math.max(.5, I.sc * .8), I.lc);
    for (var i = 0; i < nLeaf; i++) {
      var y = h * (.2 + .7 * i / nLeaf), a = i * 2.3 + R();
      m.leaf(0, y, 0, a, .6 - I.d * 1.1, lw, ll, mix(I.lc, I.lc2, R() * .6));
    }
  }
  F.sun = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), h = (.3 + .9 * T) * S0 * 1.3;
    stemWithLeaves(m, I, R, h, 5, .09 * S0 + .03, .22 * S0 + .05, 0);
    var hy = h + .02;
    if (I.bud) m.ball(.08 * S0 + .03, 0, hy, 0, I.lc2);
    else if (I.bloom || I.fruit) {
      var ctr = I.fruit ? '#4a3622' : '#5a3b22';
      m.add(G.cyl0, ctr, 0, hy - .02, .02, .17 * S0 + .05, .06, .17 * S0 + .05, .6, 0, 0);
      if (I.bloom) for (var i = 0; i < 14; i++) { var a = i / 14 * PI * 2; m.leaf(Math.cos(a) * .12 * S0, hy, Math.sin(a) * .12 * S0 + .02, PI / 2 - a, .3 - I.d, .05 * S0 + .015, .17 * S0 + .04, I.flower); }
    }
  };
  F.tulip = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), h = (.3 + .5 * T) * S0 * 1.3;
    for (var i = 0; i < 3; i++) m.leaf(0, .02, 0, i * 2.1 + R() * .3, .85 - I.d * .8, .07 * S0 + .02, .5 * S0 + .06, mix(I.lc, I.lc2, R() * .5));
    if (I.bud || I.bloom || I.fruit) { m.stem(0, .02, 0, 0, h, 0, .018, I.lc); if (I.bud) cup(m, 0, h, 0, .1, mix(I.lc, I.flower, .5), 0); else cup(m, 0, h, 0, .13, I.flower, I.bloom ? 1 : 0); }
  };
  F.cosmos = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 3 + Math.floor(3 * T);
    for (var i = 0; i < n; i++) {
      var a = R() * PI * 2, d = R() * .12 * S0, h = (.35 + R() * .55) * S0 * 1.3, tx = Math.cos(a) * d, tz = Math.sin(a) * d;
      m.stem(0, .02, 0, tx, h, tz, .014, I.lc);
      for (var k = 0; k < 3; k++) m.leaf(tx * k / 3, h * (.25 + .2 * k), tz * k / 3, R() * 6, .4, .012, .14 * S0 + .04, I.lc2);
      if (I.bloom) daisy(m, tx, h, tz, .17, I.flower, '#f2b43a', 8, .1 + I.d * .6);
      else if (I.bud) m.ball(.035, tx, h, tz, mix(I.lc, I.flower, .4));
    }
  };
  F.pansy = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 6 + Math.floor(8 * T);
    for (var i = 0; i < n; i++) { var a = R() * PI * 2, r = R() * .12 * S0; m.leaf(Math.cos(a) * r, .03, Math.sin(a) * r, a, .5 - I.d * .6, .06 * S0 + .02, .17 * S0 + .03, mix(I.lc, I.lc2, R())); }
    if (I.bloom || I.bud) for (var k = 0; k < 4; k++) {
      var b = k / 4 * PI * 2 + .5, fx = Math.cos(b) * .12 * S0, fz = Math.sin(b) * .12 * S0, fy = .12 + R() * .1;
      m.stem(0, .03, 0, fx, fy, fz, .01, I.lc);
      if (I.bud) m.ball(.03, fx, fy, fz, mix(I.lc, I.flower, .4));
      else { for (var q = 0; q < 5; q++) { var qa = q / 5 * PI * 2; m.leaf(fx + Math.cos(qa) * .02, fy, fz + Math.sin(qa) * .02, PI / 2 - qa, .6, .045, .09, I.flower); } m.ball(.015, fx, fy + .01, fz, '#2a1f10'); }
    }
  };
  F.rose = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 3 + Math.floor(2 * T);
    for (var i = 0; i < n; i++) {
      var a = i / n * PI * 2 + R(), h = (.35 + R() * .45) * S0 * 1.3, tx = Math.cos(a) * h * .25, tz = Math.sin(a) * h * .25;
      m.stem(0, .03, 0, tx, h, tz, .018, '#5f7a3f');
      for (var k = 0; k < 3; k++) m.leaf(tx * k / 3, h * (.3 + .2 * k), tz * k / 3, R() * 6, .5 - I.d, .06 * S0 + .02, .15 * S0 + .04, mix(I.lc, I.lc2, R()));
      if (I.bloom) { m.ball(.07, tx, h, tz, I.flower, 1, .8, 1); m.ball(.05, tx, h + .04, tz, mix(I.flower, '#ffffff', .25), 1, .8, 1); m.ball(.03, tx, h + .07, tz, mix(I.flower, '#000000', .15)); }
      else if (I.bud) m.cone(.04, .09, tx, h, tz, mix(I.lc, I.flower, .5));
      else if (I.fruit) m.ball(.03, tx, h, tz, '#d86a3a');
    }
  };
  F.tomato = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), h = (.35 + .8 * T) * S0 * 1.3;
    m.stem(0, 0, .12, 0, h * 1.15, .12, .012, '#a58a5a');
    m.stem(0, .02, 0, .05, h, .06, .02, I.lc);
    for (var i = 0; i < 5 + Math.floor(5 * T); i++) { var y = h * (.1 + .85 * i / 9), a = i * 1.9 + R(); for (var k = 0; k < 2; k++) m.leaf(.03, y, .05, a + k * PI * .8, .5 - I.d, .05 * S0 + .02, .17 * S0 + .03, mix(I.lc, I.lc2, R())); }
    if (I.bloom) for (var j = 0; j < 4; j++) daisy(m, .05 + (R() - .5) * .2, h * (.3 + R() * .6), .07 + (R() - .5) * .2, .08, I.flower, '#d9a824', 5, .3);
    if (I.fruit) for (var q = 0; q < 7; q++) m.ball(.045, .05 + (R() - .5) * .22, h * (.2 + R() * .6), .07 + (R() - .5) * .22, I.fruitCol);
  };
  F.berry = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 4 + Math.floor(4 * T);
    for (var i = 0; i < n; i++) { var a = i / n * PI * 2 + R() * .4, r = .04 + R() * .05; for (var k = -1; k <= 1; k++) m.leaf(Math.cos(a) * r, .05, Math.sin(a) * r, PI / 2 - a + k * .5, .7 - I.d, .06 * S0 + .02, .17 * S0 + .04, mix(I.lc, I.lc2, R())); }
    for (var j = 0; j < 4; j++) {
      var b = R() * PI * 2, fx = Math.cos(b) * .13 * S0, fz = Math.sin(b) * .13 * S0;
      if (I.bloom) { m.stem(0, .05, 0, fx, .13, fz, .008, I.lc); daisy(m, fx, .14, fz, .08, I.flower, '#f2c74a', 5, .3); }
      if (I.fruit) m.cone(.035, .07, fx, .1, fz, I.fruitCol, PI, 0);
    }
  };
  F.aqua = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 4 + Math.floor(5 * T);
    for (var i = 0; i < n; i++) { var a = i / n * PI * 2 + R(), r = R() * .08; m.stem(0, 0, 0, Math.cos(a) * r, .1 * S0, Math.sin(a) * r, .012, '#4a7a4a'); m.leaf(Math.cos(a) * r, .1 * S0, Math.sin(a) * r, PI / 2 - a, .6 - I.d * .8, .09 * S0 + .03, .2 * S0 + .04, mix(I.lc, I.lc2, R())); }
  };
  F.lily = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 3 + Math.floor(4 * T), wy = I.waterY || .5;
    m.stem(0, 0, 0, 0, wy, 0, .015, '#4a7a4a');
    for (var i = 0; i < n; i++) { var a = i / n * PI * 2 + R(), r = (.18 + R() * .18) * S0 * 1.4; m.stem(0, 0, 0, Math.cos(a) * r, wy, Math.sin(a) * r, .008, '#4a7a4a'); m.add(G.cyl0, mix(I.lc, I.lc2, R() * .6), Math.cos(a) * r, wy, Math.sin(a) * r, .13 * S0 + .04, .015, .13 * S0 + .04); }
    if (I.bloom) { for (var k = 0; k < 8; k++) { var b = k / 8 * PI * 2; m.leaf(Math.cos(b) * .02, wy + .02, Math.sin(b) * .02, PI / 2 - b, .8, .05, .17, I.flower); } m.ball(.025, 0, wy + .04, 0, '#f2c74a'); }
    else if (I.bud) m.cone(.04, .1, 0, wy, 0, mix(I.lc, I.flower, .5));
  };
  F.moss = function (m, I, R) {
    var T = I.t, S0 = I.sc * (.3 + .7 * T), n = 14 + Math.floor(40 * T);
    for (var i = 0; i < n; i++) { var a = R() * PI * 2, d = Math.sqrt(R()) * .3 * S0 * 1.3; m.blob(.05 + R() * .04, Math.cos(a) * d, .02 + (1 - d / (.4 * S0 + .01)) * .06 * S0 * 2, Math.sin(a) * d, mix(I.lc, I.lc2, R())); }
  };

  /* ---- 鉢・土台 ---- */
  function potBody(m, I) {
    var c = I.potCap, kind = I.style;
    if (kind === 'pot') {
      var h = .34 * c, rb = .3 * c, rt = .38 * c;
      m.add(G.cyl, I.potCol, 0, 0, 0, rb * 1.3, h, rb * 1.3, 0, 0, 0, .03);
      m.cyl(rt, .06, 0, h - .02, 0, mix(I.potCol, '#ffffff', .12));
      m.cyl(rt * .88, .02, 0, h + .03, 0, I.soilCol);
      return h + .04;
    }
    if (kind === 'bed') {
      m.add(G.sph, I.soilCol, 0, 0, 0, .55, .14, .55);
      for (var i = 0; i < 7; i++) { var a = i / 7 * PI * 2; m.blob(.06 + (i % 3) * .01, Math.cos(a) * .5, .02, Math.sin(a) * .5, '#a9a59a'); }
      return .08;
    }
    m.add(G.sph, I.soilCol, 0, -.02, 0, .5, .1, .5);
    m.blob(.1, .3, .03, .1, '#8f9aa5'); m.blob(.07, -.32, .02, -.06, '#9aa5ad');
    return .06;
  }
  function makeInfo(p, place) {
    var s = D.byId[p.sp], f = Sim.phen(p), st = p.stage, pot = D.pot(p.pot), soil = D.soil(p.soil), P = D.PLACES[p.place];
    var t = st === 0 ? 0 : st === 1 ? .12 + .1 * p.prog : st === 2 ? .25 + .15 * p.prog : st === 3 ? (p.mature ? 1 : .4 + .45 * Math.min(1, p.prog)) : st === 4 ? .9 : st === 7 ? .55 : st === 8 ? .5 : 1;
    var d = clamp((70 - p.hp) / 70) * .8 + (!P.water && p.w < .15 ? .3 : 0);
    if (st === 8) d = 1; else if (st === 7) d = .3; d = clamp(d);
    var fruitPal = s.id === 'tomato' || s.id === 'strawberry';
    var flowerCol = (s.pk === 'f' && !fruitPal) ? s.pal[f.col] : (s.fl || '#ffffff');
    var fruitCol = fruitPal ? s.pal[f.col] : (s.fr || '#e8b040');
    var base = s.pk === 'l' ? s.pal[f.col] : s.leaf;
    var lc = mix(base, '#c4b04a', Math.min(1, d * .8));
    if (st === 8) lc = mix(base, '#7d6644', .85); else if (st === 7) lc = mix(lc, '#9a8a58', .5);
    var potStyle = P.water ? 'tank' : p.place === 'garden' ? 'bed' : 'pot';
    var sc = (.8 + .45 * f.sz) * (.92 + .16 * pot.cap);
    return {
      s: s, t: t, d: d, stage: st, sc: sc, lc: lc, lc2: mix(lc, '#ffffff', .18), flower: flowerCol, fruitCol: fruitCol,
      bud: st === 4, bloom: st === 5, fruit: st === 6, dead: st === 8, style: potStyle, potCap: pot.cap, potCol: pot.col, soilCol: soil.col,
      waterY: .55,
      sig: [p.id, st, Math.round(t * 10), Math.round(d * 4), f.col, p.pot, p.soil, p.cyc, potStyle].join('|')
    };
  }

  /* ---- 1株ぶんのオブジェクトを作る ---- */
  function build(p) {
    init();
    var I = makeInfo(p), R = rng(p.id * 7919 + 13);
    var pm = new Mesher(p.id + 3); var top = potBody(pm, I);
    var potMesh = pm.mesh();
    var m = new Mesher(p.id * 31 + 7);
    if (I.t > .02) { var fn = F[I.s.form] || F.herb; fn(m, I, R); }
    else m.ball(.025, 0, .01, 0, '#3c2c1c', 1, .6, 1);
    var body = m.mesh(); body.position.y = I.style === 'tank' ? top : top;
    var g = new THREE.Group(); g.add(potMesh); g.add(body);
    g.userData = { plantId: p.id, sig: I.sig, body: body, top: top };
    return g;
  }
  function signature(p) { return makeInfo(p).sig; }
  function disposeGroup(g) { g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }

  return { init: init, build: build, signature: signature, disposeGroup: disposeGroup, Mesher: Mesher, G: G, mix: mix, toColor: toColor, rng: rng, mat: function () { init(); return MAT; } };
})();
