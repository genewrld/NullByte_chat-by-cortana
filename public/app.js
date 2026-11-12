const $ = (id) => document.getElementById(id);
const h = (t, c, ...k) => { const e = document.createElement(t); if (c) e.className = c; k.flat().forEach((x) => x != null && x !== false && e.append(x)); return e; };
const P = {
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  comment: 'M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z',
  bookmark: 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z',
  send: 'M2 21l21-9L2 3v7l15 2-15 2z',
  back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z',
  phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  videocam: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
  screen: 'M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zm-7-3.53v-2.19c-2.78 0-4.61.85-6 2.72.56-2.67 2.11-5.33 6-5.87V7l4 3.73-4 3.74z',
  mic: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
  callend: 'M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z',
  add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  attach: 'M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6h-1.5z',
  chat: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
  play: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z',
  group: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  music: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  hood: 'M12 2C7 2 4 6 4 10v4l-2 6h20l-2-6v-4c0-4-3-8-8-8zm0 6c2.2 0 4 1.5 4 3.5S14.2 15 12 15s-4-1.5-4-3.5S9.8 8 12 8zm-2 2.5h1.5v1H10v-1zm2.5 0H14v1h-1.5v-1z',
  logout: 'M10 17l1.4-1.4L8.8 13H20v-2H8.8l2.6-2.6L10 7l-5 5 5 5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'
};
const ic = (n, s = 22) => { const d = document.createElement('span'); d.className = 'ic'; d.innerHTML = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '"><path fill="currentColor" d="' + P[n] + '"/></svg>'; return d; };
document.querySelectorAll('i[data-ic]').forEach((e) => e.replaceWith(ic(e.dataset.ic)));

const ECDH = { name: 'ECDH', namedCurve: 'P-256' };
const enc = new TextEncoder(), dec = new TextDecoder();
const MAXMB = 20;
const b64 = (b) => { let s = ''; new Uint8Array(b).forEach((c) => (s += String.fromCharCode(c))); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hm = (t) => new Date(t).toTimeString().slice(0, 5);
const ago = (t) => { const m = Math.floor((Date.now() - t) / 6e4); return m < 1 ? 'now' : m < 60 ? m + 'm' : m < 1440 ? Math.floor(m / 60) + 'h' : Math.floor(m / 1440) + 'd'; };
const ls = (k, v) => (v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v));

let ws, me = ls('gc_user') || null, tok = ls('gc_tok') || '', kp, myPub, cur = null, gid = null, pass = null, view = 'chats';
let people = {}, msgs = {}, read = {}, dir = {}, pubMsgs = [], notices = [], stories = [], reels = [], reelTab = 'all', callS = null, ringS = null, sv = null;
const keys = {}, pend = {};

