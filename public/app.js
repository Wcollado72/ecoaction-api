// File: public/app.js
// Description: EcoAction frontend — handles auth (register/login/logout),
// session persistence on page reload, and full task CRUD with filters.

// ─── DOM REFERENCES ────────────────────────────────────────────────────────────

// Auth panel — logged-out view
const authLoggedOut   = document.getElementById('auth-logged-out');
const showRegisterBtn = document.getElementById('show-register-btn');
const showLoginBtn    = document.getElementById('show-login-btn');
const alertBox        = document.getElementById('alert-box');
const authForm        = document.getElementById('auth-form');
const authSubmitBtn   = document.getElementById('auth-submit-btn');

// Forgot / Reset password sections
const forgotLinkWrap     = document.getElementById('forgot-password-link-wrap');
const showForgotBtn      = document.getElementById('show-forgot-btn');
const forgotFormSection  = document.getElementById('forgot-form-section');
const forgotForm         = document.getElementById('forgot-form');
const devTokenBox        = document.getElementById('dev-token-box');
const devTokenValue      = document.getElementById('dev-token-value');
const backToLoginBtn     = document.getElementById('back-to-login-btn');
const resetFormSection   = document.getElementById('reset-form-section');
const resetForm          = document.getElementById('reset-form');
const resetTokenInput    = document.getElementById('reset-token');
const backToForgotBtn    = document.getElementById('back-to-forgot-btn');

// Auth panel — logged-in view
const authLoggedIn    = document.getElementById('auth-logged-in');
const authUserEmail   = document.getElementById('auth-user-email');
const logoutBtn       = document.getElementById('logout-btn');

// Dashboard panel
const dashboardSubtitle   = document.getElementById('dashboard-subtitle');
const addTaskBtn          = document.getElementById('add-task-btn');
const dashboardPlaceholder = document.getElementById('dashboard-placeholder');

// Task form section
const taskFormSection = document.getElementById('task-form-section');
const taskForm        = document.getElementById('task-form');
const taskFormTitle   = document.getElementById('task-form-title');
const taskIdInput     = document.getElementById('task-id');
const taskTitleInput  = document.getElementById('task-title');
const taskDescInput   = document.getElementById('task-description');
const taskStatusSel   = document.getElementById('task-status');
const taskDueDateInp  = document.getElementById('task-due-date');
const taskSubmitBtn   = document.getElementById('task-submit-btn');
const taskCancelBtn   = document.getElementById('task-cancel-btn');
const taskAlertBox    = document.getElementById('task-alert-box');

// Filter section
const filterSection   = document.getElementById('filter-section');
const filterStatusSel = document.getElementById('filter-status');
const filterDateInp   = document.getElementById('filter-date');
const applyFilterBtn  = document.getElementById('apply-filter-btn');
const clearFilterBtn  = document.getElementById('clear-filter-btn');
const seedTasksBtn    = document.getElementById('seed-tasks-btn');

// Task list section
const taskListSection = document.getElementById('task-list-section');
const taskCountBadge  = document.getElementById('task-count');
const taskList        = document.getElementById('task-list');

// ─── PASSWORD VISIBILITY TOGGLE ────────────────────────────────────────────────

// SVG: eye open (password visible)
const SVG_EYE_OPEN = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`.trim();

// SVG: eye closed (password hidden)
const SVG_EYE_CLOSED = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
           a18.45 18.45 0 0 1 5.06-5.94
           M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8
           a18.5 18.5 0 0 1-2.16 3.19
           m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
  <line x1="1" y1="1" x2="23" y2="23"/>
</svg>`.trim();

/**
 * Wires up all .toggle-password buttons on the page.
 * Each button must have data-target="<input-id>".
 * Toggles between type="password" and type="text", swapping the eye icon.
 */
const initPasswordToggles = () => {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        // Set initial icon (eye-closed = password hidden = default state)
        btn.innerHTML = SVG_EYE_CLOSED;

        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;

            const isNowVisible = input.type === 'password';
            input.type = isNowVisible ? 'text' : 'password';

            btn.innerHTML = isNowVisible ? SVG_EYE_OPEN : SVG_EYE_CLOSED;
            btn.classList.toggle('is-visible', isNowVisible);
            btn.setAttribute('aria-label', isNowVisible ? 'Hide password' : 'Show password');
        });
    });
};

