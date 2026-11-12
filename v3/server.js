const express = require('express'), http = require('http'), crypto = require('crypto'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const D = path.join(__dirname, 'data'), BL = path.join(D, 'blobs'), DBF = path.join(D, 'db.json');
fs.mkdirSync(BL, { recursive: true });

/* ---- storage: one JSON file. Messages and media are saved as ciphertext only ---- */
let db = { users: {}, msgs: [], sessions: {}, resets: {}, admin: null };
try { Object.assign(db, JSON.parse(fs.readFileSync(DBF, 'utf8'))); } catch {}
let st;
const save = () => { clearTimeout(st); st = setTimeout(() => fs.writeFile(DBF + '.tmp', JSON.stringify(db), (e) => { if (!e) fs.rename(DBF + '.tmp', DBF, () => {}); }), 400); };
const now = () => Date.now(), rnd = (n) => crypto.randomBytes(n).toString('hex');
const hash = (pw) => { const salt = rnd(16); return { salt, h: crypto.scryptSync(String(pw), salt, 64).toString('hex') }; };
const verify = (pw, o) => crypto.timingSafeEqual(crypto.scryptSync(String(pw), o.salt, 64), Buffer.from(o.h, 'hex'));

if (process.env.ADMIN_PASS || !db.admin) {
  const pw = process.env.ADMIN_PASS || crypto.randomBytes(6).toString('base64url');
  db.admin = hash(pw); save();
  console.log('\n=== ADMIN PASSWORD: ' + pw + ' ===\n(shown once. Admin dashboard: http://localhost:4000)\n');
}

const sec = (q, s, n) => {
  s.set({ 'Content-Security-Policy': "default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' blob: data:; media-src 'self' blob:; style-src 'self'",
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' });
  n();
};
const games = new Map(), fails = {};
const gate = (id) => { const g = games.get(id); return !!(g && g.done && g.exp > now()); };
const locked = (k) => fails[k] && fails[k].until > now();
const bad = (k) => { const f = (fails[k] = fails[k] || { n: 0 }); if (++f.n >= 5) { f.until = now() + 3e5; f.n = 0; } };
const newTok = (u) => { const t = rnd(24); db.sessions[t] = { u, exp: now() + 30 * 864e5 }; save(); return t; };
const userOf = (t) => { const s = db.sessions[t]; if (!s || s.exp < now()) return null; const u = db.users[s.u]; return u && !u.disabled ? u : null; };
const dropSessions = (u) => { for (const t in db.sessions) if (db.sessions[t].u === u) delete db.sessions[t]; };
const NAME = /^[a-z0-9_]{3,20}$/;
const validPub = (p) => p && typeof p.x === 'string' && typeof p.y === 'string' && p.x.length < 100 && p.y.length < 100;

/* ---- main app (port 3000) ---- */
const app = express();
app.disable('x-powered-by'); app.use(sec); app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/game/start', (q, s) => {
  for (const [k, g] of games) if (now() - g.t > 36e5) games.delete(k);
  const id = rnd(12); games.set(id, { t: now(), done: false }); s.json({ id });
});
app.post('/api/game/finish', (q, s) => {
  const g = games.get(q.body.id);
  if (!g || now() - g.t < 15000 || q.body.coins < 25) return s.status(400).json({ e: 'not finished' });
  g.done = true; g.exp = now() + 6e5; s.json({ ok: 1 });
});
app.post('/api/register', (q, s) => {
  const b = q.body, u = String(b.username || '').toLowerCase();
  if (!gate(b.pass)) return s.status(403).json({ e: 'Finish the game first' });
  if (!NAME.test(u) || String(b.password || '').length < 8 || !String(b.name || '').trim())
    return s.status(400).json({ e: 'Check your name, username (3-20 letters, numbers, _) and password (8+ characters)' });
  if (db.users[u]) return s.status(409).json({ e: 'That username is taken' });
  db.users[u] = { username: u, name: String(b.name).trim().slice(0, 40), contact: String(b.contact || '').slice(0, 60), created: now(), last: now(), pub: null, disabled: false, ...hash(b.password) };
  games.delete(b.pass); s.json({ token: newTok(u), username: u });
});
app.post('/api/login', (q, s) => {
  const b = q.body, u = String(b.username || '').toLowerCase();
  if (!gate(b.pass)) return s.status(403).json({ e: 'Finish the game first' });
  if (locked(u)) return s.status(429).json({ e: 'Too many attempts. Try again in 5 minutes' });
  const x = db.users[u];
  if (!x || !verify(b.password, x)) { bad(u); return s.status(401).json({ e: 'Wrong username or password' }); }
  if (x.disabled) return s.status(403).json({ e: 'Account disabled. Contact the admin' });
  x.last = now(); games.delete(b.pass); s.json({ token: newTok(u), username: u });
});
app.post('/api/forgot', (q, s) => {
  if (!gate(q.body.pass)) return s.status(403).json({ e: 'Finish the game first' });
  const u = String(q.body.username || '').toLowerCase();
  if (db.users[u] && !db.resets[u]) { db.resets[u] = { ts: now(), otp: null, exp: 0, tries: 0 }; save(); }
  s.json({ ok: 1 });
});
app.post('/api/reset', (q, s) => {
  const b = q.body, u = String(b.username || '').toLowerCase(), r = db.resets[u], x = db.users[u];
  if (!x || !r || !r.otp || r.exp < now() || r.tries >= 5 || String(b.password || '').length < 8) return s.status(400).json({ e: 'Invalid or expired code' });
  if (String(b.otp) !== r.otp) { r.tries++; save(); return s.status(400).json({ e: 'Invalid or expired code' }); }
  Object.assign(x, hash(b.password)); dropSessions(u); delete db.resets[u]; save(); s.json({ ok: 1 });
});
app.post('/api/logout', (q, s) => { delete db.sessions[q.body.token]; save(); s.json({ ok: 1 }); });

const authB = (q, s, n) => (userOf((q.get('authorization') || '').slice(7)) ? n() : s.sendStatus(401));
app.post('/blob', authB, express.raw({ type: 'application/octet-stream', limit: '22mb' }), (q, s) => {
  if (!Buffer.isBuffer(q.body) || !q.body.length) return s.sendStatus(400);
  const id = rnd(16);
  fs.writeFile(path.join(BL, id), q.body, (e) => (e ? s.sendStatus(500) : s.json({ id })));
});
app.get('/blob/:id', authB, (q, s) => {
  if (!/^[a-f0-9]{32}$/.test(q.params.id)) return s.sendStatus(404);
  s.type('application/octet-stream');
  fs.createReadStream(path.join(BL, q.params.id)).on('error', () => s.sendStatus(404)).pipe(s);
});

/* ---- realtime ---- */
const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 256 * 1024 });
const online = new Map();
const send = (ws, o) => ws && ws.readyState === 1 && ws.send(JSON.stringify(o));
wss.on('connection', (ws) => {
  let me = null, cnt = 0;
  const tk = setInterval(() => (cnt = 0), 1e4);
  ws.on('message', (raw) => {
    if (++cnt > 60) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'join') {
      const u = userOf(m.token);
      if (!u || me || !validPub(m.pub)) return send(ws, { t: 'bad' });
      me = u.username; u.pub = { kty: 'EC', crv: 'P-256', x: m.pub.x, y: m.pub.y, ext: true };
      const old = online.get(me); if (old && old !== ws) old.close();
      online.set(me, ws); u.last = now(); save();
      const mine = db.msgs.filter((x) => x.from === me || x.to === me), people = {};
      mine.forEach((x) => { const o = x.from === me ? x.to : x.from, p = db.users[o]; if (p) people[o] = { name: p.name, pub: p.pub }; });
      send(ws, { t: 'ok', user: { username: u.username, name: u.name } });
      return send(ws, { t: 'hist', msgs: mine, people });
    }
    if (!me) return;
    const u = db.users[me];
    if (m.t === 'find') {
      const q = String(m.q || '').toLowerCase(), p = db.users[q];
      return send(ws, p && !p.disabled && p.pub ? { t: 'found', q, username: p.username, name: p.name, pub: p.pub } : { t: 'found', q, none: true });
    }
    if (m.t === 'msg') {
      const to = String(m.to || '').toLowerCase(), p = db.users[to];
      if (!p || p.disabled || !p.pub || to === me) return send(ws, { t: 'err', e: 'User not found' });
      const r = { id: rnd(6), from: me, to, iv: String(m.iv), ct: String(m.ct), ts: now(), spub: u.pub, rpub: p.pub };
      db.msgs.push(r); save();
      send(ws, { t: 'sent', m: r }); send(online.get(to), { t: 'msg', m: r, fn: u.name });
    }
  });
  ws.on('close', () => { clearInterval(tk); if (me && online.get(me) === ws) online.delete(me); });
});
setInterval(() => wss.clients.forEach((c) => c.ping()), 3e4);
server.listen(3000, '0.0.0.0', () => console.log('Chat app: http://localhost:3000'));

