const container = document.querySelector('.container');
const LoginLink = document.querySelector('.SignInLink');
const RegisterLink = document.querySelector('.SignUpLink');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const loginPassword = document.getElementById('loginPassword');
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

const translations = {
    en: {
        documentTitle: 'Lectora Nova | Login / Signup',
        brandName: 'Lectora Nova',
        brandTagline: 'Stories that take you further.',
        loginTitle: 'Login',
        username: 'Username',
        password: 'Password',
        loginButton: 'Login',
        noAccount: "Don't have an account?",
        signUp: 'Sign Up',
        welcomeBackTitle: 'WELCOME BACK!',
        welcomeBackText: 'We are happy to have you with us again. If you need anything, we are here to help.',
        registerTitle: 'Register',
        email: 'Email',
        registerButton: 'Register',
        haveAccount: 'Already have an account?',
        signIn: 'Sign In',
        welcomeTitle: 'WELCOME!',
        welcomeText: "We're delighted to have you here. If you need any assistance, feel free to reach out.",
        invalidCredentials: 'Incorrect username or password.',
        registerUnavailable: 'Registration is disabled. Sign in with the administrator account.',
        sessionError: 'Could not start your session. Check your browser storage settings.'
    },
    es: {
        documentTitle: 'Lectora Nova | Inicio de sesión y registro',
        brandName: 'Lectora Nova',
        brandTagline: 'Historias que te llevan más lejos.',
        loginTitle: 'Iniciar sesión',
        username: 'Usuario',
        password: 'Contraseña',
        loginButton: 'Entrar',
        noAccount: '¿No tienes una cuenta?',
        signUp: 'Regístrate',
        welcomeBackTitle: '¡QUÉ BUENO VERTE DE NUEVO!',
        welcomeBackText: 'Nos alegra tenerte de vuelta. Si necesitas algo, aquí estamos para ayudarte.',
        registerTitle: 'Crear cuenta',
        email: 'Correo electrónico',
        registerButton: 'Registrarse',
        haveAccount: '¿Ya tienes una cuenta?',
        signIn: 'Inicia sesión',
        welcomeTitle: '¡TE DAMOS LA BIENVENIDA!',
        welcomeText: 'Nos alegra que estés aquí. Si necesitas ayuda, no dudes en contactarnos.',
        invalidCredentials: 'El usuario o la contraseña son incorrectos.',
        registerUnavailable: 'El registro está deshabilitado. Inicia sesión con la cuenta del administrador.',
        sessionError: 'No se pudo iniciar la sesión. Revisa la configuración de almacenamiento del navegador.'
    }
};

function applySystemLanguage() {
    const preferredLanguages = navigator.languages || [navigator.language];
    const language = preferredLanguages
        .map((preference) => preference.toLowerCase().split('-')[0])
        .find((preference) => translations[preference]) || 'en';

    document.documentElement.lang = language;
    document.title = translations[language].documentTitle;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = translations[language][element.dataset.i18n];
    });
}

applySystemLanguage();
window.addEventListener('languagechange', applySystemLanguage);

function currentTranslations() {
    return translations[document.documentElement.lang] || translations.en;
}

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = loginPassword.value;

    if (username !== 'Admin' || password !== 'Admin852456') {
        loginMessage.textContent = currentTranslations().invalidCredentials;
        loginPassword.value = '';
        loginPassword.focus();
        return;
    }

    try {
        sessionStorage.setItem('lectoraNovaAuthenticated', 'true');
    } catch (error) {
        console.error('No se pudo guardar la sesión de Lectora Nova.', error);
        loginMessage.textContent = currentTranslations().sessionError;
        return;
    }

    const layout = window.matchMedia('(max-width: 760px)').matches ? 'M' : 'P';
    window.location.replace(`pages/dashboard${layout}.html`);
});

loginForm.addEventListener('input', () => {
    loginMessage.textContent = '';
});

registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    registerMessage.textContent = currentTranslations().registerUnavailable;
});

RegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.add('active');
});

LoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.remove('active');
});