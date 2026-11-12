const card = document.getElementById("authCard");
const loginPanel = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");
const loginStatus = document.getElementById("loginStatus");
const registerStatus = document.getElementById("registerStatus");

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    const showRegister = button.dataset.mode === "register";

    card.classList.remove("swing-to-register", "swing-to-login");
    card.classList.toggle("register-mode", showRegister);
    card.classList.add(showRegister ? "swing-to-register" : "swing-to-login");
    loginPanel.inert = showRegister;
    loginPanel.setAttribute("aria-hidden", String(showRegister));
    registerPanel.inert = !showRegister;
    registerPanel.setAttribute("aria-hidden", String(!showRegister));
    loginStatus.textContent = "";
    registerStatus.textContent = "";

    const activePanel = showRegister ? registerPanel : loginPanel;
    activePanel.querySelector("input").focus({ preventScroll: true });
  });
});

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  loginStatus.textContent = "Demo form: connect this to your authentication service.";
});

document.getElementById("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  registerStatus.textContent = "Demo form: connect this to your registration service.";
});
