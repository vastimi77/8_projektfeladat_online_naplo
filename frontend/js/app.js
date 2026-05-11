const state = {
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    notes: [],
    filteredNotes: [],
    selectedNoteId: null
};

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const servedOutsideBackend = isLocalHost && window.location.port && window.location.port !== '5000';
const API_BASE = (window.location.protocol === 'file:' || servedOutsideBackend) ? 'http://localhost:5000' : '';

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
        throw new Error('A szerver nem erheto el. Ellenorizd, hogy fut-e a backend a http://localhost:5000 cimen.');
    }

    const rawText = await response.text();
    let data = {};

    if (rawText) {
        try {
            data = JSON.parse(rawText);
        } catch (error) {
            data = { error: '' };
        }
    }

    if (!response.ok) {
        if (response.status === 405) {
            throw new Error('405 Method Not Allowed. Valoszinuleg nem a backend szervert ered el. Nyisd meg az alkalmazast a http://localhost:5000 cimen.');
        }
        throw new Error(data.error || `Szerverhiba (${response.status}).`);
    }

    return data;
}

function setStatus(message, type = 'success') {
    elements.statusBanner.textContent = message;
    const alertType = type === 'error' ? 'danger' : 'success';
    elements.statusBanner.className = `alert alert-${alertType}`;
}

function clearStatus() {
    elements.statusBanner.textContent = '';
    elements.statusBanner.className = 'alert d-none';
}

function setSession(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
    state.token = '';
    state.user = null;
    state.notes = [];
    state.filteredNotes = [];
    state.selectedNoteId = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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