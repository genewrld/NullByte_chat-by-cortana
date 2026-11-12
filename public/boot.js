/* Loading screen: matrix rain + boot log. boot(title, lines, ms) resolves when it fades out. */
window.boot = function (title, lines, ms) {
  return new Promise((res) => {
    const o = document.createElement('div'); o.id = 'boot';
    const cv = document.createElement('canvas'), box = document.createElement('div'), t = document.createElement('div'), pre = document.createElement('pre'), bar = document.createElement('div'), fill = document.createElement('i');
    box.className = 'bbox'; t.className = 'btitle'; t.textContent = title; bar.className = 'bbar'; bar.append(fill); box.append(t, pre, bar); o.append(cv, box); document.body.append(o);
    const c = cv.getContext('2d'); let W = (cv.width = innerWidth), H = (cv.height = innerHeight);
    const cols = Math.floor(W / 16) + 1, drops = Array.from({ length: cols }, () => Math.random() * -40), chars = '01ABCDEF<>/{}#$%&*=+'; let raf;
    const draw = () => {
      c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(0, 0, W, H); c.fillStyle = '#00ff9c'; c.font = '15px monospace';
      for (let i = 0; i < cols; i++) { c.fillText(chars[(Math.random() * chars.length) | 0], i * 16, drops[i] * 16); if (drops[i] * 16 > H && Math.random() > .975) drops[i] = 0; drops[i]++; }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const t0 = Date.now(), total = ms || 1500;
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / total), n = Math.ceil(p * lines.length);
      pre.textContent = lines.slice(0, n).map((l, i) => '> ' + l + (i < n - 1 || p >= 1 ? ' [ok]' : '...')).join('\n');
      fill.style.width = Math.round(p * 100) + '%';
      if (p >= 1) { clearInterval(iv); o.classList.add('out'); setTimeout(() => { cancelAnimationFrame(raf); o.remove(); res(); }, 420); }
    }, 60);
  });
};
