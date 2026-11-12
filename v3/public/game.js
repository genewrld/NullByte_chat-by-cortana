/* Beach Buggy Rush: pseudo-3D beach racer. Collect 25 coins in 60 seconds to unlock the chat. */
function runGame(cv, onWin) {
  const c = cv.getContext('2d');
  const SEG = 200, RW = 2000, CAMH = 1000, DEPTH = .84, N = 900, DRAW = 110, PZ = CAMH * DEPTH, MAXS = 7500, TARGET = 25, LIMIT = 60;
  let W, H, segs, pos, px, sp, coins, time, idx0, state = 'ready', dir = 0, last = 0, alive = true, shake = 0;
  function fit() { const d = Math.min(devicePixelRatio || 1, 1.5); W = cv.width = cv.clientWidth * d; H = cv.height = cv.clientHeight * d; }
  fit(); addEventListener('resize', fit);

  function reset() {
    segs = Array.from({ length: N }, (_, i) => ({ z: i * SEG, curve: 2 * Math.sin(i / 55) + Math.sin(i / 19), spr: [] }));
    const lane = () => [-.6, 0, .6][Math.random() * 3 | 0];
    for (let i = 0; i < N; i++) {
      if (i % 4 === 0) segs[i].spr.push({ t: 'palm', o: (i % 8 ? 1 : -1) * (1.5 + Math.random() * 1.5) });
      if (i > 30 && i % 28 === 0) { const l = lane(); for (let k = 0; k < 3; k++) segs[i + k].spr.push({ t: 'coin', o: l }); }
      if (i > 40 && i % 19 === 0) segs[i].spr.push({ t: i % 2 ? 'crate' : 'rock', o: lane() });
    }
    pos = 0; px = 0; sp = 0; coins = 0; time = 0; idx0 = Math.floor(PZ / SEG); shake = 0;
  }
  function hitSeg(s) {
    s.spr.forEach((a) => {
      if (a.hit || Math.abs(px - a.o) > (a.t === 'palm' ? .22 : .3)) return;
      a.hit = true;
      if (a.t === 'coin') coins++; else { sp *= .35; shake = .4; }
    });
  }
  function update(dt) {
    time += dt; sp = Math.min(MAXS, sp + MAXS * .4 * dt);
    if (Math.abs(px) > 1.1) sp = Math.max(MAXS * .3, sp - MAXS * 1.2 * dt);
    const sc = sp / MAXS, dx = dt * 2 * Math.max(sc, .25);
    pos += sp * dt; if (pos >= N * SEG) pos -= N * SEG;
    const idx = Math.floor((pos + PZ) / SEG) % N;
    px += dx * dir; px -= dt * 2 * sc * sc * segs[idx].curve * .3; px = Math.max(-2.2, Math.min(2.2, px));
    let li = idx0, n = 0; while (li !== idx && n++ < 6) { li = (li + 1) % N; hitSeg(segs[li]); } idx0 = idx;
    shake = Math.max(0, shake - dt);
    if (coins >= TARGET) { state = 'won'; setTimeout(() => (alive = false), 1500); onWin(); }
    else if (time >= LIMIT) state = 'lost';
  }
  const poly = (a) => { c.beginPath(); c.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i], a[i + 1]); c.fill(); };
  const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fill(); };
  const txt = (s, x, y, al) => { c.textAlign = al || 'left'; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 5; c.strokeText(s, x, y); c.fillStyle = '#fff'; c.fillText(s, x, y); };

  function sprite(a, x, y, u, T) {
    if (u < 2 || u > W * 3) return;
    if (a.t === 'palm') {
      c.strokeStyle = '#8b5a2b'; c.lineWidth = u * .09; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + u * .12, y - u * .6, x + u * .06, y - u * 1.2); c.stroke();
      const tx = x + u * .06, ty = y - u * 1.2; c.strokeStyle = '#1f9d55'; c.lineWidth = u * .07;
      for (let k = 0; k < 7; k++) { const an = Math.PI * k / 6, ex = tx - Math.cos(an) * u * .6, ey = ty - Math.sin(an) * u * .12 + u * .2; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + ex) / 2, ty - u * .3, ex, ey); c.stroke(); }
    } else if (a.t === 'coin') {
      const r = u * .1, w = Math.max(r * Math.abs(Math.cos(T * 6)), r * .2);
      c.fillStyle = '#ffd23f'; c.strokeStyle = '#d68f00'; c.lineWidth = r * .25; c.beginPath(); c.ellipse(x, y - r * 1.8, w, r, 0, 0, 7); c.fill(); c.stroke();
    } else if (a.t === 'crate') {
      const s = u * .22; c.fillStyle = '#b5651d'; c.fillRect(x - s, y - s * 1.9, s * 2, s * 1.9);
      c.strokeStyle = '#6b3a10'; c.lineWidth = s * .15; c.strokeRect(x - s, y - s * 1.9, s * 2, s * 1.9);
      c.beginPath(); c.moveTo(x - s, y - s * 1.9); c.lineTo(x + s, y); c.moveTo(x + s, y - s * 1.9); c.lineTo(x - s, y); c.stroke();
    } else {
      const s = u * .2; c.fillStyle = '#7d8590'; poly([x - s * 1.2, y, x - s * .8, y - s * 1.4, x, y - s * 1.9, x + s * .9, y - s * 1.3, x + s * 1.3, y]);
      c.fillStyle = '#a3abb5'; poly([x - s * .8, y - s * 1.4, x, y - s * 1.9, x + s * .2, y - s * 1.1]);
    }
  }
  function car(T) {
    const u = W * .16, y = H * .86 + (sp > 0 ? Math.sin(T * 30) * 2 : 0), sx = shake ? (Math.random() - .5) * 10 : 0;
    c.save(); c.translate(W / 2 + sx, y); c.rotate(dir * .05);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, u * .12, u * .8, u * .14, 0, 0, 7); c.fill();
    c.fillStyle = '#1b1b1b'; rr(-u * .78, -u * .42, u * .3, u * .52, u * .06); rr(u * .48, -u * .42, u * .3, u * .52, u * .06);
    c.fillStyle = '#e63946'; rr(-u * .5, -u * .64, u, u * .64, u * .14);
    c.fillStyle = '#ffd23f'; rr(-u * .3, -u * .5, u * .6, u * .13, u * .04);
    c.strokeStyle = '#ffd23f'; c.lineWidth = u * .05; c.beginPath(); c.moveTo(-u * .4, -u * .64); c.lineTo(-u * .3, -u); c.lineTo(u * .3, -u); c.lineTo(u * .4, -u * .64); c.stroke();
    c.fillStyle = '#f1c27d'; c.beginPath(); c.arc(0, -u * .8, u * .14, 0, 7); c.fill();
    c.fillStyle = '#1d3557'; c.beginPath(); c.arc(0, -u * .84, u * .15, Math.PI, 0); c.fill();
    c.restore();
  }
  function render(T) {
    const g = c.createLinearGradient(0, 0, 0, H / 2); g.addColorStop(0, '#1e90ff'); g.addColorStop(1, '#bdf4ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H / 2 + 1);
    c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(W * .72, H * .17, H * .07, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 4; i++) { const cx = ((T * 8 + i * W / 3) % (W * 1.3)) - W * .15, cy = H * (.08 + i * .06); c.beginPath(); c.ellipse(cx, cy, W * .09, H * .025, 0, 0, 7); c.ellipse(cx + W * .06, cy + 4, W * .06, H * .02, 0, 0, 7); c.fill(); }
    c.fillStyle = '#19a7d8'; c.fillRect(0, H * .43, W, H * .08); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(0, H * .43, W, 2);
    c.fillStyle = '#f2d38a'; c.fillRect(0, H / 2, W, H / 2);
    const bi = Math.floor(pos / SEG), bp = (pos % SEG) / SEG, P = [];
    let x = 0, dx = -(segs[bi % N].curve * bp);
    for (let n = 0; n < DRAW; n++) {
      const i = (bi + n) % N, s = segs[i], z1 = s.z - pos + (bi + n >= N ? N * SEG : 0), z2 = z1 + SEG;
      const cam = px * RW - x;
      if (z1 > DEPTH) {
        const s1 = DEPTH / z1, s2 = DEPTH / z2;
        P.push({ i, s, sc: s1, x1: W / 2 + s1 * -cam * W / 2, y1: H / 2 + s1 * CAMH * H / 2, w1: s1 * RW * W / 2,
          x2: W / 2 + s2 * -(cam - dx) * W / 2, y2: H / 2 + s2 * CAMH * H / 2, w2: s2 * RW * W / 2 });
      }
      x += dx; dx += s.curve;
    }
    for (let n = P.length - 1; n >= 0; n--) {
      const q = P[n];
      c.fillStyle = q.i % 6 < 3 ? '#f2d38a' : '#ecc97a'; c.fillRect(0, q.y2, W, q.y1 - q.y2 + 1);
      c.fillStyle = q.i % 4 < 2 ? '#5a5a66' : '#54545f'; poly([q.x1 - q.w1, q.y1, q.x2 - q.w2, q.y2, q.x2 + q.w2, q.y2, q.x1 + q.w1, q.y1]);
      c.fillStyle = q.i % 4 < 2 ? '#fff' : '#e63946';
      poly([q.x1 - q.w1 * 1.14, q.y1, q.x2 - q.w2 * 1.14, q.y2, q.x2 - q.w2, q.y2, q.x1 - q.w1, q.y1]);
      poly([q.x1 + q.w1, q.y1, q.x2 + q.w2, q.y2, q.x2 + q.w2 * 1.14, q.y2, q.x1 + q.w1 * 1.14, q.y1]);
      if (q.i % 6 < 3) { c.fillStyle = '#fff'; poly([q.x1 - q.w1 / 45, q.y1, q.x2 - q.w2 / 45, q.y2, q.x2 + q.w2 / 45, q.y2, q.x1 + q.w1 / 45, q.y1]); }
      q.s.spr.forEach((a) => { if (!a.hit) sprite(a, q.x1 + a.o * q.w1, q.y1, q.w1, T); });
    }
    car(T);
    c.font = `bold ${Math.round(W * .05)}px system-ui, sans-serif`;
    txt(`COINS ${coins}/${TARGET}`, W * .03, W * .07); txt(Math.max(0, Math.ceil(LIMIT - time)) + 's', W * .97, W * .07, 'right');
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(W * .03, W * .095, W * .3, 8); c.fillStyle = '#ffd23f'; c.fillRect(W * .03, W * .095, W * .3 * sp / MAXS, 8);
    if (state !== 'play') {
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, W, H); c.textAlign = 'center';
      c.font = `bold ${Math.round(W * .09)}px system-ui, sans-serif`;
      txt(state === 'won' ? 'UNLOCKED!' : state === 'lost' ? 'TIME UP' : 'BEACH BUGGY RUSH', W / 2, H * .38, 'center');
      c.font = `${Math.round(W * .04)}px system-ui, sans-serif`;
      if (state === 'ready') { txt(`Collect ${TARGET} coins in ${LIMIT}s to unlock the chat`, W / 2, H * .46, 'center'); txt('Hold the left or right side of the screen to steer', W / 2, H * .51, 'center'); txt('Dodge crates and rocks. Tap to start', W / 2, H * .56, 'center'); }
      if (state === 'lost') txt('Tap to try again', W / 2, H * .46, 'center');
      if (state === 'won') txt('Opening the chat...', W / 2, H * .46, 'center');
    }
  }
  const steer = (e) => { if (state === 'play') dir = e.clientX < cv.clientWidth / 2 ? -1 : 1; };
  cv.addEventListener('pointerdown', (e) => { if (state === 'ready' || state === 'lost') { reset(); state = 'play'; } steer(e); });
  cv.addEventListener('pointermove', (e) => e.buttons && steer(e));
  ['pointerup', 'pointercancel'].forEach((ev) => cv.addEventListener(ev, () => (dir = 0)));
  addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'a') dir = -1; if (e.key === 'ArrowRight' || e.key === 'd') dir = 1; if (state === 'ready' || state === 'lost') { reset(); state = 'play'; } });
  addEventListener('keyup', () => (dir = 0));
  function frame(ts) {
    if (!alive) return; requestAnimationFrame(frame);
    const dt = Math.min((ts - last) / 1000 || 0, .05); last = ts;
    if (state === 'play') update(dt); render(ts / 1000);
  }
  reset(); requestAnimationFrame(frame);
}
