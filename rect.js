
/* =====================================================
   script.js  -  Hospital Management System dashboard
   Works with the existing HTML (no changes needed except
   adding the <script> tag). Pure vanilla JavaScript.
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
 
  /* ---------- helpers ---------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const body  = id => $(`#${id} tbody`);
  const heads = id => $$(`#${id} thead th`).map(th => th.textContent.trim());
  const names = (id, col) => $$(`#${id} tbody tr`).map(r => r.cells[col].textContent.trim());
  const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const inr   = n => n.toLocaleString('en-IN');
  const time12 = t => {
    let [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
  };
  const nextNum = id => 1 + Math.max(0, ...$$(`#${id} tbody tr`)
    .map(r => parseInt(r.cells[0].textContent.replace(/\D/g, ''), 10) || 0));
  const deptOf = doc => {
    const r = $$('#doctors tbody tr').find(r => r.cells[0].textContent.trim() === doc);
    return r ? r.cells[1].textContent.trim() : 'General';
  };
 
  const ACT = {
    patients:      '<a href="#">Profile</a> | <a href="#">Edit</a>',
    appointments:  '<a href="#">View</a> | <a href="#">Cancel</a>',
    billing:       '<a href="#">View</a> | <a href="#">Print Receipt</a>',
    prescriptions: '<a href="#">View</a> | <a href="#">Print</a>'
  };
  const BADGE = {
    'completed': 'b-green', 'paid': 'b-green', 'available': 'b-green',
    'in progress': 'b-blue', 'scheduled': 'b-blue',
    'waiting': 'b-amber', 'pending': 'b-amber', 'in surgery': 'b-amber',
    'cancelled': 'b-red', 'on leave': 'b-red'
  };
 
  /* ---------- injected CSS for the new JS features ---------- */
  const style = document.createElement('style');
  style.textContent = `
    html{scroll-behavior:smooth}
    .hide{display:none!important}
    .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:.8rem;font-weight:600;white-space:nowrap}
    .b-green{background:#dcfce7;color:#166534}.b-blue{background:#dbeafe;color:#1e40af}
    .b-amber{background:#fef3c7;color:#92400e}.b-red{background:#fee2e2;color:#991b1b}
    th.sortable{cursor:pointer;user-select:none}
    th.sortable:hover{color:var(--primary)}
    th[data-dir=asc]::after{content:' \\25B2'}
    th[data-dir=desc]::after{content:' \\25BC'}
    nav a.active{background:#1e293b;color:#fff;border-left-color:var(--primary)}
    #overview td{cursor:pointer}
    #clock{font-size:.85rem;opacity:.9;white-space:nowrap}
    #searchCount{font-size:.8rem;min-width:70px}
    .hms-toasts{position:fixed;right:20px;bottom:20px;display:flex;flex-direction:column;gap:8px;z-index:9999}
    .hms-toast{background:#0f172a;color:#fff;padding:12px 18px;border-radius:8px;border-left:5px solid #22c55e;
      box-shadow:0 6px 18px rgba(0,0,0,.25);transition:opacity .3s;animation:toastIn .3s ease}
    .hms-toast.warn{border-left-color:#f59e0b}
    @keyframes toastIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
    dialog.hms-modal{border:none;border-radius:12px;padding:0;width:min(440px,92vw);color:var(--text);
      background:var(--card);box-shadow:0 20px 50px rgba(0,0,0,.35)}
    dialog.hms-modal::backdrop{background:rgba(15,23,42,.55)}
    .hms-modal .box{padding:22px}
    .hms-modal h3{margin:0 0 14px;color:var(--primary-dark)}
    .hms-modal label{display:block;margin-bottom:12px;font-size:.85rem;font-weight:600;color:var(--muted)}
    .hms-modal input,.hms-modal select{display:block;width:100%;margin-top:4px;padding:9px 10px;font:inherit;
      border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text)}
    .hms-modal input[readonly]{opacity:.6}
    .hms-modal dl{display:grid;grid-template-columns:130px 1fr;gap:8px 12px;margin:0 0 16px}
    .hms-modal dt{color:var(--muted);font-weight:600}.hms-modal dd{margin:0}
    .hms-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:8px}
    .hms-actions button{padding:9px 18px;border:none;border-radius:6px;background:var(--primary);color:#fff;cursor:pointer;font:inherit}
    .hms-actions button.ghost{background:var(--border);color:var(--text)}
    html.dark{--bg:#0b1220;--card:#162033;--text:#e2e8f0;--muted:#94a3b8;--border:#263449}
    html.dark thead th,html.dark tr:first-child>th,html.dark tfoot th,html.dark tbody tr:hover{background:#1c2940}
    html.dark footer{background:#0f172a}
    html.dark #pharmacy li{background:#3a2f12}
    html.dark #settings li{background:#10283a}
    html.dark #settings li:nth-child(3){background:#3b1518}
    html.dark #reports select,html.dark #reports input{background:#0f172a;color:var(--text)}
    html.dark .b-green{background:#14532d;color:#bbf7d0}html.dark .b-blue{background:#1e3a8a;color:#bfdbfe}
    html.dark .b-amber{background:#78350f;color:#fde68a}html.dark .b-red{background:#7f1d1d;color:#fecaca}
  `;
  document.head.appendChild(style);
 
  /* ---------- toast notifications ---------- */
  const toastBox = document.body.appendChild(
    Object.assign(document.createElement('div'), { className: 'hms-toasts' }));
  function toast(msg, type = 'ok') {
    const t = Object.assign(document.createElement('div'), { className: `hms-toast ${type}`, textContent: msg });
    toastBox.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  }
 
  /* ---------- modal dialogs ---------- */
  function openDialog(html) {
    const dlg = document.createElement('dialog');
    dlg.className = 'hms-modal';
    dlg.innerHTML = html;
    dlg.addEventListener('close', () => dlg.remove());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    document.body.appendChild(dlg);
    dlg.showModal();
    return dlg;
  }
 
  function formModal(title, fields, values, label, onSubmit) {
    const fieldHTML = f => {
      const v = values[f.name] ?? f.value ?? '';
      const control = f.options
        ? `<select name="${f.name}">${f.options.map(o =>
            `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
        : `<input name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}"
             ${f.required ? 'required' : ''} ${f.readonly ? 'readonly' : ''}
             ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''}
             ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}>`;
      return `<label>${esc(f.label)}${control}</label>`;
    };
    const dlg = openDialog(`<form method="dialog" class="box"><h3>${esc(title)}</h3>
      ${fields.map(fieldHTML).join('')}
      <div class="hms-actions">
        <button value="cancel" class="ghost" formnovalidate>Cancel</button>
        <button value="ok">${esc(label)}</button>
      </div></form>`);
    $('form', dlg).addEventListener('submit', e => {
      e.preventDefault();
      if (e.submitter && e.submitter.value === 'cancel') return dlg.close();
      onSubmit(Object.fromEntries(new FormData(e.target)));
      dlg.close();
    });
    const first = $('input:not([readonly]), select', dlg);
    if (first) first.focus();
  }
 
  function infoModal(title, pairs) {
    const dlg = openDialog(`<div class="box"><h3>${esc(title)}</h3>
      <dl>${pairs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <div class="hms-actions"><button>Close</button></div></div>`);
    $('button', dlg).addEventListener('click', () => dlg.close());
  }
 
  /* ---------- table helpers ---------- */
  function badgeify() {
    $$('main section:not(#overview) table').forEach(t => {
      [...t.tHead.rows[0].cells].forEach((h, i) => {
        if (!/status|availability/i.test(h.textContent)) return;
        [...t.tBodies[0].rows].forEach(r => {
          const txt = r.cells[i].textContent.trim();
          r.cells[i].innerHTML = `<span class="badge ${BADGE[txt.toLowerCase()] || 'b-blue'}">${esc(txt)}</span>`;
        });
      });
    });
  }
 
  function addRow(id, cells) {
    const tr = document.createElement('tr');
    tr.innerHTML = cells.map(c => `<td>${c.html ?? esc(c)}</td>`).join('');
    tr.style.animationDelay = '0s';
    body(id).prepend(tr);
    badgeify();
    tr.animate([{ background: '#bbf7d0' }, { background: 'rgba(187,247,208,0)' }], { duration: 1800 });
    return tr;
  }
 
  const pairsOf = (sec, tr) => heads(sec)
    .map((h, i) => [h, tr.cells[i].textContent.trim()])
    .filter(([h]) => h !== 'Action');
 
  function recalcBills() {
    const sum = $$('#billing tbody tr').reduce((s, r) =>
      s + (parseInt(r.cells[2].textContent.replace(/\D/g, ''), 10) || 0), 0);
    const th = $('#billing tfoot th:nth-child(2)');
    if (th) th.textContent = 'Rs. ' + inr(sum);
  }
 
  /* ---------- 1. live clock ---------- */
  const header = $('header');
  const clock = Object.assign(document.createElement('span'), { id: 'clock' });
  header.appendChild(clock);
  const tick = () => clock.textContent = new Date().toLocaleString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  tick(); setInterval(tick, 1000);
 
  /* ---------- 2. dark mode toggle ---------- */
  const root = document.documentElement;
  try { if (localStorage.getItem('hms-theme') === 'dark') root.classList.add('dark'); } catch {}
  const themeBtn = Object.assign(document.createElement('button'), { type: 'button', id: 'themeToggle' });
  const setLabel = () => themeBtn.textContent = root.classList.contains('dark') ? '\u2600 Light' : '\uD83C\uDF19 Dark';
  setLabel();
  themeBtn.addEventListener('click', () => {
    root.classList.toggle('dark');
    try { localStorage.setItem('hms-theme', root.classList.contains('dark') ? 'dark' : 'light'); } catch {}
    setLabel();
  });
  header.appendChild(themeBtn);
 
  /* ---------- 3. count-up stat cards (+ click to jump) ---------- */
  const stats = $$('#overview td');
  function countUp(td) {
    const parts = td.textContent.trim().split(/([\d,]+)/);
    const targets = parts.map(p => /^[\d,]+$/.test(p) ? parseInt(p.replace(/,/g, ''), 10) : null);
    const t0 = performance.now(), dur = 1400;
    (function step(now) {
      const k = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
      td.textContent = parts.map((p, i) => targets[i] === null ? p : inr(Math.round(targets[i] * e))).join('');
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  stats.forEach(countUp);
  ['patients', 'doctors', 'appointments', 'wards', 'billing'].forEach((id, i) =>
    stats[i].addEventListener('click', () => document.getElementById(id).scrollIntoView()));
 
  function bump(i, delta) {
    const td = stats[i], m = td.textContent.match(/[\d,]+/);
    if (!m) return;
    const n = Math.max(0, parseInt(m[0].replace(/,/g, ''), 10) + delta);
    td.textContent = td.textContent.replace(/[\d,]+/, inr(n));
    td.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 350 });
  }
 
  /* ---------- 4. status badges ---------- */
  badgeify();
 
  /* ---------- 5. sidebar: highlight current section ---------- */
  const links = $$('nav a');
  const byId = Object.fromEntries(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(l => l.classList.remove('active'));
    if (byId[en.target.id]) byId[en.target.id].classList.add('active');
  }), { rootMargin: '-35% 0px -55% 0px' });
  $$('main section[id]').forEach(s => io.observe(s));
 
  /* ---------- 6. live global search ---------- */
  const form = $('header form'), box = $('#search');
  const count = Object.assign(document.createElement('span'), { id: 'searchCount' });
  form.appendChild(count);
 
  function runSearch(q) {
    q = q.trim().toLowerCase();
    let total = 0;
    $$('main section:not(#overview)').forEach(sec => {
      const items = $$('tbody tr, li', sec);
      let vis = 0;
      items.forEach(it => {
        const ok = !q || it.textContent.toLowerCase().includes(q);
        it.classList.toggle('hide', !ok);
        if (ok) vis++;
      });
      sec.classList.toggle('hide', !!q && items.length > 0 && vis === 0);
      if (q) total += vis;
    });
    count.textContent = q ? `${total} result${total === 1 ? '' : 's'}` : '';
  }
  box.addEventListener('input', () => runSearch(box.value));
  form.addEventListener('submit', e => { e.preventDefault(); runSearch(box.value); });
  box.addEventListener('keydown', e => { if (e.key === 'Escape') { box.value = ''; runSearch(''); } });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); box.focus();
    }
  });
 
  /* ---------- 7. click column headers to sort ---------- */
  const sortKey = t => {
    t = t.trim();
    if (/^\d{1,2} [A-Za-z]{3} \d{4}$/.test(t)) return Date.parse(t);
    if (/^\d{2}:\d{2} [AP]M$/.test(t)) {
      const [h, m] = t.split(/[: ]/); return (h % 12) * 60 + +m + (/PM/.test(t) ? 720 : 0);
    }
    const n = parseFloat(t.replace(/[^\d.]/g, ''));
    return /^(Rs\.|\d)/.test(t) && !isNaN(n) ? n : t.toLowerCase();
  };
  const cmp = (a, b) => typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
 
  $$('main section:not(#overview) thead th').forEach(th => {
    if (th.textContent.trim() === 'Action') return;
    th.classList.add('sortable');
    th.title = 'Click to sort';
    th.addEventListener('click', () => {
      const table = th.closest('table'), tb = table.tBodies[0];
      const dir = th.dataset.dir === 'asc' ? 'desc' : 'asc';
      $$('th', table).forEach(x => delete x.dataset.dir);
      th.dataset.dir = dir;
      [...tb.rows]
        .sort((a, b) => cmp(sortKey(a.cells[th.cellIndex].textContent), sortKey(b.cells[th.cellIndex].textContent)) * (dir === 'asc' ? 1 : -1))
        .forEach(r => tb.appendChild(r));
    });
  });
 
  /* ---------- 8. row actions: view / edit / cancel / print ---------- */
  function printHTML(title, inner) {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;width:0;height:0;border:0';
    document.body.appendChild(f);
    f.contentDocument.write(`<html><head><title>${esc(title)}</title><style>
      body{font-family:Arial,sans-serif;padding:30px}h1{margin:0}p{color:#555}
      table{width:100%;border-collapse:collapse;margin-top:18px}
      td,th{border:1px solid #999;padding:9px;text-align:left}th{width:35%;background:#f1f5f9}
      </style></head><body>${inner}</body></html>`);
    f.contentDocument.close();
    f.contentWindow.focus();
    f.contentWindow.print();
    setTimeout(() => f.remove(), 2000);
  }
 
  function printRow(sec, tr) {
    const title = sec === 'billing' ? 'Bill Receipt' : 'Prescription';
    const rows = pairsOf(sec, tr).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
    printHTML(title, `<h1>City Care Hospital</h1><p>${title} &mdash; ${today()}</p><table>${rows}</table>
      <p style="margin-top:40px">Authorised signature: ______________________</p>`);
  }
 
  function editRow(sec, tr) {
    const fields = heads(sec)
      .map((h, i) => ({ h, i }))
      .filter(x => x.h !== 'Action')
      .map(x => ({ name: 'c' + x.i, label: x.h, readonly: x.i === 0, value: tr.cells[x.i].textContent.trim() }));
    formModal('Edit record', fields, {}, 'Save', d => {
      fields.forEach(f => tr.cells[+f.name.slice(1)].textContent = d[f.name]);
      badgeify();
      tr.animate([{ background: '#fde68a' }, { background: 'rgba(253,230,138,0)' }], { duration: 1600 });
      toast('Record updated');
    });
  }
 
  function cancelAppt(tr) {
    if (!confirm(`Cancel appointment for ${tr.cells[1].textContent.trim()}?`)) return;
    tr.cells[5].textContent = 'Cancelled';
    tr.cells[6].innerHTML = '<a href="#">View</a>';
    badgeify();
    bump(2, -1);
    toast('Appointment cancelled', 'warn');
  }
 
  $('main').addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || !a.closest('tbody td')) return;
    e.preventDefault();
    const tr = a.closest('tr'), sec = a.closest('section').id, label = a.textContent.trim();
    if (/^(View|Profile)$/.test(label)) return infoModal(`${label} \u2013 ${tr.cells[0].textContent.trim()}`, pairsOf(sec, tr));
    if (label === 'Edit') return editRow(sec, tr);
    if (label === 'Cancel') return cancelAppt(tr);
    if (/^Print/.test(label)) return printRow(sec, tr);
  });
 
  /* ---------- 9. quick actions (add new records) ---------- */
  const quick = {
    'Register Patient': () => formModal('Register Patient', [
      { name: 'name', label: 'Full name', required: true },
      { name: 'age', label: 'Age', type: 'number', required: true, min: 0, max: 120 },
      { name: 'gender', label: 'Gender', options: ['M', 'F', 'Other'] },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'type', label: 'Patient type', options: ['Outpatient', 'Inpatient'] }
    ], {}, 'Register', d => {
      addRow('patients', ['P-' + nextNum('patients'), d.name, `${d.age} / ${d.gender}`, d.phone, today(), d.type, { html: ACT.patients }]);
      bump(0, 1);
      toast(`${d.name} registered`);
    }),
 
    'Add Doctor': () => formModal('Add Doctor', [
      { name: 'name', label: 'Doctor name', required: true },
      { name: 'dept', label: 'Department', options: ['Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'General Medicine', 'Gynecology'] },
      { name: 'shift', label: 'Shift', placeholder: '9 AM - 3 PM', required: true },
      { name: 'avail', label: 'Availability', options: ['Available', 'In Surgery', 'On Leave'] }
    ], {}, 'Add', d => {
      const n = /^dr\.?\s/i.test(d.name) ? d.name : 'Dr. ' + d.name;
      addRow('doctors', [n, d.dept, d.shift, d.avail]);
      bump(1, 1);
      toast(`${n} added`);
    }),
 
    'Book Appointment': () => formModal('Book Appointment', [
      { name: 'patient', label: 'Patient name', required: true },
      { name: 'doctor', label: 'Doctor', options: names('doctors', 0) },
      { name: 'time', label: 'Time', type: 'time', required: true }
    ], {}, 'Book', d => {
      const tok = 'A-' + String(nextNum('appointments')).padStart(2, '0');
      addRow('appointments', [tok, d.patient, d.doctor, deptOf(d.doctor), time12(d.time), 'Scheduled', { html: ACT.appointments }]);
      bump(2, 1);
      toast(`Appointment ${tok} booked`);
    }),
 
    'Generate Bill': () => formModal('Generate Bill', [
      { name: 'patient', label: 'Patient', options: names('patients', 1) },
      { name: 'amount', label: 'Amount (Rs.)', type: 'number', required: true, min: 1 },
      { name: 'status', label: 'Payment status', options: ['Paid', 'Pending'] }
    ], {}, 'Generate', d => {
      const amt = parseInt(d.amount, 10);
      addRow('billing', ['B-' + nextNum('billing'), d.patient, 'Rs. ' + inr(amt), d.status, { html: ACT.billing }]);
      recalcBills();
      if (d.status === 'Paid') bump(4, amt);
      toast('Bill generated');
    }),
 
    'New Prescription': () => formModal('New Prescription', [
      { name: 'patient', label: 'Patient', options: names('patients', 1) },
      { name: 'doctor', label: 'Doctor', options: names('doctors', 0) }
    ], {}, 'Create', d => {
      addRow('prescriptions', ['RX-' + nextNum('prescriptions'), d.patient, d.doctor, today(), { html: ACT.prescriptions }]);
      toast('Prescription created');
    })
  };
 
  $$('#overview button').forEach(btn => {
    const key = Object.keys(quick).find(k => btn.textContent.includes(k));
    if (key) btn.addEventListener('click', quick[key]);
  });
 
  /* ---------- 10. reports form ---------- */
  const reportForm = $('#reports form');
  reportForm.addEventListener('submit', e => {
    e.preventDefault();
    const type = $('#report-type').value, from = $('#from').value, to = $('#to').value;
    if (!from || !to) return toast('Please choose both dates', 'warn');
    if (from > to) return toast('"From" date must be before "To" date', 'warn');
    toast(`${type} report generated (${from} to ${to})`);
  });
 
  /* ---------- 11. live bed occupancy simulation ---------- */
  function recalcWards() {
    let tot = 0, occ = 0;
    $$('#wards tbody tr').forEach(tr => {
      const t = +tr.cells[1].textContent, o = +tr.cells[2].textContent;
      tr.cells[3].textContent = t - o;
      tot += t; occ += o;
    });
    const p = $('#wards progress');
    p.max = tot; p.value = occ;
    if (p.nextSibling) p.nextSibling.nodeValue = ` ${Math.round(occ / tot * 100)}%`;
    stats[3].textContent = `${tot - occ} / ${tot}`;
  }
  setInterval(() => {
    const rows = $$('#wards tbody tr');
    const tr = rows[Math.floor(Math.random() * rows.length)];
    const t = +tr.cells[1].textContent, o = +tr.cells[2].textContent;
    const n = Math.min(t, Math.max(0, o + (Math.random() < .5 ? -1 : 1)));
    if (n === o) return;
    tr.cells[2].textContent = n;
    recalcWards();
    tr.animate([{ background: n > o ? '#fecaca' : '#bbf7d0' }, { background: 'rgba(0,0,0,0)' }], { duration: 1500 });
  }, 7000);
 
  /* ---------- 12. header links ---------- */
  $$('header a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (/logout/i.test(a.textContent)) { if (confirm('Log out of the dashboard?')) toast('Logged out (demo)', 'warn'); }
    else toast('Profile page coming soon', 'warn');
  }));
});