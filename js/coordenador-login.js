(function () {
  "use strict";

  const form = document.getElementById("coordinator-login-form");
  if (!form) return;

  const loginScreen = document.getElementById("coordinator-login");
  const dashboard = document.getElementById("coordinator-dashboard");
  const message = document.getElementById("coordinator-login-message");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const username = form.elements.username.value.trim().toLowerCase();
    const password = form.elements.password.value;

    if (username !== "coordenação" || password !== "12345678") {
      message.textContent = "Usuário ou senha incorretos. Confira os dados e tente novamente.";
      message.hidden = false;
      form.elements.password.focus();
      return;
    }

    message.hidden = true;
    loginScreen.hidden = true;
    dashboard.hidden = false;
    document.getElementById("coordinator-page-title").focus();
  });
}());
