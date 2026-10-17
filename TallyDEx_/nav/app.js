/* ==========================================================================
   Tally DEx — application shell
   Router + component kit + page views for the right-hand content area.
   No framework, no build step. Data below is representative sample data.
   ========================================================================== */

/* --------------------------------------------------------------------------
   0. Small helpers
   -------------------------------------------------------------------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const icon = (name, cls = '') => `<i data-lucide="${name}"${cls ? ` class="${cls}"` : ''}></i>`;

const nf = new Intl.NumberFormat('en-IN');
const num = (v) => (v === null || v === undefined || v === '' ? '—' : nf.format(v));
const money = (v) =>
  (v < 0 ? '−₹' : '₹') +
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
const dash = (v) => (v === null || v === undefined || v === '' ? '<span class="muted">—</span>' : esc(v));

let uid = 0;
const nextId = () => `n${++uid}`;

function toast(msg, kind = 'ok') {
  const host = $('#toasts');
  const node = document.createElement('div');
  node.className = `toast ${kind}`;
  node.innerHTML = `${icon(kind === 'ok' ? 'check-circle-2' : 'info')}<span>${esc(msg)}</span>`;
  host.appendChild(node);
  lucide.createIcons({ nameAttr: 'data-lucide' });
  setTimeout(() => {
    node.style.transition = 'opacity .3s, transform .3s';
    node.style.opacity = '0';
    node.style.transform = 'translateY(10px)';
    setTimeout(() => node.remove(), 320);
  }, 2600);
}

/* --------------------------------------------------------------------------
   1. Sample data
   -------------------------------------------------------------------------- */

