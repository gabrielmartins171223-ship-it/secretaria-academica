"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function createStorage(random) {
  const values = new Map();
  let nextId = 0;
  const math = Object.create(Math);
  if (random) math.random = random;
  const localStorage = {
    getItem: function (key) { return values.has(key) ? values.get(key) : null; },
    setItem: function (key, value) { values.set(key, String(value)); }
  };
  const window = {
    crypto: { randomUUID: function () { nextId += 1; return "test-" + nextId; } }
  };
  const context = vm.createContext({ window: window, localStorage: localStorage, Date: Date, JSON: JSON, Set: Set, Math: math });
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

test("gera novos pedidos fictícios aleatórios como pendentes", function () {
  const storage = createStorage();
  const result = storage.api.seedDemoRequests();
  const samples = storage.api.getRequests();
  assert.equal(result.created, 9);
  assert.equal(samples.length, 9);
  assert.ok(samples.every(function (item) { return item.status === "PENDENTE" && item.source === "DEMO"; }));
  assert.equal(new Set(samples.map(function (item) { return item.id; })).size, 9);
  assert.equal(new Set(samples.map(function (item) { return item.ra; })).size, 9);
  assert.equal(new Set(samples.map(function (item) { return item.reason; })).size, 9);
  assert.ok(new Set(samples.map(function (item) { return item.time; })).size > 1);
  assert.equal(new Set(samples.map(function (item) { return item.date + " " + item.time; })).size, 9);
  assert.ok(samples.every(function (item) {
    const weekday = new Date(item.date + "T12:00:00").getDay();
    return weekday !== 0 && weekday !== 6;
  }));
});

test("cada geração cria novos exemplos e preserva pedidos e decisões existentes", function () {
  let seed = 123456;
  const storage = createStorage(function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  });
  const original = storage.api.createRequest(request("2040-01-02", "09:00"));
  const initialSamples = storage.api.seedDemoRequests();
  assert.equal(initialSamples.created, 9);
  const firstSample = storage.api.getRequests().find(function (item) { return item.source === "DEMO"; });
  storage.api.updateStatus(firstSample.id, "APROVADA");
  const secondRun = storage.api.seedDemoRequests();
  const requests = storage.api.getRequests();
  assert.equal(secondRun.created, 9);
  assert.equal(requests.length, 19);
  assert.equal(requests.find(function (item) { return item.id === original.id; }).status, "PENDENTE");
  assert.equal(requests.find(function (item) { return item.id === firstSample.id; }).status, "APROVADA");
  assert.equal(requests.filter(function (item) { return item.status === "PENDENTE" && item.source === "DEMO"; }).length, 17);
  const firstBatch = requests.filter(function (item) { return item.source === "DEMO"; }).slice(0, 9);
  const secondBatch = requests.filter(function (item) { return item.source === "DEMO"; }).slice(9);
  assert.notDeepEqual(firstBatch.map(function (item) { return [item.name, item.reason, item.date, item.time]; }),
    secondBatch.map(function (item) { return [item.name, item.reason, item.date, item.time]; }));
});
