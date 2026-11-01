'use strict';
/* ぷらんと日記 - 3D世界(カメラ・光・天気・演出・タップ判定) */
var World = (function () {
  var PI = Math.PI;
  var clamp = function (x, a, b) { if (a === undefined) a = 0; if (b === undefined) b = 1; return Math.max(a, Math.min(b, x)); };
  var renderer, scene, camera, canvas, W = 1, H = 1, insets = { top: 0, bottom: 0 };
  var mats = {}, placeObjs = {}, cur = 'window', plantObjs = {}, decorGroup = null, decorSig = '';
  var hemi, sunL, moonL, lampL, sunDisc, moonDisc, stars, clouds = [], rain, snow, amb, fx, selRing, bgCol, fog;
  var cam = { yaw: 0, zoom: .45, el: .58, ty: .9 };
  var sel = { plant: 0, slot: -1 }, time = 0, tapCb = null, events = [];
  var HALFW = { window: 3.6, balcony: 3.4, garden: 3.5, greenhouse: 3.4, aquarium: 3.5 };
  var OUTDOOR = { balcony: 1, garden: 1 };

  function dotTexture() {
    if (typeof document === 'undefined') return null;
    var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d');
    var g = x.createRadialGradient(16, 16, 1, 16, 16, 15); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.6, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c);
  }

  function init(cv) {
    canvas = cv; P3.init();
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new THREE.Scene();
    bgCol = new THREE.Color('#aedcf2'); scene.background = bgCol; fog = new THREE.Fog('#aedcf2', 22, 48); scene.fog = fog;
    camera = new THREE.PerspectiveCamera(42, 1, .1, 120);
    hemi = new THREE.HemisphereLight('#ffffff', '#6b5a4a', .8); scene.add(hemi);
    sunL = new THREE.DirectionalLight('#ffffff', 1); scene.add(sunL);
    moonL = new THREE.DirectionalLight('#8aa0ff', 0); scene.add(moonL);
    lampL = new THREE.PointLight('#ffd9a0', 0, 14, 2); scene.add(lampL);
    mats.grass = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95, color: '#8fcf7a' });
    mats.leaves = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95, color: '#6fb870' });
    sunDisc = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff3c4', fog: false })); sunDisc.position.z = -17; scene.add(sunDisc);
    moonDisc = new THREE.Mesh(new THREE.SphereGeometry(.8, 12, 8), new THREE.MeshBasicMaterial({ color: '#f4f2e0', fog: false })); moonDisc.position.z = -17; scene.add(moonDisc);
    var sp = new Float32Array(130 * 3);
    for (var i = 0; i < 130; i++) { var a = Math.random() * PI * 2, el = .1 + Math.random() * 1.2; sp[i * 3] = Math.cos(a) * Math.cos(el) * 30; sp[i * 3 + 1] = Math.sin(el) * 30 + 1; sp[i * 3 + 2] = -Math.abs(Math.sin(a)) * Math.cos(el) * 30 - 5; }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: .22, transparent: true, opacity: 0, depthWrite: false, fog: false })); scene.add(stars);
    for (var c = 0; c < 4; c++) {
      var cg = new THREE.Group(), cm = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1, transparent: true, opacity: .9, fog: false });
      for (var k = 0; k < 4; k++) { var b = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), cm); b.scale.set(1.5 + Math.random(), .8 + Math.random() * .3, 1); b.position.set(k * 1.3 - 2, Math.random() * .4, 0); cg.add(b); }
      cg.position.set(-14 + c * 9, 6 + (c % 2) * 2.2, -16); cg.userData = { sp: .25 + Math.random() * .3, mat: cm }; scene.add(cg); clouds.push(cg);
    }
    var tex = dotTexture();
    var RN = 220, rp = new Float32Array(RN * 6);
    for (var r = 0; r < RN; r++) { var rx = (Math.random() - .5) * 14, ry = Math.random() * 9, rz = (Math.random() - .5) * 10; rp.set([rx, ry, rz, rx - .03, ry - .38, rz], r * 6); }
    var rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#c4dcf0', transparent: true, opacity: .55 })); rain.visible = false; rain.frustumCulled = false; scene.add(rain);
    function pts(n, size, color) {
      var p = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) p.set([(Math.random() - .5) * 13, Math.random() * 8, (Math.random() - .5) * 9], i * 3);
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      var o = new THREE.Points(g, new THREE.PointsMaterial({ color: color, size: size, map: tex, transparent: true, depthWrite: false, alphaTest: .02 })); o.visible = false; o.frustumCulled = false; scene.add(o); return o;
    }
    snow = pts(160, .16, '#ffffff'); amb = pts(46, .2, '#f8b8cc');
    var FN = 170, fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FN * 3).fill(-100), 3));
    fg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(FN * 3), 3));
    fx = new THREE.Points(fg, new THREE.PointsMaterial({ size: .2, map: tex, vertexColors: true, transparent: true, depthWrite: false, alphaTest: .02 }));
    fx.frustumCulled = false; fx.userData = { n: FN, vel: new Float32Array(FN * 3), life: new Float32Array(FN), grav: new Float32Array(FN), next: 0 }; scene.add(fx);
    selRing = new THREE.Mesh(new THREE.TorusGeometry(.62, .035, 6, 28), new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: .9 }));
    selRing.rotation.x = -PI / 2; selRing.visible = false; scene.add(selRing);
    bindInput();
    resize();
  }

  /* ---- 場所 ---- */
  function ensurePlace(id) {
    if (placeObjs[id]) return placeObjs[id];
    var po = Places.build(id, { mats: mats });
    po.markers = []; po.slotsPos = po.slots;
    po.slots.forEach(function (sl, i) {
      var sh = new THREE.Mesh(new THREE.CircleGeometry(.55, 16), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .14, depthWrite: false }));
      sh.rotation.x = -PI / 2; sh.position.set(sl.x, sl.y + .004, sl.z); if (id !== 'aquarium') po.group.add(sh);
      var mg = new THREE.Group(); mg.position.set(sl.x, sl.y + .03, sl.z);
      var mm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8, depthWrite: false });
      var ring = new THREE.Mesh(new THREE.TorusGeometry(.4, .03, 6, 24), mm); ring.rotation.x = -PI / 2; mg.add(ring);
      var h1 = new THREE.Mesh(new THREE.BoxGeometry(.3, .02, .06), mm), h2 = new THREE.Mesh(new THREE.BoxGeometry(.06, .02, .3), mm); mg.add(h1); mg.add(h2);
      var hit = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .7, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = .35; hit.userData = { slot: i }; mg.add(hit);
      mg.userData = { slot: i }; po.group.add(mg); po.markers.push(mg);
    });
    po.group.visible = false; scene.add(po.group); placeObjs[id] = po; return po;
  }
  function setPlace(id) {
    cur = id;
    for (var k in placeObjs) placeObjs[k].group.visible = false;
    var po = ensurePlace(id); po.group.visible = true;
    for (var pid in plantObjs) { var o = plantObjs[pid]; if (o.parent) o.parent.remove(o); P3.disposeGroup(o); delete plantObjs[pid]; }
    sel = { plant: 0, slot: -1 }; cam.yaw = 0;
    refreshDecor(); sync(); resize();
  }
  function refreshDecor() {
    var S = Sim.S, sig = S.decor.join(',');
    if (decorGroup) { placeObjs.garden && placeObjs.garden.group.remove(decorGroup); P3.disposeGroup(decorGroup); decorGroup = null; }
    if (cur === 'garden' || placeObjs.garden) {
      var po = ensurePlace('garden'); decorGroup = Places.buildDecor(S.decor); po.group.add(decorGroup);
    }
    decorSig = sig;
  }

  /* ---- 植物と状態の同期 ---- */
  function sync() {
    var S = Sim.S; if (!S) return;
    var po = ensurePlace(cur), alive = {};
    S.plants.forEach(function (p) {
      if (p.place !== cur) return;
      alive[p.id] = 1;
      var o = plantObjs[p.id], sig = P3.signature(p);
      if (!o || o.userData.sig !== sig) {
        var grow = !!o;
        if (o) { po.group.remove(o); P3.disposeGroup(o); }
        o = P3.build(p);
        var hit = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1.4, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = .7; o.add(hit);
        o.userData.pop = grow ? 0 : 1; o.userData.ph = p.id * 1.7; plantObjs[p.id] = o; po.group.add(o);
      }
      var sl = po.slots[p.slot]; if (sl) o.position.set(sl.x, sl.y, sl.z);
    });
    for (var id in plantObjs) if (!alive[id]) { var d = plantObjs[id]; if (d.parent) d.parent.remove(d); P3.disposeGroup(d); delete plantObjs[id]; }
    po.markers.forEach(function (mg, i) { mg.visible = !Sim.plantAt(cur, i) && i < D.PLACES[cur].slots; });
    updateSel();
  }
  function updateSel() {
    var po = placeObjs[cur]; if (!po) return;
    var pos = null;
    if (sel.plant) { var p = Sim.plantById(sel.plant); if (p && p.place === cur) pos = po.slots[p.slot]; else sel.plant = 0; }
    else if (sel.slot >= 0) pos = po.slots[sel.slot];
    if (pos) { selRing.visible = true; selRing.position.set(pos.x, pos.y + .04, pos.z); } else selRing.visible = false;
  }
  function select(plantId, slot) { sel.plant = plantId || 0; sel.slot = slot === undefined ? -1 : slot; updateSel(); }

  /* ---- カメラと入力 ---- */
  function resize() {
    if (!renderer) return;
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    W = Math.max(2, w); H = Math.max(2, h);
    renderer.setSize(W, H, false); camera.aspect = W / H;
    var dy = (insets.bottom - insets.top) / 2;
    camera.setViewOffset(W, H, 0, dy, W, H);
    camera.updateProjectionMatrix();
  }
  function setInsets(top, bottom) { insets.top = top; insets.bottom = bottom; resize(); }
  function placeCamera() {
    var tanV = Math.tan(camera.fov * PI / 360), tanH = tanV * camera.aspect;
    var dW = (HALFW[cur] || 3.4) / tanH, dH = 3.4 / tanV;
    var d = Math.max(dW, dH) * (1.28 - .62 * cam.zoom);
    var el = cam.el, tx = 0, ty = cam.ty, tz = .2;
    camera.position.set(tx + Math.sin(cam.yaw) * Math.cos(el) * d, ty + Math.sin(el) * d, tz + Math.cos(cam.yaw) * Math.cos(el) * d);
    camera.lookAt(tx, ty, tz);
  }
  var ray, ndc, ptrs = {}, pinch = 0, moved = false, downT = 0;
  function bindInput() {
    ray = new THREE.Raycaster(); ndc = new THREE.Vector2();
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', function (e) {
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ks = Object.keys(ptrs);
      if (ks.length === 1) { moved = false; downT = performance.now(); }
      if (ks.length === 2) { pinch = dist2(); moved = true; }
    });
    canvas.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      var ks = Object.keys(ptrs);
      if (ks.length === 2) { var nd = dist2(); if (pinch > 0) cam.zoom = clamp(cam.zoom + (nd - pinch) / 300); pinch = nd; }
      else { if (Math.abs(dx) + Math.abs(dy) > 2) { cam.yaw = clamp(cam.yaw - dx * .006, -.8, .8); if (Math.abs(dx) + Math.abs(dy) > 6) moved = true; } }
    });
    function up(e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var n = Object.keys(ptrs).length; delete ptrs[e.pointerId];
      if (n === 1 && !moved && performance.now() - downT < 600 && e.type === 'pointerup') { if (tapCb) tapCb(pick(e.clientX, e.clientY)); }
      if (Object.keys(ptrs).length < 2) pinch = 0;
    }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', function (e) { e.preventDefault(); cam.zoom = clamp(cam.zoom - e.deltaY * .001); }, { passive: false });
  }
  function dist2() { var a = Object.keys(ptrs).map(function (k) { return ptrs[k]; }); if (a.length < 2) return 0; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
  function pick(cx, cy) {
    var r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera);
    var po = placeObjs[cur], list = [];
    for (var id in plantObjs) list.push(plantObjs[id]);
    po.markers.forEach(function (m) { if (m.visible) list.push(m); });
    var hits = ray.intersectObjects(list, true);
    for (var i = 0; i < hits.length; i++) {
      var o = hits[i].object;
      while (o && !(o.userData && (o.userData.plantId || o.userData.slot !== undefined))) o = o.parent;
      if (o) return o.userData.plantId ? { type: 'plant', id: o.userData.plantId } : { type: 'slot', idx: o.userData.slot };
    }
    return null;
  }
  function pickAt(cx, cy) { return pick(cx, cy); }

  /* ---- 光・空 ---- */
  var cNight = new THREE.Color('#1a2448'), cDay = new THREE.Color('#aedcf2'), cWarm = new THREE.Color('#f5b48c'), cGrey = new THREE.Color('#a4b0b8'), cSnow = new THREE.Color('#cdd7de'), tmp = new THREE.Color();
  var SEASON_GROUND = ['#8fcf7a', '#62b85c', '#c0b45a', '#dbe6ea'], SEASON_LEAF = ['#f2b6cf', '#5fae60', '#e08a4a', '#c9d6d2'];
  function lighting(dt) {
    var S = Sim.S, hour = Sim.hour(), wx = S.weather, si = Sim.dateInfo().season;
    var a = (hour - 6) / 12 * PI, sh = Math.sin(a), day = clamp(sh * 2.2 + .25), warm = clamp(1 - Math.abs(sh) * 3.2) * (hour > 4 && hour < 20 ? 1 : 0);
    var grey = wx === 'cloud' ? .3 : wx === 'rain' ? .55 : wx === 'snow' ? .4 : 0;
    var indoorBg = cur === 'aquarium';
    bgCol.copy(cNight).lerp(cDay, day).lerp(cWarm, warm * .55).lerp(wx === 'snow' ? cSnow : cGrey, grey * (.4 + .6 * day));
    if (indoorBg) { tmp.set('#173f4f'); bgCol.lerp(tmp, .8 - .1 * day); }
    scene.background = bgCol; fog.color.copy(bgCol);
    var wm = { sun: 1, cloud: .6, rain: .4, snow: .5 }[wx];
    sunL.intensity = 1.0 * day * wm; sunL.color.set('#ffffff').lerp(tmp.set('#ffcf9a'), warm);
    sunL.position.set(-Math.cos(a) * 8, Math.max(2, Math.sin(a) * 9 + 1), 6);
    moonL.intensity = .55 * (1 - day); moonL.position.set(Math.cos(a) * 8, 6, 5);
    var indoor = D.PLACES[cur].indoor;
    hemi.intensity = .5 + .4 * day + (indoor ? .12 * (1 - day) : 0);
    hemi.color.copy(bgCol).lerp(tmp.set('#ffffff'), .4);
    var po = placeObjs[cur];
    if (indoor && po && po.lampAt) { lampL.position.set(po.lampAt[0], po.lampAt[1], po.lampAt[2]); lampL.intensity = 1.6 * (1 - day) + .25; } else lampL.intensity = 0;
    sunDisc.position.set(-Math.cos(a) * 13, Math.sin(a) * 11 + 1, -17); sunDisc.visible = sh > -.12 && !indoorBg;
    moonDisc.position.set(Math.cos(a) * 13, -Math.sin(a) * 11 + 1, -17); moonDisc.visible = sh < .12 && !indoorBg;
    stars.material.opacity = clamp((1 - day) * 1.1 - grey) * .9; stars.visible = !indoorBg;
    clouds.forEach(function (c) {
      c.position.x += c.userData.sp * dt; if (c.position.x > 18) c.position.x = -18;
      c.userData.mat.color.set('#ffffff').lerp(tmp.set('#8a96a4'), clamp(grey * 1.1 + (1 - day) * .75)); c.userData.mat.opacity = .5 + .4 * (wx === 'sun' ? .6 : 1); c.visible = !indoorBg;
    });
    mats.grass.color.set(SEASON_GROUND[si]); if (wx === 'snow') mats.grass.color.set('#eef3f5');
    mats.grass.color.multiplyScalar(.45 + .55 * clamp(day + .25)); mats.leaves.color.set(SEASON_LEAF[si]); mats.leaves.color.multiplyScalar(.5 + .5 * clamp(day + .25));
  }

  /* ---- 天気・季節のつぶ ---- */
  function weatherFx(dt) {
    var S = Sim.S, out = !!OUTDOOR[cur], wx = S.weather, si = Sim.dateInfo().season, night = Sim.hour() < 5.5 || Sim.hour() > 19;
    rain.visible = out && wx === 'rain'; snow.visible = out && wx === 'snow';
    var mode = !out || wx === 'rain' || wx === 'snow' ? '' : si === 0 ? 'petal' : si === 2 ? 'leaf' : (si === 1 && night) ? 'fly' : '';
    amb.visible = mode !== '';
    if (rain.visible) {
      var a = rain.geometry.attributes.position.array;
      for (var i = 0; i < a.length; i += 6) { a[i + 1] -= 14 * dt; a[i + 4] -= 14 * dt; a[i] -= .6 * dt; a[i + 3] -= .6 * dt; if (a[i + 1] < 0) { var ny = 8 + Math.random() * 2; a[i + 1] = ny; a[i + 4] = ny - .38; } }
      rain.geometry.attributes.position.needsUpdate = true;
    }
    if (snow.visible) {
      var s = snow.geometry.attributes.position.array;
      for (var j = 0; j < s.length; j += 3) { s[j + 1] -= 1.1 * dt; s[j] += Math.sin(time + j) * .3 * dt; if (s[j + 1] < 0) s[j + 1] = 8; }
      snow.geometry.attributes.position.needsUpdate = true;
    }
    if (amb.visible) {
      amb.material.color.set(mode === 'petal' ? '#f8b8cc' : mode === 'leaf' ? '#e8944a' : '#f4f08a'); amb.material.size = mode === 'fly' ? .14 : .2;
      var q = amb.geometry.attributes.position.array;
      for (var k = 0; k < q.length; k += 3) {
        if (mode === 'fly') { q[k] += Math.sin(time * .8 + k) * .4 * dt; q[k + 1] += Math.cos(time * .6 + k * 2) * .3 * dt; if (q[k + 1] < .3) q[k + 1] = 2.5; if (q[k + 1] > 4) q[k + 1] = .8; }
        else { q[k + 1] -= .5 * dt; q[k] += (Math.sin(time * .9 + k) * .5 + .15) * dt; if (q[k + 1] < 0) { q[k + 1] = 8; q[k] = (Math.random() - .5) * 13; } }
      }
      amb.geometry.attributes.position.needsUpdate = true;
    }
  }

  /* ---- 演出のつぶ ---- */
  function spawn(x, y, z, vx, vy, vz, life, col, grav) {
    var u = fx.userData, i = u.next; u.next = (u.next + 1) % u.n;
    var p = fx.geometry.attributes.position.array, c = fx.geometry.attributes.color.array, cc = P3.toColor(col);
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; u.vel[i * 3] = vx; u.vel[i * 3 + 1] = vy; u.vel[i * 3 + 2] = vz; u.life[i] = life; u.grav[i] = grav;
    c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b;
  }
  function plantPos(pid) {
    var p = Sim.plantById(pid), po = placeObjs[cur]; if (!p || p.place !== cur || !po) return { x: 0, y: 1, z: 0 };
    var s = po.slots[p.slot]; return { x: s.x, y: s.y + .6, z: s.z };
  }
  function burst(kind, pid) {
    if (!fx) return;
    var ps = plantPos(pid), n = 18, col = '#ffffff', up = 1.6, spread = .8, life = 1, grav = -2.4;
    var cols = { water: ['#8fd0f0', '#bfe6ff'], fert: ['#9be07a', '#d8f0a0'], coin: ['#ffd24a', '#fff0a0'], bloom: ['#ffb6d0', '#ffe6f0', '#ffffff'], sparkle: ['#fff3a0', '#ffffff'], bug: ['#554433'], spray: ['#e8f4ff', '#d0e8f8'], prune: ['#7ac060', '#a8d878'], look: ['#fff3a0', '#ffd0a0'], plant: ['#7a5a40', '#5a4030'], sprout: ['#9be07a', '#ffffff'], cross: ['#ffb6d0', '#d8b0ff'], rest: ['#d8d0c0', '#ffffff'], gift: ['#ffd24a', '#ff9ec0', '#a0e0ff'], pot: ['#cf8f6c', '#7a5a40'], move: ['#ffffff'], rank: ['#ffd24a', '#ffffff', '#ff9ec0', '#a0e0ff'] };
    var cl = cols[kind] || cols.sparkle;
    if (kind === 'water') { up = 0; grav = -4; spread = .5; n = 26; ps.y += .6; }
    if (kind === 'bug') { up = .8; grav = 0; n = 12; }
    if (kind === 'rank') n = 60; if (kind === 'bloom') n = 34;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * PI * 2, sp = Math.random() * spread;
      spawn(ps.x + (Math.random() - .5) * .3, ps.y, ps.z + (Math.random() - .5) * .3, Math.cos(a) * sp, up * (.4 + Math.random()), Math.sin(a) * sp, .7 + Math.random() * .7, cl[i % cl.length], grav);
    }
  }
  function fxUpdate(dt) {
    var u = fx.userData, p = fx.geometry.attributes.position.array;
    for (var i = 0; i < u.n; i++) {
      if (u.life[i] <= 0) continue;
      u.life[i] -= dt;
      if (u.life[i] <= 0) { p[i * 3 + 1] = -100; continue; }
      u.vel[i * 3 + 1] += u.grav[i] * dt;
      p[i * 3] += u.vel[i * 3] * dt; p[i * 3 + 1] += u.vel[i * 3 + 1] * dt; p[i * 3 + 2] += u.vel[i * 3 + 2] * dt;
    }
    fx.geometry.attributes.position.needsUpdate = true; fx.geometry.attributes.color.needsUpdate = true;
  }
  function addEvent(obj, dur, fn) { scene.add(obj); events.push({ obj: obj, t: 0, dur: dur, fn: fn }); }
  function event(kind) {
    if (!scene) return;
    if (kind === 'butterfly') {
      for (var k = 0; k < 2; k++) {
        (function (k) {
          var g = new THREE.Group(), wm = new THREE.MeshBasicMaterial({ color: k ? '#ffb86b' : '#8fd0ff', side: THREE.DoubleSide });
          var w1 = new THREE.Mesh(new THREE.CircleGeometry(.11, 4), wm), w2 = new THREE.Mesh(new THREE.CircleGeometry(.11, 4), wm); w1.position.x = -.08; w2.position.x = .08; g.add(w1); g.add(w2);
          addEvent(g, 14, function (t) { g.position.set(Math.sin(t * .8 + k * 2) * 2, 1.6 + Math.sin(t * 1.3 + k) * .4, Math.cos(t * .6 + k) * 1.6); g.rotation.y = t; var f = Math.abs(Math.sin(t * 14)); w1.scale.x = f; w2.scale.x = f; });
        })(k);
      }
    } else if (kind === 'bird') {
      var g = new THREE.Group(), bm = new THREE.MeshStandardMaterial({ color: '#7aa8e0', flatShading: true });
      var body = new THREE.Mesh(new THREE.IcosahedronGeometry(.2, 0), bm); body.scale.set(1.3, 1, 1); g.add(body);
      var wing = new THREE.Mesh(new THREE.ConeGeometry(.18, .02, 4), bm); g.add(wing);
      var beak = new THREE.Mesh(new THREE.ConeGeometry(.05, .12, 4), new THREE.MeshStandardMaterial({ color: '#f2b04a' })); beak.rotation.z = -PI / 2; beak.position.x = .28; g.add(beak);
      addEvent(g, 7, function (t) { g.position.set(-6 + t * 1.7, 3.2 + Math.sin(t * 2) * .3, -1); wing.rotation.z = Math.sin(t * 16) * .8; });
    } else if (kind === 'rainbow') {
      var rg = new THREE.Group(), cs = ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#9775fa', '#da77f2'], ms = [];
      cs.forEach(function (c, i) { var m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, fog: false, depthWrite: false }); ms.push(m); var t = new THREE.Mesh(new THREE.TorusGeometry(8 + i * .35, .2, 6, 32, PI), m); rg.add(t); });
      rg.position.set(0, -1, -15); addEvent(rg, 14, function (t) { var o = clamp(Math.min(t / 2, (14 - t) / 3)) * .55; ms.forEach(function (m) { m.opacity = o; }); });
    } else if (kind === 'star') {
      var sg = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff7c0', fog: false }));
      addEvent(sg, 1.8, function (t) { sg.position.set(8 - t * 9, 9 - t * 3.5, -14); if (Math.random() < .6) spawn(sg.position.x, sg.position.y, sg.position.z, 0, 0, 0, .5, '#fff7c0', 0); });
    } else if (kind === 'season') { for (var i = 0; i < 40; i++) spawn((Math.random() - .5) * 8, 4 + Math.random() * 2, (Math.random() - .5) * 5, 0, -.6, 0, 2.5, ['#ffd24a', '#ff9ec0', '#a0e0ff'][i % 3], 0); }
  }
  function eventsUpdate(dt) {
    for (var i = events.length - 1; i >= 0; i--) {
      var e = events[i]; e.t += dt; e.fn(e.t);
      if (e.t > e.dur) { scene.remove(e.obj); P3.disposeGroup(e.obj); events.splice(i, 1); }
    }
  }

  /* ---- 毎フレーム ---- */
  function update(dt) {
    if (!renderer) return;
    time += dt;
    lighting(dt); weatherFx(dt); fxUpdate(dt); eventsUpdate(dt);
    var S = Sim.S, windy = ({ sun: .8, cloud: 1, rain: 1.5, snow: 1 })[S.weather] * (1 + D.PLACES[cur].wind);
    for (var id in plantObjs) {
      var o = plantObjs[id], u = o.userData, b = u.body;
      if (u.pop < 1) { u.pop = Math.min(1, u.pop + dt * 2.4); var s = .8 + .2 * (1 - Math.pow(1 - u.pop, 3)) + Math.sin(u.pop * PI) * .06; o.scale.setScalar(s); } else if (o.scale.x !== 1) o.scale.setScalar(1);
      b.rotation.z = Math.sin(time * 1.3 + u.ph) * .018 * windy; b.rotation.x = Math.cos(time * 1.1 + u.ph) * .012 * windy;
    }
    var po = placeObjs[cur];
    if (po) {
      if (po.update) po.update(time, dt);
      po.markers.forEach(function (m) { if (m.visible) { var s = 1 + Math.sin(time * 2.4 + m.userData.slot) * .06; m.scale.set(s, 1, s); } });
    }
    if (selRing.visible) { var ss = 1 + Math.sin(time * 4) * .05; selRing.scale.set(ss, ss, 1); }
    placeCamera();
    renderer.render(scene, camera);
  }

  return {
    init: init, resize: resize, setPlace: setPlace, sync: sync, select: select, update: update, burst: burst, event: event,
    refreshDecor: refreshDecor, setInsets: setInsets, onTap: function (f) { tapCb = f; }, pick: pickAt, get place() { return cur; },
    get zoom() { return cam.zoom; }, set zoom(v) { cam.zoom = clamp(v); }
  };
})();
