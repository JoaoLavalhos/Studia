/* ===== STUDIA APP - app.js ===== */

// ─── STATE ───────────────────────────────────────────────────────────────────
let state = {
  user: null,
  disciplines: [],   // { id, name, colorHex }
  activities: [],    // { id, disciplineId, name, description, date, type, status }
  currentDisciplineId: null,
  editingDisciplineId: null,  // null = new, else = editing
  editingActivityId: null,    // null = new, else = editing
  deletingActivityId: null,   // activity awaiting delete confirmation
  boardCameFrom: 'disciplines', // 'disciplines' | 'calendar'
  calYear: null,
  calMonth: null,
  calSelectedDay: null,
};

const COLORS = [
  { name: 'Azul',    hex: '#4C6EF5' },
  { name: 'Verde',   hex: '#2EC4B6' },
  { name: 'Coral',   hex: '#FF6B6B' },
  { name: 'Roxo',    hex: '#845EF7' },
  { name: 'Laranja', hex: '#FF922B' },
  { name: 'Verde2',  hex: '#51CF66' },
  { name: 'Rosa',    hex: '#F06595' },
  { name: 'Amarelo', hex: '#FAB005' },
];

let selectedColor = COLORS[0].hex;

// ─── PERSISTENCE ─────────────────────────────────────────────────────────────
function saveState() {
  try {
    localStorage.setItem('studia_user',        JSON.stringify(state.user));
    localStorage.setItem('studia_disciplines', JSON.stringify(state.disciplines));
    localStorage.setItem('studia_activities',  JSON.stringify(state.activities));
  } catch(e) {}
}
function loadState() {
  try {
    const u = localStorage.getItem('studia_user');
    const d = localStorage.getItem('studia_disciplines');
    const a = localStorage.getItem('studia_activities');
    if (u) state.user        = JSON.parse(u);
    if (d) state.disciplines = JSON.parse(d);
    if (a) state.activities  = JSON.parse(a);
  } catch(e) {}
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function today() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function todayDate() { return new Date(today() + 'T00:00:00'); }

function daysFromToday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - todayDate()) / 86400000);
}

function fmtDate(dateStr) {
  const [y,m,d] = dateStr.split('-');
  return `${d}/${m}`;
}

function initials(name) { return name.trim().charAt(0).toUpperCase(); }

function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(value ?? '').replace(/[&<>"']/g, ch => map[ch]);
}

function safeColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? value : '#4C6EF5';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ─── LOCAL ACCESS ────────────────────────────────────────────────────────────
// This portfolio version runs entirely in the browser. The local profile and
// study data are stored with Web Storage; there is no server-side authentication.
function setLocalSession(active) {
  try {
    if (active) localStorage.setItem('studia_session', 'active');
    else localStorage.removeItem('studia_session');
  } catch(e) {}
}

function hasLocalSession() {
  try { return localStorage.getItem('studia_session') === 'active'; }
  catch(e) { return false; }
}

function dateWithOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function exploreSampleData() {
  const hasExistingData = state.disciplines.length > 0 || state.activities.length > 0;
  if (hasExistingData && !window.confirm('Carregar os dados de exemplo substituirá os dados salvos neste navegador. Continuar?')) return;

  const webId = 'demo-web';
  const dbId = 'demo-db';
  const uxId = 'demo-ux';

  state.user = { name: 'Visitante Studia', email: 'demo@studia.app' };
  state.disciplines = [
    { id: webId, name: 'Desenvolvimento Web', colorHex: '#4C6EF5' },
    { id: dbId, name: 'Banco de Dados', colorHex: '#2EC4B6' },
    { id: uxId, name: 'UX e Interfaces', colorHex: '#845EF7' },
  ];
  state.activities = [
    { id: 'demo-a1', disciplineId: webId, name: 'Finalizar interface responsiva', description: 'Ajustar a adaptação das telas para desktop e celular e revisar os principais componentes da interface.', date: dateWithOffset(2), type: 'Projeto', status: 'progress' },
    { id: 'demo-a2', disciplineId: webId, name: 'Revisar exercícios de JavaScript', description: 'Revisar funções, arrays, objetos e manipulação do DOM antes da próxima avaliação.', date: dateWithOffset(5), type: 'Exercício', status: 'todo' },
    { id: 'demo-a3', disciplineId: dbId, name: 'Modelagem do banco de dados', description: 'Criar o modelo lógico da aplicação, definindo entidades, relacionamentos e principais atributos.', date: dateWithOffset(1), type: 'Trabalho', status: 'todo' },
    { id: 'demo-a4', disciplineId: dbId, name: 'Lista de consultas SQL', description: 'Resolver a lista de SELECTs com filtros, JOINs, agrupamentos e ordenação.', date: dateWithOffset(-1), type: 'Exercício', status: 'progress' },
    { id: 'demo-a5', disciplineId: uxId, name: 'Wireframe da tela inicial', description: 'Desenhar a organização da tela inicial e validar a hierarquia visual das informações.', date: dateWithOffset(-3), type: 'Projeto', status: 'done' },
  ];
  state.currentDisciplineId = null;
  state.editingDisciplineId = null;
  state.editingActivityId = null;
  state.deletingActivityId = null;
  saveState();
  setLocalSession(true);
  enterApp();
  showToast('Dados de exemplo carregados');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) { showToast('Informe seu e-mail'); return; }
  if (!isValidEmail(email)) { showToast('Informe um e-mail válido'); return; }

  loadState();
  if (!state.user) {
    showToast('Crie primeiro um perfil local de demonstração');
    return;
  }
  if (state.user.email.toLowerCase() !== email.toLowerCase()) {
    showToast('Use o e-mail do perfil salvo neste navegador');
    return;
  }

  setLocalSession(true);
  enterApp();
}

