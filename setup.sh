#!/data/data/com.termux/files/usr/bin/bash
# GENE//CHAT step 1: relay server + E2EE 1:1 chat client
set -e
mkdir -p ~/gene-chat/public && cd ~/gene-chat
[ -f package.json ] || npm init -y >/dev/null
npm install express ws

cat > server.js <<'EOF'
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': "default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' blob: data:; media-src 'self' blob:",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store'
  });
  next();
});
app.use(express.static(__dirname + '/public'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });
const users = new Map(); // name -> { ws, pub }  (memory only, never written to disk)
const send = (ws, o) => ws.readyState === 1 && ws.send(JSON.stringify(o));

wss.on('connection', (ws) => {
  let me = null, count = 0;
  const tick = setInterval(() => (count = 0), 10000);

  ws.on('message', (raw) => {
    if (++count > 40) return; // rate limit
    let m;
    try { m = JSON.parse(raw); } catch { return; }

    if (m.t === 'join') {
      const n = String(m.name || '').toLowerCase();
      if (me || !/^[a-z0-9_]{3,20}$/.test(n) || !m.pub) return send(ws, { t: 'err', e: 'invalid handle (3-20 letters, numbers, _)' });
      if (users.has(n)) return send(ws, { t: 'err', e: 'handle already online' });
      me = n;
      users.set(n, { ws, pub: m.pub });
      return send(ws, { t: 'ok', name: n });
    }
    if (!me) return;

    if (m.t === 'key') {
      const p = users.get(String(m.to).toLowerCase());
      return send(ws, { t: 'key', name: String(m.to).toLowerCase(), pub: p ? p.pub : null });
    }
    if (m.t === 'msg') {
      const p = users.get(String(m.to).toLowerCase());
      if (!p) return send(ws, { t: 'err', e: 'target offline' });
      send(p.ws, { t: 'msg', from: me, pub: users.get(me).pub, iv: String(m.iv), ct: String(m.ct) });
    }
  });

  ws.on('close', () => {
    clearInterval(tick);
    if (me && users.get(me)?.ws === ws) users.delete(me);
  });
});

server.listen(3000, '0.0.0.0', () => console.log('GENE//CHAT relay up on :3000'));
EOF

cat > public/index.html <<'EOF'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GENE//CHAT</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header>
  <pre id="logo">   ___ ___ _  _ ___   _ _ _ ___ _    ___
  / __| __| \| | __| | | | | _ \ |  |   \
 | (_ | _|| .` | _|  | V V |   / |__| |) |
  \___|___|_|\_|___|  \_/\_/|_|_\____|___/</pre>
  <div id="status">link: offline | cipher: ECDH-P256 + AES-256-GCM</div>
</header>
<main id="log" aria-live="polite"></main>
<form id="login">
  <label for="name">handle@gene:~$</label>
  <input id="name" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="pick a handle" maxlength="20">
  <button>jack in</button>
</form>
<form id="chat" hidden>
  <label for="peer">target</label>
  <input id="peer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="their handle">
  <label for="msg">&gt;</label>
  <input id="msg" autocomplete="off" placeholder="type message, enter to send">
  <button>send</button>
</form>
<script src="app.js"></script>
</body>
</html>
EOF

cat > public/style.css <<'EOF'
:root { --bg:#000; --fg:#00ff41; --dim:#0a8a2a; --warn:#ff3b30; --me:#8affa8; }
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  display: flex; flex-direction: column; height: 100dvh;
  background: var(--bg); color: var(--fg);
  font: 15px/1.5 "Courier New", ui-monospace, monospace;
  text-shadow: 0 0 4px rgba(0,255,65,.45);
  background-image: repeating-linear-gradient(0deg, rgba(0,255,65,.04) 0 1px, transparent 1px 3px);
}
header { padding: 8px 12px; border-bottom: 1px solid var(--dim); }
#logo { margin: 0; font-size: 9px; line-height: 1.1; overflow-x: auto; }
#status { color: var(--dim); font-size: 12px; margin-top: 4px; }
#log { flex: 1; overflow-y: auto; padding: 10px 12px; }
#log div { margin: 2px 0; word-break: break-word; }
#log .sys { color: var(--dim); }
#log .warn { color: var(--warn); text-shadow: 0 0 4px rgba(255,59,48,.5); }
#log .me { color: var(--me); }
form { display: flex; gap: 8px; align-items: center; padding: 8px 12px; border-top: 1px solid var(--dim); }
form[hidden] { display: none; }
label { color: var(--dim); white-space: nowrap; }
input {
  flex: 1; min-width: 0; background: transparent; color: var(--fg);
  border: 0; border-bottom: 1px solid var(--dim); padding: 6px 2px;
  font: inherit; caret-color: var(--fg); border-radius: 0;
}
#peer { flex: 0 0 28%; }
input::placeholder { color: var(--dim); }
input:focus-visible, button:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
button {
  background: transparent; color: var(--fg); border: 1px solid var(--fg);
  padding: 6px 12px; font: inherit; border-radius: 0; cursor: pointer;
}
button:active { background: var(--fg); color: var(--bg); text-shadow: none; }
@media (prefers-reduced-motion: no-preference) {
  #msg:focus { animation: blink 1.1s steps(1) infinite; }
  @keyframes blink { 50% { caret-color: transparent; } }
}
EOF

cat > public/app.js <<'EOF'
const $ = (id) => document.getElementById(id);
const ECDH = { name: 'ECDH', namedCurve: 'P-256' };
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const time = () => new Date().toTimeString().slice(0, 5);

function log(text, cls = '') {
  const d = document.createElement('div');
  d.className = cls;
  d.textContent = text;
  $('log').append(d);
  $('log').scrollTop = $('log').scrollHeight;
}

if (!window.crypto || !crypto.subtle) {
  log('[!!] WebCrypto unavailable. Open this page over HTTPS or http://localhost.', 'warn');
}

let ws, kp, myPub, me;
const aesCache = {}, pending = {};

async function loadIdentity() {
  const saved = localStorage.getItem('gc_id');
  if (saved) {
    const o = JSON.parse(saved);
    const privateKey = await crypto.subtle.importKey('jwk', o.priv, ECDH, false, ['deriveKey']);
    return { privateKey, pub: o.pub };
  }
  const k = await crypto.subtle.generateKey(ECDH, true, ['deriveKey']);
  const priv = await crypto.subtle.exportKey('jwk', k.privateKey);
  const pub = await crypto.subtle.exportKey('jwk', k.publicKey);
  localStorage.setItem('gc_id', JSON.stringify({ priv, pub }));
  return { privateKey: k.privateKey, pub };
}

async function fingerprint(pub) {
  const h = await crypto.subtle.digest('SHA-256', enc.encode(pub.x + pub.y));
  return [...new Uint8Array(h).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

async function trust(name, pub) {
  const f = await fingerprint(pub), k = 'gc_fp_' + name, old = localStorage.getItem(k);
  if (!old) {
    localStorage.setItem(k, f);
    log(`[key] ${name} fingerprint: ${f}  (verify it with them on another channel)`, 'sys');
  } else if (old !== f) {
    log(`[!!] ${name}'s KEY CHANGED (${f}). Possible impersonation. Blocked.`, 'warn');
    return false;
  }
  return true;
}

