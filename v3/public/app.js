const $ = (id) => document.getElementById(id);
const ECDH = { name: 'ECDH', namedCurve: 'P-256' };
const enc = new TextEncoder(), dec = new TextDecoder();
const MAXMB = 20;
const b64 = (b) => { let s = ''; new Uint8Array(b).forEach((c) => (s += String.fromCharCode(c))); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hm = (t) => new Date(t).toTimeString().slice(0, 5);
const ls = (k, v) => (v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v));

let ws, me = ls('gc_user') || null, tok = ls('gc_tok') || '', kp, myPub, cur = null, gid = null, pass = null;
let people = {}, msgs = {}, read = {};
const keys = {}, pend = {};

function show(id) { ['game', 'auth', 'app'].forEach((x) => ($(x).hidden = x !== id)); }
function toast(t, err) {
  const el = $('toast'); el.textContent = t; el.className = err ? 'err' : ''; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 3500);
}
const hue = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;
function av(el, n) { el.textContent = (n || '?')[0].toUpperCase(); el.style.background = `hsl(${hue(n || '?') % 360} 40% 42%)`; }
const api = async (p, b) => {
  const r = await fetch('/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  return { ok: r.ok, status: r.status, d: await r.json().catch(() => ({})) };
};

/* ---------- game gate ---------- */
async function startGame() {
  show('game'); pass = null;
  const r = await api('game/start', {}); gid = r.d.id;
  runGame($('gcv'), async () => {
    const f = await api('game/finish', { id: gid, coins: 25 });
    if (f.ok) { pass = gid; setTimeout(() => show('auth'), 1200); } else toast('Game check failed, reload and try again', true);
  });
}

/* ---------- accounts ---------- */
const msg = (t, err = 1) => { $('amsg').textContent = t; $('amsg').className = err ? 'err' : ''; };
function showForm(f) { document.querySelectorAll('#auth form').forEach((x) => (x.hidden = x.id !== 'f-' + f)); msg(''); }
document.querySelectorAll('[data-go]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); showForm(a.dataset.go); }));
async function entered(d) {
  tok = d.token; me = d.username; ls('gc_tok', tok); ls('gc_user', me);
  kp = await loadIdentity(me); myPub = kp.pub; connect();
}
async function authCall(path, body, okFn) {
  const r = await api(path, { ...body, pass });
  if (r.status === 403 && /game/i.test(r.d.e || '')) { toast('Play the game again to continue', true); return startGame(); }
  if (!r.ok) return msg(r.d.e || 'Something went wrong');
  okFn(r.d);
}
$('f-login').onsubmit = (e) => { e.preventDefault(); authCall('login', { username: $('lu').value.trim(), password: $('lp').value }, entered); };
$('f-reg').onsubmit = (e) => { e.preventDefault(); authCall('register', { name: $('rn').value, username: $('ru').value.trim(), contact: $('rc').value, password: $('rp').value }, entered); };
$('f-forgot').onsubmit = (e) => { e.preventDefault(); authCall('forgot', { username: $('fu').value.trim() }, () => { msg('Request sent. The admin will send you a code.', 0); showForm('reset'); $('xu').value = $('fu').value; }); };
$('f-reset').onsubmit = async (e) => {
  e.preventDefault();
  const r = await api('reset', { username: $('xu').value.trim(), otp: $('xo').value.trim(), password: $('xp').value });
  if (!r.ok) return msg(r.d.e || 'Invalid or expired code');
  showForm('login'); msg('Password changed. Log in with your new password.', 0);
};
function logoutLocal() { ls('gc_tok', ''); ls('gc_user', ''); tok = ''; me = null; location.reload(); }
$('logout').onclick = async () => { await api('logout', { token: tok }); logoutLocal(); };

/* ---------- crypto (keys never leave this device) ---------- */
async function loadIdentity(u) {
  const s = ls('gc_id_' + u);
  if (s) { const o = JSON.parse(s); return { privateKey: await crypto.subtle.importKey('jwk', o.priv, ECDH, false, ['deriveKey']), pub: o.pub }; }
  const k = await crypto.subtle.generateKey(ECDH, true, ['deriveKey']);
  const priv = await crypto.subtle.exportKey('jwk', k.privateKey), pub = await crypto.subtle.exportKey('jwk', k.publicKey);
  ls('gc_id_' + u, JSON.stringify({ priv, pub })); return { privateKey: k.privateKey, pub };
}
async function fingerprint(pub) {
  const h = await crypto.subtle.digest('SHA-256', enc.encode(pub.x + pub.y));
  return [...new Uint8Array(h).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join(' ');
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
const auth = () => ({ Authorization: 'Bearer ' + tok });
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

/* ---------- chats ---------- */
async function ingest(x) {
  const o = x.from === me ? x.to : x.from, pub = x.from === me ? x.rpub : x.spub;
  let env;
  try { env = await jdec(await aesKey(o, pub), x); } catch { env = { text: 'Message could not be decrypted (new device or reset keys).' }; }
  (msgs[o] = msgs[o] || []).push({ id: x.id, from: x.from, ts: x.ts, env });
  return o;
}
const markRead = (o) => { const l = msgs[o]; if (l && l.length) { read[o] = l[l.length - 1].ts; ls('gc_read_' + me, JSON.stringify(read)); } };
const preview = (l) => { const e = l[l.length - 1].env; return (l[l.length - 1].from === me ? 'You: ' : '') + (e.text || (e.blob ? e.name : '')); };
function list() {
  const L = $('list'); L.textContent = '';
  const ids = [...new Set([...Object.keys(people), ...Object.keys(msgs)])];
  const lastTs = (u) => (msgs[u] ? msgs[u][msgs[u].length - 1].ts : 0);
  ids.sort((a, b) => lastTs(b) - lastTs(a)).forEach((u) => {
    const n = (people[u] || {}).name || u, l = msgs[u] || [];
    const unread = l.filter((m) => m.from !== me && m.ts > (read[u] || 0)).length;
    const row = document.createElement('div'); row.className = 'chat' + (u === cur ? ' on' : '');
    const a = document.createElement('div'); a.className = 'av'; av(a, n);
    const mid = document.createElement('div'); mid.className = 'mid';
    const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = n;
    const pv = document.createElement('div'); pv.className = 'pv'; pv.textContent = l.length ? preview(l) : '@' + u;
    mid.append(nm, pv);
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = l.length ? hm(lastTs(u)) : '';
    if (unread) { const b = document.createElement('div'); b.className = 'badge'; b.textContent = unread; meta.append(b); }
    row.append(a, mid, meta); row.onclick = () => openChat(u); L.append(row);
  });
}
function addRow(x) {
  const r = document.createElement('div'); r.className = 'row' + (x.from === me ? ' me' : '');
  const b = document.createElement('div'); b.className = 'b'; b.append(body(x.env));
  const t = document.createElement('span'); t.className = 't'; t.textContent = hm(x.ts); b.append(t); r.append(b);
  $('msgs').append(r); $('msgs').scrollTop = $('msgs').scrollHeight;
}
function openChat(u) {
  cur = u; $('app').classList.add('open'); $('empty').hidden = true; $('pane').hidden = false;
  const n = (people[u] || {}).name || u;
  $('pname').textContent = n; $('puser').textContent = '@' + u + ' | end-to-end encrypted'; av($('pav'), n);
  $('msgs').textContent = ''; (msgs[u] || []).forEach(addRow); markRead(u); list();
}
$('back').onclick = () => { cur = null; $('app').classList.remove('open'); list(); };
$('phead').onclick = async () => { const p = (people[cur] || {}).pub; if (p) alert(`Security code for ${cur}:\n${await fingerprint(p)}\n\nCompare it with them in person or by phone.`); };
const lookup = (q) => new Promise((res) => { pend[q] = res; ws.send(JSON.stringify({ t: 'find', q })); });
async function sendEnv(env) {
  const f = await lookup(cur);
  if (f.none || !(await trust(cur, f.pub))) return toast('Cannot send: user not found or key not trusted', true);
  people[cur] = { name: f.name, pub: f.pub };
  ws.send(JSON.stringify({ t: 'msg', to: cur, ...(await jenc(await aesKey(cur, f.pub), env)) }));
}
$('chat').onsubmit = (e) => {
  e.preventDefault();
  const text = $('msg').value; if (!text || !cur) return;
  $('msg').value = ''; sendEnv({ k: 'text', text });
};
$('attach').onclick = () => $('file').click();
$('file').onchange = async () => {
  const f = $('file').files[0]; $('file').value = '';
  if (!f || !cur) return;
  try { toast('Encrypting and uploading...'); await sendEnv({ k: 'file', ...(await sealFile(f)) }); } catch (err) { toast(err.message, true); }
};
$('findf').onsubmit = async (e) => {
  e.preventDefault();
  const q = $('findq').value.trim().toLowerCase().replace(/^@/, ''); if (!q) return;
  const f = await lookup(q);
  if (f.none) return toast('No user @' + q + ' found', true);
  people[f.username] = { name: f.name, pub: f.pub }; $('findq').value = ''; openChat(f.username);
};

/* ---------- connection ---------- */
function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.onopen = () => ws.send(JSON.stringify({ t: 'join', token: tok, pub: myPub }));
  ws.onclose = () => { if (tok) setTimeout(connect, 3000); };
  ws.onmessage = async (e) => {
    const m = JSON.parse(e.data);
    if (m.t === 'ok') { show('app'); $('mename').textContent = m.user.name; av($('meav'), m.user.name); }
    else if (m.t === 'bad') { tok = ''; startGame(); }
    else if (m.t === 'hist') {
      people = m.people; msgs = {}; read = JSON.parse(ls('gc_read_' + me) || '{}');
      for (const x of m.msgs) await ingest(x);
      list(); if (cur) openChat(cur);
    }
    else if (m.t === 'found') { if (pend[m.q]) { pend[m.q](m); delete pend[m.q]; } }
    else if (m.t === 'msg' || m.t === 'sent') {
      const x = m.m;
      if (m.fn) people[x.from] = { name: m.fn, pub: x.spub };
      const o = await ingest(x);
      if (o === cur) { addRow(msgs[o][msgs[o].length - 1]); markRead(o); }
      list();
    }
    else if (m.t === 'err') toast(m.e, true);
  };
}

/* ---------- start ---------- */
(async () => {
  if (!crypto.subtle) toast('Encryption needs https or http://localhost', true);
  if (tok && me) { kp = await loadIdentity(me); myPub = kp.pub; connect(); } else startGame();
})();