function show(id) { ['game', 'auth', 'app'].forEach((x) => ($(x).hidden = x !== id)); }
function toast(t, err) {
  const el = $('toast'); el.textContent = t; el.className = err ? 'err' : ''; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 3800);
}
const auth = () => ({ Authorization: 'Bearer ' + tok });
const mediaUrl = (id) => '/media/' + id + '?t=' + tok;
const wsend = (o) => ws && ws.readyState === 1 && ws.send(JSON.stringify(o));
const who = (u) => dir[u] || (people[u] && { username: u, name: people[u].name }) || { username: u, name: u };
function avEl(u, cls) {
  u = u || {}; const d = h('div', 'av' + (u.status ? ' glow' : '') + (cls ? ' ' + cls : ''));
  if (u.avatar) { const i = new Image(); i.alt = ''; i.src = u.avatar + (u.avatar.startsWith('/avatar/') ? '&t=' + tok : ''); d.append(i); }
  else d.textContent = (u.name || u.username || '?')[0].toUpperCase();
  return d;
}
const api = async (p, b) => {
  const r = await fetch('/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  return { ok: r.ok, status: r.status, d: await r.json().catch(() => ({})) };
};
const call = async (p, b) => {
  const r = await fetch('/api/' + p, { method: b === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...auth() }, body: b === undefined ? undefined : JSON.stringify(b) });
  if (r.status === 401 && tok) logoutLocal();
  return { ok: r.ok, status: r.status, d: await r.json().catch(() => ({})) };
};
const pickFile = (accept) => new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => res(i.files[0] || null); i.oncancel = () => res(null); i.click(); });
const toDataURL = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
async function up(b, mime) {
  const r = await fetch('/media', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Mime': mime, ...auth() }, body: b });
  if (!r.ok) throw new Error(r.status === 413 ? 'File too large (25 MB max)' : r.status === 400 ? 'That file type is not supported' : 'Upload failed');
  return r.json();
}
function setIcon() {
  document.title = 'NullByte';
  if (!document.querySelector('link[rel=icon]')) { const l = document.createElement('link'); l.rel = 'icon'; l.href = 'icon.svg'; document.head.append(l); }
  $('alogo').src = 'icon.svg'; $('tlogo').src = 'icon.svg';
}

/* ---------- game gate (disguised as a standalone shooter) ---------- */
async function startGame() {
  show('game'); pass = null;
  const r = await api('game/start', {}); gid = r.d.id;
  runGame($('gcv'), async () => {
    const f = await api('game/finish', { id: gid, kills: 20 });
    if (f.ok) { pass = gid; setTimeout(async () => { setIcon(); await boot('NULLBYTE', ['establishing encrypted channel', 'generating keys', 'mounting secure storage', 'welcome, operator'], 1500); show('auth'); }, 1500); }
    else toast('Mission check failed, reload and try again', true);
  });
}

/* ---------- accounts ---------- */
const msg = (t, err = 1) => { $('amsg').textContent = t; $('amsg').className = err ? 'err' : ''; };
let pollT = null, regAvatar = '';
function showForm(f) { document.querySelectorAll('#auth form').forEach((x) => (x.hidden = x.id !== 'f-' + f)); msg(''); clearInterval(pollT); if (f === 'reset') startPoll(); }
document.querySelectorAll('[data-go]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); showForm(a.dataset.go); }));
async function entered(d) {
  tok = d.token; me = d.username; ls('gc_tok', tok); ls('gc_user', me);
  kp = await loadIdentity(me); myPub = kp.pub; connect();
}
async function authCall(path, body, okFn) {
  const r = await api(path, { ...body, pass });
  if (r.status === 403 && /mission/i.test(r.d.e || '')) { toast('Complete the mission again to continue', true); return startGame(); }
  if (!r.ok) return msg(r.d.e || 'Something went wrong');
  okFn(r.d);
}
$('f-login').onsubmit = (e) => { e.preventDefault(); authCall('login', { username: $('lu').value.trim(), password: $('lp').value }, entered); };
$('regpick').onclick = async () => {
  const f = await pickFile('image/*'); if (!f) return;
  const b = await cropModal(f, [1], 256); if (!b) return;
  regAvatar = await toDataURL(b); const p = $('ravp'); p.textContent = ''; const i = new Image(); i.src = regAvatar; p.append(i);
};
$('f-reg').onsubmit = (e) => { e.preventDefault(); authCall('register', { name: $('rn').value, username: $('ru').value.trim(), contact: $('rc').value, password: $('rp').value, avatar: regAvatar }, entered); };
$('f-forgot').onsubmit = (e) => {
  e.preventDefault();
  authCall('forgot', { username: $('fu').value.trim() }, (d) => {
    ls('gc_rid', d.rid); ls('gc_rid_u', $('fu').value.trim().toLowerCase());
    msg('Request sent. Waiting for the admin...', 0); showForm('reset'); $('xu').value = $('fu').value.trim();
  });
};
async function pollReset() {
  const u = ($('xu').value || ls('gc_rid_u') || '').trim().toLowerCase(), rid = ls('gc_rid'); if (!u || !rid) return;
  const r = await api('reset-poll', { username: u, rid });
  const n = $('rnote');
  if (r.d.otp) { n.hidden = false; n.textContent = ''; n.append('ADMIN NOTICE: your reset code is ', h('b', '', r.d.otp), h('div', 'sub', 'valid for 10 minutes. Enter it below.')); if (!$('xo').value) $('xo').value = r.d.otp; }
  else if (r.d.waiting) { n.hidden = false; n.textContent = 'Waiting for the admin to send your code. This page will show it as soon as it arrives.'; }
}
function startPoll() { if (!$('xu').value && ls('gc_rid_u')) $('xu').value = ls('gc_rid_u'); pollReset(); pollT = setInterval(pollReset, 4000); }
$('f-reset').onsubmit = async (e) => {
  e.preventDefault();
  const r = await api('reset', { username: $('xu').value.trim(), otp: $('xo').value.trim(), password: $('xp').value });
  if (!r.ok) return msg(r.d.e || 'Invalid or expired code');
  ls('gc_rid', ''); showForm('login'); msg('Password changed. Log in with your new password.', 0);
};
function logoutLocal() { ls('gc_tok', ''); ls('gc_user', ''); tok = ''; me = null; location.reload(); }

/* ---------- crypto (DM keys never leave this device) ---------- */
async function loadIdentity(u) {
  const s = ls('gc_id_' + u);
  if (s) { const o = JSON.parse(s); return { privateKey: await crypto.subtle.importKey('jwk', o.priv, ECDH, false, ['deriveKey']), pub: o.pub }; }
  const k = await crypto.subtle.generateKey(ECDH, true, ['deriveKey']);
  const priv = await crypto.subtle.exportKey('jwk', k.privateKey), pub = await crypto.subtle.exportKey('jwk', k.publicKey);
  ls('gc_id_' + u, JSON.stringify({ priv, pub })); return { privateKey: k.privateKey, pub };
}
async function fingerprint(pub) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(pub.x + pub.y));
  return [...new Uint8Array(d).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join(' ');
}
async function trust(u, pub) {
  const f = await fingerprint(pub), k = `gc_fp_${me}_${u}`, old = ls(k);
  if (!old || old === f) { ls(k, f); return true; }
  if (confirm(`${u}'s security code changed (new device or account reset). Only continue if you trust this. Accept the new code?`)) { ls(k, f); return true; }
  return false;
}
async function aesKey(n, pub) {
  const id = n + ':' + pub.x;
  if (keys[id]) return keys[id];
  const theirs = await crypto.subtle.importKey('jwk', pub, ECDH, false, []);
  return (keys[id] = await crypto.subtle.deriveKey({ name: 'ECDH', public: theirs }, kp.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']));
}
async function jenc(k, o) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return { iv: b64(iv), ct: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(JSON.stringify(o)))) };
}
const jdec = async (k, m) => JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(m.iv) }, k, unb64(m.ct))));
async function sealFile(f) {
  if (f.size > MAXMB * 1048576) throw new Error('Max file size is ' + MAXMB + ' MB');
  const K = crypto.getRandomValues(new Uint8Array(32)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ck = await crypto.subtle.importKey('raw', K, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, ck, await f.arrayBuffer()));
  const body = new Uint8Array(12 + ct.length); body.set(iv); body.set(ct, 12);
  const r = await fetch('/blob', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', ...auth() }, body });
  if (!r.ok) throw new Error('Upload failed');
  return { blob: (await r.json()).id, key: b64(K), name: f.name, mime: f.type || 'application/octet-stream', size: f.size };
}
async function openFile(e) {
  const r = await fetch('/blob/' + e.blob, { headers: auth() });
  if (!r.ok) throw 0;
  const ab = new Uint8Array(await r.arrayBuffer());
  const ck = await crypto.subtle.importKey('raw', unb64(e.key), 'AES-GCM', false, ['decrypt']);
  return new Blob([await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ab.slice(0, 12) }, ck, ab.slice(12))], { type: e.mime });
}
function body(env) {
  const w = document.createElement('span');
  if (env.text) w.append(env.text);
  if (env.blob) {
    const m = document.createElement('div'); m.textContent = 'Decrypting ' + env.name + '...'; w.append(m);
    openFile(env).then((b) => {
      const u = URL.createObjectURL(b); let el;
      if (env.mime.startsWith('image/')) { el = new Image(); el.src = u; }
      else if (env.mime.startsWith('video/')) { el = document.createElement('video'); el.src = u; el.controls = true; el.playsInline = true; }
      else if (env.mime.startsWith('audio/')) { el = document.createElement('audio'); el.src = u; el.controls = true; }
      else { el = document.createElement('a'); el.href = u; el.download = env.name; el.textContent = 'Save ' + env.name + ' (' + Math.round(env.size / 1024) + ' KB)'; }
      m.textContent = ''; m.append(el);
    }).catch(() => (m.textContent = 'Media unavailable'));
  }
  return w;
}

/* ---------- navigation, sheet ---------- */
function setView(v) {
  view = v;
  document.querySelectorAll('.view').forEach((s) => (s.hidden = s.id !== 'v-' + v));
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
  if (v !== 'reels') document.querySelectorAll('.rv').forEach((x) => x.pause());
  if (v === 'reels') loadReels();
  if (v === 'comm') { renderPub(); }
  if (v === 'people') { loadDir(); }
  if (v === 'me') { renderMe(); }
}
document.querySelectorAll('#nav button').forEach((b) => (b.onclick = () => setView(b.dataset.v)));
$('bell').onclick = () => setView('me');
function openSheet(title, ...nodes) { $('sht').textContent = title; const b = $('shb'); b.textContent = ''; b.append(...nodes); $('sheet').hidden = false; }
$('shx').onclick = () => ($('sheet').hidden = true);
$('sheet').onclick = (e) => { if (e.target === $('sheet')) $('sheet').hidden = true; };

