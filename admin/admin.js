const $ = (id) => document.getElementById(id);
const h = (t, c, ...k) => { const e = document.createElement(t); if (c) e.className = c; k.flat().forEach((x) => x != null && x !== false && e.append(x)); return e; };
let T = sessionStorage.getItem('at') || '', D = null, tab = 'overview', q = '', booted = false;
const TABS = [['overview', 'Overview'], ['users', 'Users'], ['resets', 'Resets'], ['reels', 'Reels'], ['community', 'Community'], ['notices', 'Notices'], ['log', 'Audit log'], ['settings', 'Settings']];
const toast = (t) => { const e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (e.hidden = true), 2500); };
const call = async (p, b) => {
  const r = await fetch('/a/' + p, { method: b ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-admin': T }, body: b ? JSON.stringify(b) : undefined });
  if (r.status === 401 && T) { T = ''; sessionStorage.removeItem('at'); view(); }
  return r.ok ? r.json().catch(() => ({})) : { _err: r.status };
};
const when = (t) => (t ? new Date(t).toLocaleString() : 'never');
const btn = (txt, cls, fn) => { const b = h('button', 'btn ' + (cls || ''), txt); b.onclick = fn; return b; };
const stat = (k, v) => h('div', 'stat', h('b', '', String(v)), h('small', '', k));
const uptime = (s) => (s > 3600 ? Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm' : Math.floor(s / 60) + 'm');

function view() { $('lg').hidden = !!T; $('pn').hidden = !T; $('out').hidden = !T; if (T) { drawTabs(); load(); } }
function drawTabs() { const n = $('tabs'); n.textContent = ''; TABS.forEach(([k, l]) => { const b = h('button', k === tab ? 'on' : '', l + (k === 'resets' && D && D.stats.pending ? ' (' + D.stats.pending + ')' : '')); b.onclick = () => { tab = k; drawTabs(); render(); }; n.append(b); }); }
async function load() { const d = await call('data'); if (!d.stats) return; D = d; drawTabs(); render(); }
const act = async (p, b, msg) => { const r = await call(p, b); if (r._err) toast('Failed (' + r._err + ')'); else if (msg) toast(msg); load(); return r; };

function render() {
  const M = $('tab'); M.textContent = ''; if (!D) return;
  if (tab === 'overview') {
    const s = D.stats;
    M.append(h('div', 'grid', stat('users', s.users), stat('online now', s.online), stat('disabled', s.disabled), stat('encrypted DMs', s.dms), stat('reels', s.reels), stat('live statuses', s.statuses), stat('community msgs', s.pub), stat('in community call', s.inCall), stat('media files', s.media), stat('media MB', s.mb), stat('pending resets', s.pending), stat('uptime', uptime(s.up))));
    M.append(h('h3', '', 'RECENT ACTIVITY')); D.log.slice(0, 12).forEach((l) => M.append(h('div', 'logline', h('b', '', new Date(l.ts).toLocaleTimeString() + '  '), l.t)));
  }
  if (tab === 'users') {
    const s = h('input', 'in'); s.placeholder = 'search users'; s.value = q; s.oninput = () => { q = s.value; fill(); };
    const box = h('div', ''); box.style.display = 'grid'; box.style.gap = '8px';
    const fill = () => {
      box.textContent = '';
      D.users.filter((u) => !q || (u.name + u.username).toLowerCase().includes(q.toLowerCase())).forEach((u) => {
        const b = h('b', '', u.name + ' (@' + u.username + ') '); b.append(h('span', 'tag' + (u.disabled ? ' off' : ''), u.disabled ? 'disabled' : u.online ? 'online' : 'offline'));
        const left = h('div', '', b, h('small', '', 'contact: ' + (u.contact || 'none') + ' | photo: ' + (u.photo ? 'yes' : 'no') + ' | joined ' + when(u.created) + ' | last seen ' + when(u.last)), u.bio ? h('small', '', 'bio: ' + u.bio) : null);
        const a = h('div', 'acts', btn('OTP', '', () => act('otp', { username: u.username }, 'OTP sent as a notice')),
          btn('notice', 'ghost', async () => { const t = prompt('Message to @' + u.username); if (t) act('notice', { to: u.username, text: t }, 'Notice sent'); }),
          btn('kick', 'ghost', () => act('kick', { username: u.username }, 'Logged out')),
          btn(u.disabled ? 'enable' : 'disable', 'ghost', () => act('toggle', { username: u.username })),
          btn('delete', 'red', () => { if (confirm('Delete @' + u.username + ' and everything they posted?')) act('delete', { username: u.username }); }));
        box.append(h('div', 'row', left, a));
      });
      if (!box.children.length) box.append(h('p', 'note', 'No users match.'));
    };
    fill(); M.append(s, box);
  }
  if (tab === 'resets') {
    if (!D.resets.length) M.append(h('p', 'note', 'No pending requests.'));
    D.resets.forEach((r) => M.append(h('div', 'row', h('div', '', h('b', '', '@' + r.username), h('small', '', 'requested ' + when(r.ts) + (r.otp ? ' | code expires ' + when(r.exp) : ''))),
      h('div', 'acts', r.otp ? h('span', 'otp', r.otp) : null, btn(r.otp ? 'new code' : 'generate OTP', '', () => act('otp', { username: r.username }, 'Code sent to the user as a notice')), btn('dismiss', 'ghost', () => act('dismiss', { username: r.username }))))));
    M.append(h('p', 'note', 'Check it is really the user first. The code appears as a notice on the device that requested the reset and in their account. It lasts 10 minutes.'));
  }
  if (tab === 'reels') {
    if (!D.reels.length) M.append(h('p', 'note', 'No reels posted.'));
    D.reels.forEach((r) => M.append(h('div', 'row', h('div', '', h('b', '', '@' + r.u), h('small', '', (r.caption || '(no caption)') + ' | ' + r.likes + ' likes, ' + r.comments + ' comments | ' + when(r.ts))), h('div', 'acts', btn('remove', 'red', () => { if (confirm('Remove this reel?')) act('reel/delete', { id: r.id }); })))));
  }
  if (tab === 'community') {
    if (!D.pub.length) M.append(h('p', 'note', 'No community messages.'));
    D.pub.forEach((m) => M.append(h('div', 'row', h('div', '', h('b', '', '@' + m.from), h('small', '', when(m.ts)), h('div', '', m.text || (m.media ? '[' + m.mime + ' attachment]' : ''))), h('div', 'acts', btn('remove', 'red', () => act('pub/delete', { id: m.id }))))));
  }
  if (tab === 'notices') {
    const to = h('input', 'in'); to.placeholder = 'username, or * for everyone'; const t = h('textarea', 'in'); t.placeholder = 'message (300 chars)'; t.maxLength = 300;
    M.append(h('h3', '', 'SEND A NOTICE'), to, t, btn('send', '', async () => { if (!t.value.trim() || !to.value.trim()) return toast('Fill both fields'); const r = await call('notice', { to: to.value.trim(), text: t.value }); toast(r._err ? 'User not found' : 'Sent'); if (!r._err) t.value = ''; }), h('p', 'note', 'Notices show in the user\'s account (bell icon) and pop up if they are online.'));
  }
  if (tab === 'log') {
    M.append(btn('clear log', 'ghost', () => act('clearlog', {}, 'Cleared'))); if (!D.log.length) M.append(h('p', 'note', 'Empty.'));
    D.log.forEach((l) => M.append(h('div', 'logline', h('b', '', when(l.ts) + '  '), l.t)));
  }
  if (tab === 'settings') {
    const np = h('input', 'in'); np.type = 'password'; np.placeholder = 'new admin password (8+)';
    M.append(h('h3', '', 'ADMIN PASSWORD'), np, btn('change password', '', async () => { const r = await call('pass', { password: np.value }); toast(r._err ? 'Needs 8+ characters' : 'Password changed'); np.value = ''; }),
      h('h3', '', 'BACKUP'), btn('download backup (json)', 'ghost', async () => { const r = await fetch('/a/backup', { headers: { 'x-admin': T } }); const b = await r.blob(), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'nullbyte-backup.json'; a.click(); }),
      h('p', 'note', 'The backup holds accounts, reels metadata and community messages. DMs inside are ciphertext only. Media files stay in ~/gene-chat/data/media.'));
  }
}
$('lg').onsubmit = async (e) => {
  e.preventDefault();
  const r = await fetch('/a/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('pw').value }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) return ($('err').textContent = d.e || 'Failed');
  T = d.t; sessionStorage.setItem('at', T); $('pw').value = ''; $('err').textContent = ''; view();
};
$('out').onclick = () => { T = ''; sessionStorage.removeItem('at'); D = null; view(); };
setInterval(() => { if (T && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) load(); }, 10000);
(async () => { await boot('NULLBYTE // ADMIN', ['mounting dashboard', 'verifying integrity', 'opening secure console', 'ready'], 1400); view(); })();