function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  if (!name || !email) { showToast('Preencha nome e e-mail'); return; }
  if (!isValidEmail(email)) { showToast('Informe um e-mail válido'); return; }

  state.user = { name, email };
  saveState();
  setLocalSession(true);
  enterApp();
}

function enterApp() {
  const now = new Date();
  state.calYear  = now.getFullYear();
  state.calMonth = now.getMonth();
  renderAll();
  showScreen('home');
}

function doLogout() {
  setLocalSession(false);
  const emailInput = document.getElementById('login-email');
  if (emailInput && state.user) emailInput.value = state.user.email;
  showScreen('login');
}

function renderAll() {
  renderHome();
  renderDiscList();
  renderCalendar();
  renderNotifications();
  renderProfile();
  updateTopbarAvatars();
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === name);
  });
  if (name === 'home')          renderHome();
  if (name === 'disciplines')   renderDiscList();
  if (name === 'calendar')      renderCalendar();
  if (name === 'notifications') renderNotifications();
  if (name === 'profile')       { renderProfile(); updateTopbarAvatars(); }
}

function updateTopbarAvatars() {
  if (!state.user) return;
  ['home-topbar-avatar','disc-topbar-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials(state.user.name);
  });
}

// ─── DISCIPLINE CRUD ──────────────────────────────────────────────────────────

// Open modal for NEW discipline
function openAddDiscipline() {
  state.editingDisciplineId = null;
  selectedColor = COLORS[0].hex;
  document.getElementById('new-disc-name').value = '';
  document.getElementById('disc-modal-title').textContent = 'Nova disciplina';
  document.getElementById('disc-modal-save-btn').textContent = 'Salvar';
  renderColorPicker();
  openModal('modal-add-discipline');
}

// Open modal to EDIT existing discipline (called from board topbar)
function openEditDiscipline() {
  const disc = state.disciplines.find(d => d.id === state.currentDisciplineId);
  if (!disc) return;
  state.editingDisciplineId = disc.id;
  selectedColor = safeColor(disc.colorHex);
  document.getElementById('new-disc-name').value = disc.name;
  document.getElementById('disc-modal-title').textContent = 'Editar disciplina';
  document.getElementById('disc-modal-save-btn').textContent = 'Atualizar';
  renderColorPicker();
  openModal('modal-add-discipline');
}