/* ---------- directory + presence ---------- */
async function loadDir() {
  const r = await call('users'); if (!Array.isArray(r.d)) return;
  dir = {}; r.d.forEach((u) => (dir[u.username] = u)); renderPeople(); list(); renderStories();
}
async function loadStories() { const r = await call('statuses'); if (Array.isArray(r.d)) { stories = r.d; renderStories(); } }
function renderPeople() {
  const L = $('plist'); if (!L) return; const q = ($('pq').value || '').toLowerCase().trim(); L.textContent = '';
  const all = Object.values(dir).sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name));
  $('pcount').textContent = all.length + ' registered, ' + all.filter((u) => u.online).length + ' online';
  all.filter((u) => !q || u.name.toLowerCase().includes(q) || u.username.includes(q)).forEach((u) => {
    const r = h('div', 'chat', avEl(u), h('div', 'mid', h('div', 'nm', u.name), h('div', 'pv', h('span', 'dot' + (u.online ? ' on' : '')), '@' + u.username + (u.bio ? ' | ' + u.bio : ''))));
    r.onclick = () => openProfile(u.username); L.append(r);
  });
}
$('pq').oninput = renderPeople;
function openProfile(u) {
  const p = who(u), acts = h('div', 'edbtns');
  if (u !== me) { const m = h('button', 'btn', 'message'); m.onclick = () => { $('sheet').hidden = true; openChat(u); }; acts.append(m); }
  if (stories.some((s) => s.u === u)) { const s = h('button', 'btn ghost', 'view status'); s.onclick = () => { $('sheet').hidden = true; openStory(u); }; acts.append(s); }
  openSheet('@' + u, avEl(p, 'big'), h('div', '', h('b', 'brand', p.name || u), h('div', 'sub', p.bio || 'no bio yet'), h('div', 'sub', (p.online ? 'online now' : 'offline') + (p.created ? ' | joined ' + new Date(p.created).toLocaleDateString() : ''))), acts);
}

/* ---------- status (stories) ---------- */
function renderStories() {
  const R = $('stories'); if (!R) return; R.textContent = '';
  const add = h('div', 'st', h('div', 'av add', ic('add', 24)), h('small', '', 'add status')); add.onclick = statusEditor; R.append(add);
  const users = [...new Set(stories.map((s) => s.u))].sort((a, b) => (a === me ? -1 : b === me ? 1 : 0));
  users.forEach((u) => {
    const unseen = stories.some((s) => s.u === u && !s.seen);
    const t = h('div', 'st' + (unseen || u === me ? '' : ' seen'), avEl({ ...who(u), status: true }), h('small', '', u === me ? 'you' : (who(u).name || u).split(' ')[0]));
    t.onclick = () => openStory(u); R.append(t);
  });
}
function openStory(u) {
  const items = stories.filter((s) => s.u === u); if (!items.length) return;
  sv = { items, i: 0, t: null, a: null }; $('storyv').hidden = false; playStory();
}
function closeStory() { if (!sv) return; clearTimeout(sv.t); if (sv.a) sv.a.pause(); sv = null; $('storyv').hidden = true; $('storyv').textContent = ''; }
function playStory() {
  const box = $('storyv'), s = sv.items[sv.i]; clearTimeout(sv.t); if (sv.a) sv.a.pause(); box.textContent = '';
  const isVid = s.mime.startsWith('video/'), secs = 7;
  const bars = h('div', 'sbars', sv.items.map((_, k) => h('i', k < sv.i ? 'done' : k === sv.i ? 'cur' : '')));
  const cb = bars.children[sv.i]; if (cb && !isVid) cb.style.animationDuration = secs + 's';
  const x = h('button', 'ib', ic('close', 26)); x.onclick = closeStory;
  const head = h('div', 'shead', avEl(who(s.u)), h('div', '', h('b', 'brand', who(s.u).name || s.u), h('div', 'sub', ago(s.ts) + ' ago')), h('span', 'sp'), x);
  let m;
  if (isVid) { m = h('video', 'smedia'); m.src = mediaUrl(s.media); m.autoplay = true; m.playsInline = true; m.onended = nextStory; if (cb) m.onloadedmetadata = () => (cb.style.animationDuration = m.duration + 's'); }
  else { m = new Image(); m.className = 'smedia'; m.src = mediaUrl(s.media); sv.t = setTimeout(nextStory, secs * 1000); }
  const cap = h('div', 'scap', s.caption ? h('div', '', s.caption) : null, s.musicName ? h('small', '', '♪ ' + s.musicName) : null);
  if (s.u === me) {
    const del = h('button', 'btn red', 'delete'); del.onclick = async () => { await call('status/delete', { id: s.id }); closeStory(); loadStories(); loadDir(); };
    cap.append(h('small', '', (s.views || 0) + ' views'), del);
  } else call('status/seen', { id: s.id }).then(() => (s.seen = true));
  const l = h('div', 'stap l'), r = h('div', 'stap r'); l.onclick = prevStory; r.onclick = nextStory;
  box.append(m, bars, head, l, r, cap);
  if (s.music) { sv.a = new Audio(mediaUrl(s.music)); sv.a.loop = true; sv.a.play().catch(() => {}); }
}
function nextStory() { if (!sv) return; if (sv.i + 1 < sv.items.length) { sv.i++; playStory(); } else { closeStory(); renderStories(); } }
function prevStory() { if (!sv) return; if (sv.i > 0) sv.i--; playStory(); }

/* ---------- cropper (status photos, profile pictures) ---------- */
function cropModal(file, aspects, outW) {
  return new Promise(async (res) => {
    const img = new Image(), url = URL.createObjectURL(file);
    try { await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; }); } catch (e) { toast('Cannot read that image', true); return res(null); }
    const ed = $('editor'); ed.textContent = ''; ed.hidden = false;
    let asp = aspects[0], z = 1, ox = 0, oy = 0, PW = 360, PH = 360, last = null;
    const cv = h('canvas', 'cropcv'), c = cv.getContext('2d'), zoom = h('input'); zoom.type = 'range'; zoom.min = 1; zoom.max = 4; zoom.step = .01; zoom.value = 1;
    const geo = (W, Hh) => { const sc = Math.max(W / img.width, Hh / img.height) * z, w = img.width * sc, hh = img.height * sc; return { w, hh, mx: (w - W) / 2, my: (hh - Hh) / 2 }; };
    const clampPan = () => { const g = geo(PW, PH); ox = Math.max(-g.mx, Math.min(g.mx, ox)); oy = Math.max(-g.my, Math.min(g.my, oy)); };
    const paint = (cc, k) => { const W = PW * k, Hh = PH * k, g = geo(W, Hh); cc.fillStyle = '#000'; cc.fillRect(0, 0, W, Hh); cc.drawImage(img, W / 2 - g.w / 2 + ox * k, Hh / 2 - g.hh / 2 + oy * k, g.w, g.hh); };
    const size = () => { PW = 360; PH = Math.round(360 / asp); cv.width = PW; cv.height = PH; ox = oy = 0; z = 1; zoom.value = 1; paint(c, 1); };
    zoom.oninput = () => { z = +zoom.value; clampPan(); paint(c, 1); };
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); last = [e.clientX, e.clientY]; };
    cv.onpointermove = (e) => { if (!last) return; const k = PW / cv.clientWidth; ox += (e.clientX - last[0]) * k; oy += (e.clientY - last[1]) * k; last = [e.clientX, e.clientY]; clampPan(); paint(c, 1); };
    cv.onpointerup = cv.onpointercancel = () => (last = null);
    const chips = h('div', 'chips');
    if (aspects.length > 1) aspects.forEach((a) => { const b = h('button', 'chip' + (a === asp ? ' on' : ''), a === 1 ? '1:1' : a > 1 ? '16:9' : a === 9 / 16 ? '9:16' : '4:5'); b.type = 'button'; b.onclick = () => { asp = a; [...chips.children].forEach((x) => x.classList.toggle('on', x === b)); size(); }; chips.append(b); });
    const done = h('button', 'btn', 'done'), cancel = h('button', 'btn ghost', 'cancel');
    const close = (v) => { ed.hidden = true; ed.textContent = ''; URL.revokeObjectURL(url); res(v); };
    cancel.onclick = () => close(null);
    done.onclick = () => { const o = document.createElement('canvas'), k = outW / PW; o.width = Math.round(PW * k); o.height = Math.round(PH * k); paint(o.getContext('2d'), k); o.toBlob((b) => close(b), 'image/jpeg', .85); };
    ed.append(h('div', 'brand', 'CROP'), cv, chips, h('div', 'ed-row', h('small', '', 'drag to move, slide to zoom'), zoom), h('div', 'edbtns', cancel, done));
    size();
  });
}