// ─── STATE ─────────────────────────────────────────────────────────────────────

let authMode      = 'login';   // 'login' | 'register'
let editingTaskId = null;      // null when creating, task.id when editing

// ─── TOKEN STORAGE ─────────────────────────────────────────────────────────────
// Using sessionStorage keeps the session alive for the tab lifetime.
// On page close the session ends, providing a sensible security default.

const TOKEN_KEY = 'ecoaction_token';

const getToken  = ()    => sessionStorage.getItem(TOKEN_KEY);
const setToken  = (t)   => sessionStorage.setItem(TOKEN_KEY, t);
const clearToken = ()   => sessionStorage.removeItem(TOKEN_KEY);

// ─── ALERT HELPERS ─────────────────────────────────────────────────────────────

/**
 * Shows a message in the auth panel alert box.
 * @param {string} msg  - Text to display.
 * @param {'error'|'success'} type
 */
const showAlert = (msg, type = 'error') => {
    alertBox.textContent = msg;
    alertBox.className = `alert-box ${type}`;
    alertBox.classList.remove('hidden');
};

const hideAlert = () => alertBox.classList.add('hidden');

/**
 * Shows a message inside the task form (doesn't override auth alerts).
 */
const showTaskAlert = (msg, type = 'error') => {
    taskAlertBox.textContent = msg;
    taskAlertBox.className = `alert-box ${type}`;
    taskAlertBox.classList.remove('hidden');
};

const hideTaskAlert = () => taskAlertBox.classList.add('hidden');

// ─── API HELPER ────────────────────────────────────────────────────────────────

/**
 * Thin wrapper around fetch that attaches the JWT and Content-Type header.
 * Returns { response, data } where data is already parsed JSON.
 */
const apiCall = async (endpoint, options = {}) => {
    const token   = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(endpoint, { ...options, headers });

    let data = {};
    try {
        data = await response.json();
    } catch (_) {
        // Response had no JSON body (e.g., network error)
    }

    return { response, data };
};

/**
 * Extracts a human-readable error message from an API error response.
 */
const extractErrorMessage = (data, fallback = 'Something went wrong. Please try again.') => {
    if (data?.details?.length) {
        return data.details.map(d => d.message).join(' ');
    }
    return data?.message || fallback;
};

// ─── UI STATE: SHOW DASHBOARD ──────────────────────────────────────────────────

/**
 * Transitions the UI to the logged-in state.
 * Hides auth form, shows logged-in card, reveals dashboard sections.
 * @param {string} email - The logged-in user's email address.
 */
const showDashboard = (email) => {
    // Auth panel: swap to logged-in state
    authLoggedOut.classList.add('hidden');
    authLoggedIn.classList.remove('hidden');
    authUserEmail.textContent = email;

    // Dashboard panel: reveal sections
    dashboardPlaceholder.classList.add('hidden');
    dashboardSubtitle.textContent = `Welcome, ${email}`;
    addTaskBtn.classList.remove('hidden');
    filterSection.classList.remove('hidden');
    taskListSection.classList.remove('hidden');
};

/**
 * Transitions the UI back to the logged-out state.
 * Re-shows auth form, hides dashboard, clears task list.
 */
const hideDashboard = () => {
    // Auth panel: swap to logged-out state
    authLoggedIn.classList.add('hidden');
    authLoggedOut.classList.remove('hidden');
    authUserEmail.textContent = '';

    // Dashboard panel: hide sections and reset
    dashboardPlaceholder.classList.remove('hidden');
    dashboardSubtitle.textContent = 'Log in to start managing your eco tasks.';
    addTaskBtn.classList.add('hidden');
    taskFormSection.classList.add('hidden');
    filterSection.classList.add('hidden');
    taskListSection.classList.add('hidden');
    taskList.innerHTML = '';
    taskCountBadge.textContent = '';
};

// ─── SESSION RESTORE ───────────────────────────────────────────────────────────

/**
 * On page load: check if a token exists and is still valid.
 * If valid, restore the dashboard without requiring re-login.
 */
const restoreSession = async () => {
    const token = getToken();
    if (!token) return; // No session — show auth form

    const { response, data } = await apiCall('/api/auth/me');

    if (response.ok && data.success) {
        showDashboard(data.data.email);
        loadTasks();
    } else {
        // Token expired or invalid — clean up and show auth
        clearToken();
    }
};

