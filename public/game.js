/* OPERATION: BLACKOUT. First-person tactical shooter. Eliminate 20 hostiles to complete the mission. */
function runGame(cv, onWin) {
  const c = cv.getContext('2d'), GOAL = 20, MAG = 30, R = Math.random;
  let W, H, S = [], state = 'ready', last = 0, alive = true, ac = null, hold = null;
  let kills, ammo, hp, en, fx, tr, feed, streak, hurt, flash, recoil, rel, uav, spawnT, cx, cy, spread, banner, sweep = 0;

  function fit() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = Math.round(cv.clientWidth * d); H = cv.height = Math.round(cv.clientHeight * d); S = [];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
      const ch = H * (.055 + r * .03);
      S.push({ r, k, x: W * (.17 + k * .33) + (r === 1 ? W * .06 : r === 2 ? -W * .03 : 0), base: H * (.5 + r * .14), cw: W * (.18 + r * .05), ch, eh: ch * 2.8, ew: ch });
    }
    if (cx === undefined) { cx = W / 2; cy = H / 2; }
  }
  function reset() {
    kills = 0; ammo = MAG; hp = 100; en = []; fx = []; tr = []; feed = []; streak = 0; hurt = 0; flash = 0; recoil = 0; rel = 0; uav = 0; spawnT = 1; spread = 0; banner = null;
  }
  fit(); reset(); addEventListener('resize', fit);

  function snd(f, d, type, vol) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = type || 'square'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f / 4), t + d);
      g.gain.setValueAtTime(vol || .12, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(t + d);
    } catch (e) {}
  }
  const ban = (s) => { banner = { s, t: 2.4 }; snd(500, .3, 'triangle', .15); };
  function reload() { if (state !== 'play' || rel > 0 || ammo === MAG) return; rel = 1.1; snd(300, .2, 'triangle', .15); }
  const box = (e) => { const s = S[e.si], feet = s.base + (1 - e.p) * s.eh; return { s, feet, top: feet - s.eh, bot: Math.min(feet, s.base - s.ch), x0: s.x - s.ew * .6, x1: s.x + s.ew * .6 }; };

  function kill(e, hs) {
    e.ph = 'dead'; e.dp = 0; kills++; streak++;
    feed.unshift({ t: 3.4, s: hs ? 'HEADSHOT  +150' : 'ELIMINATED  +100' }); if (feed.length > 5) feed.pop();
    snd(900, .05, 'square', .12);
    if (streak === 3) { ban('UAV ONLINE'); uav = 10; }
    else if (streak === 5) { ban('CARE PACKAGE  AMMO + HEALTH'); ammo = MAG; hp = Math.min(100, hp + 30); }
    else if (streak === 8) { ban('PRECISION AIRSTRIKE'); en.forEach((o) => { if (o !== e && o.ph !== 'dead') { o.ph = 'dead'; o.dp = 0; kills++; } }); }
    if (kills >= GOAL && state === 'play') { state = 'won'; clearInterval(hold); setTimeout(() => (alive = false), 2400); onWin(); }
  }
  function fire(x, y) {
    if (state !== 'play' || rel > 0) return;
    if (ammo <= 0) return reload();
    ammo--; recoil = Math.min(1, recoil + .45); spread = Math.min(40, spread + 7); flash = .06; snd(170, .1, 'sawtooth', .2);
    tr.push({ x, y, t: .07 });
    const list = en.filter((e) => e.ph !== 'dead').sort((a, b) => S[b.si].r - S[a.si].r);
    for (const e of list) {
      const b = box(e);
      if (y > b.top && y < b.bot && x > b.x0 && x < b.x1) {
        const hs = y < b.top + b.s.eh * .26; kill(e, hs); fx.push({ x, y, t: .3, k: 1 }); return;
      }
    }
    fx.push({ x, y, t: .25, k: 0 });
  }

  function update(dt) {
    hurt = Math.max(0, hurt - dt); flash = Math.max(0, flash - dt); recoil = Math.max(0, recoil - dt * 4); spread = Math.max(0, spread - dt * 40); uav = Math.max(0, uav - dt); sweep += dt * 2;
    if (rel > 0) { rel -= dt; if (rel <= 0) ammo = MAG; }
    feed.forEach((f) => (f.t -= dt)); feed = feed.filter((f) => f.t > 0);
    fx.forEach((f) => (f.t -= dt)); fx = fx.filter((f) => f.t > 0);
    tr.forEach((f) => (f.t -= dt)); tr = tr.filter((f) => f.t > 0);
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    spawnT -= dt;
    const live = en.filter((e) => e.ph !== 'dead').length, cap = 2 + Math.floor(kills / 6);
    if (spawnT <= 0 && live < cap) {
      const used = new Set(en.map((e) => e.si)), free = S.map((s, i) => i).filter((i) => !used.has(i));
      if (free.length) { en.push({ si: free[(R() * free.length) | 0], p: 0, ph: 'rise', dp: 0, k: (R() * 99) | 0, tm: 0, ft: 0, fl: 0 }); }
      spawnT = .5 + R() * .9;
    }
    en.forEach((e) => {
      e.fl = Math.max(0, e.fl - dt);
      if (e.ph === 'rise') { e.p += dt * 3; if (e.p >= 1) { e.p = 1; e.ph = 'up'; e.tm = 1.5 + R() * 1.3; e.ft = .8 + R() * .5; } }
      else if (e.ph === 'up') {
        e.tm -= dt; e.ft -= dt;
        if (e.ft <= 0) { e.ft = 1 + R() * .4; e.fl = .12; if (R() < .72) { hp -= 5 + S[e.si].r * 2; hurt = .4; snd(110, .2, 'sawtooth', .18); } }
        if (e.tm <= 0) e.ph = 'fall';
      } else if (e.ph === 'fall') { e.p -= dt * 3; if (e.p <= 0) e.ph = 'gone'; }
      else if (e.ph === 'dead') { e.dp += dt * 2.2; if (e.dp >= 1) e.ph = 'gone'; }
    });
    en = en.filter((e) => e.ph !== 'gone');
    if (hp <= 0 && state === 'play') { hp = 0; state = 'dead'; clearInterval(hold); }
  }

  const sky = () => {
    const g = c.createLinearGradient(0, 0, 0, H * .5); g.addColorStop(0, '#0c0716'); g.addColorStop(.6, '#4a1c3a'); g.addColorStop(1, '#e0702d');
    c.fillStyle = g; c.fillRect(0, 0, W, H * .52);
    c.fillStyle = 'rgba(255,200,120,.9)'; c.beginPath(); c.arc(W * .78, H * .3, H * .045, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,160,80,.15)'; c.beginPath(); c.arc(W * .78, H * .3, H * .12, 0, 7); c.fill();
    let x = -10, i = 0;
    while (x < W + 40) {
      const w = W * (.07 + ((i * 37) % 9) / 100), h = H * (.12 + ((i * 53) % 20) / 100), y = H * .5 - h;
      c.fillStyle = '#0a0e14'; c.fillRect(x, y, w, h + 2);
      const cw = Math.max(1, Math.floor(w / (W * .02)));
      for (let a = 0; a < cw; a++) for (let b = 0; b < Math.floor(h / (H * .03)); b++) if ((i * 7 + a * 13 + b * 5) % 6 === 0) { c.fillStyle = 'rgba(255,210,110,.55)'; c.fillRect(x + W * .01 + a * W * .02, y + H * .012 + b * H * .03, W * .008, H * .014); }
      x += w + W * .006; i++;
    }
    c.fillStyle = 'rgba(224,112,45,.22)'; c.fillRect(0, H * .44, W, H * .08);
    const gr = c.createLinearGradient(0, H * .5, 0, H); gr.addColorStop(0, '#2a2d26'); gr.addColorStop(1, '#0b0c0a'); c.fillStyle = gr; c.fillRect(0, H * .5, W, H * .5);
  };
  function soldier(e, b) {
    const s = b.s, u = s.eh, x = s.x, f = b.feet;
    c.save();
    if (e.ph === 'dead') { c.globalAlpha = 1 - e.dp; c.translate(x, f); c.rotate(e.dp * .9 * (e.k % 2 ? 1 : -1)); c.translate(-x, -f); }
    c.fillStyle = '#1d231a'; c.fillRect(x - u * .13, f - u * .36, u * .26, u * .36);
    c.fillStyle = '#3a4a2d'; c.fillRect(x - u * .17, f - u * .74, u * .34, u * .42);
    c.fillStyle = '#242c1c'; c.fillRect(x - u * .17, f - u * .6, u * .34, u * .1);
    c.fillStyle = '#c29b6c'; c.beginPath(); c.arc(x, f - u * .83, u * .095, 0, 7); c.fill();
    c.fillStyle = '#1f2619'; c.beginPath(); c.arc(x, f - u * .85, u * .115, Math.PI, 0); c.fill();
    c.strokeStyle = '#0a0a0a'; c.lineWidth = u * .05; c.beginPath(); c.moveTo(x + u * .05, f - u * .56); c.lineTo(x + u * .4, f - u * .62); c.stroke();
    if (e.fl > 0) { c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(x + u * .43, f - u * .62, u * .08, 0, 7); c.fill(); }
    if (uav > 0 && e.ph !== 'dead') { c.strokeStyle = '#ff3860'; c.lineWidth = Math.max(2, u * .03); c.strokeRect(x - u * .25, b.top, u * .5, f - b.top); }
    c.restore();
  }
  function cover(s) {
    const x = s.x - s.cw / 2, y = s.base - s.ch;
    c.fillStyle = '#4b5057'; c.fillRect(x, y, s.cw, s.ch); c.fillStyle = '#6a7078'; c.fillRect(x, y, s.cw, s.ch * .14);
    c.fillStyle = '#2f3338'; c.fillRect(x, s.base - s.ch * .12, s.cw, s.ch * .12);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + s.cw * .33, y + s.ch * .14); c.lineTo(x + s.cw * .33, s.base); c.moveTo(x + s.cw * .66, y + s.ch * .14); c.lineTo(x + s.cw * .66, s.base); c.stroke();
  }
  function gun() {
    const k = Math.min(W, H) / 400, rx = recoil * 18 * k, ry = recoil * 26 * k;
    c.save(); c.translate(W * .74 + rx, H + 14 * k + ry); c.rotate(-.18 + (cx - W / 2) / W * .1);
    c.fillStyle = '#d4a574'; c.fillRect(-30 * k, -60 * k, 60 * k, 70 * k);
    c.fillStyle = '#16181b'; c.fillRect(-26 * k, -150 * k, 52 * k, 100 * k); c.fillRect(-15 * k, -240 * k, 30 * k, 100 * k);
    c.fillStyle = '#2c3036'; c.fillRect(-9 * k, -330 * k, 18 * k, 100 * k); c.fillStyle = '#0a0a0a'; c.fillRect(-5 * k, -350 * k, 10 * k, 24 * k);
    c.fillStyle = '#2c3036'; c.fillRect(18 * k, -170 * k, 22 * k, 62 * k); c.fillRect(-4 * k, -255 * k, 8 * k, 16 * k);
    if (flash > 0) { c.fillStyle = 'rgba(255,220,120,.95)'; c.beginPath(); c.arc(0, -362 * k, 26 * k, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -362 * k, 11 * k, 0, 7); c.fill(); }
    c.restore();
  }
  function hud(T) {
    const fs = Math.round(Math.min(W, H) * .034); c.font = `bold ${fs}px ui-monospace, Menlo, monospace`;
    const txt = (s, x, y, al, col) => { c.textAlign = al || 'left'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText(s, x, y); c.fillStyle = col || '#e8f2e4'; c.fillText(s, x, y); };
    txt('ELIMINATE HOSTILES', W * .03, fs * 1.6); txt(kills + ' / ' + GOAL, W * .03, fs * 2.8, 'left', '#ffd24a');
    const rx = W / 2, ry = H * .085, rr = Math.min(W, H) * .06;
    c.fillStyle = 'rgba(0,20,10,.55)'; c.beginPath(); c.arc(rx, ry, rr, 0, 7); c.fill(); c.strokeStyle = 'rgba(120,255,160,.6)'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(sweep) * rr, ry + Math.sin(sweep) * rr); c.stroke();
    if (uav > 0) en.forEach((e) => { if (e.ph === 'dead') return; const s = S[e.si]; c.fillStyle = '#ff3860'; c.beginPath(); c.arc(rx + (s.x / W - .5) * rr * 1.8, ry + (s.r - 1) * rr * .6, rr * .09, 0, 7); c.fill(); });
    feed.forEach((f, i) => txt(f.s, W * .97, fs * 1.6 + i * fs * 1.25, 'right', f.s[0] === 'H' ? '#ff6b6b' : '#e8f2e4'));
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(W * .03, H * .93, W * .3, H * .016); c.fillStyle = hp > 35 ? '#6bff95' : '#ff3860'; c.fillRect(W * .03, H * .93, W * .3 * hp / 100, H * .016); txt('HP ' + Math.ceil(hp), W * .03, H * .925);
    txt(rel > 0 ? 'RELOADING' : ammo + ' / ' + MAG, W * .97, H * .96, 'right', ammo < 8 ? '#ff6b6b' : '#e8f2e4'); txt('ASSAULT RIFLE', W * .97, H * .925, 'right', '#9bb09a');
    c.strokeStyle = 'rgba(232,242,228,.8)'; c.lineWidth = 2; c.strokeRect(W * .36, H * .9, W * .28, H * .06); txt(rel > 0 ? '...' : 'RELOAD', W / 2, H * .94, 'center');
    if (banner) { c.font = `bold ${Math.round(W * .06)}px ui-monospace, Menlo, monospace`; txt(banner.s, W / 2, H * .24, 'center', '#ffd24a'); }
  }
  function render(T) {
    c.save(); if (hurt > 0) c.translate((R() - .5) * 8, (R() - .5) * 8);
    sky();
    for (let r = 0; r < 3; r++) {
      en.filter((e) => S[e.si].r === r).forEach((e) => soldier(e, box(e)));
      S.filter((s) => s.r === r).forEach(cover);
    }
    tr.forEach((t) => { c.strokeStyle = `rgba(255,230,150,${t.t * 12})`; c.lineWidth = 2; c.beginPath(); c.moveTo(W * .66, H * .78); c.lineTo(t.x, t.y); c.stroke(); });
    fx.forEach((f) => {
      if (f.k) { c.strokeStyle = '#ff3860'; c.lineWidth = 3; const a = 10 + (.3 - f.t) * 30; c.beginPath(); c.moveTo(f.x - a, f.y - a); c.lineTo(f.x - a / 2, f.y - a / 2); c.moveTo(f.x + a, f.y - a); c.lineTo(f.x + a / 2, f.y - a / 2); c.moveTo(f.x - a, f.y + a); c.lineTo(f.x - a / 2, f.y + a / 2); c.moveTo(f.x + a, f.y + a); c.lineTo(f.x + a / 2, f.y + a / 2); c.stroke(); }
      else { c.fillStyle = `rgba(200,190,170,${f.t * 3})`; c.beginPath(); c.arc(f.x, f.y, 6 + (.25 - f.t) * 40, 0, 7); c.fill(); }
    });
    gun(); c.restore();
    if (state === 'play' || state === 'won') {
      const g = 6 + spread; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath();
      c.moveTo(cx - g - 12, cy); c.lineTo(cx - g, cy); c.moveTo(cx + g, cy); c.lineTo(cx + g + 12, cy); c.moveTo(cx, cy - g - 12); c.lineTo(cx, cy - g); c.moveTo(cx, cy + g); c.lineTo(cx, cy + g + 12); c.stroke();
      c.fillStyle = '#ff3860'; c.fillRect(cx - 1, cy - 1, 2, 2);
    }
    if (hurt > 0) { const g = c.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .75); g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(255,0,0,${Math.min(.8, hurt * 1.8)})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    hud(T);
    if (state !== 'play') {
      c.fillStyle = 'rgba(0,0,0,.62)'; c.fillRect(0, 0, W, H); c.textAlign = 'center';
      const big = (s, y, col) => { c.font = `bold ${Math.round(W * .085)}px ui-monospace, Menlo, monospace`; c.lineWidth = 6; c.strokeStyle = '#000'; c.strokeText(s, W / 2, y); c.fillStyle = col || '#fff'; c.fillText(s, W / 2, y); };
      const sm = (s, y) => { c.font = `${Math.round(W * .036)}px ui-monospace, Menlo, monospace`; c.fillStyle = '#d6e0d2'; c.fillText(s, W / 2, y); };
      if (state === 'ready') { big('OPERATION', H * .34); big('BLACKOUT', H * .43, '#ffd24a'); sm('Eliminate ' + GOAL + ' hostiles to complete the mission', H * .52); sm('Tap to fire. Hold for full-auto. Aim for the head.', H * .57); sm('TAP TO DEPLOY', H * .66); }
      if (state === 'dead') { big('K.I.A.', H * .42, '#ff3860'); sm(kills + ' of ' + GOAL + ' eliminated', H * .51); sm('Tap to redeploy', H * .57); }
      if (state === 'won') { big('MISSION', H * .4); big('COMPLETE', H * .49, '#6bff95'); sm('Extracting...', H * .57); }
    }
  }

  const pos = (e) => { const r = cv.getBoundingClientRect(), k = cv.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; };
  cv.addEventListener('pointerdown', (e) => {
    snd(1, .01, 'sine', .001);
    const [x, y] = pos(e);
    if (state === 'ready' || state === 'dead') { reset(); state = 'play'; return; }
    if (state !== 'play') return;
    if (y > H * .9 && Math.abs(x - W / 2) < W * .14) return reload();
    cx = x; cy = y; fire(x, y); clearInterval(hold); hold = setInterval(() => fire(cx, cy), 120);
  });
  cv.addEventListener('pointermove', (e) => { const p = pos(e); cx = p[0]; cy = p[1]; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => cv.addEventListener(ev, () => clearInterval(hold)));
  addEventListener('keydown', (e) => { if (e.key === ' ') fire(cx, cy); if (e.key === 'r') reload(); if (state === 'ready' || state === 'dead') { reset(); state = 'play'; } });
  function frame(ts) {
    if (!alive) return; requestAnimationFrame(frame);
    const dt = Math.min((ts - last) / 1000 || 0, .05); last = ts;
    if (state === 'play') update(dt); render(ts / 1000);
  }
  requestAnimationFrame(frame);
}