/* ---------- status editor: crop + music only ---------- */
async function statusEditor() {
  const f = await pickFile('image/*,video/*'); if (!f) return;
  if (f.type.startsWith('video/')) return statusPanel(f, f.type || 'video/mp4', true);
  const b = await cropModal(f, [9 / 16, 1, 4 / 5], 720); if (b) statusPanel(b, 'image/jpeg', false);
}
function statusPanel(blob, mime, isVid) {
  const ed = $('editor'); ed.textContent = ''; ed.hidden = false;
  const url = URL.createObjectURL(blob), pv = isVid ? h('video', 'pv') : h('img', 'pv'); pv.src = url;
  if (isVid) { pv.controls = true; pv.playsInline = true; pv.muted = true; }
  let music = null, mname = ''; const au = new Audio(), ml = h('small', '', 'no music'), cap = h('input', 'in'); cap.placeholder = 'caption (optional)'; cap.maxLength = 100;
  const mb = h('button', 'btn ghost', ic('music'), ' add music'); mb.onclick = async () => { const f = await pickFile('audio/*'); if (!f) return; music = f; mname = f.name.replace(/\.[^.]+$/, ''); ml.textContent = '♪ ' + mname; au.src = URL.createObjectURL(f); au.currentTime = 0; au.play().catch(() => {}); };
  const post = h('button', 'btn', 'post status'), cancel = h('button', 'btn ghost', 'cancel');
  const close = () => { au.pause(); ed.hidden = true; ed.textContent = ''; URL.revokeObjectURL(url); };
  cancel.onclick = close;
  post.onclick = async () => {
    post.disabled = true; toast('Uploading...');
    try {
      const mid = (await up(blob, mime)).id; let aid = null;
      if (music) aid = (await up(music, music.type || 'audio/mpeg')).id;
      const r = await call('status', { media: mid, music: aid, musicName: mname, caption: cap.value });
      if (!r.ok) throw new Error(r.d.e || 'Failed');
      close(); toast('Status posted'); loadStories(); loadDir();
    } catch (e) { toast(e.message, true); post.disabled = false; }
  };
  ed.append(h('div', 'brand', 'NEW STATUS'), pv, isVid ? h('small', '', 'video statuses can add music; cropping is for photos') : null, h('div', 'edbtns', mb), ml, cap, h('div', 'edbtns', cancel, post));
}