// ─── AUTH PANEL VIEW SWITCHER ──────────────────────────────────────────────────
// The auth panel has three views: 'auth' (login/register), 'forgot', 'reset'.
// Only one is visible at a time.

const showAuthView = (view) => {
    // Hide all three views first
    authForm.classList.add('hidden');
    forgotFormSection.classList.add('hidden');
    resetFormSection.classList.add('hidden');
    devTokenBox.classList.add('hidden');
    hideAlert();

    if (view === 'auth') {
        authForm.classList.remove('hidden');
    } else if (view === 'forgot') {
        forgotFormSection.classList.remove('hidden');
        forgotForm.reset();
    } else if (view === 'reset') {
        forgotFormSection.classList.remove('hidden'); // keep dev token visible
        resetFormSection.classList.remove('hidden');
    }
};

// ─── AUTH MODE UI (Login / Register toggle) ────────────────────────────────────

/**
 * Updates the Login/Register toggle buttons:
 * - Active mode → white solid button  (light-solid-button)
 * - Inactive mode → transparent button (light-button)
 */
const updateAuthModeUI = () => {
    if (authMode === 'register') {
        authSubmitBtn.textContent = 'Create Account';

        // Register button = active (white)
        showRegisterBtn.classList.add('light-solid-button');
        showRegisterBtn.classList.remove('light-button');

        // Login button = inactive (transparent)
        showLoginBtn.classList.add('light-button');
        showLoginBtn.classList.remove('light-solid-button');

        // Hide the "Forgot password?" link — only relevant on login
        forgotLinkWrap.classList.add('hidden');

    } else {
        authSubmitBtn.textContent = 'Login';

        // Login button = active (white)
        showLoginBtn.classList.add('light-solid-button');
        showLoginBtn.classList.remove('light-button');

        // Register button = inactive (transparent)
        showRegisterBtn.classList.add('light-button');
        showRegisterBtn.classList.remove('light-solid-button');

        // Show the "Forgot password?" link
        forgotLinkWrap.classList.remove('hidden');
    }
};

showRegisterBtn.addEventListener('click', () => {
    authMode = 'register';
    showAuthView('auth');
    updateAuthModeUI();
});

showLoginBtn.addEventListener('click', () => {
    authMode = 'login';
    showAuthView('auth');
    updateAuthModeUI();
});

// ─── AUTH FORM SUBMIT ──────────────────────────────────────────────────────────

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    // Basic client-side pre-check
    if (!email || !password) {
        showAlert('Please fill in both email and password.');
        return;
    }

    const endpoint = authMode === 'register'
        ? '/api/auth/register'
        : '/api/auth/login';

    const { response, data } = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        showAlert(extractErrorMessage(data));
        return;
    }

    if (authMode === 'register') {
        // Registration success — prompt user to log in
        showAlert('Account created! Please log in.', 'success');
        authMode = 'login';
        updateAuthModeUI();
        authForm.reset();
    } else {
        // Login success — store token and show dashboard
        setToken(data.token);
        authForm.reset();
        hideAlert();
        showDashboard(data.user.email);
        loadTasks();
    }
});

// ─── LOGOUT ────────────────────────────────────────────────────────────────────

logoutBtn.addEventListener('click', async () => {
    // Notify the server to blacklist the current token
    await apiCall('/api/auth/logout', { method: 'POST' });
    clearToken();
    hideDashboard();
    showAlert('You have been logged out successfully.', 'success');
});

// ─── TASK LOADING ──────────────────────────────────────────────────────────────

/**
 * Fetches tasks from the API and renders them.
 * @param {string} status   - Optional status filter (pending | in_progress | done).
 * @param {string} dueDate  - Optional due date filter (YYYY-MM-DD).
 */
const loadTasks = async (status = '', dueDate = '') => {
    taskList.innerHTML = '<p class="loading-text">Loading tasks…</p>';

    const params = new URLSearchParams();
    if (status)  params.append('status',   status);
    if (dueDate) params.append('due_date', dueDate);

    const url = `/api/tasks${params.toString() ? '?' + params.toString() : ''}`;
    const { response, data } = await apiCall(url);

    if (!response.ok) {
        taskList.innerHTML = '<p class="error-text">Could not load tasks. Please try again.</p>';
        return;
    }

    renderTasks(data.data, data.count);
};