/* ---- admin web app (separate app, port 4000, this phone only) ---- */
const adm = express();
adm.use(sec); adm.use(express.json({ limit: '10kb' })); adm.use(express.static(path.join(__dirname, 'admin')));
const atok = new Set();
const aauth = (q, s, n) => (atok.has(q.get('x-admin')) ? n() : s.sendStatus(401));
adm.post('/a/login', (q, s) => {
  if (locked('admin')) return s.status(429).json({ e: 'Locked for 5 minutes' });
  if (!verify(q.body.password || '', db.admin)) { bad('admin'); return s.status(401).json({ e: 'Wrong password' }); }
  const t = rnd(24); atok.add(t); s.json({ t });
});
adm.get('/a/data', aauth, (q, s) => s.json({
  users: Object.values(db.users).map((u) => ({ username: u.username, name: u.name, contact: u.contact, created: u.created, last: u.last, disabled: u.disabled, online: online.has(u.username) })),
  resets: Object.entries(db.resets).map(([u, r]) => ({ username: u, ts: r.ts, otp: r.exp > now() ? r.otp : null, exp: r.exp }))
}));
adm.post('/a/otp', aauth, (q, s) => {
  const u = String(q.body.username || '').toLowerCase();
  if (!db.users[u]) return s.sendStatus(404);
  const r = (db.resets[u] = db.resets[u] || { ts: now(), tries: 0 });
  r.otp = String(crypto.randomInt(1e5, 1e6)); r.exp = now() + 6e5; r.tries = 0; save();
  s.json({ otp: r.otp }); // TODO: plug an SMS/email provider in here to send the OTP automatically
});
adm.post('/a/toggle', aauth, (q, s) => {
  const x = db.users[String(q.body.username)];
  if (!x) return s.sendStatus(404);
  x.disabled = !x.disabled;
  if (x.disabled) { dropSessions(x.username); const w = online.get(x.username); if (w) w.close(); }
  save(); s.json({ ok: 1 });
});
adm.post('/a/delete', aauth, (q, s) => {
  const u = String(q.body.username);
  if (!db.users[u]) return s.sendStatus(404);
  delete db.users[u]; delete db.resets[u]; dropSessions(u);
  db.msgs = db.msgs.filter((m) => m.from !== u && m.to !== u);
  const w = online.get(u); if (w) w.close();
  save(); s.json({ ok: 1 });
});
adm.listen(4000, '127.0.0.1', () => console.log('Admin dashboard: http://localhost:4000'));
