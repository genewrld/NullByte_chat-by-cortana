const express = require('express'), http = require('http'), crypto = require('crypto'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const D = path.join(__dirname, 'data'), BL = path.join(D, 'blobs'), MD = path.join(D, 'media'), DBF = path.join(D, 'db.json');
fs.mkdirSync(BL, { recursive: true }); fs.mkdirSync(MD, { recursive: true });

/* ---- storage: one JSON file. DMs and DM files are ciphertext only ---- */
let db = { users: {}, msgs: [], sessions: {}, resets: {}, admin: null, media: {}, statuses: {}, reels: {}, saves: {}, pub: [], notices: {}, log: [] };
try { Object.assign(db, JSON.parse(fs.readFileSync(DBF, 'utf8'))); } catch {}
let st;
const save = () => { clearTimeout(st); st = setTimeout(() => fs.writeFile(DBF + '.tmp', JSON.stringify(db), (e) => { if (!e) fs.rename(DBF + '.tmp', DBF, () => {}); }), 400); };
const now = () => Date.now(), rnd = (n) => crypto.randomBytes(n).toString('hex');
const hash = (pw) => { const salt = rnd(16); return { salt, h: crypto.scryptSync(String(pw), salt, 64).toString('hex') }; };
const verify = (pw, o) => crypto.timingSafeEqual(crypto.scryptSync(String(pw), o.salt, 64), Buffer.from(o.h, 'hex'));
const audit = (t) => { db.log.push({ ts: now(), t }); if (db.log.length > 300) db.log.splice(0, db.log.length - 300); save(); };

if (process.env.ADMIN_PASS || !db.admin) {
  const pw = process.env.ADMIN_PASS || crypto.randomBytes(6).toString('base64url');
  db.admin = hash(pw); save();
  console.log('\n=== ADMIN PASSWORD: ' + pw + ' ===\n(shown once. Admin dashboard: http://localhost:4000)\n');
}

const sec = (q, s, n) => {
  s.set({ 'Content-Security-Policy': "default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' blob: data:; media-src 'self' blob:; style-src 'self'; frame-ancestors 'none'",
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
const okAvatar = (a) => typeof a === 'string' && a.length < 90000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(a);
const MIMES = /^(image\/(jpeg|png|webp|gif)|video\/(webm|mp4|quicktime)|audio\/(mpeg|mp3|mp4|ogg|webm|wav|x-wav|aac|x-m4a|m4a|flac))$/;

/* ---- live state + helpers (used by both apps) ---- */
const online = new Map(), rooms = new Map();
const send = (ws, o) => ws && ws.readyState === 1 && ws.send(JSON.stringify(o));
const sendU = (u, o) => send(online.get(u), o);
const bcast = (o, except) => online.forEach((w, u) => u !== except && send(w, o));
const hasStatus = (u) => Object.values(db.statuses).some((s) => s.u === u && s.exp > now());
const pubU = (u) => ({ username: u.username, name: u.name, avatar: u.avatar ? '/avatar/' + u.username + '?v=' + (u.av || 0) : '', bio: u.bio || '', online: online.has(u.username), status: hasStatus(u.username), created: u.created });
const notify = (u, text, kind) => {
  const n = { id: rnd(5), text, kind: kind || 'info', ts: now(), seen: false };
  (db.notices[u] = db.notices[u] || []).push(n); if (db.notices[u].length > 50) db.notices[u].shift();
  save(); sendU(u, { t: 'notice', n }); return n;
};
const dropMedia = (id) => { if (!id || !db.media[id]) return; delete db.media[id]; fs.unlink(path.join(MD, id), () => {}); };
const roomState = () => bcast({ t: 'roomstate', room: 'pub', users: [...(rooms.get('pub') || [])] });
const leave = (u) => rooms.forEach((set, r) => {
  if (set.delete(u)) { set.forEach((p) => sendU(p, { t: 'rleft', room: r, u })); if (!set.size) rooms.delete(r); if (r === 'pub') roomState(); }
});
setInterval(() => {
  for (const [id, s] of Object.entries(db.statuses)) if (s.exp < now()) { dropMedia(s.media); dropMedia(s.music); delete db.statuses[id]; }
  save();
}, 6e5);

/* ---- main app (port 3000) ---- */
const J = express.json({ limit: '10kb' }), JB = express.json({ limit: '150kb' });
const app = express();
app.disable('x-powered-by'); app.use(sec);
app.use(express.static(path.join(__dirname, 'public')));
const authU = (q, s, n) => { const u = userOf((q.get('authorization') || '').slice(7)); if (!u) return s.sendStatus(401); q.user = u; n(); };

app.post('/api/game/start', J, (q, s) => {
  for (const [k, g] of games) if (now() - g.t > 36e5) games.delete(k);
  const id = rnd(12); games.set(id, { t: now(), done: false }); s.json({ id });
});
app.post('/api/game/finish', J, (q, s) => {
  const g = games.get(q.body.id);
  if (!g || now() - g.t < 15000 || q.body.kills < 20) return s.status(400).json({ e: 'not finished' });
  g.done = true; g.exp = now() + 18e5; s.json({ ok: 1 });
});
app.post('/api/register', JB, (q, s) => {
  const b = q.body, u = String(b.username || '').toLowerCase();
  if (!gate(b.pass)) return s.status(403).json({ e: 'Finish the mission first' });
  if (!NAME.test(u) || String(b.password || '').length < 8 || !String(b.name || '').trim())
    return s.status(400).json({ e: 'Check your name, username (3-20 letters, numbers, _) and password (8+ characters)' });
  if (db.users[u]) return s.status(409).json({ e: 'That username is taken' });
  if (b.avatar && !okAvatar(b.avatar)) return s.status(400).json({ e: 'Bad profile photo' });
  db.users[u] = { username: u, name: String(b.name).trim().slice(0, 40), contact: String(b.contact || '').slice(0, 60), bio: '', avatar: b.avatar || '', av: now(), created: now(), last: now(), pub: null, disabled: false, ...hash(b.password) };
  games.delete(b.pass); audit('new account @' + u);
  s.json({ token: newTok(u), username: u });
});
app.post('/api/login', J, (q, s) => {
  const b = q.body, u = String(b.username || '').toLowerCase();
  if (!gate(b.pass)) return s.status(403).json({ e: 'Finish the mission first' });
  if (locked(u)) return s.status(429).json({ e: 'Too many attempts. Try again in 5 minutes' });
  const x = db.users[u];
  if (!x || !verify(b.password, x)) { bad(u); return s.status(401).json({ e: 'Wrong username or password' }); }
  if (x.disabled) return s.status(403).json({ e: 'Account disabled. Contact the admin' });
  x.last = now(); games.delete(b.pass); s.json({ token: newTok(u), username: u });
});

/* password reset: the requester's device gets a private request id (rid). When the admin
   generates the code it appears as a notice on that device and in the user's account. */
app.post('/api/forgot', J, (q, s) => {
  if (!gate(q.body.pass)) return s.status(403).json({ e: 'Finish the mission first' });
  const u = String(q.body.username || '').toLowerCase(), rid = rnd(10);
  const old = db.resets[u];
  if (db.users[u] && !(old && old.otp && old.exp > now())) { db.resets[u] = { ts: now(), otp: null, exp: 0, tries: 0, rid }; save(); audit('reset requested @' + u); }
  s.json({ ok: 1, rid });
});
app.post('/api/reset-poll', J, (q, s) => {
  const u = String(q.body.username || '').toLowerCase(), r = db.resets[u];
  if (!r || !r.rid || String(q.body.rid) !== r.rid) return s.json({ none: true });
  if (r.otp && r.exp > now()) return s.json({ otp: r.otp, exp: r.exp });
  s.json({ waiting: true });
});
app.post('/api/reset', J, (q, s) => {
  const b = q.body, u = String(b.username || '').toLowerCase(), r = db.resets[u], x = db.users[u];
  if (locked('rs' + u)) return s.status(429).json({ e: 'Too many tries. Wait 5 minutes' });
  if (!x || !r || !r.otp || r.exp < now() || r.tries >= 5 || String(b.password || '').length < 8) return s.status(400).json({ e: 'Invalid or expired code' });
  if (String(b.otp).trim() !== r.otp) { r.tries++; bad('rs' + u); save(); return s.status(400).json({ e: 'Invalid or expired code' }); }
  Object.assign(x, hash(b.password)); dropSessions(u); delete db.resets[u]; audit('password reset done @' + u); save(); s.json({ ok: 1 });
});
app.post('/api/logout', J, (q, s) => { delete db.sessions[q.body.token]; save(); s.json({ ok: 1 }); });

/* directory, profile, notices */
app.get('/api/users', authU, (q, s) => s.json(Object.values(db.users).filter((u) => !u.disabled).map(pubU)));
app.get('/avatar/:u', (q, s) => {
  if (!userOf(String(q.query.t || ''))) return s.sendStatus(401);
  const x = db.users[q.params.u], m = x && x.avatar && /^data:(image\/\w+);base64,(.+)$/.exec(x.avatar);
  if (!m) return s.sendStatus(404);
  s.set({ 'Content-Type': m[1], 'Cache-Control': 'private, max-age=604800' }); s.send(Buffer.from(m[2], 'base64'));
});
app.get('/api/me', authU, (q, s) => s.json({ ...pubU(q.user), contact: q.user.contact || '' }));
app.post('/api/profile', authU, JB, (q, s) => {
  const u = q.user, b = q.body;
  if (typeof b.name === 'string' && b.name.trim()) u.name = b.name.trim().slice(0, 40);
  if (typeof b.bio === 'string') u.bio = b.bio.slice(0, 140);
  if (typeof b.contact === 'string') u.contact = b.contact.slice(0, 60);
  if (b.avatar !== undefined && b.avatar !== null) {
    if (b.avatar === '' || okAvatar(b.avatar)) { u.avatar = b.avatar; u.av = now(); } else return s.status(400).json({ e: 'Bad image' });
  }
  if (b.newPassword) {
    if (String(b.newPassword).length < 8) return s.status(400).json({ e: 'New password needs 8+ characters' });
    if (!verify(b.oldPassword || '', u)) return s.status(403).json({ e: 'Wrong current password' });
    Object.assign(u, hash(b.newPassword));
  }
  save(); bcast({ t: 'dirchg', u: u.username }); s.json({ ok: 1 });
});
app.post('/api/notices/read', authU, J, (q, s) => { (db.notices[q.user.username] || []).forEach((n) => (n.seen = true)); save(); s.json({ ok: 1 }); });

/* media (images, video, audio) for avatars-free content: reels, status, community */
app.post('/media', authU, express.raw({ type: () => true, limit: '25mb' }), (q, s) => {
  const mime = String(q.get('x-mime') || '').split(';')[0].trim().toLowerCase();
  if (!MIMES.test(mime) || !Buffer.isBuffer(q.body) || !q.body.length) return s.sendStatus(400);
  if (Object.values(db.media).filter((m) => m.u === q.user.username).length > 300) return s.status(429).json({ e: 'Storage limit reached' });
  const id = rnd(16);
  fs.writeFile(path.join(MD, id), q.body, (e) => {
    if (e) return s.sendStatus(500);
    db.media[id] = { u: q.user.username, mime, ts: now(), size: q.body.length }; save(); s.json({ id });
  });
});
app.get('/media/:id', (q, s) => {
  if (!userOf(String(q.query.t || (q.get('authorization') || '').slice(7)))) return s.sendStatus(401);
  const m = /^[a-f0-9]{32}$/.test(q.params.id) && db.media[q.params.id];
  if (!m) return s.sendStatus(404);
  s.sendFile(path.join(MD, q.params.id), { cacheControl: false, headers: { 'Content-Type': m.mime, 'Cache-Control': 'private, max-age=86400' } });
});

/* status (24h) */
app.post('/api/status', authU, J, (q, s) => {
  const b = q.body, m = db.media[b.media], me = q.user.username;
  if (!m || m.u !== me || !/^(image|video)\//.test(m.mime)) return s.status(400).json({ e: 'Bad media' });
  let music = null;
  if (b.music) { const a = db.media[b.music]; if (!a || a.u !== me || !a.mime.startsWith('audio/')) return s.status(400).json({ e: 'Bad music' }); music = b.music; }
  const id = rnd(6);
  db.statuses[id] = { id, u: me, media: b.media, mime: m.mime, music, musicName: String(b.musicName || '').slice(0, 60), caption: String(b.caption || '').slice(0, 100), ts: now(), exp: now() + 864e5, views: [] };
  save(); bcast({ t: 'dirchg', u: me }); s.json({ ok: 1, id });
});
app.get('/api/statuses', authU, (q, s) => s.json(Object.values(db.statuses).filter((x) => x.exp > now() && db.users[x.u] && !db.users[x.u].disabled).sort((a, b) => a.ts - b.ts).map((x) => ({
  id: x.id, u: x.u, media: x.media, mime: x.mime, music: x.music, musicName: x.musicName, caption: x.caption, ts: x.ts,
  seen: x.views.includes(q.user.username), views: x.u === q.user.username ? x.views.length : undefined }))));
app.post('/api/status/seen', authU, J, (q, s) => { const x = db.statuses[q.body.id]; if (x && !x.views.includes(q.user.username) && x.u !== q.user.username) { x.views.push(q.user.username); save(); } s.json({ ok: 1 }); });
app.post('/api/status/delete', authU, J, (q, s) => {
  const x = db.statuses[q.body.id]; if (!x || x.u !== q.user.username) return s.sendStatus(404);
  dropMedia(x.media); dropMedia(x.music); delete db.statuses[x.id]; save(); bcast({ t: 'dirchg', u: x.u }); s.json({ ok: 1 });
});

/* reels */
const reelView = (r, me) => { const a = db.users[r.u] || {}; return { id: r.id, u: r.u, name: a.name || r.u, avatar: a.avatar ? '/avatar/' + r.u + '?v=' + (a.av || 0) : '', media: r.media, caption: r.caption, music: r.musicName || '', ts: r.ts, likes: r.likes.length, liked: r.likes.includes(me), comments: r.comments.length, saved: (db.saves[me] || []).includes(r.id) }; };
const liveReels = () => Object.values(db.reels).filter((r) => db.users[r.u] && !db.users[r.u].disabled).sort((a, b) => b.ts - a.ts);
app.post('/api/reel', authU, J, (q, s) => {
  const b = q.body, m = db.media[b.media];
  if (!m || m.u !== q.user.username || !m.mime.startsWith('video/')) return s.status(400).json({ e: 'Bad video' });
  const id = rnd(6);
  db.reels[id] = { id, u: q.user.username, media: b.media, caption: String(b.caption || '').slice(0, 200), musicName: String(b.music || '').slice(0, 60), ts: now(), likes: [], comments: [] };
  save(); s.json({ ok: 1, id });
});
app.get('/api/reels', authU, (q, s) => s.json(liveReels().slice(0, 100).map((r) => reelView(r, q.user.username))));
app.get('/api/saved', authU, (q, s) => { const ids = db.saves[q.user.username] || []; s.json(liveReels().filter((r) => ids.includes(r.id)).map((r) => reelView(r, q.user.username))); });
app.post('/api/reel/like', authU, J, (q, s) => {
  const r = db.reels[q.body.id]; if (!r) return s.sendStatus(404);
  const i = r.likes.indexOf(q.user.username); if (i >= 0) r.likes.splice(i, 1); else r.likes.push(q.user.username);
  save(); s.json({ liked: i < 0, likes: r.likes.length });
});
app.post('/api/reel/save', authU, J, (q, s) => {
  const r = db.reels[q.body.id]; if (!r) return s.sendStatus(404);
  const l = (db.saves[q.user.username] = db.saves[q.user.username] || []), i = l.indexOf(r.id);
  if (i >= 0) l.splice(i, 1); else l.push(r.id);
  save(); s.json({ saved: i < 0 });
});
app.get('/api/reel/comments', authU, (q, s) => {
  const r = db.reels[String(q.query.id)]; if (!r) return s.sendStatus(404);
  s.json(r.comments.map((c) => { const a = db.users[c.u] || {}; return { id: c.id, u: c.u, name: a.name || c.u, avatar: a.avatar ? '/avatar/' + c.u + '?v=' + (a.av || 0) : '', text: c.text, ts: c.ts }; }));
});
app.post('/api/reel/comment', authU, J, (q, s) => {
  const r = db.reels[q.body.id], text = String(q.body.text || '').trim().slice(0, 200); if (!r || !text) return s.sendStatus(400);
  const c = { id: rnd(5), u: q.user.username, text, ts: now() }; r.comments.push(c); save();
  const a = q.user; s.json({ c: { ...c, name: a.name, avatar: a.avatar ? '/avatar/' + a.username + '?v=' + (a.av || 0) : '' } });
});
app.post('/api/reel/delete', authU, J, (q, s) => {
  const r = db.reels[q.body.id]; if (!r || r.u !== q.user.username) return s.sendStatus(404);
  dropMedia(r.media); delete db.reels[r.id]; save(); s.json({ ok: 1 });
});

/* old encrypted-DM file blobs */
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

/* ---- realtime: DMs, community chat, call signaling ---- */
const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 256 * 1024 });
const roomOk = (room, u) => room === 'pub' || (room.startsWith('dm:') && (() => { const p = room.slice(3).split(':'); return p.length === 2 && p.includes(u); })());
wss.on('connection', (ws) => {
  let me = null, cnt = 0;
  const tk = setInterval(() => (cnt = 0), 1e4);
  ws.on('message', (raw) => {
    if (++cnt > 300) return;
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
      send(ws, { t: 'hist', msgs: mine, people, pub: db.pub.slice(-100), notices: db.notices[me] || [] });
      send(ws, { t: 'roomstate', room: 'pub', users: [...(rooms.get('pub') || [])] });
      return bcast({ t: 'presence', u: me, online: true }, me);
    }
    if (!me) return;
    const u = db.users[me]; if (!u || u.disabled) return;
    if (m.t === 'find') {
      const q = String(m.q || '').toLowerCase(), p = db.users[q];
      return send(ws, p && !p.disabled && p.pub ? { t: 'found', q, username: p.username, name: p.name, pub: p.pub } : { t: 'found', q, none: true });
    }
    if (m.t === 'msg') {
      const to = String(m.to || '').toLowerCase(), p = db.users[to];
      if (!p || p.disabled || !p.pub || to === me) return send(ws, { t: 'err', e: 'User not found' });
      const r = { id: rnd(6), from: me, to, iv: String(m.iv), ct: String(m.ct), ts: now(), spub: u.pub, rpub: p.pub };
      db.msgs.push(r); save();
      send(ws, { t: 'sent', m: r }); return sendU(to, { t: 'msg', m: r, fn: u.name });
    }
    if (m.t === 'pub') {
      const text = String(m.text || '').slice(0, 1000); let media = null, mime = null;
      if (m.media) { const a = db.media[m.media]; if (!a || a.u !== me) return; media = m.media; mime = a.mime; }
      if (!text.trim() && !media) return;
      const r = { id: rnd(6), from: me, text, media, mime, fname: String(m.fname || '').slice(0, 80), ts: now() };
      db.pub.push(r); if (db.pub.length > 500) db.pub.shift(); save();
      return bcast({ t: 'pub', m: r });
    }
    if (m.t === 'ring') {
      const to = String(m.to || '').toLowerCase();
      if (!db.users[to] || to === me || !online.has(to)) return send(ws, { t: 'err', e: 'User is offline' });
      const room = 'dm:' + [me, to].sort().join(':');
      return sendU(to, { t: 'ring', from: me, name: u.name, video: !!m.video, room });
    }
    if (m.t === 'rdecline') return sendU(String(m.to || ''), { t: 'declined', from: me });
    if (m.t === 'rjoin') {
      const room = String(m.room || '');
      if (!roomOk(room, me)) return send(ws, { t: 'err', e: 'Cannot join that call' });
      leave(me);
      const set = rooms.get(room) || new Set();
      if (room !== 'pub' && set.size >= 2) return send(ws, { t: 'err', e: 'Call is full' });
      if (set.size >= 8) return send(ws, { t: 'err', e: 'Community call is full (8 people max)' });
      const peers = [...set]; set.add(me); rooms.set(room, set);
      send(ws, { t: 'rpeers', room, peers }); peers.forEach((p) => sendU(p, { t: 'rnew', room, u: me }));
      if (room === 'pub') roomState();
      return;
    }
    if (m.t === 'rleave') return leave(me);
    if (m.t === 'rtc') {
      const set = rooms.get(m.room), to = String(m.to || '');
      if (set && set.has(me) && set.has(to)) sendU(to, { t: 'rtc', room: m.room, from: me, data: m.data });
    }
  });
  ws.on('close', () => {
    clearInterval(tk);
    if (me && online.get(me) === ws) { online.delete(me); leave(me); bcast({ t: 'presence', u: me, online: false }); }
  });
});
setInterval(() => wss.clients.forEach((c) => c.ping()), 3e4);
server.listen(3000, '0.0.0.0', () => console.log('NullByte chat: http://localhost:3000'));

/* ---- admin web app (separate app, port 4000, this phone only) ---- */
const adm = express();
adm.use(sec); adm.use(express.json({ limit: '10kb' })); adm.use(express.static(path.join(__dirname, 'admin')));
const atok = new Set();
const aauth = (q, s, n) => (atok.has(q.get('x-admin')) ? n() : s.sendStatus(401));
adm.post('/a/login', (q, s) => {
  if (locked('admin')) return s.status(429).json({ e: 'Locked for 5 minutes' });
  if (!verify(q.body.password || '', db.admin)) { bad('admin'); return s.status(401).json({ e: 'Wrong password' }); }
  const t = rnd(24); atok.add(t); audit('admin signed in'); s.json({ t });
});
adm.get('/a/data', aauth, (q, s) => {
  let bytes = 0; for (const m of Object.values(db.media)) bytes += m.size || 0;
  s.json({
    stats: { users: Object.keys(db.users).length, online: online.size, disabled: Object.values(db.users).filter((u) => u.disabled).length, dms: db.msgs.length,
      reels: Object.keys(db.reels).length, statuses: Object.values(db.statuses).filter((x) => x.exp > now()).length, pub: db.pub.length, media: Object.keys(db.media).length,
      mb: Math.round(bytes / 1048576), pending: Object.values(db.resets).filter((r) => !r.otp || r.exp < now()).length, up: Math.round(process.uptime()), inCall: (rooms.get('pub') || new Set()).size },
    users: Object.values(db.users).map((u) => ({ username: u.username, name: u.name, contact: u.contact, bio: u.bio, created: u.created, last: u.last, disabled: u.disabled, online: online.has(u.username), photo: !!u.avatar })),
    resets: Object.entries(db.resets).map(([u, r]) => ({ username: u, ts: r.ts, otp: r.exp > now() ? r.otp : null, exp: r.exp })),
    reels: Object.values(db.reels).sort((a, b) => b.ts - a.ts).slice(0, 100).map((r) => ({ id: r.id, u: r.u, caption: r.caption, likes: r.likes.length, comments: r.comments.length, ts: r.ts })),
    pub: db.pub.slice(-80).reverse(), log: db.log.slice(-80).reverse()
  });
});
adm.post('/a/otp', aauth, (q, s) => {
  const u = String(q.body.username || '').toLowerCase();
  if (!db.users[u]) return s.sendStatus(404);
  const r = (db.resets[u] = db.resets[u] || { ts: now(), tries: 0, rid: null });
  r.otp = String(crypto.randomInt(1e5, 1e6)); r.exp = now() + 6e5; r.tries = 0; delete fails['rs' + u]; save();
  notify(u, 'NullByte admin sent you a reset code: ' + r.otp + ' (valid 10 minutes, never share it)', 'otp');
  audit('OTP generated for @' + u); s.json({ otp: r.otp });
});
adm.post('/a/dismiss', aauth, (q, s) => { delete db.resets[String(q.body.username)]; save(); s.json({ ok: 1 }); });
adm.post('/a/notice', aauth, (q, s) => {
  const text = String(q.body.text || '').trim().slice(0, 300), to = String(q.body.to || '').toLowerCase();
  if (!text) return s.sendStatus(400);
  if (to === '*') { Object.keys(db.users).forEach((u) => notify(u, text, 'admin')); audit('broadcast notice'); return s.json({ ok: 1 }); }
  if (!db.users[to]) return s.sendStatus(404);
  notify(to, text, 'admin'); audit('notice to @' + to); s.json({ ok: 1 });
});
adm.post('/a/toggle', aauth, (q, s) => {
  const x = db.users[String(q.body.username)];
  if (!x) return s.sendStatus(404);
  x.disabled = !x.disabled;
  if (x.disabled) { dropSessions(x.username); const w = online.get(x.username); if (w) w.close(); }
  audit((x.disabled ? 'disabled @' : 'enabled @') + x.username); bcast({ t: 'dirchg', u: x.username }); save(); s.json({ ok: 1 });
});
adm.post('/a/kick', aauth, (q, s) => {
  const u = String(q.body.username); if (!db.users[u]) return s.sendStatus(404);
  dropSessions(u); const w = online.get(u); if (w) w.close(); audit('forced logout @' + u); s.json({ ok: 1 });
});
adm.post('/a/delete', aauth, (q, s) => {
  const u = String(q.body.username);
  if (!db.users[u]) return s.sendStatus(404);
  delete db.users[u]; delete db.resets[u]; delete db.saves[u]; delete db.notices[u]; dropSessions(u);
  db.msgs = db.msgs.filter((m) => m.from !== u && m.to !== u); db.pub = db.pub.filter((m) => m.from !== u);
  for (const [id, r] of Object.entries(db.reels)) if (r.u === u) delete db.reels[id];
  for (const [id, x] of Object.entries(db.statuses)) if (x.u === u) delete db.statuses[id];
  for (const [id, m] of Object.entries(db.media)) if (m.u === u) dropMedia(id);
  const w = online.get(u); if (w) w.close();
  audit('deleted @' + u); bcast({ t: 'dirchg', u }); save(); s.json({ ok: 1 });
});
adm.post('/a/reel/delete', aauth, (q, s) => { const r = db.reels[q.body.id]; if (!r) return s.sendStatus(404); dropMedia(r.media); delete db.reels[r.id]; audit('removed reel ' + r.id); save(); s.json({ ok: 1 }); });
adm.post('/a/pub/delete', aauth, (q, s) => { db.pub = db.pub.filter((m) => m.id !== q.body.id); bcast({ t: 'pubdel', id: q.body.id }); audit('removed community message'); save(); s.json({ ok: 1 }); });
adm.post('/a/pass', aauth, (q, s) => {
  const pw = String(q.body.password || ''); if (pw.length < 8) return s.status(400).json({ e: '8+ characters' });
  db.admin = hash(pw); audit('admin password changed'); save(); s.json({ ok: 1 });
});
adm.post('/a/clearlog', aauth, (q, s) => { db.log = []; save(); s.json({ ok: 1 }); });
adm.get('/a/backup', aauth, (q, s) => { s.set('Content-Disposition', 'attachment; filename=nullbyte-backup.json'); s.json({ ...db, sessions: {}, admin: null }); });
adm.listen(4000, '127.0.0.1', () => console.log('NullByte admin: http://localhost:4000'));