const DB = {
  entities: ['SSVDemo', 'GRB Foods', 'Lion Dates'],

  entityRows: [
    { name: 'SSVDemo', id: 'ssv_demo', host: 'db-blr-01.tallydex.in', rules: 4, dealers: 3, synced: '2 min ago' },
  ],

  users: [
    { no: 1, name: 'SSV_User', email: 'ssvuser@itcatalystindia.com', mobile: '9844101210', role: 'User-L2', active: true },
    { no: 2, name: 'SSV Demo', email: 'ssvdemo@itcatalystindia.com', mobile: '9844100011', role: 'Admin', active: true },
    { no: 3, name: 'K. Raghavan', email: 'raghavan@itcatalystindia.com', mobile: '9840055512', role: 'User-L1', active: false },
  ],

  rules: [
    { entity: 'ssv_demo', slno: '735352083', company: 'SSV - HO', status: 'Active', guid: 'b50b7f6b-4c72-4263-a18c-a0c0d2eee264' },
    { entity: 'ssv_demo', slno: '735352083', company: 'SSV - Hotel Sri Ramanuja', status: 'Active', guid: '3bc2d5a3-ed12-4ece-8818-edb02183dc36' },
    { entity: 'ssv_demo', slno: '735352083', company: 'SSV - Sri Murugan Agencies', status: 'Active', guid: 'acbf301a-f83b-43af-992b-e8072a2a6991' },
    { entity: 'ssv_demo', slno: '711020736', company: 'SSV Ledgers Demo', status: 'Active', guid: 'dbe7faea-33e0-4feb-9be1-dbe69e301e84' },
  ],

  dealers: [
    { code: 'BP0001', name: 'Sri Murugan Agencies', state: 'Karnataka', region: 'WEST', division: '', so: '', am: '', head: '', ts: '2024-11-22 12:40:38' },
    { code: 'BP0002', name: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', division: '', so: '', am: '', head: '', ts: '2024-11-22 12:40:38' },
    { code: 'BP0003', name: 'Annamalai Agencies', state: 'Karnataka', region: 'WEST', division: '', so: '', am: '', head: '', ts: '2024-11-22 12:40:38' },
  ],

  stockItems: [
    { sku: 'GH00100010A', desc: 'Ghee', unit: 'Pcs', add: 'box', denom: 1200, conv: 1, mrpDate: '2024-04-01', mrp: 10, costDate: '2024-04-01', cost: 10, hsn: '04059020', gst: 12 },
    { sku: 'GH0020050JK', desc: 'Udhayam Ghee 50 ml', unit: 'Pcs', add: 'box', denom: 240, conv: 1, mrpDate: '2024-04-01', mrp: 52, costDate: '2024-04-01', cost: 52, hsn: '04059020', gst: 12 },
    { sku: 'GH0020100JK', desc: 'Udhayam Ghee 100 ml', unit: 'Pcs', add: 'box', denom: 120, conv: 1, mrpDate: '2024-04-01', mrp: 97, costDate: '2024-04-01', cost: 97, hsn: '04059020', gst: 12 },
    { sku: 'GH0020200JK', desc: 'Udhayam Ghee 200 ml', unit: 'Pcs', add: 'box', denom: 60, conv: 1, mrpDate: '2024-04-01', mrp: 180, costDate: '2024-04-01', cost: 180, hsn: '04059020', gst: 12 },
    { sku: 'GH0020500JK', desc: 'Udhayam Ghee 500 ml', unit: 'Pcs', add: 'box', denom: 24, conv: 1, mrpDate: '2024-04-01', mrp: 433, costDate: '2024-04-01', cost: 433, hsn: '04059020', gst: 12 },
    { sku: 'GH0021000JK', desc: 'Udhayam Ghee 1Ltr', unit: 'Pcs', add: 'box', denom: 12, conv: 1, mrpDate: '2024-04-01', mrp: 836, costDate: '2024-04-01', cost: 836, hsn: '04059020', gst: 12 },
    { sku: 'GI0020100BD', desc: 'Badam Drink Mix 100g', unit: 'Pcs', add: '', denom: '', conv: '', mrpDate: '2024-04-01', mrp: 125, costDate: '2024-04-01', cost: 125, hsn: '04059020', gst: 12 },
    { sku: 'GI0020200BD', desc: 'Badam Drink Mix 200g', unit: 'Pcs', add: '', denom: '', conv: '', mrpDate: '2024-04-01', mrp: 250, costDate: '2024-04-01', cost: 250, hsn: '04059020', gst: 12 },
    { sku: 'GI0020200RD', desc: 'Rava Dosa Mix 200g', unit: 'Pcs', add: '', denom: '', conv: '', mrpDate: '2024-04-01', mrp: 130, costDate: '2024-04-01', cost: 130, hsn: '04059020', gst: 12 },
    { sku: 'GI0020200RI', desc: 'Rava Idly Mix 200g', unit: 'Pcs', add: '', denom: '', conv: '', mrpDate: '2024-04-01', mrp: 130, costDate: '2024-04-01', cost: 130, hsn: '04059020', gst: 12 },
    { sku: 'GM0020100BB', desc: 'Bisibele Bath Powder 100g', unit: 'Pcs', add: '', denom: '', conv: '', mrpDate: '2024-04-01', mrp: 60, costDate: '2024-04-01', cost: 60, hsn: '04059020', gst: 12 },
    { sku: 'GM0020050BB', desc: 'Bisibele Bath Powder 50g', unit: 'Pcs', add: '', denom: '', conv: '', mrpDate: '2024-04-01', mrp: 30, costDate: '2024-04-01', cost: 30, hsn: '04059020', gst: 12 },
  ],

  priceLevels: [
    { id: 1, state: 'Karnataka', level: 'Super Stockiest Tier 1' },
    { id: 2, state: 'Karnataka', level: 'Super Stockiest Tier 2' },
    { id: 3, state: 'Karnataka', level: 'Super Stockiest Tier 3' },
  ],

  skuPriceLevels: [
    { date: '2024-04-01', item: 'Udhayam Ghee 100 ml', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: '', to: 10, disc: 3, rate: 97, ts: '2024-11-22 12:44:14' },
    { date: '2024-04-01', item: 'Udhayam Ghee 100 ml', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: 10, to: 50, disc: 5, rate: 96, ts: '2024-11-22 12:44:14' },
    { date: '2024-04-01', item: 'Udhayam Ghee 100 ml', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: 50, to: '', disc: '', rate: 90, ts: '2024-11-22 12:44:14' },
    { date: '2024-04-01', item: 'Udhayam Ghee 200 ml', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: '', to: '', disc: 3, rate: 180, ts: '2024-11-22 12:44:14' },
    { date: '2024-04-01', item: 'Udhayam Ghee 500 ml', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: '', to: '', disc: 3, rate: 433, ts: '2024-11-22 12:44:14' },
    { date: '2024-04-01', item: 'Udhayam Ghee 50 ml', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: '', to: '', disc: 3, rate: 52, ts: '2024-11-22 12:44:14' },
    { date: '2024-04-01', item: 'Udhayam Ghee 1Ltr', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: '', to: '', disc: 3, rate: 836, ts: '2024-11-22 12:44:14' },
    { date: '2024-04-01', item: 'Ghee', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: '', to: '', disc: 3, rate: 10, ts: '2024-11-22 12:44:14' },
    { date: '2024-04-01', item: 'Bisibele Bath Powder 100g', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: '', to: '', disc: 3, rate: 60, ts: '2024-11-22 12:44:14' },
    { date: '2024-04-01', item: 'Bisibele Bath Powder 50g', level: 'Super Stockiest Tier 1', state: 'Karnataka', from: '', to: '', disc: 3, rate: 30, ts: '2024-11-22 12:44:14' },
  ],

  companies: ['SSV - HO', 'SSV - Hotel Sri Ramanuja', 'SSV - Sri Murugan Agencies', 'SSV Ledgers Demo'],

  dealerPending: [
    { guid: 'b50b7f6b-4c72-4263-a18c-a0c0d2eee264', name: 'SSV - HO', mail: 'SSV - HO', state: 'Karnataka' },
    { guid: 'dbe7faea-33e0-4feb-9be1-dbe69e301e84', name: 'SSV Ledgers Demo', mail: 'SSV Ledgers Demo', state: 'Karnataka' },
  ],

  dealerMapped: [
    { coid: 1, name: 'SSV - Hotel Sri Ramanuja', hoid: 2, code: 'BP0002', hoName: 'Hotel Sri Ramanuja' },
    { coid: 3, name: 'SSV - Sri Murugan Agencies', hoid: 1, code: 'BP0001', hoName: 'Sri Murugan Agencies' },
  ],

  syncLog: [
    { dealer: '', code: '', company: 'SSV - HO', state: '', region: '', division: '', tally: 'TallyPrime Series A Release 6.1', at: '2026-03-23' },
    { dealer: '', code: '', company: 'SSV Ledgers Demo', state: '', region: '', division: '', tally: 'TallyPrime Series A Release 7.0 (Beta)', at: '2026-06-24' },
    { dealer: 'Hotel Sri Ramanuja', code: 'BP0002', company: 'SSV - Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', division: '', tally: 'TallyPrime Series A Release 6.1', at: '2026-03-23' },
    { dealer: 'Sri Murugan Agencies', code: 'BP0001', company: 'SSV - Sri Murugan Agencies', state: 'Karnataka', region: 'WEST', division: '', tally: 'TallyPrime Series A Release 6.1', at: '2026-03-23' },
  ],

  closingStock: [
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Badam Drink Mix 100g', sku: 'GI0020100BD', unit: 'Pcs', qty: 15, val: 644.87 },
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Badam Drink Mix 1kg', sku: 'GI0021000BD', unit: 'Pcs', qty: 154, val: 45181.33 },
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Badam Drink Mix 200g', sku: 'GI0020200BD', unit: 'Pcs', qty: 276, val: 3380.13 },
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Badam Drink Mix 500g', sku: 'GI0020500BD', unit: 'Pcs', qty: 75, val: 4261.37 },
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Bisibele Bath Powder 100g', sku: 'GM0020100BB', unit: 'Pcs', qty: 34, val: 209.23 },
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Bisibele Bath Powder 50g', sku: 'GM0020050BB', unit: 'Pcs', qty: -20, val: -600 },
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Coriander Powder 100g', sku: 'GM0020100CR', unit: 'Pcs', qty: -25, val: -1000 },
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Coriander Powder 250g', sku: 'GM0020250CR', unit: 'Pcs', qty: -7, val: -700 },
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Coriander Powder 500g', sku: 'GM0020500CR', unit: 'Pcs', qty: 1, val: 200 },
    { coid: 1, date: '2026-03-23', code: 'BP0002', dealer: 'Hotel Sri Ramanuja', state: 'Karnataka', region: 'WEST', name: 'Coriander Powder 50g', sku: 'GM0020050CR', unit: 'Pcs', qty: 43, val: 860 },
  ],

  vouchers: [
    { id: 60, alt: 93, no: 10, no2: '10', date: '2025-07-24', type: 'Sales Order', typeId: 48, party: 'Hotel Sri Ramanuja' },
    { id: 61, alt: 94, no: 20, no2: '20', date: '2025-07-24', type: 'Sales', typeId: 38, party: 'Hotel Sri Ramanuja' },
    { id: 62, alt: 95, no: 21, no2: '21', date: '2025-07-24', type: 'Sales', typeId: 38, party: 'Sri Murugan Agencies' },
    { id: 63, alt: 97, no: 11, no2: '11', date: '2025-07-25', type: 'Sales Order', typeId: 48, party: 'Sri Murugan Agencies' },
    { id: 64, alt: 98, no: 22, no2: '22', date: '2025-07-25', type: 'Sales', typeId: 38, party: 'Sri Murugan Agencies' },
    { id: 65, alt: 99, no: 23, no2: '23', date: '2025-07-26', type: 'Sales', typeId: 38, party: 'Sri Murugan Agencies' },
    { id: 66, alt: 100, no: 24, no2: '24', date: '2025-11-05', type: 'Sales', typeId: 38, party: 'Sri Murugan Agencies' },
    { id: 67, alt: 102, no: 12, no2: '12', date: '2025-11-06', type: 'Sales Order', typeId: 48, party: 'Hotel Sri Ramanuja' },
    { id: 68, alt: 103, no: 25, no2: '25', date: '2025-12-25', type: 'Sales', typeId: 38, party: 'Annamalai Agencies' },
    { id: 69, alt: 104, no: 13, no2: '13 (deleted)', date: '2025-12-26', type: 'Sales Order', typeId: 48, party: 'Hotel Sri Ramanuja' },
  ],

  statistics: [
    { type: 'Sales', typeId: 38, cancl: 0, del: 1, optnl: 0, total: 13 },
    { type: 'Purchase', typeId: 39, cancl: 0, del: 0, optnl: 2, total: 6 },
    { type: 'Purchase Order', typeId: 49, cancl: 0, del: 2, optnl: 0, total: 6 },
  ],

  monthlySales: [
    { month: 'April 2025', sales: 41913.2, ret: 0 },
    { month: 'May 2025', sales: 60655.5, ret: 0 },
    { month: 'June 2025', sales: 2745.9, ret: 0 },
    { month: 'July 2025', sales: 42450.75, ret: 0 },
    { month: 'November 2025', sales: 200, ret: 0 },
    { month: 'December 2025', sales: 7396, ret: 0 },
    { month: 'March 2026', sales: 5650, ret: 0 },
  ],

  principalSales: [
    { company: 'SSV - Hotel Sri Ramanuja', code: 'BP0002', state: 'Karnataka', invoices: 15, qty: 1268, value: 161011.35, ret: 0 },
    { company: 'SSV - Sri Murugan Agencies', code: 'BP0001', state: 'Karnataka', invoices: 11, qty: 942, value: 118430.0, ret: 1250 },
    { company: 'SSV - HO', code: '—', state: 'Karnataka', invoices: 3, qty: 210, value: 24980.5, ret: 0 },
  ],
};

/* --------------------------------------------------------------------------
   2. App state
   -------------------------------------------------------------------------- */

const app = {
  entity: 'SSVDemo',
  route: 'home',
  theme: localStorage.getItem('tdx-theme') || 'light',
};

/* --------------------------------------------------------------------------
   3. Component kit
   -------------------------------------------------------------------------- */

function pageHead({ eyebrow, title, sub, actions = '' }) {
  return `
    <header class="page-head">
      <div>
        ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
        <h1>${esc(title)}</h1>
        ${sub ? `<p>${esc(sub)}</p>` : ''}
      </div>
      ${actions ? `<div class="head-actions">${actions}</div>` : ''}
    </header>`;
}

function cardHead({ icon: ic, title, sub, right = '', chev = false }) {
  return `
    <div class="card-head">
      ${ic ? `<div class="lead-icon">${icon(ic)}</div>` : ''}
      <div class="grow">
        <h2>${esc(title)}</h2>
        ${sub ? `<p>${esc(sub)}</p>` : ''}
      </div>
      ${right}
      ${chev ? `<span class="chev">${icon('chevron-down')}</span>` : ''}
    </div>`;
}

/* Field builders --------------------------------------------------------- */

function fSelect(label, options, { value = '', req = false, placeholder = 'Select…', hint = '' } = {}) {
  const opts = [placeholder ? `<option value="">${esc(placeholder)}</option>` : '']
    .concat(options.map((o) => `<option${o === value ? ' selected' : ''}>${esc(o)}</option>`))
    .join('');
  return `
    <div class="field">
      <label>${esc(label)}${req ? '<span class="req">*</span>' : ''}</label>
      <div class="control select"><select>${opts}</select></div>
      ${hint ? `<span class="hint">${esc(hint)}</span>` : ''}
    </div>`;
}

function fText(label, { placeholder = '', value = '', req = false, lead = '', hint = '', readonly = false } = {}) {
  return `
    <div class="field">
      <label>${esc(label)}${req ? '<span class="req">*</span>' : ''}</label>
      <div class="control${readonly ? ' readonly' : ''}">
        ${lead ? `<span class="lead">${icon(lead)}</span>` : ''}
        <input type="text" placeholder="${esc(placeholder)}" value="${esc(value)}"${readonly ? ' readonly' : ''}>
      </div>
      ${hint ? `<span class="hint">${esc(hint)}</span>` : ''}
    </div>`;
}

function fDateRange(label, value = 'April 1, 2025 — March 31, 2026') {
  return `
    <div class="field">
      <label>${esc(label)}</label>
      <div class="control">
        <span class="lead">${icon('calendar-days')}</span>
        <input type="text" value="${esc(value)}" readonly>
      </div>
    </div>`;
}

function fFile(label, hint = 'XLSX or CSV, up to 10 MB') {
  const id = nextId();
  return `
    <div class="field">
      <label>${esc(label)}</label>
      <div class="filefield" data-file>
        <label for="${id}">${icon('paperclip')} Choose file</label>
        <input id="${id}" type="file">
        <span class="name">No file chosen</span>
      </div>
      <span class="hint">${esc(hint)}</span>
    </div>`;
}

/* Filter bar ------------------------------------------------------------- */

function filterBar({ fields = [], advanced = [], submit = 'Search', extra = '' }) {
  const adv = advanced.length
    ? `
      <div class="divider"></div>
      <label class="check" data-adv-toggle>
        <input type="checkbox"><span class="box"></span>
        <span>Show advanced filters</span>
      </label>
      <div class="fold" data-adv hidden style="margin-top:16px">
        <div class="grid compact">${advanced.join('')}</div>
      </div>`
    : '';
  return `
    <section class="card">
      <div class="card-body stack-lg">
        <div class="grid compact">${fields.join('')}</div>
        ${adv}
        <div class="btn-row">
          <button class="btn btn-primary" data-act="search">${icon('search')} ${esc(submit)}</button>
          <button class="btn btn-ghost" data-act="reset">${icon('rotate-ccw')} Reset</button>
          ${extra}
        </div>
      </div>
    </section>`;
}

/* Empty state ------------------------------------------------------------ */

function emptyState({ art = 'search-x', title, hint, actions = '', accent = false }) {
  return `
    <div class="empty${accent ? ' accent' : ''}">
      <div class="art">${icon(art)}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(hint)}</p>
      ${actions ? `<div class="btn-row">${actions}</div>` : ''}
    </div>`;
}

/* Data table ------------------------------------------------------------- */

const tables = new Map();

/**
 * columns: [{ key, label, align, cls, render(row), sort:false }]
 * opts: { title, icon, rows, columns, search, exportable, pageSize, totals, empty }
 */
function dataTable(opts) {
  const id = nextId();
  tables.set(id, {
    ...opts,
    q: '',
    page: 1,
    size: opts.pageSize || 10,
    sortKey: null,
    sortDir: 1,
  });
  return `<section class="card" id="${id}" data-table>${renderTableInner(id)}</section>`;
}

function tableView(id) {
  const t = tables.get(id);
  let rows = t.rows;
  if (t.q) {
    const q = t.q.toLowerCase();
    rows = rows.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q)));
  }
  if (t.sortKey) {
    const k = t.sortKey;
    rows = [...rows].sort((a, b) => {
      const x = a[k], y = b[k];
      const bothNum = typeof x === 'number' && typeof y === 'number';
      return (bothNum ? x - y : String(x ?? '').localeCompare(String(y ?? ''))) * t.sortDir;
    });
  }
  const pages = Math.max(1, Math.ceil(rows.length / t.size));
  const page = Math.min(t.page, pages);
  return { rows, pages, page, slice: rows.slice((page - 1) * t.size, page * t.size) };
}

