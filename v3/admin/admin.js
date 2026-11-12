const $ = (id) => document.getElementById(id);
let T = sessionStorage.getItem('at') || '';
const call = async (p, b) => {
  const r = await fetch('/a/' + p, { method: b ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-admin': T }, body: b ? JSON.stringify(b) : undefined });
  if (r.status === 401 && T) { T = ''; sessionStorage.removeItem('at'); view(); }
  return r.json().catch(() => ({}));
};
const view = () => { $('lg').hidden = !!T; $('pn').hidden = !T; $('out').hidden = !T; if (T) load(); };
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; };
const btn = (txt, cls, fn) => { const b = el('button', cls, txt); b.onclick = fn; return b; };
const when = (t) => (t ? new Date(t).toLocaleString() : 'never');
async function load() {
  const d = await call('data'); if (!d.users) return;
  $('rq').textContent = ''; $('us').textContent = '';
  if (!d.resets.length) $('rq').append(el('p', 'note', 'No pending requests.'));
  d.resets.forEach((r) => {
    const row = el('div', 'row'), left = el('div'); left.append(el('b', '', '@' + r.username), el('small', '', 'requested ' + when(r.ts)));
    const acts = el('div', 'acts');
    if (r.otp) acts.append(el('span', 'otp', r.otp));
    acts.append(btn(r.otp ? 'New OTP' : 'Generate OTP', '', async () => { await call('otp', { username: r.username }); load(); }));
    row.append(left, acts); $('rq').append(row);
  });
  d.users.forEach((u) => {
    const row = el('div', 'row'), left = el('div');
    const b = el('b', '', u.name + ' (@' + u.username + ') '); b.append(el('span', 'tag' + (u.disabled ? ' off' : ''), u.disabled ? 'disabled' : u.online ? 'online' : 'offline'));
    left.append(b, el('small', '', 'contact: ' + (u.contact || 'none') + ' | joined ' + when(u.created) + ' | last seen ' + when(u.last)));
    const acts = el('div', 'acts');
    acts.append(btn('OTP', '', async () => { await call('otp', { username: u.username }); load(); }),
      btn(u.disabled ? 'Enable' : 'Disable', 'grey', async () => { await call('toggle', { username: u.username }); load(); }),
      btn('Delete', 'red', async () => { if (confirm('Delete @' + u.username + ' and all their messages?')) { await call('delete', { username: u.username }); load(); } }));
    row.append(left, acts); $('us').append(row);
  });
}
$('lg').onsubmit = async (e) => {
  e.preventDefault();
  const r = await fetch('/a/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('pw').value }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) return ($('err').textContent = d.e || 'Failed');
  T = d.t; sessionStorage.setItem('at', T); $('pw').value = ''; $('err').textContent = ''; view();
};
$('out').onclick = () => { T = ''; sessionStorage.removeItem('at'); view(); };
setInterval(() => T && load(), 15000);
view();
