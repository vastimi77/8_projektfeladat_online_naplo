/**
 * Online Napló - Frontend Application
 * Handles authentication, notes CRUD, and UI state management
 */

/* ============================================
   Application State
   ============================================ */
const state = {
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    notes: [],
    filteredNotes: [],
    selectedNoteId: null,
    isLoading: false
};

/* ============================================
   Configuration
   ============================================ */
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const servedOutsideBackend = isLocalHost && window.location.port && window.location.port !== '5000';
const API_BASE = (window.location.protocol === 'file:' || servedOutsideBackend) ? 'http://localhost:5000' : '';

const API_ENDPOINTS = {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    NOTES: '/api/notes',
    NOTES_BY_ID: (id) => `/api/notes/${id}`
};

const MESSAGES = {
    SERVER_ERROR: 'A szerver nem elérhető. Ellenőrizd, hogy fut-e a backend a http://localhost:5000 címen.',
    METHOD_ERROR: '405 Method Not Allowed. Valószínűleg nem a backend szervert éred el. Nyisd meg az alkalmazást a http://localhost:5000 címen.',
    SESSION_EXPIRED: 'A munkamenet lejárt. Jelentkezz be újra.',
    REGISTRATION_SUCCESS: 'Sikeres regisztráció és automatikus bejelentkezés.',
    LOGIN_SUCCESS: 'Sikeres bejelentkezés.',
    NOTE_CREATED: 'Jegyzet létrehozva.',
    NOTE_UPDATED: 'Jegyzet frissítve.',
    NOTE_DELETED: 'Jegyzet törölve.',
    USER_EXISTS: 'Ez a felhasználónév vagy email már létezik. Próbálj bejelentkezni, vagy válassz mást.'
};

/* ============================================
   DOM Elements
   ============================================ */
const elements = {
    authLayout: document.getElementById('authLayout'),
    workspace: document.getElementById('workspace'),
    statusBanner: document.getElementById('statusBanner'),
    currentUser: document.getElementById('currentUser'),
    logoutButton: document.getElementById('logoutButton'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    noteForm: document.getElementById('noteForm'),
    notesList: document.getElementById('notesList'),
    searchInput: document.getElementById('searchInput'),
    refreshNotesButton: document.getElementById('refreshNotesButton'),
    resetEditorButton: document.getElementById('resetEditorButton'),
    deleteNoteButton: document.getElementById('deleteNoteButton'),
    editorTitle: document.getElementById('editorTitle'),
    noteId: document.getElementById('noteId'),
    noteTitle: document.getElementById('noteTitle'),
    noteCategory: document.getElementById('noteCategory'),
    noteContent: document.getElementById('noteContent')
};

/* ============================================
   Utility Functions
   ============================================ */

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/**
 * Format date to Hungarian locale
 */
function formatDate(value) {
    if (!value) return 'nincs dátum';
    return new Intl.DateTimeFormat('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
}

/**
 * Debounce function for input events
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Set loading state on UI
 */
function setLoading(isLoading) {
    state.isLoading = isLoading;
    elements.saveNoteButton = document.getElementById('saveNoteButton');
    if (elements.saveNoteButton) {
        elements.saveNoteButton.disabled = isLoading;
        elements.saveNoteButton.textContent = isLoading ? '⏳ Menti...' : '💾 Mentés';
    }
}

/* ============================================
   API Communication
   ============================================ */

/**
 * Fetch wrapper with auth token and error handling
 */
async function apiFetch(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (error) {
        throw new Error(MESSAGES.SERVER_ERROR);
    }

    const rawText = await response.text();
    let data = {};

    if (rawText) {
        try {
            data = JSON.parse(rawText);
        } catch (error) {
            data = { error: 'Invalid server response' };
        }
    }

    if (!response.ok) {
        if (response.status === 405) {
            throw new Error(MESSAGES.METHOD_ERROR);
        }
        throw new Error(data.error || `Szerverhiba (${response.status}).`);
    }

    return data;
}

/* ============================================
   Status Messages
   ============================================ */

/**
 * Display status message
 */
function setStatus(message, type = 'success') {
    elements.statusBanner.textContent = message;
    const alertType = type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success';
    elements.statusBanner.className = `alert alert-${alertType}`;
    elements.statusBanner.classList.remove('d-none');
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => clearStatus(), 5000);
    }
}