function renderTableInner(id) {
  const t = tables.get(id);
  const { rows, pages, page, slice } = tableView(id);

  const toolbar = `
    <div class="table-toolbar">
      ${t.icon ? `<div class="lead-icon">${icon(t.icon)}</div>` : ''}
      <div>
        <h2 style="margin:0;font-size:14.5px;font-weight:650">${esc(t.title || 'Results')}</h2>
        ${t.sub ? `<p style="margin:3px 0 0;font-size:12.5px;color:var(--text-3)">${esc(t.sub)}</p>` : ''}
      </div>
      <span class="count-pill">${nf.format(t.rows.length)}</span>
      <span class="grow"></span>
      ${t.search === false ? '' : `
        <div class="control search-ctl">
          <span class="lead">${icon('search')}</span>
          <input type="search" placeholder="Search in table…" value="${esc(t.q)}" data-tsearch>
        </div>`}
      <div class="pagesize">
        <span>Rows</span>
        <div class="control select">
          <select data-tsize>
            ${[10, 25, 50, 100].map((n) => `<option${n === t.size ? ' selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
      </div>
      ${t.exportable === false ? '' : `
        <button class="btn btn-ghost btn-sm" data-act="export">${icon('file-spreadsheet')} Excel</button>
        <button class="btn btn-ghost btn-sm btn-icon" data-act="print" title="Print">${icon('printer')}</button>`}
    </div>`;

  const head = `<tr>${t.columns
    .map((c) => {
      const sortable = c.sort !== false;
      const isSorted = t.sortKey === c.key;
      return `<th class="${c.align === 'right' ? 'num ' : ''}${sortable ? 'sortable' : ''}"${
        isSorted ? ` aria-sort="${t.sortDir === 1 ? 'ascending' : 'descending'}"` : ''
      }${sortable ? ` data-sort="${esc(c.key)}"` : ''}>${esc(c.label)}${
        sortable ? `<span class="arrow">${isSorted ? (t.sortDir === 1 ? '▲' : '▼') : '⇅'}</span>` : ''
      }</th>`;
    })
    .join('')}</tr>`;

  const body = slice.length
    ? slice
        .map(
          (r, i) =>
            `<tr>${t.columns
              .map((c) => {
                const cls = [c.align === 'right' ? 'num' : '', c.cls || ''].filter(Boolean).join(' ');
                const val = c.render ? c.render(r, i) : dash(r[c.key]);
                return `<td${cls ? ` class="${cls}"` : ''}>${val}</td>`;
              })
              .join('')}</tr>`
        )
        .join('')
    : '';

  const foot = t.totals
    ? `<tfoot><tr>${t.columns
        .map((c) => {
          const v = t.totals[c.key];
          return `<td class="${c.align === 'right' ? 'num' : ''}">${v === undefined ? '' : v}</td>`;
        })
        .join('')}</tr></tfoot>`
    : '';

  const table = slice.length
    ? `<div class="table-wrap"><table class="data"><thead>${head}</thead><tbody>${body}</tbody>${foot}</table></div>`
    : (t.empty
        ? emptyState(t.empty)
        : emptyState({
            art: 'search-x',
            title: t.q ? 'No matching rows' : 'Nothing to show yet',
            hint: t.q
              ? `No rows match “${t.q}”. Try a shorter search term or clear the filter.`
              : 'Adjust the filters above and run the search to load records.',
          }));

  const from = rows.length ? (page - 1) * t.size + 1 : 0;
  const to = Math.min(page * t.size, rows.length);

  const footBar = rows.length
    ? `<div class="card-foot">
        <span class="rowcount">Showing <b>${from}–${to}</b> of ${nf.format(rows.length)}${
          t.q ? ` (filtered from ${nf.format(t.rows.length)})` : ''
        }</span>
        ${pager(page, pages)}
      </div>`
    : '';

  return toolbar + table + footBar;
}

function pager(page, pages) {
  const nums = [];
  const push = (n) => nums.push(`<button class="${n === page ? 'on' : ''}" data-page="${n}">${n}</button>`);
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) push(i);
  } else {
    push(1);
    if (page > 3) nums.push('<span class="gap">…</span>');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) push(i);
    if (page < pages - 2) nums.push('<span class="gap">…</span>');
    push(pages);
  }
  return `<div class="pager">
    <button data-page="${page - 1}"${page === 1 ? ' disabled' : ''}>Prev</button>
    ${nums.join('')}
    <button data-page="${page + 1}"${page === pages ? ' disabled' : ''}>Next</button>
  </div>`;
}

function refreshTable(id) {
  const host = document.getElementById(id);
  if (!host) return;
  host.innerHTML = renderTableInner(id);
  lucide.createIcons({ nameAttr: 'data-lucide' });
}

/* Tiles ------------------------------------------------------------------ */

function tile({ k, v, unit, icon: ic, delta, tone }) {
  return `
    <article class="tile">
      <div class="k">${ic ? icon(ic) : ''}<span>${esc(k)}</span></div>
      <div class="v">${v}${unit ? `<small>${esc(unit)}</small>` : ''}</div>
      ${delta ? `<div class="d">${delta}</div>` : ''}
    </article>`;
}

/* Bar chart -------------------------------------------------------------- */

function barChart(data, { fmt = (v) => nf.format(v) } = {}) {
  const max = Math.max(...data.map((d) => d.v), 1);
  return `<div class="chart">${data
    .map(
      (d, i) => `
      <div class="col" title="${esc(d.label)}: ${fmt(d.v)}">
        <div class="track">
          <div class="bar${d.v === 0 ? ' mute' : ''}" style="height:${Math.max(3, (d.v / max) * 100)}%;animation-delay:${i * 45}ms"></div>
        </div>
        <span class="lbl">${esc(d.short || d.label)}</span>
      </div>`
    )
    .join('')}</div>`;
}

/* --------------------------------------------------------------------------
   4. Pages
   -------------------------------------------------------------------------- */

const ROUTES = {};
const define = (id, section, label, render) => (ROUTES[id] = { id, section, label, render });

/* — Home ----------------------------------------------------------------- */

define('home', null, 'Home', () => {
  const months = DB.monthlySales.map((m) => ({
    label: m.month,
    short: m.month.split(' ')[0].slice(0, 3),
    v: m.sales,
  }));

  return (
    pageHead({
      eyebrow: 'Channel overview',
      title: `Good to see you, Ashwin`,
      sub: `Live position across the ${app.entity} distributor network. Everything below reflects the latest completed Tally sync.`,
      actions: `
        <button class="btn btn-ghost" data-act="export">${icon('download')} Export snapshot</button>
        <button class="btn btn-primary" data-act="sync">${icon('refresh-cw')} Sync now</button>`,
    }) +
    `<div class="tiles n6">
      ${tile({ k: 'Connected dealers', v: '3', icon: 'store', delta: `<span class="up">+1</span> this month` })}
      ${tile({ k: 'Synced in last 24h', v: '2', unit: '/ 3', icon: 'refresh-cw', delta: `1 dealer overdue` })}
      ${tile({ k: 'Secondary sales (YTD)', v: '₹1.61', unit: 'L', icon: 'trending-up', delta: `<span class="up">+8.4%</span> vs last year` })}
      ${tile({ k: 'Closing stock value', v: '₹27,896', icon: 'package', delta: `376 units across 36 SKUs` })}
      ${tile({ k: 'Mapping pending', v: '2', icon: 'git-compare', delta: `Dealers awaiting a HO match` })}
      ${tile({ k: 'Active rules', v: '4', icon: 'toggle-right', delta: `All companies enabled` })}
    </div>` +
    `<div class="split">
      <section class="card">
        ${cardHead({
          icon: 'bar-chart-3',
          title: 'Secondary sales by month',
          sub: 'FY 2025–26 · all mapped dealers',
          right: `<span class="badge badge-accent plain">₹1,61,011 total</span>`,
        })}
        <div class="card-body">${barChart(months, { fmt: money })}</div>
      </section>

      <section class="card">
        ${cardHead({ icon: 'activity', title: 'Sync health', sub: 'Last 7 days' })}
        <div class="card-body legend">
          <div class="row">
            <span class="name">SSV - Hotel Sri Ramanuja</span>
            <span class="badge badge-ok">Synced</span>
          </div>
          <div class="meter ok"><span style="width:100%"></span></div>
          <div class="row">
            <span class="name">SSV - Sri Murugan Agencies</span>
            <span class="badge badge-ok">Synced</span>
          </div>
          <div class="meter ok"><span style="width:92%"></span></div>
          <div class="row">
            <span class="name">SSV Ledgers Demo</span>
            <span class="badge badge-warn">4 days ago</span>
          </div>
          <div class="meter warn"><span style="width:38%"></span></div>
          <div class="divider"></div>
          <div class="kv">
            <div class="row"><span class="name">Vouchers exchanged</span><span class="val">29</span></div>
            <div class="row"><span class="name">Masters in sync</span><span class="val">50</span></div>
            <div class="row"><span class="name">Failed transfers</span><span class="val">0</span></div>
          </div>
        </div>
      </section>
    </div>` +
    dataTable({
      title: 'Recent sync activity',
      sub: 'Newest connector check-ins across the network',
      icon: 'history',
      rows: DB.syncLog,
      pageSize: 10,
      exportable: false,
      columns: [
        {
          key: 'company',
          label: 'Company',
          render: (r) => `
            <div class="rowcell">
              <span class="avatar a2">${esc(r.company.replace(/^SSV\s*-\s*/, '').slice(0, 2).toUpperCase())}</span>
              <span class="stack"><b>${esc(r.company)}</b><small>${esc(r.code || 'Head office')}</small></span>
            </div>`,
        },
        { key: 'dealer', label: 'Dealer' },
        { key: 'state', label: 'State' },
        { key: 'tally', label: 'Tally version', render: (r) => `<span class="badge badge-mute plain">${esc(r.tally)}</span>` },
        { key: 'at', label: 'Last sync', align: 'right', cls: 'strong' },
      ],
    })
  );
});

/* — Entity --------------------------------------------------------------- */

define('entity', null, 'Entity', () =>
  pageHead({
    eyebrow: 'Administration',
    title: 'Entities',
    sub: 'An entity is one principal organisation and the database its distributor data lands in.',
    actions: `<button class="btn btn-primary" data-toggle-card="new-entity">${icon('plus')} New entity</button>`,
  }) +
  `<section class="card collapsible" id="new-entity" data-open="false">
    ${cardHead({
      icon: 'building-2',
      title: 'Create a new entity',
      sub: 'Connection details can be added now or left for your DBA.',
      chev: true,
    })}
    <div class="fold"><div><div class="card-body stack-lg">
      <div class="grid">
        ${fText('Entity name', { placeholder: 'e.g. Udhayam Foods', req: true })}
        ${fText('Database name', { placeholder: 'e.g. udhayam_prod', req: true, hint: 'Lowercase, no spaces' })}
      </div>
      <label class="switch" data-more-toggle>
        <input type="checkbox"><span class="track"></span>
        <span class="txt">Provide database connection details</span>
      </label>
      <div class="fold" data-more hidden>
        <div class="grid">
          ${fText('DB host', { placeholder: 'db-blr-01.tallydex.in', lead: 'server' })}
          ${fText('DB port', { placeholder: '5432', lead: 'plug' })}
          ${fText('DB user', { placeholder: 'tallydex_app', lead: 'user' })}
          ${fText('DB password', { placeholder: '••••••••', lead: 'key-round' })}
        </div>
      </div>
      <div class="note accent">
        ${icon('info')}
        <div>Creating an entity provisions its schema and a connector key. <b>Dealers, stock items and price levels</b> are imported afterwards from the Import section.</div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" data-act="save">${icon('check')} Create entity</button>
        <button class="btn btn-ghost" data-toggle-card="new-entity">Cancel</button>
      </div>
    </div></div></div>
  </section>` +
  dataTable({
    title: 'Entities',
    sub: 'Every principal organisation configured on this portal',
    icon: 'database',
    rows: DB.entityRows,
    columns: [
      {
        key: 'name',
        label: 'Entity',
        render: (r) => `
          <div class="rowcell">
            <span class="avatar a1">${esc(r.name.slice(0, 2).toUpperCase())}</span>
            <span class="stack"><b>${esc(r.name)}</b><small>${esc(r.host)}</small></span>
          </div>`,
      },
      { key: 'id', label: 'Entity ID', cls: 'mono' },
      { key: 'rules', label: 'Rules', align: 'right', render: (r) => `<span class="badge badge-info plain">${r.rules}</span>` },
      { key: 'dealers', label: 'Dealers', align: 'right', cls: 'strong' },
      { key: 'synced', label: 'Last sync', align: 'right' },
      {
        key: '_',
        label: '',
        sort: false,
        cls: 'actions',
        render: () => `
          <div class="btn-row" style="justify-content:flex-end">
            <button class="btn btn-ghost btn-sm">${icon('settings-2')} Manage</button>
            <button class="btn btn-danger btn-sm btn-icon" data-act="delete" title="Delete entity">${icon('trash-2')}</button>
          </div>`,
      },
    ],
  })
);

/* — Users ---------------------------------------------------------------- */

define('users', null, 'Users', () =>
  pageHead({
    eyebrow: 'Administration',
    title: 'Users & access',
    sub: 'Who can sign in to Tally DEx for this entity, and what they are allowed to see.',
    actions: `<button class="btn btn-primary" data-toggle-card="new-user">${icon('user-plus')} Invite user</button>`,
  }) +
  `<section class="card collapsible" id="new-user" data-open="false">
    ${cardHead({ icon: 'user-plus', title: 'Invite a user', sub: 'They receive an email to set their own password.', chev: true })}
    <div class="fold"><div><div class="card-body stack-lg">
      <div class="grid">
        ${fText('Full name', { placeholder: 'e.g. Priya Raman', req: true })}
        ${fText('Email', { placeholder: 'name@company.com', req: true, lead: 'mail' })}
        ${fText('Mobile number', { placeholder: '10-digit number', lead: 'phone' })}
        ${fSelect('Role', ['Admin', 'User-L1', 'User-L2', 'Read only'], { req: true, placeholder: 'Select role' })}
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" data-act="save">${icon('send')} Send invite</button>
        <button class="btn btn-ghost" data-toggle-card="new-user">Cancel</button>
      </div>
    </div></div></div>
  </section>` +
  dataTable({
    title: 'Users',
    sub: 'Accounts with access to this entity',
    icon: 'users',
    rows: DB.users,
    columns: [
      {
        key: 'name',
        label: 'User',
        render: (r) => `
          <div class="rowcell">
            <span class="avatar a${(r.no % 4) + 1}">${esc(r.name.slice(0, 2).toUpperCase())}</span>
            <span class="stack"><b>${esc(r.name)}</b><small>${esc(r.email)}</small></span>
          </div>`,
      },
      { key: 'mobile', label: 'Mobile', cls: 'mono' },
      { key: 'role', label: 'Role', render: (r) => `<span class="badge badge-info">${esc(r.role)}</span>` },
      {
        key: 'active',
        label: 'Status',
        render: (r) =>
          `<label class="switch"><input type="checkbox"${r.active ? ' checked' : ''}><span class="track"></span><span class="txt">${
            r.active ? 'Active' : 'Disabled'
          }</span></label>`,
      },
      {
        key: '_',
        label: '',
        sort: false,
        cls: 'actions',
        render: () => `<button class="btn btn-ghost btn-sm">${icon('pencil')} Edit</button>`,
      },
    ],
  })
);

/* — Rules Activation ------------------------------------------------------ */

define('rules', null, 'Rules Activation', () =>
  pageHead({
    eyebrow: 'Administration',
    title: 'Rules activation',
    sub: 'Each rule links one Tally company to Tally DEx. Turning a rule off pauses its data exchange without removing history.',
    actions: `<button class="btn btn-ghost" data-act="export">${icon('download')} Export</button>`,
  }) +
  `<div class="tiles n4">
    ${tile({ k: 'Rules configured', v: '4', icon: 'list-checks' })}
    ${tile({ k: 'Active', v: '4', icon: 'toggle-right', delta: 'Exchanging data now' })}
    ${tile({ k: 'Paused', v: '0', icon: 'pause-circle' })}
    ${tile({ k: 'Tally serials', v: '2', icon: 'fingerprint', delta: '735352083 · 711020736' })}
  </div>` +
  dataTable({
    title: 'Rules',
    sub: 'Companies registered against this entity',
    icon: 'toggle-right',
    rows: DB.rules,
    columns: [
      {
        key: 'company',
        label: 'Company',
        render: (r) => `
          <div class="rowcell">
            <span class="avatar a2">${esc(r.company.replace(/^SSV\s*-?\s*/, '').slice(0, 2).toUpperCase())}</span>
            <span class="stack"><b>${esc(r.company)}</b><small>Serial ${esc(r.slno)}</small></span>
          </div>`,
      },
      { key: 'entity', label: 'Entity ID', cls: 'mono' },
      { key: 'guid', label: 'Company GUID', cls: 'mono' },
      { key: 'status', label: 'State', render: (r) => `<span class="badge badge-ok">${esc(r.status)}</span>` },
      {
        key: '_',
        label: 'Enabled',
        sort: false,
        cls: 'actions',
        render: (r) =>
          `<label class="switch"><input type="checkbox"${r.status === 'Active' ? ' checked' : ''}><span class="track"></span></label>`,
      },
    ],
  })
);

/* — Import: shared upload panel ------------------------------------------ */

function importPage({ title, sub, template, columns, rows, tableTitle, empty, note }) {
  return (
    pageHead({
      eyebrow: 'Import',
      title,
      sub,
      actions: `<button class="btn btn-ghost" data-act="template">${icon('file-down')} Download template</button>`,
    }) +
    `<section class="card">
      ${cardHead({ icon: 'upload-cloud', title: 'Upload a file', sub: `Rows are validated before anything is written to ${esc(app.entity)}.` })}
      <div class="card-body stack-lg">
        <div class="grid cols-2">
          ${fFile('Source file')}
          <div class="field">
            <label>Expected columns</label>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${template.map((c) => `<span class="badge badge-mute plain">${esc(c)}</span>`).join('')}
            </div>
            <span class="hint">Column order does not matter; headers must match exactly.</span>
          </div>
        </div>
        ${note ? `<div class="note">${icon('info')}<div>${note}</div></div>` : ''}
        <div class="btn-row">
          <button class="btn btn-primary" data-act="upload">${icon('upload')} Validate &amp; import</button>
          <button class="btn btn-ghost" data-act="template">${icon('file-down')} Template</button>
        </div>
      </div>
    </section>` +
    dataTable({
      title: tableTitle,
      sub: 'Currently held for this entity',
      icon: 'table-2',
      rows,
      columns,
      empty,
    })
  );
}

define('import/dealers', 'Import', 'Import dealers', () =>
  importPage({
    title: 'Import dealers',
    sub: 'Load your distributor master — codes, names and the territory hierarchy they roll up to.',
    template: ['DELCODE', 'DELNAME', 'STATE', 'REGION', 'DIVISION', 'SALESOFFR', 'AREAMANGR', 'STATEHEAD', 'DGM'],
    tableTitle: 'Dealers on file',
    rows: DB.dealers,
    note: 'Existing dealers are matched on <b>DELCODE</b> and updated in place — re-uploading the full master is safe.',
    columns: [
      { key: 'code', label: 'Code', cls: 'mono' },
      {
        key: 'name',
        label: 'Dealer',
        render: (r) => `<div class="rowcell"><span class="avatar a3">${esc(r.name.slice(0, 2).toUpperCase())}</span><b>${esc(r.name)}</b></div>`,
      },
      { key: 'state', label: 'State' },
      { key: 'region', label: 'Region', render: (r) => `<span class="badge badge-mute plain">${esc(r.region)}</span>` },
      { key: 'division', label: 'Division' },
      { key: 'so', label: 'Sales officer' },
      { key: 'am', label: 'Area manager' },
      { key: 'ts', label: 'Imported', align: 'right' },
    ],
  })
);

define('import/stock-items', 'Import', 'Import Stock Item', () =>
  importPage({
    title: 'Import stock items',
    sub: 'The single product master every distributor’s catalogue will be reconciled against.',
    template: ['SKUCODE', 'SKUDESC', 'BASEUNIT', 'ADDLUNIT', 'DENOMI', 'MRPPRICE', 'COSTPRICE', 'HSNCODE', 'GSTRATE'],
    tableTitle: 'Stock items',
    rows: DB.stockItems,
    columns: [
      { key: 'sku', label: 'SKU code', cls: 'mono' },
      { key: 'desc', label: 'Description', cls: 'strong' },
      { key: 'unit', label: 'Base unit' },
      { key: 'add', label: 'Alt unit' },
      { key: 'denom', label: 'Denom', align: 'right' },
      { key: 'mrp', label: 'MRP', align: 'right', render: (r) => `<b>${money(r.mrp)}</b>` },
      { key: 'cost', label: 'Cost', align: 'right', render: (r) => money(r.cost) },
      { key: 'hsn', label: 'HSN', cls: 'mono' },
      { key: 'gst', label: 'GST %', align: 'right', render: (r) => `<span class="badge badge-mute plain">${r.gst}%</span>` },
      { key: 'mrpDate', label: 'Effective', align: 'right' },
    ],
  })
);

define('import/price-level', 'Import', 'Price Level', () =>
  pageHead({
    eyebrow: 'Import',
    title: 'Price levels',
    sub: 'Name the pricing tiers used in each state. Dealers are then attached to a tier, and rates hang off the tier.',
  }) +
  `<section class="card">
    ${cardHead({ icon: 'plus', title: 'Add a price level' })}
    <div class="card-body stack-lg">
      <div class="grid">
        ${fSelect('State', ['Karnataka', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Telangana'], { req: true })}
        ${fText('Price level name', { placeholder: 'e.g. Super Stockiest Tier 4', req: true })}
      </div>
      <div class="btn-row"><button class="btn btn-primary" data-act="save">${icon('plus')} Add price level</button></div>
    </div>
  </section>` +
  dataTable({
    title: 'Price levels',
    sub: 'Defined for this entity',
    icon: 'layers',
    rows: DB.priceLevels,
    columns: [
      { key: 'id', label: '#', align: 'right', cls: 'mono' },
      { key: 'state', label: 'State' },
      { key: 'level', label: 'Price level', cls: 'strong' },
      {
        key: '_',
        label: '',
        sort: false,
        cls: 'actions',
        render: () => `
          <div class="btn-row" style="justify-content:flex-end">
            <button class="btn btn-ghost btn-sm btn-icon" title="Rename">${icon('pencil')}</button>
            <button class="btn btn-danger btn-sm btn-icon" title="Remove">${icon('trash-2')}</button>
          </div>`,
      },
    ],
  })
);

define('import/stock-price-level', 'Import', 'Stockitem Price Level Upload', () =>
  importPage({
    title: 'Stock item price levels',
    sub: 'Slab rates and discounts per SKU, per price level — the pricing that gets pushed out to every distributor.',
    template: ['APLLDT', 'ITEMNAME', 'PRICELEVEL', 'STATE', 'FROMQTY', 'TOQTY', 'DISC', 'RATE'],
    tableTitle: 'Rate slabs',
    rows: DB.skuPriceLevels,
    note: 'Leave <b>FROMQTY</b> and <b>TOQTY</b> blank for a flat rate. Overlapping slabs are rejected during validation.',
    columns: [
      { key: 'date', label: 'Effective' },
      { key: 'item', label: 'Item', cls: 'strong' },
      { key: 'level', label: 'Price level', render: (r) => `<span class="badge badge-accent plain">${esc(r.level)}</span>` },
      { key: 'state', label: 'State' },
      { key: 'from', label: 'From qty', align: 'right' },
      { key: 'to', label: 'To qty', align: 'right' },
      { key: 'disc', label: 'Disc %', align: 'right' },
      { key: 'rate', label: 'Rate', align: 'right', render: (r) => `<b>${money(r.rate)}</b>` },
      { key: 'ts', label: 'Imported', align: 'right' },
    ],
  })
);

define('import/dealer-customers', 'Import', 'Dealer Customer Upload', () =>
  importPage({
    title: 'Dealer customers',
    sub: 'The retailer and sub-dealer list sitting below each distributor — needed for true secondary sales visibility.',
    template: ['DELCODE', 'CUSTCODE', 'CUSTNAME', 'STATE', 'CITY', 'GSTIN', 'ROUTE'],
    tableTitle: 'Dealer customers',
    rows: [],
    empty: {
      art: 'users-round',
      accent: true,
      title: 'No dealer customers imported yet',
      hint: 'Upload the retailer list for each distributor to unlock route-level and retailer-level sales reporting.',
      actions: `<button class="btn btn-primary btn-sm" data-act="template">${icon('file-down')} Download template</button>`,
    },
    columns: [
      { key: 'delcode', label: 'Dealer code', cls: 'mono' },
      { key: 'custcode', label: 'Customer code', cls: 'mono' },
      { key: 'custname', label: 'Customer' },
      { key: 'state', label: 'State' },
      { key: 'city', label: 'City' },
      { key: 'gstin', label: 'GSTIN', cls: 'mono' },
    ],
  })
);

/* — Mapping -------------------------------------------------------------- */

define('map/stock-manual', 'Mapping', 'Stock Item - Manual', () =>
  pageHead({
    eyebrow: 'Mapping',
    title: 'Stock item mapping — manual',
    sub: 'Pair a distributor’s own item name with the matching head-office SKU. Do the tricky ones here; let the matcher handle the rest.',
    actions: `<button class="btn btn-ghost" data-route="map/stock-auto">${icon('wand-2')} Try automatic matching</button>`,
  }) +
  `<section class="card">
    ${cardHead({ icon: 'git-compare', title: 'Create a mapping', sub: 'Pick one item on each side, set the pack size, then add.' })}
    <div class="card-body stack-lg">
      ${fSelect('Company', DB.companies, { req: true, placeholder: 'Select a company' })}
      <div class="pair">
        <div>
          <div class="pane-label">${icon('store')} Dealer item</div>
          ${fSelect('', ['Udhayam Ghee 100ml Pouch', 'UDHAYAM GHEE 200 ML', 'Badam Mix 100 GM'], { placeholder: 'Search dealer catalogue…' })}
        </div>
        <div class="arrow-cell">${icon('arrow-right')}</div>
        <div>
          <div class="pane-label">${icon('database')} Head-office SKU</div>
          ${fSelect('', DB.stockItems.map((s) => `${s.sku} · ${s.desc}`), { placeholder: 'Search master catalogue…' })}
        </div>
      </div>
      <div class="grid" style="max-width:340px">
        ${fText('Pack size', { value: '1', hint: 'Dealer units contained in one HO unit' })}
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" data-act="save">${icon('link')} Add mapping</button>
        <button class="btn btn-ghost" data-act="reset">Clear</button>
      </div>
    </div>
  </section>` +
  dataTable({
    title: 'Mappings in this session',
    sub: 'Nothing is committed until you save',
    icon: 'link-2',
    rows: [],
    exportable: false,
    search: false,
    empty: {
      art: 'link',
      accent: true,
      title: 'No mappings staged',
      hint: 'Select a company, pair a dealer item with a head-office SKU and click “Add mapping”. Staged rows appear here.',
    },
    columns: [
      { key: 'company', label: 'Company' },
      { key: 'dealerItem', label: 'Dealer item' },
      { key: 'hoSku', label: 'HO SKU' },
      { key: 'pack', label: 'Pack size', align: 'right' },
    ],
  })
);

define('map/stock-auto', 'Mapping', 'Stock Item - Automatic', () =>
  pageHead({
    eyebrow: 'Mapping',
    title: 'Stock item mapping — automatic',
    sub: 'Tally DEx proposes matches by name, code and pack size. Review the confidence, then accept in bulk.',
  }) +
  filterBar({
    fields: [
      fSelect('Company', DB.companies, { placeholder: 'All companies' }),
      fSelect('Items', ['Unmapped only', 'All items'], { value: 'Unmapped only', placeholder: '' }),
    ],
    advanced: [
      fSelect('State', ['Karnataka', 'Tamil Nadu', 'Kerala']),
      fSelect('Region', ['WEST', 'SOUTH', 'NORTH', 'EAST']),
      fSelect('Division', ['—']),
      fSelect('Group 1', ['—']),
      fSelect('Group 2', ['—']),
    ],
    submit: 'Find matches',
  }) +
  dataTable({
    title: 'Suggested matches',
    icon: 'wand-2',
    rows: [],
    search: false,
    empty: {
      art: 'wand-2',
      accent: true,
      title: 'Ready when you are',
      hint: 'Choose a company and run the matcher. Suggestions are ranked by confidence — anything above 90% is usually safe to accept in bulk.',
    },
    columns: [
      { key: 'dealerItem', label: 'Dealer item' },
      { key: 'hoSku', label: 'Suggested HO SKU' },
      { key: 'conf', label: 'Confidence', align: 'right' },
    ],
  })
);

define('map/dealer-manual', 'Mapping', 'Dealer Mapping - Manual', () =>
  pageHead({
    eyebrow: 'Mapping',
    title: 'Dealer mapping — manual',
    sub: 'Connect a Tally company that is syncing with you to the dealer record in your own master.',
  }) +
  `<section class="card">
    ${cardHead({ icon: 'git-compare', title: 'Create a mapping' })}
    <div class="card-body stack-lg">
      <div class="pair">
        <div>
          <div class="pane-label">${icon('building')} Syncing company</div>
          ${fSelect('', DB.companies, { placeholder: 'Select a company' })}
        </div>
        <div class="arrow-cell">${icon('arrow-right')}</div>
        <div>
          <div class="pane-label">${icon('store')} Dealer in your master</div>
          ${fSelect('', DB.dealers.map((d) => `${d.code} · ${d.name}`), { placeholder: 'Select a dealer' })}
        </div>
      </div>
      <div class="btn-row"><button class="btn btn-primary" data-act="save">${icon('link')} Add mapping</button></div>
    </div>
  </section>` +
  dataTable({
    title: 'Existing dealer mappings',
    icon: 'link-2',
    rows: DB.dealerMapped,
    columns: [
      { key: 'coid', label: 'Co. ID', align: 'right', cls: 'mono' },
      { key: 'name', label: 'Syncing company', cls: 'strong' },
      { key: 'code', label: 'Dealer code', cls: 'mono' },
      { key: 'hoName', label: 'Dealer in master' },
      {
        key: '_',
        label: '',
        sort: false,
        cls: 'actions',
        render: () => `<button class="btn btn-danger btn-sm">${icon('unlink')} Unmap</button>`,
      },
    ],
  })
);

define('map/dealer-price-level', 'Mapping', 'Dealer Price Level Mapping', () =>
  pageHead({
    eyebrow: 'Mapping',
    title: 'Dealer price level mapping',
    sub: 'Choose which price tiers a dealer is entitled to. Only the ticked levels are pushed into their Tally.',
  }) +
  filterBar({
    fields: [fSelect('Dealer', DB.dealers.map((d) => d.name), { value: 'Hotel Sri Ramanuja', placeholder: 'Select a dealer' })],
    submit: 'Load price levels',
  }) +
  `<section class="card">
    ${cardHead({
      icon: 'layers',
      title: 'Price levels for Hotel Sri Ramanuja',
      sub: 'Karnataka · 3 levels available',
      right: `<button class="btn btn-primary btn-sm" data-act="save">${icon('check')} Save changes</button>`,
    })}
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>State</th><th>Price level</th><th>Rate slabs</th><th style="width:120px">Entitled</th></tr></thead>
        <tbody>
          ${DB.priceLevels
            .map(
              (p, i) => `
            <tr>
              <td>${esc(p.state)}</td>
              <td class="strong">${esc(p.level)}</td>
              <td><span class="badge badge-mute plain">${[10, 4, 2][i]} slabs</span></td>
              <td><label class="switch"><input type="checkbox"${i > 0 ? ' checked' : ''}><span class="track"></span></label></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </section>`
);

/* — Mapping Report -------------------------------------------------------- */

const advFilters = () => [
  fSelect('State', ['Karnataka', 'Tamil Nadu', 'Kerala']),
  fSelect('Region', ['WEST', 'SOUTH', 'NORTH', 'EAST']),
  fSelect('Items', ['All items']),
  fSelect('Division', ['—']),
  fSelect('Group 1', ['—']),
  fSelect('Group 2', ['—']),
];

define('mapreport/stock-pending', 'Mapping Report', 'Stock item - Mapping Pending', () =>
  pageHead({
    eyebrow: 'Mapping report',
    title: 'Stock items pending mapping',
    sub: 'Items a distributor is selling that have no head-office SKU behind them. Until they are mapped, their sales sit outside your reports.',
    actions: `<button class="btn btn-primary" data-route="map/stock-auto">${icon('wand-2')} Map these items</button>`,
  }) +
  filterBar({ fields: [fSelect('Company', DB.companies, { placeholder: 'All companies' })], advanced: advFilters() }) +
  dataTable({
    title: 'Pending items',
    icon: 'circle-alert',
    rows: [],
    empty: {
      art: 'party-popper',
      accent: true,
      title: 'Nothing pending',
      hint: 'Every stock item reported by this entity’s distributors is mapped to a head-office SKU. Sales and stock figures are complete.',
    },
    columns: [
      { key: 'company', label: 'Company' },
      { key: 'item', label: 'Dealer item' },
      { key: 'qty', label: 'Qty seen', align: 'right' },
      { key: 'lastSeen', label: 'Last seen', align: 'right' },
    ],
  })
);

define('mapreport/stock-mapped', 'Mapping Report', 'Stock item - Mapped/Un Map', () =>
  pageHead({
    eyebrow: 'Mapping report',
    title: 'Stock items mapped',
    sub: 'Every dealer item currently pointing at a head-office SKU. Unmap anything that was matched incorrectly.',
  }) +
  filterBar({ fields: [fSelect('Company', DB.companies, { placeholder: 'All companies' })], advanced: advFilters() }) +
  dataTable({
    title: 'Mapped items',
    icon: 'link-2',
    rows: [],
    empty: {
      art: 'search-x',
      title: 'No results for these filters',
      hint: 'Select a company and search. Mapped item pairs will be listed here with the option to unmap.',
    },
    columns: [
      { key: 'company', label: 'Company' },
      { key: 'dealerItem', label: 'Dealer item' },
      { key: 'hoSku', label: 'HO SKU' },
      { key: 'pack', label: 'Pack size', align: 'right' },
    ],
  })
);

define('mapreport/dealer-pending', 'Mapping Report', 'Dealer - Mapping Pending', () =>
  pageHead({
    eyebrow: 'Mapping report',
    title: 'Dealers pending mapping',
    sub: 'Tally companies that are syncing but have not been matched to a dealer in your master yet.',
    actions: `<button class="btn btn-primary" data-route="map/dealer-manual">${icon('link')} Map dealers</button>`,
  }) +
  `<div class="note accent">${icon('triangle-alert')}<div><b>2 companies are sending data you can’t attribute.</b> Map them to a dealer code so their sales and stock appear in the reports below.</div></div>` +
  dataTable({
    title: 'Unmapped companies',
    icon: 'circle-alert',
    rows: DB.dealerPending,
    columns: [
      {
        key: 'name',
        label: 'Company',
        render: (r) => `<div class="rowcell"><span class="avatar a2">${esc(r.name.slice(0, 2).toUpperCase())}</span><b>${esc(r.name)}</b></div>`,
      },
      { key: 'mail', label: 'Mailing name' },
      { key: 'state', label: 'State' },
      { key: 'guid', label: 'GUID', cls: 'mono' },
      {
        key: '_',
        label: '',
        sort: false,
        cls: 'actions',
        render: () => `<button class="btn btn-primary btn-sm" data-route="map/dealer-manual">${icon('link')} Map</button>`,
      },
    ],
  })
);

define('mapreport/dealer-mapped', 'Mapping Report', 'Dealer - Mapped/Un Map', () =>
  pageHead({
    eyebrow: 'Mapping report',
    title: 'Dealers mapped',
    sub: 'Companies successfully linked to a dealer code in your master.',
  }) +
  dataTable({
    title: 'Mapped dealers',
    icon: 'link-2',
    rows: DB.dealerMapped,
    columns: [
      { key: 'coid', label: 'Co. ID', align: 'right', cls: 'mono' },
      {
        key: 'name',
        label: 'Syncing company',
        render: (r) => `<div class="rowcell"><span class="avatar a3">${esc(r.hoName.slice(0, 2).toUpperCase())}</span><span class="stack"><b>${esc(r.name)}</b><small>${esc(r.hoName)}</small></span></div>`,
      },
      { key: 'code', label: 'Dealer code', cls: 'mono' },
      { key: 'hoid', label: 'HO ID', align: 'right', cls: 'mono' },
      {
        key: '_',
        label: '',
        sort: false,
        cls: 'actions',
        render: () => `<button class="btn btn-danger btn-sm">${icon('unlink')} Unmap</button>`,
      },
    ],
  })
);

/* — Report --------------------------------------------------------------- */

define('report/synclog', 'Report', 'SyncLog', () =>
  pageHead({
    eyebrow: 'Report',
    title: 'Sync log',
    sub: 'The last connector check-in from every company registered against this entity.',
    actions: `<button class="btn btn-ghost" data-act="export">${icon('download')} Export</button>`,
  }) +
  dataTable({
    title: 'Connector check-ins',
    icon: 'refresh-cw',
    rows: DB.syncLog,
    columns: [
      {
        key: 'company',
        label: 'Company',
        render: (r) => `<div class="rowcell"><span class="avatar a2">${esc(r.company.replace(/^SSV\s*-?\s*/, '').slice(0, 2).toUpperCase())}</span><b>${esc(r.company)}</b></div>`,
      },
      { key: 'dealer', label: 'Dealer' },
      { key: 'code', label: 'Code', cls: 'mono' },
      { key: 'state', label: 'State' },
      { key: 'region', label: 'Region' },
      { key: 'tally', label: 'Tally version', render: (r) => `<span class="badge badge-mute plain">${esc(r.tally)}</span>` },
      { key: 'at', label: 'Last sync', align: 'right', cls: 'strong' },
    ],
  })
);

define('report/synclog-summary', 'Report', 'Synclog_summ', () => {
  const today = 3;
  const cells = [];
  for (let i = 26; i <= 31; i++) cells.push({ n: i, out: true });
  cells.push({ n: 1, out: false, syncs: 0 });
  for (let d = 2; d <= 31; d++) {
    const syncs = d <= today ? (d === today ? 2 : (d % 4 === 0 ? 0 : 3)) : null;
    cells.push({ n: d, out: false, syncs, today: d === today, future: d > today });
  }
  for (let i = 1; i <= 5; i++) cells.push({ n: i, out: true });

  return (
    pageHead({
      eyebrow: 'Report',
      title: 'Sync summary',
      sub: 'A month at a glance — which distributors checked in on which day. Click any date for the detail.',
    }) +
    `<div class="tiles n4">
      ${tile({ k: 'Total dealers', v: '3', icon: 'store' })}
      ${tile({ k: 'Synced in last 7 days', v: '2', icon: 'refresh-cw', delta: '67% of the network' })}
      ${tile({ k: 'Pending sync', v: '1', icon: 'clock', delta: 'SSV Ledgers Demo · 4 days' })}
      ${tile({ k: 'Longest gap', v: '4', unit: 'days', icon: 'trending-down' })}
    </div>` +
    `<section class="card">
      <div class="cal-head">
        <button class="btn btn-ghost btn-sm btn-icon">${icon('chevron-left')}</button>
        <button class="btn btn-ghost btn-sm btn-icon">${icon('chevron-right')}</button>
        <span class="month">August 2026</span>
        <button class="btn btn-ghost btn-sm">Today</button>
        <span class="grow" style="flex:1"></span>
        <span style="display:flex;gap:14px;font-size:11.5px;color:var(--text-3);align-items:center">
          <span style="display:flex;align-items:center;gap:6px"><i style="width:7px;height:7px;border-radius:50%;background:var(--ok);display:block"></i>All synced</span>
          <span style="display:flex;align-items:center;gap:6px"><i style="width:7px;height:7px;border-radius:50%;background:var(--warn);display:block"></i>Partial</span>
          <span style="display:flex;align-items:center;gap:6px"><i style="width:7px;height:7px;border-radius:50%;background:var(--text-4);display:block"></i>No sync</span>
        </span>
      </div>
      <div class="cal">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<div class="dow">${d}</div>`).join('')}
        ${cells
          .map((c) => {
            if (c.out) return `<div class="day out"><span class="n">${c.n}</span></div>`;
            let pips = '';
            let tot = '';
            if (c.syncs !== null && c.syncs !== undefined && !c.future) {
              const cls = c.syncs === 3 ? '' : c.syncs === 0 ? 'off' : 'warn';
              pips = `<div class="pips">${Array.from({ length: Math.max(c.syncs, 1) })
                .map(() => `<span class="pip ${cls}"></span>`)
                .join('')}</div>`;
              tot = `<span class="tot">${c.syncs}/3</span>`;
            }
            return `<button class="day${c.today ? ' today' : ''}"><span class="n">${c.n}</span>${pips}${tot}</button>`;
          })
          .join('')}
      </div>
    </section>`
  );
});

define('report/principal-sales', 'Report', 'Principal Company wise Sales Report', () =>
  pageHead({
    eyebrow: 'Report',
    title: 'Sales by principal company',
    sub: 'Secondary sales rolled up per syncing company for the selected period.',
    actions: `<button class="btn btn-ghost" data-act="export">${icon('download')} Export</button>`,
  }) +
  filterBar({
    fields: [fSelect('Company', DB.companies, { placeholder: 'All companies' }), fDateRange('Period')],
    advanced: advFilters(),
  }) +
  `<div class="tiles n4">
    ${tile({ k: 'Net sales', v: '₹3.04', unit: 'L', icon: 'trending-up', delta: `<span class="up">+12.1%</span> vs prior period` })}
    ${tile({ k: 'Invoices', v: '29', icon: 'receipt' })}
    ${tile({ k: 'Units moved', v: '2,420', icon: 'package' })}
    ${tile({ k: 'Sales returns', v: '₹1,250', icon: 'undo-2', delta: '0.4% of net sales' })}
  </div>` +
  dataTable({
    title: 'Company-wise sales',
    icon: 'bar-chart-3',
    rows: DB.principalSales,
    totals: {
      company: 'Total',
      invoices: '29',
      qty: nf.format(2420),
      value: money(304421.85),
      ret: money(1250),
    },
    columns: [
      {
        key: 'company',
        label: 'Company',
        render: (r) => `<div class="rowcell"><span class="avatar a1">${esc(r.company.replace(/^SSV\s*-?\s*/, '').slice(0, 2).toUpperCase())}</span><span class="stack"><b>${esc(r.company)}</b><small>${esc(r.code)}</small></span></div>`,
      },
      { key: 'state', label: 'State' },
      { key: 'invoices', label: 'Invoices', align: 'right' },
      { key: 'qty', label: 'Qty', align: 'right' },
      { key: 'value', label: 'Sales value', align: 'right', render: (r) => `<b>${money(r.value)}</b>` },
      { key: 'ret', label: 'Returns', align: 'right', render: (r) => (r.ret ? money(r.ret) : '<span class="muted">—</span>') },
    ],
  })
);

define('report/closing-stock', 'Report', 'Closing Stock', () =>
  pageHead({
    eyebrow: 'Report',
    title: 'Closing stock',
    sub: 'What is physically sitting in the channel right now, SKU by SKU, as of each distributor’s last sync.',
    actions: `<button class="btn btn-ghost" data-act="export">${icon('download')} Export</button>`,
  }) +
  filterBar({ fields: [fSelect('Company', DB.companies, { placeholder: 'All companies' })], advanced: advFilters() }) +
  `<div class="tiles n4">
    ${tile({ k: 'Stock value', v: '₹27,896', icon: 'wallet', delta: 'Across 36 SKUs' })}
    ${tile({ k: 'Units on hand', v: '376', icon: 'package' })}
    ${tile({ k: 'Negative balances', v: '4', icon: 'triangle-alert', delta: '<span class="down">Needs review</span>' })}
    ${tile({ k: 'As on', v: '23 Mar', unit: '2026', icon: 'calendar-days' })}
  </div>` +
  `<div class="note">${icon('triangle-alert')}<div><b>4 SKUs are showing a negative balance.</b> This usually means sales were recorded before the corresponding purchase was synced — worth checking with the distributor.</div></div>` +
  dataTable({
    title: 'Stock positions',
    icon: 'package',
    rows: DB.closingStock,
    totals: { name: 'Total', qty: nf.format(546), val: money(52436.93) },
    columns: [
      { key: 'dealer', label: 'Dealer', cls: 'strong' },
      { key: 'code', label: 'Code', cls: 'mono' },
      { key: 'state', label: 'State' },
      { key: 'region', label: 'Region' },
      { key: 'name', label: 'Item' },
      { key: 'sku', label: 'SKU', cls: 'mono' },
      { key: 'unit', label: 'Unit' },
      {
        key: 'qty',
        label: 'Qty',
        align: 'right',
        render: (r) => (r.qty < 0 ? `<b style="color:var(--danger)">${nf.format(r.qty)}</b>` : `<b>${nf.format(r.qty)}</b>`),
      },
      {
        key: 'val',
        label: 'Value',
        align: 'right',
        render: (r) => (r.val < 0 ? `<span style="color:var(--danger)">${money(r.val)}</span>` : money(r.val)),
      },
      { key: 'date', label: 'As on', align: 'right' },
    ],
  })
);

define('report/statistics', 'Report', 'Statistics', () =>
  pageHead({
    eyebrow: 'Report',
    title: 'Voucher statistics',
    sub: 'Volume of documents exchanged with the selected company, broken down by voucher type.',
  }) +
  filterBar({
    fields: [fSelect('Company', DB.companies, { value: 'SSV - Sri Murugan Agencies', placeholder: 'Select a company' }), fDateRange('Period')],
  }) +
  `<div class="split">
    ${dataTable({
      title: 'By voucher type',
      icon: 'list-checks',
      rows: DB.statistics,
      search: false,
      exportable: false,
      totals: { type: 'Total', cancl: '0', del: '3', optnl: '2', total: '25' },
      columns: [
        { key: 'type', label: 'Voucher type', cls: 'strong' },
        { key: 'typeId', label: 'Type ID', align: 'right', cls: 'mono' },
        { key: 'cancl', label: 'Cancelled', align: 'right' },
        { key: 'del', label: 'Deleted', align: 'right' },
        { key: 'optnl', label: 'Optional', align: 'right' },
        { key: 'total', label: 'Total', align: 'right', render: (r) => `<b>${r.total}</b>` },
      ],
    })}
    <section class="card">
      ${cardHead({ icon: 'pie-chart', title: 'Mix', sub: '25 vouchers in period' })}
      <div class="card-body legend">
        ${DB.statistics
          .map((s, i) => {
            const pct = Math.round((s.total / 25) * 100);
            return `
              <div class="row"><span class="name">${esc(s.type)}</span><span class="val">${s.total}</span><span class="badge badge-mute plain">${pct}%</span></div>
              <div class="meter${i === 0 ? '' : i === 1 ? ' ok' : ' warn'}"><span style="width:${pct}%"></span></div>`;
          })
          .join('')}
        <div class="divider"></div>
        <div class="kv">
          <div class="row"><span class="name">Cancelled</span><span class="val">0</span></div>
          <div class="row"><span class="name">Deleted</span><span class="val">3</span></div>
          <div class="row"><span class="name">Optional</span><span class="val">2</span></div>
        </div>
      </div>
    </section>
  </div>`
);

define('report/daily-summary', 'Report', 'Daily Summary', () =>
  pageHead({
    eyebrow: 'Report',
    title: 'Voucher register',
    sub: 'Every voucher received from the selected company, with drill-through to its ledgers and line items.',
    actions: `<button class="btn btn-ghost" data-act="export">${icon('download')} Export</button>`,
  }) +
  filterBar({
    fields: [fSelect('Company', DB.companies, { value: 'SSV - HO', placeholder: 'Select a company' }), fDateRange('Period')],
  }) +
  dataTable({
    title: 'Vouchers',
    icon: 'receipt',
    rows: DB.vouchers,
    columns: [
      { key: 'id', label: 'Vch ID', align: 'right', cls: 'mono' },
      { key: 'no2', label: 'Vch no.', render: (r) => `<span class="link">${esc(r.no2)}</span>` },
      { key: 'date', label: 'Date' },
      {
        key: 'type',
        label: 'Type',
        render: (r) => `<span class="badge ${r.type === 'Sales' ? 'badge-ok' : 'badge-info'}">${esc(r.type)}</span>`,
      },
      { key: 'typeId', label: 'Type ID', align: 'right', cls: 'mono' },
      { key: 'party', label: 'Party ledger', cls: 'strong' },
      {
        key: '_',
        label: '',
        sort: false,
        cls: 'actions',
        render: () => `
          <div class="btn-row" style="justify-content:flex-end">
            <button class="btn btn-ghost btn-sm">${icon('book-open')} Ledgers</button>
            <button class="btn btn-ghost btn-sm">${icon('list')} Items</button>
          </div>`,
      },
    ],
  })
);

define('report/daily-summary-2', 'Report', 'Daily Summary 2', () => {
  const months = DB.monthlySales.map((m) => ({ label: m.month, short: m.month.split(' ')[0].slice(0, 3), v: m.sales }));
  return (
    pageHead({
      eyebrow: 'Report',
      title: 'Data summary',
      sub: 'One-page health check for a distributor: what has been received, and what it adds up to.',
      actions: `<button class="btn btn-ghost" data-act="export">${icon('download')} Export</button>`,
    }) +
    filterBar({
      fields: [
        fSelect('Company', DB.companies, { value: 'SSV - Hotel Sri Ramanuja', placeholder: 'Select a company' }),
        fDateRange('Period'),
      ],
    }) +
    `<div class="split">
      <section class="card">
        ${cardHead({
          icon: 'bar-chart-3',
          title: 'Sales by month',
          sub: '01 Apr 2025 — 31 Mar 2026',
          right: `<span class="badge badge-accent plain">${money(161011.35)}</span>`,
        })}
        <div class="card-body">${barChart(months, { fmt: money })}</div>
      </section>
      <div class="stack-lg">
        <section class="card">
          ${cardHead({ icon: 'boxes', title: 'Masters received' })}
          <div class="card-body kv">
            <div class="row"><span class="name">Ledgers</span><span class="val">12</span></div>
            <div class="row"><span class="name">Stock items</span><span class="val">38</span></div>
          </div>
        </section>
        <section class="card">
          ${cardHead({ icon: 'receipt', title: 'Transactions received' })}
          <div class="card-body kv">
            <div class="row"><span class="name">Sales</span><span class="val">15</span></div>
            <div class="row"><span class="name">Sales order</span><span class="val">15</span></div>
            <div class="row"><span class="name">Purchase</span><span class="val">4</span></div>
            <div class="row"><span class="name">Purchase order</span><span class="val">8</span></div>
          </div>
        </section>
        <section class="card">
          ${cardHead({ icon: 'package', title: 'Closing stock', sub: 'As on 03 Aug 2026' })}
          <div class="card-body kv">
            <div class="row"><span class="name">Units</span><span class="val">376.00</span></div>
            <div class="row"><span class="name">Value</span><span class="val">${money(27896.64)}</span></div>
          </div>
        </section>
      </div>
    </div>` +
    dataTable({
      title: 'Monthly detail',
      icon: 'calendar-range',
      rows: DB.monthlySales,
      search: false,
      totals: { month: 'Total', sales: money(161011.35), ret: money(0) },
      columns: [
        { key: 'month', label: 'Month', cls: 'strong' },
        { key: 'sales', label: 'Sales', align: 'right', render: (r) => `<b>${money(r.sales)}</b>` },
        { key: 'ret', label: 'Sales return', align: 'right', render: (r) => money(r.ret) },
      ],
    })
  );
});

/* --------------------------------------------------------------------------
   5. Router
   -------------------------------------------------------------------------- */

function navigate(routeId, { silent = false } = {}) {
  const route = ROUTES[routeId] || ROUTES.home;
  app.route = route.id;
  tables.clear();
  uid = 0;

  // sidebar active state
  $$('.nav-item, .submenu-item').forEach((n) => n.classList.remove('active'));
  const link = $(`[data-route="${route.id}"]`);
  if (link) {
    link.classList.add('active');
    const group = link.closest('.nav-group');
    if (group) {
      $$('.nav-group').forEach((g) => g !== group && g.classList.remove('expanded'));
      group.classList.add('expanded');
      group.querySelector('.nav-item').classList.add('active');
    } else {
      $$('.nav-group').forEach((g) => g.classList.remove('expanded'));
    }
  }

  // breadcrumb
  $('#crumb').innerHTML = `
    ${route.section ? `<span class="parent">${esc(route.section)}</span><span class="sep">/</span>` : ''}
    <b>${esc(route.label)}</b>`;

  const view = $('#view');
  view.innerHTML = `<div class="page">${route.render()}</div>`;
  view.scrollTop = 0;
  lucide.createIcons({ nameAttr: 'data-lucide' });

  if (!silent) history.replaceState(null, '', `#${route.id}`);
  document.body.classList.remove('nav-open');
}

/* --------------------------------------------------------------------------
   6. Wiring
   -------------------------------------------------------------------------- */

/* Single source of truth for the off-canvas breakpoint — must match the
   `@media (max-width: 1080px)` block in app.css. */
const OFF_CANVAS = window.matchMedia('(max-width: 1080px)');
const isOffCanvas = () => OFF_CANVAS.matches;
const closeNav = () => document.body.classList.remove('nav-open');

function applyTheme() {
  document.documentElement.setAttribute('data-theme', app.theme);
  const btn = $('#themeBtn');
  if (btn) {
    btn.innerHTML = icon(app.theme === 'dark' ? 'sun' : 'moon');
    btn.title = app.theme === 'dark' ? 'Switch to light' : 'Switch to dark';
    lucide.createIcons({ nameAttr: 'data-lucide' });
  }
}

function buildScopeMenu() {
  $('#scopeMenu').innerHTML =
    `<div class="menu-head">Entity in scope</div>` +
    DB.entities
      .map(
        (e) => `<button class="menu-item" data-entity="${esc(e)}" aria-selected="${e === app.entity}">
          ${icon('database')}<span>${esc(e)}</span><span class="tick">${icon('check')}</span>
        </button>`
      )
      .join('');
  $('#scopeName').textContent = app.entity;
  lucide.createIcons({ nameAttr: 'data-lucide' });
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  buildScopeMenu();

  /* Sidebar navigation ---------------------------------------------------- */
  $$('[data-route]').forEach((n) => {
    if (n.closest('.sidebar')) {
      n.addEventListener('click', (e) => {
        e.preventDefault();
        // A deliberately collapsed rail stays collapsed — only submenus need
        // it expanded, and that is handled by the has-submenu listener below.
        navigate(n.dataset.route);
      });
    }
  });

  /* Submenu headers expand a collapsed rail first, so the flyout has
     somewhere to go, then toggle their own group. */
  $$('.nav-item.has-submenu').forEach((h) =>
    h.addEventListener('click', (e) => {
      e.preventDefault();
      if (document.body.classList.contains('nav-collapsed')) {
        document.body.classList.remove('nav-collapsed');
        h.closest('.nav-group').classList.add('expanded');
        return;
      }
      h.closest('.nav-group').classList.toggle('expanded');
    })
  );

  /* Top bar --------------------------------------------------------------- */
  $('#railBtn').addEventListener('click', () => {
    document.body.classList.toggle(isOffCanvas() ? 'nav-open' : 'nav-collapsed');
  });

  /* Scrim: tapping the blurred page behind the menu closes it. */
  $('#scrim').addEventListener('click', closeNav);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeNav();
  });

  /* Rotating a tablet or resizing past the breakpoint must not leave the
     menu stuck open over a sidebar that is docked again. */
  OFF_CANVAS.addEventListener('change', (e) => {
    if (!e.matches) closeNav();
  });

  $('#themeBtn').addEventListener('click', () => {
    app.theme = app.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tdx-theme', app.theme);
    applyTheme();
  });

  $('#fullBtn').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  });

  const scopeBtn = $('#scopeBtn');
  const scopeMenu = $('#scopeMenu');
  scopeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = scopeBtn.getAttribute('aria-expanded') === 'true';
    scopeBtn.setAttribute('aria-expanded', String(!open));
    scopeMenu.hidden = open;
  });
  document.addEventListener('click', () => {
    scopeBtn.setAttribute('aria-expanded', 'false');
    scopeMenu.hidden = true;
  });
  scopeMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-entity]');
    if (!item) return;
    app.entity = item.dataset.entity;
    buildScopeMenu();
    navigate(app.route);
    toast(`Switched to ${app.entity}`);
  });

  /* Delegated behaviour inside the content area ---------------------------- */
  const view = $('#view');

  view.addEventListener('input', (e) => {
    // table search
    const s = e.target.closest('[data-tsearch]');
    if (s) {
      const id = s.closest('[data-table]').id;
      tables.get(id).q = s.value;
      tables.get(id).page = 1;
      refreshTable(id);
      const box = $(`#${id} [data-tsearch]`);
      box.focus();
      box.setSelectionRange(box.value.length, box.value.length);
      return;
    }
    // file picker label
    const f = e.target.closest('[data-file] input[type=file]');
    if (f) {
      const name = f.closest('[data-file]').querySelector('.name');
      name.textContent = f.files[0]?.name || 'No file chosen';
      name.classList.toggle('has', !!f.files[0]);
    }
  });

  view.addEventListener('change', (e) => {
    const sizeSel = e.target.closest('[data-tsize]');
    if (sizeSel) {
      const id = sizeSel.closest('[data-table]').id;
      tables.get(id).size = Number(sizeSel.value);
      tables.get(id).page = 1;
      refreshTable(id);
      return;
    }
    const adv = e.target.closest('[data-adv-toggle] input');
    if (adv) {
      const fold = adv.closest('.card-body').querySelector('[data-adv]');
      fold.hidden = !adv.checked;
      return;
    }
    const more = e.target.closest('[data-more-toggle] input');
    if (more) {
      more.closest('.card-body').querySelector('[data-more]').hidden = !more.checked;
    }
  });

  view.addEventListener('click', (e) => {
    // sort
    const th = e.target.closest('th[data-sort]');
    if (th) {
      const id = th.closest('[data-table]').id;
      const t = tables.get(id);
      if (t.sortKey === th.dataset.sort) t.sortDir *= -1;
      else {
        t.sortKey = th.dataset.sort;
        t.sortDir = 1;
      }
      refreshTable(id);
      return;
    }
    // pagination
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) {
      const id = pg.closest('[data-table]').id;
      tables.get(id).page = Number(pg.dataset.page);
      refreshTable(id);
      return;
    }
    // collapsible cards
    const toggle = e.target.closest('[data-toggle-card]');
    if (toggle) {
      const card = document.getElementById(toggle.dataset.toggleCard);
      const open = card.dataset.open === 'true';
      card.dataset.open = String(!open);
      if (!open) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    const head = e.target.closest('.card.collapsible .card-head');
    if (head) {
      const card = head.closest('.card');
      card.dataset.open = card.dataset.open === 'true' ? 'false' : 'true';
      return;
    }
    // cross-links
    const jump = e.target.closest('[data-route]');
    if (jump && !jump.closest('.sidebar')) {
      navigate(jump.dataset.route);
      return;
    }
    // demo actions
    const act = e.target.closest('[data-act]');
    if (act) {
      const messages = {
        search: 'Filters applied',
        reset: 'Filters cleared',
        export: 'Preparing Excel export…',
        print: 'Opening print view…',
        template: 'Template downloaded',
        upload: 'Select a file to validate',
        save: 'Saved',
        delete: 'Delete requires confirmation',
        sync: 'Sync requested — connectors will pick this up shortly',
      };
      toast(messages[act.dataset.act] || 'Done', act.dataset.act === 'upload' ? 'info' : 'ok');
    }
  });

  /* Boot ------------------------------------------------------------------ */
  const initial = location.hash.replace('#', '');
  navigate(ROUTES[initial] ? initial : 'home', { silent: true });
});
