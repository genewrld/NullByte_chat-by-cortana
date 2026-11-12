const $ = (id) => document.getElementById(id);
const ECDH = { name: 'ECDH', namedCurve: 'P-256' };
const enc = new TextEncoder(), dec = new TextDecoder();
const ICE = []; // add your TURN server here to hide IPs and cross NATs
const MAXMB = 10;
const b64 = (b) => { let s = ''; new Uint8Array(b).forEach((c) => (s += String.fromCharCode(c))); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hm = (t) => new Date(t).toTimeString().slice(0, 5);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let ws, kp, myPub, me, peer = null, cur = '~sys';
let contacts = JSON.parse(localStorage.getItem('gc_contacts') || '[]');
const pubs = {}, keys = {}, pend = {}, threads = {}, seen = new Set(), unread = new Set();

/* ---------- graphics: matrix rain + boot ---------- */
const cv = $('rain'), cx = cv.getContext('2d');
let cols = [];
function fit() { cv.width = innerWidth; cv.height = innerHeight; cols = Array.from({ length: Math.ceil(cv.width / 16) }, () => Math.random() * cv.height / 16); }
fit(); addEventListener('resize', fit);
const glyphs = '01アイウエオカキクケコサシスセソ<>{}/#$%';
if (!reduce) setInterval(() => {
  cx.fillStyle = 'rgba(2,8,5,.12)'; cx.fillRect(0, 0, cv.width, cv.height);
  cx.fillStyle = '#00ff41'; cx.font = '14px monospace';
  cols.forEach((y, i) => { cx.fillText(glyphs[Math.random() * glyphs.length | 0], i * 16, y * 16); cols[i] = y * 16 > cv.height && Math.random() > .975 ? 0 : y + 1; });
}, 60);

(async () => {
  const lines = ['mounting encrypted volume', 'generating P-256 keypair (stays on this device)', 'AES-256-GCM cipher online', 'logging disabled, metadata minimised', 'relay handshake', 'GENE_WRLD secure channel ready'];
  for (let i = 0; i < lines.length; i++) {
    const d = document.createElement('div'); d.textContent = '[ ok ] ' + lines[i]; $('bl').append(d);
    $('bi').style.width = ((i + 1) / lines.length * 100) + '%';
    await wait(reduce ? 50 : 380);
  }
  await wait(reduce ? 50 : 500);
  $('boot').classList.add('off');
  await wait(reduce ? 0 : 600);
  $('boot').hidden = true; $('login').hidden = false; $('name').focus();
})();

/* ---------- helpers ---------- */
function toast(t, warn) {
  const el = $('toast'); el.textContent = t; el.className = warn ? 'warn' : ''; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 3500);
}
function thread(n) {
  if (!threads[n]) { const d = document.createElement('div'); d.hidden = true; $('threads').append(d); threads[n] = d; }
  return threads[n];
}
function say(t, cls = 'sys') {
  const d = document.createElement('div'); d.className = cls; d.textContent = t;
  thread(cur).append(d); $('threads').scrollTop = 1e9;
  if (cls === 'warn') toast(t, true);
}
function saveContacts() { localStorage.setItem('gc_contacts', JSON.stringify(contacts)); }
function addContact(n) {
  n = String(n).toLowerCase().trim();
  if (!/^[a-z0-9_]{3,20}$/.test(n) || n === me || contacts.includes(n)) return;
  contacts.push(n); saveContacts(); chips();
}
function chips() {
  $('chips').textContent = '';
  contacts.forEach((n) => {
    const b = document.createElement('button');
    b.textContent = n; b.className = (n === peer ? 'on ' : '') + (unread.has(n) ? 'new' : '');
    b.onclick = () => pick(n); $('chips').append(b);
  });
}
function pick(n) {
  peer = n; cur = n || '~sys'; unread.delete(n);
  Object.values(threads).forEach((d) => (d.hidden = true));
  thread(cur).hidden = false; $('msg').placeholder = n ? 'message ' + n : 'pick a contact first';
  $('callwho').textContent = 'target: ' + (n || 'pick a contact in chat'); chips();
}
function go(v) {
  document.querySelectorAll('.view').forEach((x) => x.classList.toggle('on', x.id === 'v-' + v));
  document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('on', x.dataset.v === v));
}
document.querySelectorAll('#tabs button').forEach((b) => (b.onclick = () => go(b.dataset.v)));

