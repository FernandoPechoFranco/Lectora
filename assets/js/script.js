const container = document.querySelector('.container');
const LoginLink = document.querySelector('.SignInLink');
const RegisterLink = document.querySelector('.SignUpLink');

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
        welcomeText: "We're delighted to have you here. If you need any assistance, feel free to reach out."
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
        welcomeText: 'Nos alegra que estés aquí. Si necesitas ayuda, no dudes en contactarnos.'
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

RegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.add('active');
});

LoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.remove('active');
});