/**
 * Clear status message
 */
function clearStatus() {
    elements.statusBanner.textContent = '';
    elements.statusBanner.className = 'alert d-none';
}

/* ============================================
   Session Management
   ============================================ */

/**
 * Set authentication session
 */
function setSession(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Clear authentication session
 */
function clearSession() {
    state.token = '';
    state.user = null;
    state.notes = [];
    state.filteredNotes = [];
    state.selectedNoteId = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

/* ============================================
   View Management
   ============================================ */

/**
 * Toggle between auth and workspace views
 */
function toggleView() {
    const loggedIn = Boolean(state.token && state.user);

    elements.authLayout.classList.toggle('d-none', loggedIn);
    elements.workspace.classList.toggle('d-none', !loggedIn);
    elements.currentUser.classList.toggle('d-none', !loggedIn);
    elements.logoutButton.classList.toggle('d-none', !loggedIn);

    if (loggedIn) {
        elements.currentUser.textContent = `Bejelentkezve: ${state.user.username}`;
        setTimeout(() => elements.searchInput?.focus(), 0);
    }
}

/**
 * Reset editor to new note state
 */
function resetEditor() {
    state.selectedNoteId = null;
    elements.noteForm.reset();
    elements.noteId.value = '';
    elements.editorTitle.textContent = 'Új jegyzet';
    elements.deleteNoteButton.classList.add('d-none');
    renderNotes();
}

/**
 * Fill editor with note data
 */
function fillEditor(note) {
    state.selectedNoteId = note.id;
    elements.noteId.value = note.id;
    elements.noteTitle.value = note.title;
    elements.noteCategory.value = note.category || '';
    elements.noteContent.value = note.content;
    elements.editorTitle.textContent = 'Jegyzet szerkesztése';
    elements.deleteNoteButton.classList.remove('d-none');
    renderNotes();
    elements.noteTitle.focus();
}

/* ============================================
   Notes Management
   ============================================ */

/**
 * Load notes from API
 */
async function loadNotes() {
    if (!state.token) return;

    try {
        const response = await apiFetch(API_ENDPOINTS.NOTES);
        state.notes = response.data || response;
        applyFilter();
    } catch (error) {
        console.error('Error loading notes:', error);
        throw error;
    }
}

/**
 * Apply search filter to notes
 */
function applyFilter() {
    const query = elements.searchInput.value.trim().toLowerCase();

    state.filteredNotes = state.notes.filter((note) => {
        if (!query) return true;
        return [note.title, note.content, note.category || '']
            .join(' ')
            .toLowerCase()
            .includes(query);
    });

    renderNotes();
}

/**
 * Render notes list to DOM
 */
function renderNotes() {
    if (!state.filteredNotes.length) {
        elements.notesList.innerHTML = `
            <div class="empty-state">
                <p>Nincs megjeleníthető jegyzet. Hozz létre egy újat, vagy módosítsd a keresést.</p>
            </div>
        `;
        return;
    }

    elements.notesList.innerHTML = state.filteredNotes
        .map((note) => {
            const preview = note.content.length > 140 ? `${note.content.slice(0, 140)}...` : note.content;
            const activeClass = note.id === state.selectedNoteId ? 'active' : '';
            const categoryHtml = note.category ? `<span class="note-category">${escapeHtml(note.category)}</span>` : '';

            return `
                <article class="note-item ${activeClass}" data-note-id="${note.id}" role="button" tabindex="0">
                    <h5>${escapeHtml(note.title)}</h5>
                    <p>${escapeHtml(preview)}</p>
                    <div class="note-meta">
                        ${categoryHtml}
                        <span class="note-meta-item">📅 ${escapeHtml(formatDate(note.updated_at))}</span>
                    </div>
                </article>
            `;
        })
        .join('');

    // Add event listeners to notes
    document.querySelectorAll('.note-item').forEach((card) => {
        const handleSelect = () => {
            const noteId = Number(card.dataset.noteId);
            const note = state.notes.find((item) => item.id === noteId);
            if (note) fillEditor(note);
        };

        card.addEventListener('click', handleSelect);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect();
            }
        });
    });
}

