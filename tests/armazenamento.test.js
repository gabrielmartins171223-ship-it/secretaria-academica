"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function createStorage() {
  const values = new Map();
  let nextId = 0;
  const localStorage = {
    getItem: function (key) { return values.has(key) ? values.get(key) : null; },
    setItem: function (key, value) { values.set(key, String(value)); }
  };
  const window = {
    crypto: { randomUUID: function () { nextId += 1; return "test-" + nextId; } }
  };
  const context = vm.createContext({ window: window, localStorage: localStorage, Date: Date, JSON: JSON, Set: Set, Math: Math });
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "armazenamento.js"), "utf8");
  vm.runInContext(source, context);
  return { api: window.SecretariaStorage, localStorage: localStorage };
}

function request(date, time) {
  return {
    name: "Aluno Fictício",
    ra: "RA-TESTE",
    cpf: "52998224725",
    course: "Curso de Teste",
    date: date,
    time: time,
    reason: "Solicitação de teste"
  };
}

test("solicitação pendente reserva o intervalo e bloqueia pedido duplicado", function () {
  const storage = createStorage();
  const date = "2030-05-06";
  assert.equal(storage.api.isAvailable(date, "09:00", storage.api.getRequests()), true);
  const created = storage.api.createRequest(request(date, "09:00"));
  assert.equal(created.status, "PENDENTE");
  assert.equal(storage.api.isAvailable(date, "09:00", storage.api.getRequests()), false);
  assert.throws(function () { storage.api.createRequest(request(date, "09:00")); }, /reservado/);
});

test("aprovar confirma a solicitação e mantém o intervalo ocupado", function () {
  const storage = createStorage();
  const created = storage.api.createRequest(request("2030-05-07", "10:00"));
  const updated = storage.api.updateStatus(created.id, "APROVADA");
  assert.equal(updated.status, "APROVADA");
  assert.equal(storage.api.isAvailable("2030-05-07", "10:00", storage.api.getRequests()), false);
});

test("recusar libera o intervalo e impede nova decisão", function () {
  const storage = createStorage();
  const created = storage.api.createRequest(request("2030-05-08", "11:00"));
  storage.api.updateStatus(created.id, "RECUSADA");
  assert.equal(storage.api.isAvailable("2030-05-08", "11:00", storage.api.getRequests()), true);
  assert.throws(function () { storage.api.updateStatus(created.id, "APROVADA"); }, /já foi analisada/);
});

test("não aprova solicitação quando outro pedido ativo ocupa o horário", function () {
  const storage = createStorage();
  const created = storage.api.createRequest(request("2030-05-09", "14:00"));
  const state = JSON.parse(storage.localStorage.getItem("secretaria-academica.v1"));
  state.requests.push(Object.assign({}, request("2030-05-09", "14:00"), { id: "conflito", status: "PENDENTE" }));
  storage.localStorage.setItem("secretaria-academica.v1", JSON.stringify(state));
  assert.throws(function () { storage.api.updateStatus(created.id, "APROVADA"); }, /Não é possível aprovar/);
});

test("dados persistem no armazenamento local após nova leitura", function () {
  const storage = createStorage();
  storage.api.createRequest(request("2030-05-10", "15:00"));
  assert.equal(storage.api.getRequests().length, 1);
  assert.equal(storage.api.getRequests()[0].status, "PENDENTE");
});