/* ---------- crypto ---------- */
async function loadIdentity() {
  const s = localStorage.getItem('gc_id');
  if (s) {
    const o = JSON.parse(s);
    return { privateKey: await crypto.subtle.importKey('jwk', o.priv, ECDH, false, ['deriveKey']), pub: o.pub };
  }
  const k = await crypto.subtle.generateKey(ECDH, true, ['deriveKey']);
  const priv = await crypto.subtle.exportKey('jwk', k.privateKey), pub = await crypto.subtle.exportKey('jwk', k.publicKey);
  localStorage.setItem('gc_id', JSON.stringify({ priv, pub }));
  return { privateKey: k.privateKey, pub };
}
async function fingerprint(pub) {
  const h = await crypto.subtle.digest('SHA-256', enc.encode(pub.x + pub.y));
  return [...new Uint8Array(h).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join(' ');
}
async function trust(n, pub) {
  const f = await fingerprint(pub), k = 'gc_fp_' + n, old = localStorage.getItem(k);
  if (!old) { localStorage.setItem(k, f); say(`[key] ${n} fingerprint: ${f} (verify it with them elsewhere)`); }
  else if (old !== f) { say(`[!!] ${n}'s KEY CHANGED (${f}). Blocked.`, 'warn'); return false; }
  return true;
}
async function aesKey(n, pub) {
  const id = n + pub.x;
  if (keys[id]) return keys[id];
  const theirs = await crypto.subtle.importKey('jwk', pub, ECDH, false, []);
  return (keys[id] = await crypto.subtle.deriveKey({ name: 'ECDH', public: theirs }, kp.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']));
}
async function jenc(k, o) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return { iv: b64(iv), ct: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(JSON.stringify(o)))) };
}
async function jdec(k, m) {
  return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(m.iv) }, k, unb64(m.ct))));
}
const getPub = (n) => pubs[n] ? Promise.resolve(pubs[n]) : new Promise((r) => { pend[n] = r; ws.send(JSON.stringify({ t: 'key', to: n })); });
async function seal(n, env) {
  const pub = await getPub(n);
  if (!pub || !(await trust(n, pub))) return null;
  return jenc(await aesKey(n, pub), env);
}

/* ---------- encrypted files (random key per file, blob stored encrypted) ---------- */
async function sealFile(f) {
  if (f.size > MAXMB * 1048576) throw new Error('max file size is ' + MAXMB + ' MB');
  const K = crypto.getRandomValues(new Uint8Array(32)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ck = await crypto.subtle.importKey('raw', K, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, ck, await f.arrayBuffer()));
  const body = new Uint8Array(12 + ct.length); body.set(iv); body.set(ct, 12);
  const r = await fetch('/blob', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body });
  if (!r.ok) throw new Error('upload failed');
  return { blob: (await r.json()).id, key: b64(K), name: f.name, mime: f.type || 'application/octet-stream', size: f.size };
}
async function openFile(e) {
  const r = await fetch('/blob/' + e.blob);
  if (!r.ok) throw 0;
  const ab = new Uint8Array(await r.arrayBuffer());
  const ck = await crypto.subtle.importKey('raw', unb64(e.key), 'AES-GCM', false, ['decrypt']);
  return new Blob([await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ab.slice(0, 12) }, ck, ab.slice(12))], { type: e.mime });
}
function body(env) {
  const w = document.createElement('span');
  if (env.text) w.append(env.text);
  if (env.blob) {
    const m = document.createElement('span'); m.className = 'media'; m.textContent = ' [decrypting ' + env.name + '...]'; w.append(m);
    openFile(env).then((b) => {
      const u = URL.createObjectURL(b); let el;
      if (env.mime.startsWith('image/')) { el = new Image(); el.src = u; }
      else if (env.mime.startsWith('video/')) { el = document.createElement('video'); el.src = u; el.controls = true; el.playsInline = true; }
      else if (env.mime.startsWith('audio/')) { el = document.createElement('audio'); el.src = u; el.controls = true; }
      else { el = document.createElement('a'); el.href = u; el.download = env.name; el.textContent = 'save: ' + env.name + ' (' + Math.round(env.size / 1024) + ' KB)'; }
      m.textContent = ''; m.append(el);
    }).catch(() => (m.textContent = ' [!! media expired or corrupted]'));
  }
  return w;
}