/* ---------- reels ---------- */
const FILTERS = { none: 'none', noir: 'grayscale(1) contrast(1.2)', matrix: 'sepia(1) hue-rotate(80deg) saturate(3) contrast(1.1)', glitch: 'contrast(1.4) saturate(1.8) hue-rotate(-20deg)', warm: 'sepia(.35) saturate(1.4) brightness(1.05)', cold: 'hue-rotate(160deg) saturate(1.2) brightness(.95)' };
let reelObs = null;
async function loadReels() { const r = await call(reelTab === 'saved' ? 'saved' : 'reels'); if (Array.isArray(r.d)) { reels = r.d; renderReels(); } }
$('rt-all').onclick = () => { reelTab = 'all'; $('rt-all').classList.add('on'); $('rt-saved').classList.remove('on'); loadReels(); };
$('rt-saved').onclick = () => { reelTab = 'saved'; $('rt-saved').classList.add('on'); $('rt-all').classList.remove('on'); loadReels(); };
function renderReels() {
  const F = $('reelfeed'); if (reelObs) reelObs.disconnect(); F.textContent = '';
  if (!reels.length) { F.append(h('div', 'rempty', reelTab === 'saved' ? 'Nothing saved yet. Tap the bookmark on a reel.' : 'No reels yet. Tap + to post the first one.')); return; }
  reelObs = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target.querySelector('video');
    if (e.isIntersecting && e.intersectionRatio > .7) v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); else v.pause();
  }), { root: F, threshold: [0, .7, 1] });
  reels.forEach((r) => { const el = reelEl(r); F.append(el); reelObs.observe(el); });
}
function reelEl(r) {
  const v = h('video', 'rv'); v.src = mediaUrl(r.media); v.loop = true; v.playsInline = true; v.preload = 'metadata';
  const el = h('div', 'reel', v);
  const heart = h('button', 'like', ic('heart', 26)), hc = h('div', 'cnt'), cm = h('button', '', ic('comment', 24)), cc = h('div', 'cnt'), sv2 = h('button', '', ic('bookmark', 24));
  const upd = () => { heart.classList.toggle('on', r.liked); heart.classList.toggle('like', true); hc.textContent = r.likes; cc.textContent = r.comments; sv2.classList.toggle('on', r.saved); };
  const doLike = async () => { const x = await call('reel/like', { id: r.id }); if (x.ok) { r.liked = x.d.liked; r.likes = x.d.likes; upd(); } };
  heart.onclick = doLike; cm.onclick = () => openComments(r, upd);
  sv2.onclick = async () => { const x = await call('reel/save', { id: r.id }); if (x.ok) { r.saved = x.d.saved; upd(); toast(r.saved ? 'Saved' : 'Removed from saved'); } };
  const acts = h('div', 'racts', heart, hc, cm, cc, sv2);
  if (r.u === me) { const d = h('button', '', ic('trash', 22)); d.onclick = async () => { if (confirm('Delete this reel?')) { await call('reel/delete', { id: r.id }); loadReels(); } }; acts.append(d); }
  const who3 = h('div', 'who3', avEl({ ...who(r.u), avatar: r.avatar || who(r.u).avatar }), '@' + r.u); who3.onclick = () => openProfile(r.u);
  el.append(acts, h('div', 'rinfo', who3, r.caption ? h('div', '', r.caption) : null, r.music ? h('small', '', '♪ ' + r.music) : null));
  let lt = 0, tt = null;
  v.onclick = () => {
    const n = Date.now();
    if (n - lt < 300) { clearTimeout(tt); doLike(); const b = h('div', 'burst', ic('heart', 90)); el.append(b); setTimeout(() => b.remove(), 800); lt = 0; return; }
    lt = n; tt = setTimeout(() => (v.paused ? v.play() : v.pause()), 300);
  };
  upd(); return el;
}
async function openComments(r, onChange) {
  const list = h('div', ''), inp = h('input', 'in'), sb = h('button', 'btn', 'send'); inp.placeholder = 'add a comment'; inp.maxLength = 200; let arr = [];
  const draw = () => { list.textContent = ''; if (!arr.length) list.append(h('p', 'sub', 'no comments yet')); arr.forEach((c) => list.append(h('div', 'cm', avEl(c), h('div', '', h('b', '', c.name), ' ', h('small', '', ago(c.ts)), h('div', '', c.text))))); };
  openSheet('Comments', list, h('div', 'crow', inp, sb)); draw();
  const g = await call('reel/comments?id=' + encodeURIComponent(r.id)); arr = Array.isArray(g.d) ? g.d : []; draw();
  sb.onclick = async () => { const t = inp.value.trim(); if (!t) return; inp.value = ''; const p = await call('reel/comment', { id: r.id, text: t }); if (p.ok) { arr.push(p.d.c); r.comments = arr.length; draw(); onChange(); } };
}
$('reelnew').onclick = reelEditor;
const seekTo = (el, t) => new Promise((ok) => { if (Math.abs(el.currentTime - t) < .02) return ok(); el.onseeked = () => ok(); el.currentTime = t; });
async function reelEditor() {
  const f = await pickFile('video/*'); if (!f) return;
  const url = URL.createObjectURL(f), ed = $('editor'); ed.textContent = ''; ed.hidden = false;
  const v = h('video'); v.src = url; v.playsInline = true; v.preload = 'auto';
  await new Promise((r) => { v.onloadedmetadata = r; v.onerror = r; });
  if (!isFinite(v.duration) || !v.videoWidth) { toast('Cannot read that video', true); ed.hidden = true; return; }
  const dur = Math.min(v.duration, 60), st = { start: 0, end: dur, speed: 1, filter: 'none', text: '', music: null, mname: '', vol: 1, mvol: .8 };
  const stage = h('div', 'stage', v, h('div', 'ov')), ov = stage.lastChild;
  const rng = (min, max, val, step, fn) => { const i = h('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; i.oninput = () => fn(+i.value); return i; };
  const lab = (t) => h('small', '', t);
  const sl1 = lab('trim start: 0.0s'), sl2 = lab('trim end: ' + dur.toFixed(1) + 's');
  const rs = rng(0, dur, 0, .1, (x) => { st.start = Math.min(x, st.end - .5); sl1.textContent = 'trim start: ' + st.start.toFixed(1) + 's'; v.currentTime = st.start; });
  const re = rng(.5, dur, dur, .1, (x) => { st.end = Math.max(x, st.start + .5); sl2.textContent = 'trim end: ' + st.end.toFixed(1) + 's'; });
  const chipRow = (obj, key, opts, fn) => { const row = h('div', 'chips'); Object.entries(opts).forEach(([k, label]) => { const b = h('button', 'chip' + (obj[key] == k ? ' on' : ''), label); b.type = 'button'; b.onclick = () => { obj[key] = isNaN(+k) ? k : +k; [...row.children].forEach((x) => x.classList.toggle('on', x === b)); fn && fn(); }; row.append(b); }); return row; };
  const fr = chipRow(st, 'filter', { none: 'normal', noir: 'noir', matrix: 'matrix', glitch: 'glitch', warm: 'warm', cold: 'cold' }, () => (v.style.filter = FILTERS[st.filter]));
  const sp = chipRow(st, 'speed', { .5: '0.5x', 1: '1x', 1.5: '1.5x', 2: '2x' }, () => (v.playbackRate = st.speed));
  const txt = h('input', 'in'); txt.placeholder = 'text on video (optional)'; txt.maxLength = 40; txt.oninput = () => { st.text = txt.value; ov.textContent = txt.value; };
  const cap = h('input', 'in'); cap.placeholder = 'caption'; cap.maxLength = 200;
  const ml = lab('no music'), mb = h('button', 'btn ghost', ic('music'), ' add music'); mb.onclick = async () => { const m = await pickFile('audio/*'); if (m) { st.music = m; st.mname = m.name.replace(/\.[^.]+$/, ''); ml.textContent = '♪ ' + st.mname; } };
  const vv = rng(0, 1, 1, .05, (x) => { st.vol = x; v.volume = x; }), mv = rng(0, 1, .8, .05, (x) => (st.mvol = x));
  const prev = h('button', 'btn ghost', 'preview'); prev.onclick = () => { v.currentTime = st.start; v.playbackRate = st.speed; v.volume = st.vol; v.play(); const chk = () => { if (v.paused) return; if (v.currentTime >= st.end) v.pause(); else requestAnimationFrame(chk); }; chk(); };
  const exp = h('button', 'btn', 'export + post'), cancel = h('button', 'btn ghost', 'cancel'), prog = lab('');
  const close = () => { v.pause(); ed.hidden = true; ed.textContent = ''; URL.revokeObjectURL(url); };
  cancel.onclick = close;
  exp.onclick = async () => {
    if (!window.MediaRecorder) return toast('This browser cannot export video. Use Chrome.', true);
    exp.disabled = true; prev.disabled = true; v.pause();
    try {
      const out = await exportReel(f, url, st, (p) => (prog.textContent = 'rendering ' + Math.round(p * 100) + '% (plays in real time, keep this screen open)'));
      prog.textContent = 'uploading...'; const mid = (await up(out.blob, out.mime)).id;
      const r = await call('reel', { media: mid, caption: cap.value, music: st.mname }); if (!r.ok) throw new Error(r.d.e || 'Failed');
      close(); toast('Reel posted'); reelTab = 'all'; setView('reels'); loadReels();
    } catch (e) { toast(e.message || 'Export failed', true); exp.disabled = false; prev.disabled = false; prog.textContent = ''; }
  };
  ed.append(h('div', 'brand', 'REEL EDITOR'), stage, h('div', 'ed-row', sl1, rs, sl2, re), lab('filter'), fr, lab('speed'), sp, txt, h('div', 'edbtns', mb), ml,
    h('div', 'ed-row', lab('original sound volume'), vv, lab('music volume'), mv), cap, prog, h('div', 'edbtns', cancel, prev, exp));
}
async function exportReel(file, url, st, onp) {
  const v = h('video'); v.src = url; v.playsInline = true; v.preload = 'auto';
  await new Promise((r) => (v.onloadedmetadata = r));
  const W = 540, H = 960, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  await seekTo(v, st.start); v.playbackRate = st.speed;
  const ac = new (window.AudioContext || window.webkitAudioContext)(); await ac.resume();
  const dest = ac.createMediaStreamDestination(), vg = ac.createGain(); vg.gain.value = st.vol; ac.createMediaElementSource(v).connect(vg); vg.connect(dest);
  let ma = null;
  if (st.music) { ma = new Audio(URL.createObjectURL(st.music)); const mg = ac.createGain(); mg.gain.value = st.mvol; ac.createMediaElementSource(ma).connect(mg); mg.connect(dest); }
  const stream = new MediaStream([...cv.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mt = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
  if (!mt) throw new Error('No supported video format in this browser');
  const draw = () => {
    const vw = v.videoWidth, vh = v.videoHeight, sc = Math.max(W / vw, H / vh), dw = vw * sc, dh = vh * sc;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.filter = FILTERS[st.filter] || 'none'; c.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh); c.filter = 'none';
    if (st.text) { let fs = 46; c.textAlign = 'center'; c.font = 'bold ' + fs + 'px monospace'; while (c.measureText(st.text).width > W * .9 && fs > 16) { fs -= 2; c.font = 'bold ' + fs + 'px monospace'; } c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText(st.text, W / 2, H * .8); c.fillStyle = '#00ff9c'; c.fillText(st.text, W / 2, H * .8); }
  };
  return new Promise((res, rej) => {
    const rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 2.2e6 }), chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => { ac.close(); res({ blob: new Blob(chunks, { type: mt.split(';')[0] }), mime: mt.split(';')[0] }); };
    rec.start(500);
    v.play().catch(rej); if (ma) ma.play().catch(() => {});
    const tick = () => {
      draw(); onp(Math.min(1, (v.currentTime - st.start) / Math.max(.1, st.end - st.start)));
      if (v.currentTime >= st.end - .05 || v.ended) { v.pause(); if (ma) ma.pause(); rec.stop(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- community chat ---------- */
function pubRow(x) {
  const u = who(x.from), mine = x.from === me, b = h('div', 'b');
  if (!mine) b.append(h('div', 'who2', u.name || x.from));
  if (x.text) b.append(x.text);
  if (x.media) {
    const url = mediaUrl(x.media); let el;
    if (x.mime.startsWith('image/')) { el = new Image(); el.src = url; }
    else if (x.mime.startsWith('video/')) { el = h('video'); el.src = url; el.controls = true; el.playsInline = true; el.preload = 'metadata'; }
    else { el = h('audio'); el.src = url; el.controls = true; el.preload = 'metadata'; }
    b.append(el);
  }
  b.append(h('span', 't', hm(x.ts)));
  const r = h('div', 'row' + (mine ? ' me' : ''), mine ? null : avEl(u), b); r.dataset.id = x.id;
  if (!mine) r.firstChild.onclick = () => openProfile(x.from);
  return r;
}
function renderPub() { const B = $('cmsgs'); B.textContent = ''; pubMsgs.forEach((x) => B.append(pubRow(x))); B.scrollTop = B.scrollHeight; }
$('cform').onsubmit = (e) => { e.preventDefault(); const text = $('cmsg').value; if (!text.trim()) return; $('cmsg').value = ''; wsend({ t: 'pub', text }); };
$('cattach').onclick = async () => {
  const f = await pickFile('image/*,video/*,audio/*'); if (!f) return;
  try { toast('Uploading...'); const id = (await up(f, f.type || 'application/octet-stream')).id; wsend({ t: 'pub', text: '', media: id, fname: f.name }); } catch (e) { toast(e.message, true); }
};
$('cvoice').onclick = () => (callS ? ($('callui').hidden = false) : startCall('pub', false));
$('cvideo').onclick = () => (callS ? ($('callui').hidden = false) : startCall('pub', true));

/* ---------- calls (WebRTC, signaling over the websocket) ---------- */
const RTC = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
async function startCall(room, video) {
  if (callS) return toast('You are already in a call', true);
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return toast('Calls need https or http://localhost', true);
  let local;
  try { local = await navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { facingMode: 'user' } : false }); }
  catch (e) { return toast('Microphone or camera permission denied', true); }
  callS = { room, local, peers: new Map(), tiles: new Map(), cam: local.getVideoTracks()[0] || null, screen: null };
  buildCallUI(); addTile(me, local, true); wsend({ t: 'rjoin', room });
}
function buildCallUI() {
  const C = $('callui'); C.textContent = ''; C.hidden = false; $('callpill').hidden = true;
  callS.grid = h('div', 'cgrid');
  const mk = (ico, fn, cls) => { const b = h('button', 'cb ' + (cls || ''), ic(ico, 24)); b.onclick = fn; return b; };
  callS.micb = mk('mic', toggleMic); callS.camb = mk('videocam', toggleCam); const scr = mk('screen', shareScreen), mini = mk('back', () => { C.hidden = true; $('callpill').hidden = false; }), end = mk('callend', endCall, 'end');
  C.append(h('div', 'ctitle', callS.room === 'pub' ? 'COMMUNITY CALL' : 'SECURE CALL'), callS.grid, h('div', 'cbar', mini, callS.micb, callS.camb, scr, end));
  if (!callS.cam) callS.camb.classList.add('off');
}
$('callpill').onclick = () => { $('callui').hidden = false; $('callpill').hidden = true; };
function addTile(u, stream, local) {
  let t = callS.tiles.get(u);
  if (!t) { const v = h('video'); v.autoplay = true; v.playsInline = true; v.muted = !!local; const box = h('div', 'tile', v, h('div', 'tlab', local ? 'you' : who(u).name || u)); callS.grid.append(box); t = { box, v }; callS.tiles.set(u, t); }
  if (t.v.srcObject !== stream) t.v.srcObject = stream;
  t.v.play().catch(() => {});
}
function makePeer(u) {
  const pc = new RTCPeerConnection(RTC), P = { pc, polite: me > u, making: false, ignore: false, vs: null };
  callS.peers.set(u, P);
  callS.local.getTracks().forEach((t) => { const s = pc.addTrack(t, callS.local); if (t.kind === 'video') P.vs = s; });
  pc.onicecandidate = (e) => e.candidate && callS && wsend({ t: 'rtc', room: callS.room, to: u, data: { ice: e.candidate } });
  pc.ontrack = (e) => addTile(u, e.streams[0]);
  pc.onnegotiationneeded = async () => {
    try { P.making = true; await pc.setLocalDescription(); wsend({ t: 'rtc', room: callS.room, to: u, data: { sdp: pc.localDescription } }); } catch (e) {} finally { P.making = false; }
  };
  pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') dropPeer(u); };
  return P;
}
function dropPeer(u) {
  if (!callS) return; const P = callS.peers.get(u); if (P) { P.pc.close(); callS.peers.delete(u); }
  const t = callS.tiles.get(u); if (t) { t.box.remove(); callS.tiles.delete(u); }
}
async function onRtc(m) {
  if (!callS || callS.room !== m.room) return;
  const P = callS.peers.get(m.from) || makePeer(m.from), pc = P.pc, d = m.data;
  try {
    if (d.sdp) {
      const collision = d.sdp.type === 'offer' && (P.making || pc.signalingState !== 'stable');
      P.ignore = !P.polite && collision; if (P.ignore) return;
      await pc.setRemoteDescription(d.sdp);
      if (d.sdp.type === 'offer') { await pc.setLocalDescription(); wsend({ t: 'rtc', room: callS.room, to: m.from, data: { sdp: pc.localDescription } }); }
    } else if (d.ice) { try { await pc.addIceCandidate(d.ice); } catch (e) { if (!P.ignore) throw e; } }
  } catch (e) { console.warn(e); }
}
function toggleMic() { const t = callS.local.getAudioTracks()[0]; if (!t) return; t.enabled = !t.enabled; callS.micb.classList.toggle('off', !t.enabled); }
function setVideoTrack(t) {
  const L = callS.local; L.getVideoTracks().forEach((o) => L.removeTrack(o)); if (t) L.addTrack(t);
  callS.peers.forEach((P) => { if (P.vs) P.vs.replaceTrack(t || null); else if (t) P.vs = P.pc.addTrack(t, L); });
  addTile(me, L, true);
}
async function toggleCam() {
  if (callS.screen) return toast('Stop screen sharing first', true);
  if (callS.cam) { callS.cam.enabled = !callS.cam.enabled; callS.camb.classList.toggle('off', !callS.cam.enabled); return; }
  try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); callS.cam = s.getVideoTracks()[0]; setVideoTrack(callS.cam); callS.camb.classList.remove('off'); } catch (e) { toast('Camera permission denied', true); }
}
async function shareScreen() {
  if (!callS) return;
  if (callS.screen) return stopShare();
  if (!navigator.mediaDevices.getDisplayMedia) return toast('This browser cannot share its screen (try desktop Chrome or Firefox)', true);
  let ds; try { ds = await navigator.mediaDevices.getDisplayMedia({ video: true }); } catch (e) { return; }
  const t = ds.getVideoTracks()[0]; callS.screen = t; t.onended = stopShare; setVideoTrack(t); toast('Sharing your screen');
}
function stopShare() { if (!callS || !callS.screen) return; callS.screen.stop(); callS.screen = null; setVideoTrack(callS.cam && callS.cam.readyState === 'live' ? callS.cam : null); }
function endCall() {
  if (!callS) return;
  wsend({ t: 'rleave' }); callS.peers.forEach((P) => P.pc.close());
  callS.local.getTracks().forEach((t) => t.stop()); if (callS.screen) callS.screen.stop();
  callS = null; $('callui').hidden = true; $('callui').textContent = ''; $('callpill').hidden = true;
}
function dmCall(video) {
  if (!cur) return; if (callS) return toast('You are already in a call', true);
  wsend({ t: 'ring', to: cur, video }); startCall('dm:' + [me, cur].sort().join(':'), video);
}
$('dvoice').onclick = () => dmCall(false); $('dvideo').onclick = () => dmCall(true);
function showRing(m) {
  clearTimeout(ringS); const R = $('ring'); R.textContent = ''; R.hidden = false;
  const a = h('button', 'btn', 'accept'), d = h('button', 'btn red', 'decline');
  const close = () => { R.hidden = true; clearTimeout(ringS); };
  a.onclick = () => { close(); startCall(m.room, m.video); }; d.onclick = () => { close(); wsend({ t: 'rdecline', to: m.from }); };
  R.append(h('div', 'grow', h('b', 'brand', m.name), h('div', 'sub', 'incoming ' + (m.video ? 'video' : 'voice') + ' call')), a, d);
  ringS = setTimeout(close, 30000);
}

/* ---------- chats (encrypted DMs) ---------- */
async function ingest(x) {
  const o = x.from === me ? x.to : x.from, pub = x.from === me ? x.rpub : x.spub;
  let env;
  try { env = await jdec(await aesKey(o, pub), x); } catch (e) { env = { text: 'Message could not be decrypted (new device or reset keys).' }; }
  (msgs[o] = msgs[o] || []).push({ id: x.id, from: x.from, ts: x.ts, env });
  return o;
}
const markRead = (o) => { const l = msgs[o]; if (l && l.length) { read[o] = l[l.length - 1].ts; ls('gc_read_' + me, JSON.stringify(read)); } };
const preview = (l) => { const e = l[l.length - 1].env; return (l[l.length - 1].from === me ? 'You: ' : '') + (e.text || (e.blob ? e.name : '')); };
function list() {
  const L = $('list'); L.textContent = '';
  const ids = Object.keys(msgs); const lastTs = (u) => (msgs[u] ? msgs[u][msgs[u].length - 1].ts : 0);
  if (!ids.length) L.append(h('p', 'sub pad', 'No chats yet. Search a username above or open the People tab. DMs are end-to-end encrypted.'));
  ids.sort((a, b) => lastTs(b) - lastTs(a)).forEach((u) => {
    const p = who(u), l = msgs[u] || [], unread = l.filter((m) => m.from !== me && m.ts > (read[u] || 0)).length;
    const meta = h('div', 'meta', l.length ? hm(lastTs(u)) : '');
    if (unread) meta.append(h('div', 'badge', unread));
    const row = h('div', 'chat', avEl(p), h('div', 'mid', h('div', 'nm', p.name || u), h('div', 'pv', l.length ? preview(l) : '@' + u)), meta);
    row.onclick = () => openChat(u); L.append(row);
  });
}
function addRow(x) {
  const b = h('div', 'b', body(x.env), h('span', 't', hm(x.ts))), r = h('div', 'row' + (x.from === me ? ' me' : ''), b);
  $('msgs').append(r); $('msgs').scrollTop = $('msgs').scrollHeight;
}
function openChat(u) {
  cur = u; $('dm').hidden = false; const p = who(u);
  $('pname').textContent = p.name || u; $('puser').textContent = '@' + u + ' | end-to-end encrypted'; $('pav').replaceChildren(avEl(p));
  $('msgs').textContent = ''; (msgs[u] || []).forEach(addRow); markRead(u); list();
}
$('back').onclick = () => { cur = null; $('dm').hidden = true; list(); };
$('phead').onclick = async () => { const p = (people[cur] || {}).pub; if (p) alert(`Security code for ${cur}:\n${await fingerprint(p)}\n\nCompare it with them in person or by phone.`); };
const lookup = (q) => new Promise((res) => { pend[q] = res; wsend({ t: 'find', q }); });
async function sendEnv(env) {
  const f = await lookup(cur);
  if (f.none || !(await trust(cur, f.pub))) return toast('Cannot send: user not found or key not trusted', true);
  people[cur] = { name: f.name, pub: f.pub };
  wsend({ t: 'msg', to: cur, ...(await jenc(await aesKey(cur, f.pub), env)) });
}
$('chat').onsubmit = (e) => { e.preventDefault(); const text = $('msg').value; if (!text || !cur) return; $('msg').value = ''; sendEnv({ k: 'text', text }); };
$('attach').onclick = () => $('file').click();
$('file').onchange = async () => {
  const f = $('file').files[0]; $('file').value = ''; if (!f || !cur) return;
  try { toast('Encrypting and uploading...'); await sendEnv({ k: 'file', ...(await sealFile(f)) }); } catch (err) { toast(err.message, true); }
};
$('findf').onsubmit = async (e) => {
  e.preventDefault();
  const q = $('findq').value.trim().toLowerCase().replace(/^@/, ''); if (!q) return;
  const f = await lookup(q);
  if (f.none) return toast('No user @' + q + ' found', true);
  people[f.username] = { name: f.name, pub: f.pub }; $('findq').value = ''; openChat(f.username);
};

/* ---------- my account + notices ---------- */
const unseenN = () => notices.filter((n) => !n.seen).length;
function bellUpdate() { const n = unseenN(); $('bellb').hidden = !n; $('bellb').textContent = n; }
function drawNotices(box) {
  box.textContent = ''; if (!notices.length) box.append(h('p', 'sub', 'No notices.'));
  [...notices].reverse().forEach((n) => box.append(h('div', 'nt' + (n.kind === 'otp' ? ' otp' : '') + (n.seen ? '' : ' unseen'), h('div', '', n.text), h('small', '', (n.kind === 'otp' ? 'security | ' : n.kind === 'admin' ? 'admin | ' : '') + new Date(n.ts).toLocaleString()))));
}
async function renderMe() {
  const B = $('meb'); B.textContent = '';
  const g = await call('me'), m = g.d || {}; let newAv;
  const av = avEl({ ...dir[me], ...m }, 'big'); av.title = 'tap to change photo';
  av.onclick = async () => { const f = await pickFile('image/*'); if (!f) return; const b = await cropModal(f, [1], 256); if (!b) return; newAv = await toDataURL(b); const i = new Image(); i.src = newAv; av.replaceChildren(i); };
  const name = h('input', 'in'), bio = h('input', 'in'), contact = h('input', 'in'); name.value = m.name || ''; bio.value = m.bio || ''; contact.value = m.contact || '';
  name.placeholder = 'display name'; bio.placeholder = 'bio (140 chars)'; bio.maxLength = 140; contact.placeholder = 'recovery phone or email';
  const sv3 = h('button', 'btn', 'save profile'); sv3.onclick = async () => { const r = await call('profile', { name: name.value, bio: bio.value, contact: contact.value, ...(newAv ? { avatar: newAv } : {}) }); if (r.ok) { toast('Profile saved'); newAv = undefined; loadDir(); } else toast(r.d.e || 'Failed', true); };
  const op = h('input', 'in'), np = h('input', 'in'); op.type = np.type = 'password'; op.placeholder = 'current password'; np.placeholder = 'new password (8+)';
  const pb = h('button', 'btn ghost', 'change password'); pb.onclick = async () => { const r = await call('profile', { oldPassword: op.value, newPassword: np.value }); if (r.ok) { toast('Password changed'); op.value = np.value = ''; } else toast(r.d.e || 'Failed', true); };
  const nl = h('div', ''); drawNotices(nl);
  const lo = h('button', 'btn red', ic('logout', 18), ' log out'); lo.onclick = async () => { await api('logout', { token: tok }); logoutLocal(); };
  B.append(av, h('div', 'sub', '@' + me + ' (tap the photo to change it)'), name, bio, contact, sv3, h('h3', '', 'PASSWORD'), op, np, pb, h('h3', '', 'NOTICES'), nl, lo);
  if (unseenN()) { call('notices/read', {}); setTimeout(() => { notices.forEach((n) => (n.seen = true)); bellUpdate(); }, 1500); }
}

/* ---------- connection ---------- */
function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.onopen = () => wsend({ t: 'join', token: tok, pub: myPub });
  ws.onclose = () => { if (tok) setTimeout(connect, 3000); };
  ws.onmessage = async (e) => {
    const m = JSON.parse(e.data);
    if (m.t === 'ok') { const first = $('app').hidden; show('app'); if (first) setView('chats'); loadDir(); loadStories(); }
    else if (m.t === 'bad') { tok = ''; startGame(); }
    else if (m.t === 'hist') {
      people = m.people; msgs = {}; read = JSON.parse(ls('gc_read_' + me) || '{}'); pubMsgs = m.pub || []; notices = m.notices || [];
      for (const x of m.msgs) await ingest(x);
      list(); bellUpdate(); if (view === 'comm') renderPub(); if (cur) openChat(cur);
    }
    else if (m.t === 'found') { if (pend[m.q]) { pend[m.q](m); delete pend[m.q]; } }
    else if (m.t === 'msg' || m.t === 'sent') {
      const x = m.m; if (m.fn) people[x.from] = { name: m.fn, pub: x.spub };
      const o = await ingest(x);
      if (o === cur) { addRow(msgs[o][msgs[o].length - 1]); markRead(o); }
      list();
    }
    else if (m.t === 'pub') { pubMsgs.push(m.m); if (view === 'comm') { $('cmsgs').append(pubRow(m.m)); $('cmsgs').scrollTop = $('cmsgs').scrollHeight; } }
    else if (m.t === 'pubdel') { pubMsgs = pubMsgs.filter((x) => x.id !== m.id); if (view === 'comm') renderPub(); }
    else if (m.t === 'notice') { notices.push(m.n); bellUpdate(); toast(m.n.text); if (view === 'me') renderMe(); }
    else if (m.t === 'presence') { if (dir[m.u]) { dir[m.u].online = m.online; renderPeople(); } }
    else if (m.t === 'dirchg') { loadDir(); loadStories(); }
    else if (m.t === 'roomstate') { $('ccount').textContent = m.users.length ? m.users.length + ' in the call now' : 'open to everyone'; }
    else if (m.t === 'ring') { if (callS) wsend({ t: 'rdecline', to: m.from }); else showRing(m); }
    else if (m.t === 'declined') { toast('Call declined', true); endCall(); }
    else if (m.t === 'rpeers') { if (callS && callS.room === m.room) m.peers.forEach((u) => makePeer(u)); }
    else if (m.t === 'rnew') { if (callS && callS.room === m.room && !callS.peers.has(m.u)) makePeer(m.u); }
    else if (m.t === 'rleft') { if (callS && callS.room === m.room) { dropPeer(m.u); if (m.room !== 'pub') { toast('Call ended'); endCall(); } } }
    else if (m.t === 'rtc') onRtc(m);
    else if (m.t === 'err') { toast(m.e, true); if (callS && /offline|cannot join|full/i.test(m.e)) endCall(); }
  };
}

/* ---------- start ---------- */
(async () => {
  if (!crypto.subtle) toast('Encryption needs https or http://localhost', true);
  if (tok && me) {
    setIcon(); await boot('NULLBYTE', ['booting secure shell', 'loading keys', 'syncing the network', 'access granted'], 1500);
    kp = await loadIdentity(me); myPub = kp.pub; connect();
  } else {
    await boot('OPERATION: BLACKOUT', ['loading mission assets', 'calibrating optics', 'securing the perimeter', 'deploying'], 1700);
    startGame();
  }
})();