function renderColorPicker() {
  const cp = document.getElementById('color-picker');
  cp.innerHTML = '';
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (c.hex === selectedColor ? ' selected' : '');
    sw.style.background = c.hex;
    sw.onclick = () => { selectedColor = c.hex; renderColorPicker(); };
    cp.appendChild(sw);
  });
}

function saveDiscipline() {
  const name = document.getElementById('new-disc-name').value.trim();
  if (!name) { showToast('Digite o nome da disciplina'); return; }

  if (state.editingDisciplineId) {
    // Edit existing
    const disc = state.disciplines.find(d => d.id === state.editingDisciplineId);
    if (disc) { disc.name = name; disc.colorHex = selectedColor; }
    saveState();
    closeModal('modal-add-discipline');
    // Refresh board header
    const avatar = document.getElementById('board-disc-avatar');
    avatar.textContent = initials(name);
    avatar.style.background = selectedColor;
    document.getElementById('board-disc-name').textContent = name;
    renderBoard();
    renderHome();
    renderDiscList();
    renderNotifications();
    showToast('Disciplina atualizada!');
  } else {
    // New
    const disc = { id: genId(), name, colorHex: selectedColor };
    state.disciplines.push(disc);
    saveState();
    closeModal('modal-add-discipline');
    renderDiscList();
    renderHome();
    renderNotifications();
    showToast('Disciplina adicionada!');
  }
  state.editingDisciplineId = null;
}

function confirmDeleteDiscipline() { openModal('modal-confirm-delete'); }

function deleteDiscipline() {
  const id = state.currentDisciplineId;
  state.disciplines = state.disciplines.filter(d => d.id !== id);
  state.activities  = state.activities.filter(a => a.disciplineId !== id);
  saveState();
  closeModal('modal-confirm-delete');
  goBackFromBoard();
  renderHome();
  renderDiscList();
  renderNotifications();
  showToast('Disciplina removida');
}

// ─── BOARD ────────────────────────────────────────────────────────────────────
function openBoard(disciplineId, cameFrom) {
  state.currentDisciplineId = disciplineId;
  state.boardCameFrom = cameFrom || 'disciplines';
  const disc = state.disciplines.find(d => d.id === disciplineId);
  if (!disc) return;
  const avatar = document.getElementById('board-disc-avatar');
  avatar.textContent = initials(disc.name);
  avatar.style.background = safeColor(disc.colorHex);
  document.getElementById('board-disc-name').textContent = disc.name;
  renderBoard();
  showScreen('board');
}

function goBackFromBoard() {
  const validOrigins = ['home', 'disciplines', 'calendar', 'notifications'];
  showScreen(validOrigins.includes(state.boardCameFrom) ? state.boardCameFrom : 'disciplines');
}

function enableKanbanDropZone(body, status) {
  body.dataset.status = status;

  body.addEventListener('dragover', event => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    body.classList.add('drop-target');
  });

  body.addEventListener('dragleave', event => {
    if (!body.contains(event.relatedTarget)) body.classList.remove('drop-target');
  });

  body.addEventListener('drop', event => {
    event.preventDefault();
    body.classList.remove('drop-target');
    const activityId = event.dataTransfer?.getData('text/plain');
    if (activityId) moveActivity(activityId, status);
  });
}

function renderBoard() {
  const id   = state.currentDisciplineId;
  const acts = state.activities.filter(a => a.disciplineId === id);
  const todo     = acts.filter(a => a.status === 'todo');
  const progress = acts.filter(a => a.status === 'progress');
  const done     = acts.filter(a => a.status === 'done');

  const board = document.getElementById('kanban-board');
  board.innerHTML = '';

  const cols = [
    { key: 'todo',     label: 'A FAZER',     dot: '#4C6EF5', items: todo },
    { key: 'progress', label: 'EM ANDAMENTO', dot: '#FF922B', items: progress },
    { key: 'done',     label: 'ENTREGUE',     dot: '#2EC4B6', items: done },
  ];

  cols.forEach(col => {
    const colEl = document.createElement('div');
    colEl.className = 'kanban-col';

    const hdr = document.createElement('div');
    hdr.className = 'kanban-col-header';
    hdr.innerHTML = `<div class="col-dot" style="background:${col.dot}"></div>${col.label}<span class="col-count">${col.items.length}</span>`;
    colEl.appendChild(hdr);

    const body = document.createElement('div');
    body.className = 'kanban-col-body';
    enableKanbanDropZone(body, col.key);

    if (col.items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'col-empty';
      empty.textContent = 'Nenhuma atividade';
      body.appendChild(empty);
    } else {
      col.items.forEach(act => body.appendChild(buildActivityCard(act, col.key)));
    }

    colEl.appendChild(body);
    board.appendChild(colEl);
  });
}