/* ---------- chat ---------- */
function bubble(n, who, env, t = Date.now()) {
  const d = document.createElement('div'); d.className = 'm' + (who === me ? ' me' : '');
  const h = document.createElement('span'); h.className = 'h'; h.textContent = `[${hm(t)}] ${who}> `;
  d.append(h, body(env)); thread(n).append(d); $('threads').scrollTop = 1e9;
}
async function sendTo(n, env) {
  const e = await seal(n, env);
  if (!e) return say(`[!!] cannot reach ${n} (not registered or key mismatch)`, 'warn');
  ws.send(JSON.stringify({ t: 'msg', to: n, ...e }));
  bubble(n, me, env);
}
async function recvMsg(m) {
  pubs[m.from] = m.pub; addContact(m.from);
  if (!(await trust(m.from, m.pub))) return;
  try {
    const env = await jdec(await aesKey(m.from, m.pub), m);
    bubble(m.from, m.from, env, m.ts);
    if (m.from !== peer) { unread.add(m.from); chips(); }
  } catch { say(`[!!] undecryptable message from ${m.from}`, 'warn'); }
}
$('chat').onsubmit = async (e) => {
  e.preventDefault();
  const text = $('msg').value;
  if (!text) return;
  if (!peer) return say('[!!] pick a contact first', 'warn');
  $('msg').value = '';
  sendTo(peer, { k: 'text', text });
};
$('attach').onclick = () => $('file').click();
$('file').onchange = async () => {
  const f = $('file').files[0]; $('file').value = '';
  if (!f) return;
  if (!peer) return say('[!!] pick a contact first', 'warn');
  try { toast('encrypting + uploading...'); await sendTo(peer, { k: 'file', ...(await sealFile(f)) }); }
  catch (err) { say('[!!] ' + err.message, 'warn'); }
};
$('addc').onsubmit = (e) => { e.preventDefault(); addContact($('newc').value); $('newc').value = ''; };

/* ---------- status + reels (encrypted separately for each contact) ---------- */
function addPost(kind, p) {
  const list = kind === 'reel' ? $('reels') : $('statuses');
  const c = document.createElement('div'); c.className = 'card';
  const h = document.createElement('div'); h.className = 'h'; h.textContent = `${p.from} | ${hm(p.ts)} | expires in 24h`;
  c.append(h, body(p.env)); list.prepend(c);
}
async function publish(kind, env) {
  const items = [];
  for (const c of contacts) { const e = await seal(c, env); if (e) items.push({ to: c, kind, ...e }); }
  if (!items.length) return toast('add a registered contact first', true);
  ws.send(JSON.stringify({ t: 'post', items }));
  addPost(kind, { from: me, ts: Date.now(), env });
  toast('posted to ' + items.length + ' contact(s)');
}
async function recvPost(it) {
  if (seen.has(it.iv)) return; seen.add(it.iv);
  pubs[it.from] = it.pub;
  if (!(await trust(it.from, it.pub))) return;
  try { addPost(it.kind, { from: it.from, ts: it.ts, env: await jdec(await aesKey(it.from, it.pub), it) }); } catch {}
}
$('satt').onclick = () => $('sfile').click();
$('sfile').onchange = () => toast($('sfile').files[0] ? 'attached: ' + $('sfile').files[0].name : '');
$('pstatus').onsubmit = async (e) => {
  e.preventDefault();
  const f = $('sfile').files[0], text = $('stext').value.trim();
  if (!f && !text) return;
  try { await publish('status', { k: 'status', text, ...(f ? await sealFile(f) : {}) }); $('stext').value = ''; $('sfile').value = ''; }
  catch (err) { toast(err.message, true); }
};
const duration = (f) => new Promise((r) => {
  const v = document.createElement('video'); v.preload = 'metadata';
  v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); r(v.duration); }; v.onerror = () => r(0); v.src = URL.createObjectURL(f);
});
$('ratt').onclick = () => $('rfile').click();
$('rfile').onchange = () => toast($('rfile').files[0] ? 'picked: ' + $('rfile').files[0].name : '');
$('preel').onsubmit = async (e) => {
  e.preventDefault();
  const f = $('rfile').files[0];
  if (!f) return toast('pick a video first', true);
  if ((await duration(f)) > 60) return toast('reels can be 60 seconds at most', true);
  try { await publish('reel', { k: 'reel', text: $('rcap').value.trim(), ...(await sealFile(f)) }); $('rcap').value = ''; $('rfile').value = ''; }
  catch (err) { toast(err.message, true); }
};

