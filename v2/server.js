const express = require('express'), http = require('http'), crypto = require('crypto');
const { WebSocketServer } = require('ws');
const DAY = 864e5, MAXB = 12 * 1024 * 1024;
const app = express();
app.disable('x-powered-by');
app.use((q, s, n) => {
  s.set({
    'Content-Security-Policy': "default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' blob: data:; media-src 'self' blob:; style-src 'self'",
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store'
  });
  n();
});
app.use(express.static(__dirname + '/public'));

const blobs = new Map(); // encrypted blobs, memory only, 24h
app.post('/blob', express.raw({ type: 'application/octet-stream', limit: MAXB }), (q, s) => {
  if (!Buffer.isBuffer(q.body) || !q.body.length || blobs.size > 300) return s.sendStatus(400);
  const id = crypto.randomBytes(16).toString('hex');
  blobs.set(id, { buf: q.body, exp: Date.now() + DAY });
  s.json({ id });
});
app.get('/blob/:id', (q, s) => {
  const b = blobs.get(q.params.id);
  if (!b) return s.sendStatus(404);
  s.type('application/octet-stream').send(b.buf);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 256 * 1024 });
const reg = new Map(); // handle -> { pub, k, ws, q: queued msgs, feed: posts }
const send = (ws, o) => ws && ws.readyState === 1 && ws.send(JSON.stringify(o));
const online = (r) => r && r.ws && r.ws.readyState === 1;

wss.on('connection', (ws) => {
  let me = null, count = 0;
  const tick = setInterval(() => (count = 0), 10000);
  ws.on('message', (raw) => {
    if (++count > 60) return;
    let m; try { m = JSON.parse(raw); } catch { return; }

    if (m.t === 'join') {
      const n = String(m.name || '').toLowerCase();
      const p = m.pub;
      if (me || !/^[a-z0-9_]{3,20}$/.test(n) || !p || typeof p.x !== 'string' || typeof p.y !== 'string')
        return send(ws, { t: 'err', e: 'invalid handle (3-20 letters, numbers, _)' });
      const k = p.x + p.y;
      let r = reg.get(n);
      if (r) {
        if (r.k !== k) return send(ws, { t: 'err', e: 'handle already claimed by another key' });
        if (r.ws && r.ws !== ws) r.ws.close();
      } else { r = { q: [], feed: [] }; reg.set(n, r); }
      r.pub = p; r.k = k; r.ws = ws; me = n;
      send(ws, { t: 'ok', name: n });
      r.q.splice(0).forEach((i) => send(ws, { t: 'msg', ...i }));
      r.feed = r.feed.filter((i) => i.exp > Date.now());
      send(ws, { t: 'feed', items: r.feed });
      return;
    }
    if (!me) return;
    const self = reg.get(me), to = String(m.to || '').toLowerCase();

    if (m.t === 'key') {
      const p = reg.get(to);
      return send(ws, { t: 'key', name: to, pub: p ? p.pub : null });
    }
    if (m.t === 'msg') {
      const p = reg.get(to);
      if (!p) return send(ws, { t: 'err', e: to + ' is not registered' });
      const item = { from: me, pub: self.pub, iv: String(m.iv), ct: String(m.ct), ts: Date.now() };
      if (online(p)) send(p.ws, { t: 'msg', ...item });
      else if (p.q.length < 200) p.q.push(item);
      return;
    }
    if (m.t === 'sig') {
      const p = reg.get(to);
      if (online(p)) send(p.ws, { t: 'sig', from: me, pub: self.pub, iv: String(m.iv), ct: String(m.ct) });
      return;
    }
    if (m.t === 'post' && Array.isArray(m.items)) {
      m.items.slice(0, 100).forEach((i) => {
        const p = reg.get(String(i.to || '').toLowerCase());
        if (!p) return;
        const ts = Date.now();
        const item = { from: me, pub: self.pub, kind: i.kind === 'reel' ? 'reel' : 'status', iv: String(i.iv), ct: String(i.ct), ts, exp: ts + DAY };
        if (p.feed.length < 100) p.feed.push(item);
        send(p.ws, { t: 'post', item });
      });
    }
  });
  ws.on('close', () => {
    clearInterval(tick);
    const r = me && reg.get(me);
    if (r && r.ws === ws) r.ws = null;
  });
});

setInterval(() => {
  const now = Date.now();
  blobs.forEach((b, id) => b.exp < now && blobs.delete(id));
  reg.forEach((r) => (r.feed = r.feed.filter((i) => i.exp > now)));
}, 60000);

server.listen(3000, '0.0.0.0', () => console.log('GENE//CHAT relay up on :3000'));
