"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function createLogin() {
  const listeners = {};
  const username = { value: "" };
  let passwordFocusCount = 0;
  const password = { value: "", focus: function () { passwordFocusCount += 1; } };
  const form = {
    elements: { username: username, password: password },
    addEventListener: function (name, callback) { listeners[name] = callback; }
  };
  const loginScreen = { hidden: false };
  const dashboard = { hidden: true };
  const message = { hidden: true, textContent: "" };
  let titleFocusCount = 0;
  const title = { focus: function () { titleFocusCount += 1; } };
  const elements = {
    "coordinator-login-form": form,
    "coordinator-login": loginScreen,
    "coordinator-dashboard": dashboard,
    "coordinator-login-message": message,
    "coordinator-page-title": title
  };
  const document = { getElementById: function (id) { return elements[id]; } };
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "coordenador-login.js"), "utf8");
  vm.runInNewContext(source, { document: document });

  return {
    submit: function () {
      let prevented = false;
      listeners.submit({ preventDefault: function () { prevented = true; } });
      assert.equal(prevented, true);
    },
    username: username,
    password: password,
    loginScreen: loginScreen,
    dashboard: dashboard,
    message: message,
    passwordFocusCount: function () { return passwordFocusCount; },
    titleFocusCount: function () { return titleFocusCount; }
  };
}

test("login incorreto mantém o painel fechado e informa o erro", function () {
  const login = createLogin();
  login.password.value = "senha-incorreta";

  login.submit();

  assert.equal(login.loginScreen.hidden, false);
  assert.equal(login.dashboard.hidden, true);
  assert.equal(login.message.hidden, false);
  assert.match(login.message.textContent, /incorretos/);
  assert.equal(login.passwordFocusCount(), 1);
});

test("credenciais válidas abrem o painel da coordenação", function () {
  const login = createLogin();
  login.username.value = "  COODERNACAO ";
  login.password.value = "12345678";

  login.submit();

  assert.equal(login.loginScreen.hidden, true);
  assert.equal(login.dashboard.hidden, false);
  assert.equal(login.message.hidden, true);
  assert.equal(login.titleFocusCount(), 1);
});

test("cada perfil não oferece link direto para a outra área", function () {
  const studentPage = fs.readFileSync(path.join(__dirname, "..", "aluno.html"), "utf8");
  const coordinatorPage = fs.readFileSync(path.join(__dirname, "..", "coordenador.html"), "utf8");

  assert.doesNotMatch(studentPage, /href="coordenador\.html"/);
  assert.doesNotMatch(coordinatorPage, /href="aluno\.html"/);
});

test("credenciais não vêm preenchidas nem aparecem como aviso na tela", function () {
  const coordinatorPage = fs.readFileSync(path.join(__dirname, "..", "coordenador.html"), "utf8");
  const usernameInput = coordinatorPage.match(/<input name="username"[^>]*>/)[0];
  const passwordInput = coordinatorPage.match(/<input name="password"[^>]*>/)[0];

  assert.doesNotMatch(usernameInput, /\bvalue=/);
  assert.doesNotMatch(passwordInput, /\bvalue=/);
  assert.doesNotMatch(coordinatorPage, /Acesso demonstrativo:/);
});