/* ---------- calls + screen share (WebRTC, signalling encrypted end to end) ---------- */
let pc, callPeer, stream, pendOffer, iceQ = [];
async function sig(o) {
  const e = await seal(callPeer, o);
  if (e) ws.send(JSON.stringify({ t: 'sig', to: callPeer, ...e }));
}
function mkpc() {
  pc = new RTCPeerConnection({ iceServers: ICE });
  pc.onicecandidate = (e) => e.candidate && sig({ s: 'ice', c: e.candidate });
  pc.ontrack = (e) => { $('remote').srcObject = e.streams[0]; };
  pc.onconnectionstatechange = () => { if (pc && pc.connectionState === 'failed') hang(false); };
}
async function getMedia(video) {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
  $('local').srcObject = stream; stream.getTracks().forEach((t) => pc.addTrack(t, stream));
}
async function call(video) {
  if (!peer) return say('[!!] pick a contact first', 'warn');
  if (pc) return;
  callPeer = peer; mkpc();
  try { await getMedia(video); } catch { hang(false); return toast('mic/camera blocked', true); }
  const o = await pc.createOffer(); await pc.setLocalDescription(o);
  sig({ s: 'offer', sdp: pc.localDescription, video }); go('call');
}
async function answer(o) {
  await pc.setRemoteDescription(o.sdp);
  for (const c of iceQ) await pc.addIceCandidate(c);
  iceQ = [];
  const a = await pc.createAnswer(); await pc.setLocalDescription(a);
  sig({ s: 'answer', sdp: pc.localDescription });
}
function hang(notify = true) {
  if (notify && callPeer) sig({ s: 'bye' });
  if (stream) stream.getTracks().forEach((t) => t.stop());
  if (pc) pc.close();
  pc = stream = callPeer = pendOffer = null; iceQ = [];
  $('remote').srcObject = null; $('local').srcObject = null; $('incoming').hidden = true;
}
async function onSig(m) {
  pubs[m.from] = m.pub;
  if (!(await trust(m.from, m.pub))) return;
  let o; try { o = await jdec(await aesKey(m.from, m.pub), m); } catch { return; }
  if (o.s === 'offer') {
    if (pc && callPeer === m.from) return answer(o);
    if (pc) return;
    pendOffer = { from: m.from, o };
    $('inwho').textContent = `${m.from} is calling (${o.video ? 'video' : 'audio'})`;
    $('incoming').hidden = false; go('call');
  } else if (o.s === 'answer' && m.from === callPeer && pc) {
    await pc.setRemoteDescription(o.sdp);
  } else if (o.s === 'ice') {
    if (pc && pc.remoteDescription && m.from === callPeer) pc.addIceCandidate(o.c);
    else if (m.from === callPeer || (pendOffer && pendOffer.from === m.from)) iceQ.push(o.c);
  } else if (o.s === 'bye' && m.from === callPeer) hang(false);
}
$('acc').onclick = async () => {
  if (!pendOffer) return;
  const { from, o } = pendOffer; pendOffer = null; $('incoming').hidden = true;
  callPeer = from; mkpc();
  try { await getMedia(o.video); } catch { toast('mic/camera blocked, listening only', true); }
  answer(o);
};
$('dec').onclick = () => { if (pendOffer) { callPeer = pendOffer.from; hang(true); } };
$('ca').onclick = () => call(false);
$('cv').onclick = () => call(true);
$('ch').onclick = () => hang(true);
$('cs').onclick = async () => {
  if (!pc) return toast('start a call first', true);
  try {
    const d = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const t = d.getVideoTracks()[0];
    const s = pc.getSenders().find((x) => x.track && x.track.kind === 'video');
    if (s) { const old = s.track; await s.replaceTrack(t); t.onended = () => s.replaceTrack(old); }
    else { pc.addTrack(t, d); const o = await pc.createOffer(); await pc.setLocalDescription(o); sig({ s: 'offer', sdp: pc.localDescription, video: true }); }
  } catch { toast('screen share cancelled', true); }
};

/* ---------- connection ---------- */
const stat = (t) => ($('status').textContent = t + ' | ECDH-P256 + AES-256-GCM');
function connect(name) {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.onopen = () => ws.send(JSON.stringify({ t: 'join', name, pub: myPub }));
  ws.onclose = () => { stat('offline'); toast('link lost, reload to reconnect', true); };
  ws.onmessage = async (e) => {
    const m = JSON.parse(e.data);
    if (m.t === 'ok') {
      me = m.name; $('login').hidden = true; $('app').hidden = false; stat('online as ' + me);
      say(`[sys] connected as ${me}. Add a contact, tap their name, and start talking.`);
      thread('~sys').hidden = false; chips(); pick(contacts[0] || null);
    } else if (m.t === 'err') say('[!!] ' + m.e, 'warn');
    else if (m.t === 'key') { if (m.pub) pubs[m.name] = m.pub; if (pend[m.name]) { pend[m.name](m.pub); delete pend[m.name]; } }
    else if (m.t === 'msg') recvMsg(m);
    else if (m.t === 'feed') m.items.forEach(recvPost);
    else if (m.t === 'post') recvPost(m.item);
    else if (m.t === 'sig') onSig(m);
  };
}
$('login').onsubmit = async (e) => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (!name) return;
  if (!crypto.subtle) return toast('WebCrypto needs https or http://localhost', true);
  const id = await loadIdentity(); kp = id; myPub = id.pub; connect(name);
};
