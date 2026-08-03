(() => {
  'use strict';

  const MONTHS = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const STORAGE_KEY = 'maderegger_calendar_entries_v1';
  const cfg = window.APP_CONFIG || {};
  const liveMode = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const client = liveMode ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  const state = {
    year: new Date().getFullYear(),
    entries: [],
    user: null,
    role: liveMode ? 'viewer' : 'admin'
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    calendar: $('calendar'), yearSelect: $('yearSelect'), searchInput: $('searchInput'),
    categoryFilter: $('categoryFilter'), statusFilter: $('statusFilter'), modeBadge: $('modeBadge'),
    newEntryBtn: $('newEntryBtn'), entryDialog: $('entryDialog'), entryForm: $('entryForm'),
    deleteEntryBtn: $('deleteEntryBtn'), dialogTitle: $('dialogTitle'), loginDialog: $('loginDialog'),
    loginForm: $('loginForm'), loginBtn: $('loginBtn'), logoutBtn: $('logoutBtn'), loginError: $('loginError')
  };

  function normalizeClass(value) {
    return String(value || '').toLowerCase().replaceAll('ä','a').replaceAll('ö','o').replaceAll('ü','u').replace(/[^a-z0-9]+/g, '-');
  }
  function iso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function parseDate(value) {
    const [y,m,d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function overlaps(entry, date) {
    const target = iso(date);
    return entry.start_date <= target && entry.end_date >= target;
  }
  function canEdit() {
    return !liveMode || ['admin','editor'].includes(state.role);
  }

  async function loadEntries() {
    if (!liveMode) {
      state.entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!state.entries.length) seedDemoEntries();
      render();
      return;
    }
    const { data, error } = await client.from('calendar_entries').select('*').order('start_date');
    if (error) return alert(`Kalender konnte nicht geladen werden: ${error.message}`);
    state.entries = data || [];
    render();
  }

  function seedDemoEntries() {
    const y = state.year;
    state.entries = [
      { id: crypto.randomUUID(), project_number:'26-1042', project_title:'Montage Förderstrecke', category:'Montage', status:'Bestätigt', start_date:`${y}-03-16`, end_date:`${y}-03-19`, customer:'Musterkunde GmbH', location:'Linz', responsible:'Projektleitung', team:'Montageteam 1', notes:'Demoeintrag – kann bearbeitet oder gelöscht werden.' },
      { id: crypto.randomUUID(), project_number:'26-1088', project_title:'Auslieferung Portal-Mix', category:'Lieferung', status:'Geplant', start_date:`${y}-05-08`, end_date:`${y}-05-08`, customer:'Beispielkunde', location:'Salzburg', responsible:'Disposition', team:'Spedition', notes:'' }
    ];
    persistLocal();
  }
  function persistLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries)); }

  function filteredEntries() {
    const q = els.searchInput.value.trim().toLowerCase();
    const category = els.categoryFilter.value;
    const status = els.statusFilter.value;
    return state.entries.filter(e => {
      const text = [e.project_number,e.project_title,e.customer,e.location,e.responsible,e.team,e.notes].join(' ').toLowerCase();
      return (!q || text.includes(q)) && (!category || e.category === category) && (!status || e.status === status);
    });
  }

  function render() {
    els.calendar.innerHTML = '';
    const template = $('monthTemplate');
    const entries = filteredEntries();
    const today = new Date();

    MONTHS.forEach((monthName, monthIndex) => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.querySelector('h2').textContent = monthName;
      const monthEntries = entries.filter(e => parseDate(e.start_date).getFullYear() <= state.year && parseDate(e.end_date).getFullYear() >= state.year && (parseDate(e.start_date).getMonth() <= monthIndex || parseDate(e.start_date).getFullYear() < state.year) && (parseDate(e.end_date).getMonth() >= monthIndex || parseDate(e.end_date).getFullYear() > state.year));
      card.querySelector('.month-count').textContent = `${monthEntries.length} Termin${monthEntries.length === 1 ? '' : 'e'}`;

      const daysEl = card.querySelector('.days');
      const first = new Date(state.year, monthIndex, 1);
      const mondayOffset = (first.getDay() + 6) % 7;
      const gridStart = new Date(state.year, monthIndex, 1 - mondayOffset);

      for (let i = 0; i < 42; i++) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + i);
        const cell = document.createElement('div');
        cell.className = 'day';
        if (date.getMonth() !== monthIndex) cell.classList.add('outside');
        if (iso(date) === iso(today)) cell.classList.add('today');
        cell.innerHTML = `<span class="day-number">${date.getDate()}</span><div class="events"></div>`;

        const dayEntries = entries.filter(e => overlaps(e, date));
        const eventBox = cell.querySelector('.events');
        dayEntries.slice(0, 3).forEach(e => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `event cat-${normalizeClass(e.category)} status-${normalizeClass(e.status)}`;
          btn.title = `${e.project_number} – ${e.project_title}\n${e.category} | ${e.status}${e.customer ? `\n${e.customer}` : ''}${e.location ? `, ${e.location}` : ''}`;
          btn.innerHTML = `<strong>${escapeHtml(e.project_number)}</strong> ${escapeHtml(e.project_title)}`;
          btn.addEventListener('click', () => openEntryDialog(e));
          eventBox.appendChild(btn);
        });
        if (dayEntries.length > 3) {
          const more = document.createElement('div');
          more.className = 'more';
          more.textContent = `+${dayEntries.length - 3} weitere`;
          eventBox.appendChild(more);
        }
        cell.addEventListener('dblclick', () => canEdit() && openEntryDialog(null, iso(date)));
        daysEl.appendChild(cell);
      }
      els.calendar.appendChild(card);
    });

    els.newEntryBtn.disabled = !canEdit();
    els.newEntryBtn.title = canEdit() ? '' : 'Nur Benutzer mit Rolle Admin oder Editor dürfen Einträge bearbeiten.';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function openEntryDialog(entry = null, selectedDate = null) {
    if (!entry && !canEdit()) return;
    els.entryForm.reset();
    $('entryId').value = entry?.id || '';
    els.dialogTitle.textContent = entry ? 'Termin bearbeiten' : 'Termin eintragen';
    els.deleteEntryBtn.classList.toggle('hidden', !entry || !canEdit());

    const defaultDate = selectedDate || iso(new Date());
    $('projectNumber').value = entry?.project_number || '';
    $('projectTitle').value = entry?.project_title || '';
    $('category').value = entry?.category || 'Montage';
    $('status').value = entry?.status || 'Geplant';
    $('startDate').value = entry?.start_date || defaultDate;
    $('endDate').value = entry?.end_date || defaultDate;
    $('customer').value = entry?.customer || '';
    $('location').value = entry?.location || '';
    $('responsible').value = entry?.responsible || '';
    $('team').value = entry?.team || '';
    $('notes').value = entry?.notes || '';

    [...els.entryForm.elements].forEach(el => {
      if (el.tagName === 'BUTTON' || el.type === 'hidden') return;
      el.disabled = Boolean(entry && !canEdit());
    });
    els.entryDialog.showModal();
  }

  function formPayload() {
    return {
      project_number: $('projectNumber').value.trim(),
      project_title: $('projectTitle').value.trim(),
      category: $('category').value,
      status: $('status').value,
      start_date: $('startDate').value,
      end_date: $('endDate').value,
      customer: $('customer').value.trim(),
      location: $('location').value.trim(),
      responsible: $('responsible').value.trim(),
      team: $('team').value.trim(),
      notes: $('notes').value.trim()
    };
  }

  async function saveEntry(event) {
    event.preventDefault();
    if (!canEdit()) return;
    const id = $('entryId').value;
    const payload = formPayload();
    if (payload.end_date < payload.start_date) return alert('Das Enddatum darf nicht vor dem Startdatum liegen.');

    if (!liveMode) {
      if (id) state.entries = state.entries.map(e => e.id === id ? { ...e, ...payload } : e);
      else state.entries.push({ id: crypto.randomUUID(), ...payload });
      persistLocal();
    } else {
      const action = id
        ? client.from('calendar_entries').update(payload).eq('id', id)
        : client.from('calendar_entries').insert(payload);
      const { error } = await action;
      if (error) return alert(`Speichern fehlgeschlagen: ${error.message}`);
    }
    els.entryDialog.close();
    await loadEntries();
  }

  async function deleteEntry() {
    const id = $('entryId').value;
    if (!id || !canEdit() || !confirm('Diesen Kalendereintrag wirklich löschen?')) return;
    if (!liveMode) {
      state.entries = state.entries.filter(e => e.id !== id);
      persistLocal();
    } else {
      const { error } = await client.from('calendar_entries').delete().eq('id', id);
      if (error) return alert(`Löschen fehlgeschlagen: ${error.message}`);
    }
    els.entryDialog.close();
    await loadEntries();
  }

  async function initAuth() {
    if (!liveMode) {
      els.modeBadge.textContent = 'Demomodus';
      els.modeBadge.className = 'badge badge-warning';
      els.loginBtn.classList.add('hidden');
      return;
    }
    els.modeBadge.textContent = 'Online';
    els.modeBadge.className = 'badge badge-live';
    const { data } = await client.auth.getSession();
    await setSession(data.session);
    client.auth.onAuthStateChange((_event, session) => setSession(session));
  }

  async function setSession(session) {
    state.user = session?.user || null;
    state.role = 'viewer';
    if (state.user) {
      const { data } = await client.from('profiles').select('role').eq('id', state.user.id).single();
      state.role = data?.role || 'viewer';
    }
    els.loginBtn.classList.toggle('hidden', Boolean(state.user));
    els.logoutBtn.classList.toggle('hidden', !state.user);
    render();
  }

  async function login(event) {
    event.preventDefault();
    if (!liveMode) return;
    els.loginError.textContent = '';
    const { error } = await client.auth.signInWithPassword({ email: $('loginEmail').value, password: $('loginPassword').value });
    if (error) return els.loginError.textContent = error.message;
    els.loginDialog.close();
    await loadEntries();
  }

  async function logout() {
    if (client) await client.auth.signOut();
  }

  function buildYearSelect() {
    const current = new Date().getFullYear();
    for (let y = current - 5; y <= current + 8; y++) {
      const option = document.createElement('option');
      option.value = y; option.textContent = y;
      els.yearSelect.appendChild(option);
    }
    els.yearSelect.value = state.year;
  }

  function bindEvents() {
    $('prevYearBtn').onclick = () => { state.year--; els.yearSelect.value = state.year; render(); };
    $('nextYearBtn').onclick = () => { state.year++; els.yearSelect.value = state.year; render(); };
    $('todayBtn').onclick = () => { state.year = new Date().getFullYear(); els.yearSelect.value = state.year; render(); };
    els.yearSelect.onchange = () => { state.year = Number(els.yearSelect.value); render(); };
    [els.searchInput, els.categoryFilter, els.statusFilter].forEach(el => el.addEventListener('input', render));
    els.newEntryBtn.onclick = () => openEntryDialog();
    $('closeDialogBtn').onclick = () => els.entryDialog.close();
    $('cancelBtn').onclick = () => els.entryDialog.close();
    els.entryForm.addEventListener('submit', saveEntry);
    els.deleteEntryBtn.onclick = deleteEntry;
    els.loginBtn.onclick = () => els.loginDialog.showModal();
    els.logoutBtn.onclick = logout;
    $('closeLoginBtn').onclick = () => els.loginDialog.close();
    $('cancelLoginBtn').onclick = () => els.loginDialog.close();
    els.loginForm.addEventListener('submit', login);
  }

  async function init() {
    buildYearSelect();
    bindEvents();
    await initAuth();
    await loadEntries();
  }
  init();
})();