async function aesKey(name, pub) {
  const id = name + pub.x;
  if (aesCache[id]) return aesCache[id];
  const theirs = await crypto.subtle.importKey('jwk', pub, ECDH, false, []);
  return (aesCache[id] = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirs }, kp.privateKey,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']));
}

const getPeerPub = (name) => new Promise((res) => {
  pending[name] = res;
  ws.send(JSON.stringify({ t: 'key', to: name }));
});

function connect(name) {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.onopen = () => ws.send(JSON.stringify({ t: 'join', name, pub: myPub }));
  ws.onclose = () => { $('status').textContent = 'link: offline | cipher: ECDH-P256 + AES-256-GCM'; log('[sys] link lost', 'sys'); };
  ws.onmessage = async (e) => {
    const m = JSON.parse(e.data);
    if (m.t === 'ok') {
      me = m.name;
      $('login').hidden = true; $('chat').hidden = false;
      $('status').textContent = `link: online as ${me} | cipher: ECDH-P256 + AES-256-GCM`;
      log(`[sys] connected as ${me}. Enter a target handle and start talking.`, 'sys');
      $('peer').focus();
    } else if (m.t === 'err') {
      log('[!!] ' + m.e, 'warn');
    } else if (m.t === 'key') {
      pending[m.name]?.(m.pub); delete pending[m.name];
    } else if (m.t === 'msg') {
      if (!(await trust(m.from, m.pub))) return;
      try {
        const k = await aesKey(m.from, m.pub);
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(m.iv) }, k, unb64(m.ct));
        log(`[${time()}] ${m.from}> ${dec.decode(pt)}`);
      } catch { log(`[!!] undecryptable message from ${m.from}`, 'warn'); }
    }
  };
}

$('login').onsubmit = async (e) => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (!name) return;
  const id = await loadIdentity();
  kp = id; myPub = id.pub;
  connect(name);
};

$('chat').onsubmit = async (e) => {
  e.preventDefault();
  const to = $('peer').value.trim().toLowerCase(), text = $('msg').value;
  if (!to || !text) return;
  const pub = await getPeerPub(to);
  if (!pub) return log(`[!!] ${to} is offline`, 'warn');
  if (!(await trust(to, pub))) return;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(to, pub), enc.encode(text));
  ws.send(JSON.stringify({ t: 'msg', to, iv: b64(iv), ct: b64(ct) }));
  log(`[${time()}] ${me}> ${text}`, 'me');
  $('msg').value = '';
};
EOF

echo
echo "Done. Start it with:  cd ~/gene-chat && node server.js"
echo "Then open http://localhost:3000 in your phone browser."
EOF_MARKER_UNUSED=1
