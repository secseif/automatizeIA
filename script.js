// Folder sidebar <-> pane switching
const folderItems = document.querySelectorAll('.folder-item[data-target]');
const panes = document.querySelectorAll('.pane[data-pane]');
const windowPath = document.getElementById('windowPath');
const windowBody = document.querySelector('.window-body');

const paneLabels = {
  inicio: 'Início',
  sobre: 'Sobre a Automaizze',
  projetos: 'Projetos & Clientes',
  plugplay: 'Plug & Play',
  contato: 'Contato'
};

function goToPane(target) {
  panes.forEach(p => p.classList.toggle('active', p.dataset.pane === target));
  folderItems.forEach(f => f.classList.toggle('active', f.dataset.target === target));
  if (windowPath) windowPath.textContent = `Automaizze IA / ${paneLabels[target] || target}`;
  windowBody.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  closeSidebar();
}

folderItems.forEach(item => {
  item.addEventListener('click', () => goToPane(item.dataset.target));
});

document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', () => goToPane(el.dataset.goto));
});

// Mobile sidebar toggle
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarScrim = document.getElementById('sidebarScrim');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarScrim.classList.add('open');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarScrim.classList.remove('open');
}
if (sidebarToggle) sidebarToggle.addEventListener('click', openSidebar);
if (sidebarScrim) sidebarScrim.addEventListener('click', closeSidebar);

// Menu bar clock
const clockEl = document.getElementById('menubarClock');
function updateClock() {
  if (!clockEl) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 15000);

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============= Lead flow modal =============
const WHATSAPP_NUMBER = '5565999868334';

const leadModal = document.getElementById('leadModal');
const leadSteps = leadModal.querySelectorAll('.lead-step');
const leadNav = document.getElementById('leadNav');
const leadBack = document.getElementById('leadBack');
const leadNext = document.getElementById('leadNext');
const leadProgressBar = document.getElementById('leadProgressBar');
const leadError = document.getElementById('leadError');

let leadStep = 1;
let leadData = { product: '', business: '', workWith: '', segment: '', goal: '', name: '', phone: '', email: '' };

function openLeadModal(product) {
  leadData = { product, business: '', workWith: '', segment: '', goal: '', name: '', phone: '', email: '' };
  document.getElementById('leadPlanLabel1').textContent = product;
  document.getElementById('leadPlanLabel2').textContent = product;
  document.getElementById('leadBusiness').value = '';
  document.getElementById('leadWorkWith').value = '';
  document.getElementById('leadName').value = '';
  document.getElementById('leadPhone').value = '';
  document.getElementById('leadEmail').value = '';
  leadModal.querySelectorAll('.chip.selected').forEach(c => c.classList.remove('selected'));
  leadError.classList.remove('show');
  showLeadStep(1);
  leadModal.classList.add('open');
  leadModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLeadModal() {
  leadModal.classList.remove('open');
  leadModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function showLeadStep(n) {
  leadStep = n;
  leadSteps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === n));
  leadProgressBar.style.width = (Math.min(n, 4) / 4) * 100 + '%';
  leadBack.classList.toggle('hidden', n === 1 || n === 5);
  leadNav.style.display = n === 5 ? 'none' : 'flex';
  leadNext.textContent = n === 4 ? 'Enviar' : 'Continuar';
  leadError.classList.remove('show');

  if (n === 5) {
    const message = `Olá! Sou da empresa ${leadData.business} e tenho interesse em ${leadData.product}. Trabalho com ${leadData.workWith}. Segmento: ${leadData.segment}. Objetivo: ${leadData.goal}.`;
    document.getElementById('leadWhatsappBtn').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
}

function validateLeadStep() {
  if (leadStep === 1) {
    const v = document.getElementById('leadBusiness').value.trim();
    if (!v) return false;
    leadData.business = v;
    leadData.workWith = document.getElementById('leadWorkWith').value.trim();
  }
  if (leadStep === 2 && !leadData.segment) return false;
  if (leadStep === 3 && !leadData.goal) return false;
  if (leadStep === 4) {
    const name = document.getElementById('leadName').value.trim();
    const phone = document.getElementById('leadPhone').value.trim();
    if (!name || !phone) return false;
    leadData.name = name;
    leadData.phone = phone;
    leadData.email = document.getElementById('leadEmail').value.trim();
  }
  return true;
}

async function submitLead(data) {
  const configured = typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.startsWith('COLE_AQUI');
  if (!configured || typeof window.supabase === 'undefined') {
    console.warn('Supabase não configurado — lead não foi salvo:', data);
    return { ok: true };
  }
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await client.from('leads').insert([{
    plan: data.product,
    business: data.business,
    segment: data.segment,
    goal: data.goal,
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    page_path: window.location.pathname,
    user_agent: navigator.userAgent
  }]);
  return { ok: !error, error };
}

document.querySelectorAll('.js-open-lead').forEach(btn => {
  btn.addEventListener('click', () => openLeadModal(btn.dataset.product));
});

leadModal.querySelectorAll('[data-lead-close]').forEach(el => {
  el.addEventListener('click', closeLeadModal);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && leadModal.classList.contains('open')) closeLeadModal();
});

leadModal.querySelectorAll('.lead-chips').forEach(group => {
  group.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    group.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    if (group.id === 'leadSegment') leadData.segment = chip.dataset.value;
    if (group.id === 'leadGoal') leadData.goal = chip.dataset.value;
  });
});

leadNext.addEventListener('click', async () => {
  if (!validateLeadStep()) {
    const active = leadModal.querySelector('.lead-step.active');
    active.classList.add('lead-shake');
    setTimeout(() => active.classList.remove('lead-shake'), 350);
    return;
  }
  if (leadStep < 4) {
    showLeadStep(leadStep + 1);
    return;
  }
  leadNext.disabled = true;
  leadNext.textContent = 'Enviando...';
  const result = await submitLead(leadData);
  leadNext.disabled = false;
  if (result.ok) {
    showLeadStep(5);
  } else {
    leadNext.textContent = 'Enviar';
    leadError.textContent = 'Não foi possível enviar agora. Verifique sua internet e tente novamente.';
    leadError.classList.add('show');
  }
});

leadBack.addEventListener('click', () => {
  if (leadStep > 1) showLeadStep(leadStep - 1);
});