// ─── TASK RENDERING ────────────────────────────────────────────────────────────

const STATUS_LABELS = {
    pending:     '⏳ Pending',
    in_progress: '🔄 In Progress',
    done:        '✅ Done'
};

/**
 * Safely escapes HTML special characters to prevent XSS.
 */
const escapeHtml = (str) => String(str).replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
);

/**
 * Formats an ISO date string to a readable short date (e.g. "May 15, 2026").
 */
const formatDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

/**
 * Renders an array of task objects as cards inside #task-list.
 */
const renderTasks = (tasks, count) => {
    // Update count badge
    taskCountBadge.textContent = count > 0 ? `(${count})` : '';

    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = `
            <p class="no-tasks">
                No tasks found. Click <strong>+ New Task</strong> to create one,
                or use <strong>🌱 Load Samples</strong> to add pre-defined eco actions.
            </p>`;
        return;
    }

    taskList.innerHTML = tasks.map(task => {
        const dueText = formatDate(task.due_date);
        return `
        <div class="task-card" data-id="${task.id}">
            <div class="task-card-header">
                <span class="task-title-text">${escapeHtml(task.title)}</span>
                <span class="status-badge badge-${task.status}">${STATUS_LABELS[task.status] || task.status}</span>
            </div>
            ${task.description
                ? `<p class="task-desc">${escapeHtml(task.description)}</p>`
                : ''}
            <div class="task-card-footer">
                <span class="task-meta">${dueText ? '📅 ' + dueText : '<span class="no-date">No due date</span>'}</span>
                <div class="task-actions">
                    <button class="btn-task-edit light-button" data-id="${task.id}">Edit</button>
                    <button class="btn-task-delete light-button btn-danger" data-id="${task.id}">Delete</button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Attach event listeners to the newly rendered buttons
    taskList.querySelectorAll('.btn-task-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const task = tasks.find(t => String(t.id) === btn.dataset.id);
            if (task) openEditForm(task);
        });
    });

    taskList.querySelectorAll('.btn-task-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteTask(btn.dataset.id));
    });
};

// ─── TASK FORM ─────────────────────────────────────────────────────────────────

/** Resets the form to "new task" state and shows it. */
addTaskBtn.addEventListener('click', () => {
    editingTaskId = null;
    taskIdInput.value = '';
    taskForm.reset();
    taskFormTitle.textContent = 'New Task';
    taskSubmitBtn.textContent = 'Create Task';
    hideTaskAlert();
    taskFormSection.classList.remove('hidden');
    taskTitleInput.focus();
});

/** Hides and resets the task form without saving. */
taskCancelBtn.addEventListener('click', () => {
    taskFormSection.classList.add('hidden');
    editingTaskId = null;
    taskForm.reset();
    hideTaskAlert();
});

/** Opens the task form pre-filled for editing an existing task. */
const openEditForm = (task) => {
    editingTaskId        = task.id;
    taskIdInput.value    = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value  = task.description || '';
    taskStatusSel.value  = task.status;
    taskDueDateInp.value = task.due_date ? task.due_date.substring(0, 10) : '';
    taskFormTitle.textContent  = 'Edit Task';
    taskSubmitBtn.textContent  = 'Update Task';
    hideTaskAlert();
    taskFormSection.classList.remove('hidden');
    taskTitleInput.focus();
};

/** Handles both task creation (POST) and update (PUT). */
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideTaskAlert();

    const title = taskTitleInput.value.trim();
    if (!title) {
        showTaskAlert('Task title is required.');
        taskTitleInput.focus();
        return;
    }

    const body = {
        title,
        description: taskDescInput.value.trim() || undefined,
        status:      taskStatusSel.value,
        due_date:    taskDueDateInp.value || undefined
    };

    const isEditing = !!editingTaskId;
    const { response, data } = await apiCall(
        isEditing ? `/api/tasks/${editingTaskId}` : '/api/tasks',
        { method: isEditing ? 'PUT' : 'POST', body: JSON.stringify(body) }
    );

    if (!response.ok) {
        showTaskAlert(extractErrorMessage(data));
        return;
    }

    // Success: close form and refresh list
    taskFormSection.classList.add('hidden');
    editingTaskId = null;
    taskForm.reset();
    loadTasks(filterStatusSel.value, filterDateInp.value);
});

// ─── TASK DELETE ───────────────────────────────────────────────────────────────

const deleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) return;

    const { response, data } = await apiCall(`/api/tasks/${id}`, { method: 'DELETE' });

    if (!response.ok) {
        showAlert(extractErrorMessage(data, 'Could not delete task.'));
        return;
    }

    loadTasks(filterStatusSel.value, filterDateInp.value);
};

// ─── FILTERS ───────────────────────────────────────────────────────────────────

applyFilterBtn.addEventListener('click', () => {
    loadTasks(filterStatusSel.value, filterDateInp.value);
});

clearFilterBtn.addEventListener('click', () => {
    filterStatusSel.value = '';
    filterDateInp.value   = '';
    loadTasks();
});

// ─── SEED TASKS ────────────────────────────────────────────────────────────────

seedTasksBtn.addEventListener('click', async () => {
    seedTasksBtn.disabled     = true;
    seedTasksBtn.textContent  = 'Loading…';

    const { response, data } = await apiCall('/api/tasks/seed', { method: 'POST' });

    seedTasksBtn.disabled    = false;
    seedTasksBtn.textContent = '🌱 Load Samples';

    if (response.ok) {
        showAlert(data.message, 'success');
        loadTasks(filterStatusSel.value, filterDateInp.value);
    } else {
        showAlert(extractErrorMessage(data, 'Could not load sample tasks.'));
    }
});

// ─── FORGOT PASSWORD ───────────────────────────────────────────────────────────

// "Forgot your password?" link → switch to forgot-password view
showForgotBtn.addEventListener('click', () => {
    showAuthView('forgot');
});

// "← Back to Login" inside forgot view
backToLoginBtn.addEventListener('click', () => {
    showAuthView('auth');
});

// "← Back" inside reset view (goes back to forgot view keeping token visible)
backToForgotBtn.addEventListener('click', () => {
    resetFormSection.classList.add('hidden');
});

// Forgot Password form submit
forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById('forgot-email').value.trim();

    if (!email) {
        showAlert('Please enter your email address.');
        return;
    }

    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Sending…';

    const { response, data } = await apiCall('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    });

    submitBtn.disabled    = false;
    submitBtn.textContent = 'Send Reset Token';

    if (!response.ok) {
        showAlert(extractErrorMessage(data));
        return;
    }

    // Show the dev-mode token box if a token was returned
    if (data.dev_reset_token) {
        devTokenValue.textContent = data.dev_reset_token;
        devTokenBox.classList.remove('hidden');

        // Auto-fill the reset token field for convenience
        resetTokenInput.value = data.dev_reset_token;

        // Show the reset password form below
        resetFormSection.classList.remove('hidden');
    } else {
        // Email not found — show generic success (don't reveal whether email exists)
        showAlert(data.message, 'success');
    }
});

// ─── RESET PASSWORD ────────────────────────────────────────────────────────────

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const token           = document.getElementById('reset-token').value.trim();
    const newPassword     = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;

    if (!token) {
        showAlert('Please paste your reset token.');
        return;
    }

    if (!newPassword || newPassword.length < 6) {
        showAlert('New password must be at least 6 characters long.');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match. Please check both fields.');
        return;
    }

    const submitBtn = resetForm.querySelector('button[type="submit"]');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Resetting…';

    const { response, data } = await apiCall('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
    });

    submitBtn.disabled    = false;
    submitBtn.textContent = 'Reset Password';

    if (!response.ok) {
        showAlert(extractErrorMessage(data));
        return;
    }

    // Success — go back to login and show success message
    authMode = 'login';
    updateAuthModeUI();
    showAuthView('auth');
    authForm.reset();
    showAlert('✅ Password reset successfully! Please log in with your new password.', 'success');
});

// ─── INIT ──────────────────────────────────────────────────────────────────────

// Initialize password visibility toggle buttons
initPasswordToggles();

// Set initial button styles based on default authMode = 'login'
updateAuthModeUI();

// Restore session from storage (if token still valid)
restoreSession();
