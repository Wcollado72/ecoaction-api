const showRegisterBtn = document.getElementById('show-register-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const alertBox = document.getElementById('alert-box');

let authMode = 'login';

const updateAuthModeUI = () => {
    if (authMode === 'register') {
        authSubmitBtn.textContent = 'Register';
        showRegisterBtn.classList.remove('secondary');
        showLoginBtn.classList.add('secondary');
    } else {
        authSubmitBtn.textContent = 'Login';
        showLoginBtn.classList.remove('secondary');
        showRegisterBtn.classList.add('secondary');
    }
};

const showAlert = (message, type = 'error') => {
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
};

const hideAlert = () => {
    alertBox.textContent = '';
    alertBox.className = 'alert-box hidden';
};

showRegisterBtn.addEventListener('click', () => {
    authMode = 'register';
    hideAlert();
    updateAuthModeUI();
});

showLoginBtn.addEventListener('click', () => {
    authMode = 'login';
    hideAlert();
    updateAuthModeUI();
});

authForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!email || !password) {
        showAlert('Email and password are required.');
        return;
    }

    showAlert(
        `Frontend foundation is ready. The ${authMode} API connection will be added in the next step.`,
        'success'
    );

    console.log('Auth form submitted:', {
        authMode,
        email,
        password
    });
});

updateAuthModeUI();