function buildActivityCard(act, colKey) {
  const card = document.createElement('div');
  card.className = 'activity-card';
  card.dataset.activityId = act.id;

  const supportsDesktopDrag = window.matchMedia('(pointer: fine)').matches;
  card.draggable = supportsDesktopDrag;
  if (supportsDesktopDrag) {
    card.title = 'Arraste para mover a atividade entre as colunas';
    card.addEventListener('dragstart', event => {
      card.classList.add('dragging');
      event.dataTransfer?.setData('text/plain', act.id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.kanban-col-body.drop-target').forEach(el => el.classList.remove('drop-target'));
    });
  }

  const days = daysFromToday(act.date);
  const isOverdue = days < 0 && act.status !== 'done';
  if (isOverdue) card.classList.add('overdue');

  let daysLabel = '';
  if (act.status !== 'done') {
    if (days < 0)      daysLabel = `<span class="act-overdue-label">⚠️ Vencido há ${Math.abs(days)} dia${Math.abs(days)>1?'s':''}</span>`;
    else if (days===0) daysLabel = `<span class="act-days-left" style="color:#e07b00">⏰ Vence hoje!</span>`;
    else if (days===1) daysLabel = `<span class="act-days-left" style="color:#e07b00">⏰ Vence amanhã</span>`;
    else               daysLabel = `<span class="act-days-left">📅 ${days} dias restantes</span>`;
  }

  let actions = '';
  if (colKey === 'todo') {
    actions = `<div class="act-actions">
      <button class="act-btn start" onclick="moveActivity('${act.id}','progress')">▶ Iniciar</button>
      <button class="act-btn deliver" onclick="moveActivity('${act.id}','done')">✓ Entregar</button>
    </div>`;
  } else if (colKey === 'progress') {
    actions = `<div class="act-actions">
      <button class="act-btn done-state" onclick="moveActivity('${act.id}','done')">✓ Marcar entregue</button>
      <button class="act-btn undo" onclick="moveActivity('${act.id}','todo')">← Voltar</button>
    </div>`;
  } else {
    actions = `<div class="act-actions">
      <button class="act-btn undo" onclick="moveActivity('${act.id}','todo')">↩ Desfazer</button>
    </div>`;
  }

  card.innerHTML = `
    <div class="activity-card-header">
      <div class="activity-title-wrap">
        <span class="drag-handle" aria-hidden="true">⋮⋮</span>
        <div class="act-name">${escapeHtml(act.name)}</div>
      </div>
      <button class="act-edit-btn" onclick="openEditActivity('${act.id}')" title="Editar atividade" aria-label="Editar atividade">✏️</button>
    </div>
    <div class="act-meta">
      <span class="act-date">${fmtDate(act.date)}</span>
      <span class="act-type-badge">${escapeHtml(act.type)}</span>
    </div>
    ${act.description ? `<div class="act-description-preview">${escapeHtml(act.description)}</div>` : ''}
    <button class="act-details-btn" type="button" onclick="openActivityDetails('${act.id}')">Ver detalhes</button>
    ${daysLabel}
    ${actions}
  `;
  return card;
}

function moveActivity(actId, newStatus) {
  const act = state.activities.find(a => a.id === actId);
  if (!act) return;
  act.status = newStatus;
  saveState();
  renderBoard();
  renderHome();
  renderNotifications();
  renderCalendar();
  const msgs = { todo: 'Movido para A fazer', progress: 'Em andamento!', done: 'Atividade entregue ✓' };
  showToast(msgs[newStatus] || '');
}

// ─── ACTIVITY CRUD ────────────────────────────────────────────────────────────

function openAddActivity() {
  state.editingActivityId = null;
  state.deletingActivityId = null;
  document.getElementById('new-act-name').value = '';
  document.getElementById('new-act-description').value = '';
  document.getElementById('new-act-date').value = today();
  document.getElementById('new-act-type').value = 'Exercício';
  document.getElementById('act-modal-title').textContent = 'Nova atividade';
  document.getElementById('act-modal-save-btn').textContent = 'Salvar';
  document.getElementById('act-modal-delete-btn').style.display = 'none';
  openModal('modal-add-activity');
}

function openEditActivity(actId) {
  const act = state.activities.find(a => a.id === actId);
  if (!act) return;
  state.editingActivityId = actId;
  state.deletingActivityId = null;
  document.getElementById('new-act-name').value = act.name;
  document.getElementById('new-act-description').value = act.description || '';
  document.getElementById('new-act-date').value = act.date;
  document.getElementById('new-act-type').value = act.type;
  document.getElementById('act-modal-title').textContent = 'Editar atividade';
  document.getElementById('act-modal-save-btn').textContent = 'Atualizar';
  document.getElementById('act-modal-delete-btn').style.display = 'inline-flex';
  openModal('modal-add-activity');
}

function saveActivity() {
  const name = document.getElementById('new-act-name').value.trim();
  const description = document.getElementById('new-act-description').value.trim();
  const date = document.getElementById('new-act-date').value;
  const type = document.getElementById('new-act-type').value;
  if (!name) { showToast('Digite o nome da atividade'); return; }
  if (!date) { showToast('Selecione a data de entrega'); return; }

  if (state.editingActivityId) {
    const act = state.activities.find(a => a.id === state.editingActivityId);
    if (act) { act.name = name; act.description = description; act.date = date; act.type = type; }
    showToast('Atividade atualizada!');
  } else {
    const act = { id: genId(), disciplineId: state.currentDisciplineId, name, description, date, type, status: 'todo' };
    state.activities.push(act);
    showToast('Atividade adicionada!');
  }

  saveState();
  closeModal('modal-add-activity');
  state.editingActivityId = null;
  renderBoard();
  renderHome();
  renderNotifications();
  renderCalendar();
}

function openActivityDetails(actId) {
  const act = state.activities.find(a => a.id === actId);
  if (!act) return;
  const disc = state.disciplines.find(d => d.id === act.disciplineId);
  const statusMap = { todo: 'A fazer', progress: 'Em andamento', done: 'Entregue' };
  document.getElementById('detail-act-name').textContent = act.name;
  document.getElementById('detail-act-description').textContent = act.description || 'Nenhuma descrição adicionada.';
  document.getElementById('detail-act-discipline').textContent = disc ? disc.name : 'Disciplina';
  document.getElementById('detail-act-type').textContent = act.type;
  document.getElementById('detail-act-date').textContent = fmtDate(act.date);
  document.getElementById('detail-act-status').textContent = statusMap[act.status] || 'A fazer';
  document.getElementById('detail-act-edit-btn').onclick = () => {
    closeModal('modal-activity-details');
    openEditActivity(act.id);
  };
  openModal('modal-activity-details');
}

function confirmDeleteActivity() {
  if (!state.editingActivityId) return;
  state.deletingActivityId = state.editingActivityId;
  closeModal('modal-add-activity');
  openModal('modal-confirm-delete-activity');
}

function cancelDeleteActivity() {
  const actId = state.deletingActivityId;
  closeModal('modal-confirm-delete-activity');
  state.deletingActivityId = null;
  if (actId) openEditActivity(actId);
}

function deleteActivity() {
  const id = state.deletingActivityId;
  if (!id) return;
  state.activities = state.activities.filter(a => a.id !== id);
  saveState();
  closeModal('modal-confirm-delete-activity');
  state.editingActivityId = null;
  state.deletingActivityId = null;
  renderBoard();
  renderHome();
  renderNotifications();
  renderCalendar();
  showToast('Atividade removida');
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function renderHome() {
  if (!state.user) return;
  const homeEmpty   = document.getElementById('home-empty');
  const homeList    = document.getElementById('home-disciplines-list');
  const upcomingBox = document.getElementById('home-upcoming');
  const upcomingList= document.getElementById('upcoming-list');

  if (state.disciplines.length === 0) {
    homeEmpty.style.display = 'flex';
    homeList.innerHTML = '';
    upcomingBox.style.display = 'none';
    updateNotifBadge();
    return;
  }
  homeEmpty.style.display = 'none';

  // Upcoming: non-done sorted by date
  const nonDone = state.activities.filter(a => a.status !== 'done').sort((a,b) => a.date.localeCompare(b.date));
  if (nonDone.length > 0) {
    upcomingBox.style.display = 'block';
    upcomingList.innerHTML = '';
    nonDone.slice(0,5).forEach(act => {
      const disc = state.disciplines.find(d => d.id === act.disciplineId);
      const days = daysFromToday(act.date);
      let cls = 'ok', txt = '';
      if      (days < 0)  { cls = 'overdue'; txt = `-${Math.abs(days)} dia${Math.abs(days)>1?'s':''}`; }
      else if (days <= 2) { cls = 'urgent';  txt = days===0?'Hoje':days===1?'Amanhã':`${days} dias`; }
      else                { txt = `+${days} dias`; }

      const item = document.createElement('div');
      item.className = 'upcoming-item';
      item.innerHTML = `
        <div class="upcoming-item-left">
          <span class="upcoming-item-name">${escapeHtml(act.name)}</span>
          <span class="upcoming-item-disc" style="color:${disc?safeColor(disc.colorHex):'#999'}">${disc?escapeHtml(disc.name):''}</span>
        </div>
        <span class="upcoming-days ${cls}">${txt}</span>`;
      upcomingList.appendChild(item);
    });
  } else {
    upcomingBox.style.display = 'none';
  }

  // Sort disciplines by urgency
  const sorted = [...state.disciplines].sort((a,b) => disciplinePriorityScore(a.id) - disciplinePriorityScore(b.id));
  homeList.innerHTML = '';
  sorted.forEach(disc => homeList.appendChild(buildHomeDiscCard(disc)));
  updateNotifBadge();
}

function disciplinePriorityScore(discId) {
  const acts = state.activities.filter(a => a.disciplineId === discId && a.status !== 'done');
  if (acts.length === 0) return 9999;
  return Math.min(...acts.map(a => daysFromToday(a.date)));
}

function buildHomeDiscCard(disc) {
  const acts = state.activities.filter(a => a.disciplineId === disc.id && a.status !== 'done');
  const card = document.createElement('div');
  card.className = 'home-disc-card';
  card.onclick = () => openBoard(disc.id, 'home');

  let hasOverdue = acts.some(a => daysFromToday(a.date) < 0);
  if (hasOverdue) card.classList.add('overdue-card');

  let statusHtml = '';
  if (acts.length === 0) {
    statusHtml = `<span class="disc-status" style="color:#2EC4B6;font-weight:700">✅ Tudo em dia!</span>`;
  } else {
    const todoN = state.activities.filter(a => a.disciplineId === disc.id && a.status === 'todo').length;
    const progN = state.activities.filter(a => a.disciplineId === disc.id && a.status === 'progress').length;
    let parts = [];
    if (todoN) parts.push(`${todoN} a fazer`);
    if (progN) parts.push(`${progN} em andamento`);
    statusHtml = `<span class="disc-status">${parts.join(' · ')}</span>`;
    if (hasOverdue) statusHtml += `<br><span class="overdue-alert-badge">⚠️ Prazo vencido!</span>`;
  }

  card.innerHTML = `
    <div class="disc-avatar" style="background:${safeColor(disc.colorHex)}">${initials(disc.name)}</div>
    <div class="disc-info">
      <div class="disc-name">${escapeHtml(disc.name)}</div>
      ${statusHtml}
    </div>
    <button class="disc-ver-btn" onclick="event.stopPropagation();openBoard('${disc.id}','home')">Ver ›</button>`;
  return card;
}

// ─── DISCIPLINES LIST ─────────────────────────────────────────────────────────
function renderDiscList() {
  const empty = document.getElementById('disc-empty');
  const list  = document.getElementById('disc-list');
  if (state.disciplines.length === 0) {
    empty.style.display = 'flex';
    list.innerHTML = '';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = '';
  state.disciplines.forEach(disc => {
    const acts = state.activities.filter(a => a.disciplineId === disc.id && a.status !== 'done');
    const item = document.createElement('div');
    item.className = 'disc-list-item';
    item.onclick = () => openBoard(disc.id, 'disciplines');
    const statusText = acts.length === 0
      ? '✅ Tudo em dia!'
      : `${acts.length} atividade${acts.length>1?'s':''} pendente${acts.length>1?'s':''}`;
    item.innerHTML = `
      <div class="disc-avatar" style="background:${safeColor(disc.colorHex)}">${initials(disc.name)}</div>
      <div class="disc-list-info">
        <div class="disc-list-name">${escapeHtml(disc.name)}</div>
        <div class="disc-list-status">${statusText}</div>
      </div>
      <span class="disc-arrow">›</span>`;
    list.appendChild(item);
  });
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function renderCalendar() {
  const y = state.calYear, m = state.calMonth;
  document.getElementById('cal-month-label').textContent = `${MONTHS_PT[m]} ${y}`;
  const daysEl = document.getElementById('cal-days');
  daysEl.innerHTML = '';
  const firstDay    = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const todayStr    = today();

  for (let i = 0; i < firstDay; i++) {
    const prev = new Date(y, m, -firstDay + i + 1);
    const el = document.createElement('div');
    el.className = 'cal-day other-month';
    el.textContent = prev.getDate();
    daysEl.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const el = document.createElement('div');
    el.className = 'cal-day';
    if (dateStr === todayStr) el.classList.add('today');
    if (dateStr === state.calSelectedDay && dateStr !== todayStr) el.classList.add('selected');

    const num = document.createElement('span');
    num.textContent = d;
    el.appendChild(num);

    const dayActs = state.activities.filter(a => a.date === dateStr);
    if (dayActs.length > 0) {
      const dots = document.createElement('div');
      dots.className = 'cal-day-dots';
      dayActs.slice(0,3).forEach(a => {
        const disc = state.disciplines.find(dd => dd.id === a.disciplineId);
        const dot = document.createElement('div');
        dot.className = 'cal-dot';
        dot.style.background = disc ? safeColor(disc.colorHex) : '#4C6EF5';
        dots.appendChild(dot);
      });
      el.appendChild(dots);
    }
    el.onclick = () => selectCalDay(dateStr);
    daysEl.appendChild(el);
  }

  if (!state.calSelectedDay) {
    const now = new Date();
    const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
    state.calSelectedDay = isCurrentMonth
      ? todayStr
      : `${y}-${String(m+1).padStart(2,'0')}-01`;
  }
  renderCalDayDetail(state.calSelectedDay);
}

function selectCalDay(dateStr) {
  state.calSelectedDay = dateStr;
  renderCalendar();
  renderCalDayDetail(dateStr);
}

function renderCalDayDetail(dateStr) {
  const detail  = document.getElementById('cal-day-detail');
  const titleEl = document.getElementById('cal-detail-title');
  const listEl  = document.getElementById('cal-detail-list');
  const [y,m,d] = dateStr.split('-');
  titleEl.textContent = `Atividades do dia ${d}/${m}`;

  const dayActs = state.activities.filter(a => a.date === dateStr);
  if (dayActs.length === 0) {
    listEl.innerHTML = `<p style="color:var(--text-light);font-size:14px;padding:12px 0">Sem atividades neste dia.</p>`;
    detail.style.display = 'block';
    return;
  }
  listEl.innerHTML = '';
  dayActs.forEach(act => {
    const disc = state.disciplines.find(d => d.id === act.disciplineId);
    const item = document.createElement('div');
    item.className = 'cal-activity-item';

    // Clicking the calendar activity opens its discipline board
    item.onclick = () => {
      if (disc) openBoard(disc.id, 'calendar');
    };

    const statusMap = { todo: ['status-todo','A fazer'], progress: ['status-progress','Em andamento'], done: ['status-done','Entregue'] };
    const [cls, label] = statusMap[act.status] || ['status-todo','A fazer'];

    item.innerHTML = `
      <div class="cal-act-bar" style="background:${disc?safeColor(disc.colorHex):'#4C6EF5'}"></div>
      <div class="cal-act-info">
        <span class="cal-act-name">${escapeHtml(act.name)}</span>
        <span class="cal-act-disc">${disc?escapeHtml(disc.name):''} · ${escapeHtml(act.type)}</span>
      </div>
      <span class="cal-act-status ${cls}">${label}</span>
      <span class="cal-act-goto">›</span>`;
    listEl.appendChild(item);
  });
  detail.style.display = 'block';
}

function calPrev() {
  if (state.calMonth === 0) { state.calMonth = 11; state.calYear--; }
  else state.calMonth--;
  state.calSelectedDay = null;
  renderCalendar();
}
function calNext() {
  if (state.calMonth === 11) { state.calMonth = 0; state.calYear++; }
  else state.calMonth++;
  state.calSelectedDay = null;
  renderCalendar();
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function renderNotifications() {
  const emptyEl = document.getElementById('notif-empty');
  const listEl  = document.getElementById('notif-list');
  const alerts  = getAlerts();

  if (alerts.length === 0) {
    emptyEl.style.display = 'flex';
    listEl.innerHTML = '';
    return;
  }
  emptyEl.style.display = 'none';
  listEl.innerHTML = '';

  alerts.forEach(({ act, disc, days }) => {
    const card = document.createElement('div');
    const isOverdue = days < 0;
    card.className = 'notif-card ' + (isOverdue ? 'overdue' : days <= 1 ? 'urgent' : '');
    card.onclick = () => openBoard(disc.id, 'notifications');

    let statusText = '';
    if (isOverdue)    statusText = `Prazo vencido há ${Math.abs(days)} dia${Math.abs(days)>1?'s':''}!`;
    else if (days===0) statusText = 'Vence hoje!';
    else if (days===1) statusText = 'Vence amanhã!';
    else               statusText = `Entrega em ${days} dias (${fmtDate(act.date)})`;

    card.innerHTML = `
      <div class="notif-icon">${isOverdue ? '⚠️' : '🔔'}</div>
      <div class="notif-info">
        <div class="notif-name">${escapeHtml(act.name)}</div>
        <div class="notif-disc">${escapeHtml(disc.name)}</div>
        <div class="notif-status ${isOverdue?'overdue':'urgent'}">${statusText}</div>
      </div>
      <span style="color:var(--text-light);font-size:18px">›</span>`;
    listEl.appendChild(card);
  });
}

function getAlerts() {
  return state.activities
    .filter(a => a.status !== 'done')
    .map(a => {
      const disc = state.disciplines.find(d => d.id === a.disciplineId);
      const days = daysFromToday(a.date);
      return { act: a, disc, days };
    })
    .filter(({ disc, days }) => disc && days <= 3)
    .sort((a, b) => a.days - b.days);
}

function updateNotifBadge() {
  const badge = document.getElementById('notif-badge');
  const count = getAlerts().length;
  if (count > 0) { badge.style.display = 'flex'; badge.textContent = count > 9 ? '9+' : count; }
  else             badge.style.display = 'none';
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function renderProfile() {
  if (!state.user) return;
  document.getElementById('profile-avatar-display').textContent = initials(state.user.name);
  document.getElementById('profile-name-display').textContent   = state.user.name;
  document.getElementById('profile-email-display').textContent  = state.user.email;
  document.getElementById('stat-disciplines').textContent = state.disciplines.length;
  document.getElementById('stat-activities').textContent  = state.activities.length;
  document.getElementById('stat-done').textContent        = state.activities.filter(a => a.status === 'done').length;
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeModalOutside(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

// ─── INIT ─────────────────────────────────────────────────────────────────────
(function init() {
  loadState();
  const now = new Date();
  state.calYear  = now.getFullYear();
  state.calMonth = now.getMonth();

  const loginEmail = document.getElementById('login-email');
  if (loginEmail && state.user) loginEmail.value = state.user.email;

  if (state.user && hasLocalSession()) enterApp();
  else showScreen('login');
})();
