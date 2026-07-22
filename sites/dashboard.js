const client = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.startsWith('COLE_AQUI'))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const dashLogin = document.getElementById('dashLogin');
const dashApp = document.getElementById('dashApp');
const dashLoginBtn = document.getElementById('dashLoginBtn');
const dashLoginError = document.getElementById('dashLoginError');

let allLeads = [];

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function showApp() {
  dashLogin.style.display = 'none';
  dashApp.hidden = false;
}

async function login() {
  const email = document.getElementById('dashEmail').value.trim();
  const password = document.getElementById('dashPassword').value;
  dashLoginError.classList.remove('show');
  dashLoginBtn.disabled = true;
  dashLoginBtn.textContent = 'Entrando...';
  const { error } = await client.auth.signInWithPassword({ email, password });
  dashLoginBtn.disabled = false;
  dashLoginBtn.textContent = 'Entrar';
  if (error) {
    dashLoginError.textContent = 'E-mail ou senha incorretos.';
    dashLoginError.classList.add('show');
    return;
  }
  showApp();
  loadLeads();
}

async function logout() {
  await client.auth.signOut();
  location.reload();
}

async function loadLeads() {
  const { data, error } = await client.from('leads').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  allLeads = data || [];
  renderStats(allLeads);
  renderBars(allLeads);
  renderTable(allLeads);
}

function topValue(leads, field) {
  const counts = {};
  leads.forEach(l => { counts[l[field]] = (counts[l[field]] || 0) + 1; });
  let top = null;
  let max = 0;
  Object.entries(counts).forEach(([key, count]) => {
    if (count > max) { max = count; top = key; }
  });
  return top;
}

function countBy(leads, field) {
  const counts = {};
  leads.forEach(l => { counts[l[field]] = (counts[l[field]] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function renderStats(leads) {
  document.getElementById('statTotal').textContent = leads.length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekCount = leads.filter(l => new Date(l.created_at).getTime() >= weekAgo).length;
  document.getElementById('statWeek').textContent = weekCount;
  document.getElementById('statPlan').textContent = topValue(leads, 'plan') || '—';
  document.getElementById('statSegment').textContent = topValue(leads, 'segment') || '—';
}

function renderBarGroup(containerId, entries) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!entries.length) {
    container.innerHTML = '<p class="dash-empty" style="padding:0;">Sem dados ainda.</p>';
    return;
  }
  const max = entries[0][1];
  entries.forEach(([label, count]) => {
    const row = document.createElement('div');
    row.className = 'dash-bar-row';
    row.innerHTML = `
      <span class="dash-bar-label">${escapeHtml(label)}</span>
      <span class="dash-bar-track"><span class="dash-bar-fill" style="width:${(count / max) * 100}%"></span></span>
      <span class="dash-bar-count">${count}</span>
    `;
    container.appendChild(row);
  });
}

function renderBars(leads) {
  renderBarGroup('barsPlan', countBy(leads, 'plan'));
  renderBarGroup('barsSegment', countBy(leads, 'segment'));
}

function renderTable(leads) {
  const tbody = document.getElementById('leadsTableBody');
  const empty = document.getElementById('dashEmpty');
  tbody.innerHTML = '';
  if (!leads.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  leads.forEach(l => {
    const tr = document.createElement('tr');
    const date = new Date(l.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    tr.innerHTML = `
      <td>${date}</td>
      <td class="dash-td-business">${escapeHtml(l.business)}</td>
      <td>${escapeHtml(l.name)} · ${escapeHtml(l.phone)}</td>
      <td>${escapeHtml(l.segment)}</td>
      <td>${escapeHtml(l.goal)}</td>
      <td><span class="dash-plan-pill">${escapeHtml(l.plan)}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('dashSearch').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = !q ? allLeads : allLeads.filter(l =>
    (l.business || '').toLowerCase().includes(q) || (l.name || '').toLowerCase().includes(q)
  );
  renderTable(filtered);
});

dashLoginBtn.addEventListener('click', login);
document.getElementById('dashPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});
document.getElementById('dashLogoutBtn').addEventListener('click', logout);

async function init() {
  if (!client) {
    dashLoginError.textContent = 'Configure assets/supabase-config.js com sua URL e chave do Supabase antes de usar o painel.';
    dashLoginError.classList.add('show');
    dashLoginBtn.disabled = true;
    return;
  }
  const { data: { session } } = await client.auth.getSession();
  if (session) {
    showApp();
    loadLeads();
  }
}

init();