/* ============================================
   Event Handlers
   ============================================ */

/**
 * Handle user registration
 */
async function handleRegister(event) {
    event.preventDefault();
    clearStatus();

    const formData = new FormData(elements.registerForm);
    const payload = Object.fromEntries(formData.entries());

    try {
        setLoading(true);

        // Validate input
        if (payload.username.length < 3) throw new Error('A felhasználónév legalább 3 karakter hosszú legyen.');
        if (payload.password.length < 6) throw new Error('A jelszó legalább 6 karakter hosszú legyen.');

        // Attempt registration
        await apiFetch(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // Auto-login after registration
        const loginResult = await apiFetch(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ username: payload.username, password: payload.password })
        });

        setSession(loginResult.token, loginResult.user);
        toggleView();
        elements.registerForm.reset();
        resetEditor();
        await loadNotes();
        setStatus(MESSAGES.REGISTRATION_SUCCESS);
    } catch (error) {
        if (error.message.includes('már létezik')) {
            elements.loginForm.querySelector('[name="username"]').value = payload.username;
            setStatus(MESSAGES.USER_EXISTS, 'error');
        } else {
            setStatus(error.message, 'error');
        }
    } finally {
        setLoading(false);
    }
}

/**
 * Handle user login
 */
async function handleLogin(event) {
    event.preventDefault();
    clearStatus();

    const formData = new FormData(elements.loginForm);
    const payload = Object.fromEntries(formData.entries());

    try {
        setLoading(true);

        const result = await apiFetch(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        setSession(result.token, result.user);
        toggleView();
        elements.loginForm.reset();
        resetEditor();
        await loadNotes();
        setStatus(MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
        setStatus(error.message, 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Handle note save (create or update)
 */
async function handleSaveNote(event) {
    event.preventDefault();
    clearStatus();

    const payload = {
        title: elements.noteTitle.value.trim(),
        category: elements.noteCategory.value.trim() || null,
        content: elements.noteContent.value.trim()
    };

    // Validation
    if (!payload.title) {
        setStatus('A cím nem lehet üres.', 'error');
        return;
    }
    if (!payload.content) {
        setStatus('A tartalom nem lehet üres.', 'error');
        return;
    }

    const noteId = elements.noteId.value;
    const isEdit = Boolean(noteId);

    try {
        setLoading(true);

        await apiFetch(isEdit ? API_ENDPOINTS.NOTES_BY_ID(noteId) : API_ENDPOINTS.NOTES, {
            method: isEdit ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });

        await loadNotes();
        setStatus(isEdit ? MESSAGES.NOTE_UPDATED : MESSAGES.NOTE_CREATED);

        if (isEdit) {
            const updated = state.notes.find((note) => note.id === Number(noteId));
            if (updated) fillEditor(updated);
        } else {
            resetEditor();
        }
    } catch (error) {
        setStatus(error.message, 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Handle note deletion
 */
async function handleDeleteNote() {
    const noteId = elements.noteId.value;
    if (!noteId) return;

    if (!confirm('Biztosan törlöd ezt a jegyzetet?')) return;

    clearStatus();

    try {
        setLoading(true);

        await apiFetch(API_ENDPOINTS.NOTES_BY_ID(noteId), { method: 'DELETE' });
        await loadNotes();
        resetEditor();
        setStatus(MESSAGES.NOTE_DELETED);
    } catch (error) {
        setStatus(error.message, 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    clearSession();
    toggleView();
    resetEditor();
    clearStatus();
}

/* ============================================
   Application Bootstrap
   ============================================ */

/**
 * Initialize application
 */
async function bootstrap() {
    // Set initial view
    toggleView();

    // Debounced search
    const debouncedFilter = debounce(applyFilter, 300);

    // Event listeners
    elements.registerForm.addEventListener('submit', (event) => {
        handleRegister(event).catch((error) => setStatus(error.message, 'error'));
    });

    elements.loginForm.addEventListener('submit', (event) => {
        handleLogin(event).catch((error) => setStatus(error.message, 'error'));
    });

    elements.noteForm.addEventListener('submit', (event) => {
        handleSaveNote(event).catch((error) => setStatus(error.message, 'error'));
    });

    elements.deleteNoteButton.addEventListener('click', () => {
        handleDeleteNote().catch((error) => setStatus(error.message, 'error'));
    });

    elements.logoutButton.addEventListener('click', handleLogout);

    elements.refreshNotesButton.addEventListener('click', () => {
        loadNotes().catch((error) => setStatus(error.message, 'error'));
    });

    elements.resetEditorButton.addEventListener('click', resetEditor);

    elements.searchInput.addEventListener('input', debouncedFilter);

    // Restore session if exists
    if (state.token && state.user) {
        try {
            await loadNotes();
        } catch (error) {
            clearSession();
            toggleView();
            setStatus(MESSAGES.SESSION_EXPIRED, 'error');
        }
    }
}

function toggleView() {
    const loggedIn = Boolean(state.token && state.user);

    elements.authLayout.classList.toggle('d-none', loggedIn);
    elements.workspace.classList.toggle('d-none', !loggedIn);
    elements.currentUser.classList.toggle('d-none', !loggedIn);
    elements.logoutButton.classList.toggle('d-none', !loggedIn);

    if (loggedIn) {
        elements.currentUser.textContent = `Bejelentkezve: ${state.user.username}`;
    }
}

function resetEditor() {
    state.selectedNoteId = null;
    elements.noteForm.reset();
    elements.noteId.value = '';
    elements.editorTitle.textContent = 'Uj jegyzet';
    elements.deleteNoteButton.classList.add('d-none');
    renderNotes();
}

function fillEditor(note) {
    state.selectedNoteId = note.id;
    elements.noteId.value = note.id;
    elements.noteTitle.value = note.title;
    elements.noteCategory.value = note.category || '';
    elements.noteContent.value = note.content;
    elements.editorTitle.textContent = 'Jegyzet szerkesztese';
    elements.deleteNoteButton.classList.remove('d-none');
    renderNotes();
}

function formatDate(value) {
    if (!value) {
        return 'nincs datum';
    }

    return new Intl.DateTimeFormat('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
}

function applyFilter() {
    const query = elements.searchInput.value.trim().toLowerCase();

    state.filteredNotes = state.notes.filter((note) => {
        if (!query) {
            return true;
        }

        return [note.title, note.content, note.category || '']
            .join(' ')
            .toLowerCase()
            .includes(query);
    });

    renderNotes();
}

function renderNotes() {
    if (!state.filteredNotes.length) {
        elements.notesList.innerHTML = '<div class="empty-state">Nincs megjelenitheto jegyzet. Hozz letre egy ujat, vagy modositsd a keresest.</div>';
        return;
    }

    elements.notesList.innerHTML = state.filteredNotes
        .map((note) => {
            const preview = note.content.length > 140 ? `${note.content.slice(0, 140)}...` : note.content;
            const activeClass = note.id === state.selectedNoteId ? 'active' : '';
            const category = note.category ? `<span class="badge text-bg-secondary">${escapeHtml(note.category)}</span>` : '';

            return `
                <article class="note-item ${activeClass}" data-note-id="${note.id}">
                    <header class="d-flex justify-content-between align-items-start gap-2">
                        <div>
                            <h5>${escapeHtml(note.title)}</h5>
                            <p class="mb-0 text-body-secondary">${escapeHtml(preview)}</p>
                        </div>
                    </header>
                    <div class="note-meta">
                        ${category}
                        <span>Frissitve: ${escapeHtml(formatDate(note.updated_at))}</span>
                    </div>
                </article>
            `;
        })
        .join('');

    document.querySelectorAll('.note-item').forEach((card) => {
        card.addEventListener('click', () => {
            const noteId = Number(card.dataset.noteId);
            const note = state.notes.find((item) => item.id === noteId);
            if (note) {
                fillEditor(note);
            }
        });
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

async function loadNotes() {
    if (!state.token) {
        return;
    }

    const notes = await apiFetch('/api/notes');
    state.notes = notes;
    applyFilter();
}

async function handleRegister(event) {
    event.preventDefault();
    clearStatus();

    const formData = new FormData(elements.registerForm);
    const payload = Object.fromEntries(formData.entries());

    try {
        await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    } catch (error) {
        if (error.message === 'User already exists') {
            elements.loginForm.username.value = payload.username;
            setStatus('Ez a felhasznalonev vagy email mar letezik. Probalj bejelentkezni, vagy valassz masikat.', 'error');
            return;
        }
        throw error;
    }

    const loginResult = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: payload.username, password: payload.password })
    });

    setSession(loginResult.token, loginResult.user);
    toggleView();
    elements.registerForm.reset();
    resetEditor();
    await loadNotes();
    setStatus('Sikeres regisztracio es automatikus bejelentkezes.');
}

async function handleLogin(event) {
    event.preventDefault();
    clearStatus();

    const formData = new FormData(elements.loginForm);
    const payload = Object.fromEntries(formData.entries());
    const result = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    setSession(result.token, result.user);
    toggleView();
    elements.loginForm.reset();
    resetEditor();
    await loadNotes();
    setStatus('Sikeres bejelentkezes.');
}

async function handleSaveNote(event) {
    event.preventDefault();
    clearStatus();

    const payload = {
        title: elements.noteTitle.value.trim(),
        category: elements.noteCategory.value.trim(),
        content: elements.noteContent.value.trim()
    };

    const noteId = elements.noteId.value;
    const isEdit = Boolean(noteId);

    await apiFetch(isEdit ? `/api/notes/${noteId}` : '/api/notes', {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
    });

    await loadNotes();
    setStatus(isEdit ? 'Jegyzet frissitve.' : 'Jegyzet letrehozva.');

    if (isEdit) {
        const updated = state.notes.find((note) => note.id === Number(noteId));
        if (updated) {
            fillEditor(updated);
        }
    } else {
        resetEditor();
    }
}

async function handleDeleteNote() {
    const noteId = elements.noteId.value;

    if (!noteId) {
        return;
    }

    clearStatus();
    await apiFetch(`/api/notes/${noteId}`, { method: 'DELETE' });
    await loadNotes();
    resetEditor();
    setStatus('Jegyzet torolve.');
}

function handleLogout() {
    clearSession();
    toggleView();
    resetEditor();
    clearStatus();
}

async function bootstrap() {
    toggleView();

    elements.registerForm.addEventListener('submit', (event) => {
        handleRegister(event).catch((error) => setStatus(error.message, 'error'));
    });

    elements.loginForm.addEventListener('submit', (event) => {
        handleLogin(event).catch((error) => setStatus(error.message, 'error'));
    });

    elements.noteForm.addEventListener('submit', (event) => {
        handleSaveNote(event).catch((error) => setStatus(error.message, 'error'));
    });

    elements.deleteNoteButton.addEventListener('click', () => {
        handleDeleteNote().catch((error) => setStatus(error.message, 'error'));
    });

    elements.logoutButton.addEventListener('click', handleLogout);
    elements.refreshNotesButton.addEventListener('click', () => {
        loadNotes().catch((error) => setStatus(error.message, 'error'));
    });
    elements.resetEditorButton.addEventListener('click', resetEditor);
    elements.searchInput.addEventListener('input', applyFilter);

    if (state.token && state.user) {
        try {
            await loadNotes();
        } catch (error) {
            clearSession();
            toggleView();
            setStatus('A munkamenet lejart. Jelentkezz be ujra.', 'error');
        }
    }
}

bootstrap().catch((error) => setStatus(error.message, 'error'));