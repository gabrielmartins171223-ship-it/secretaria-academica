"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function createCalendar() {
  const window = {
    SecretariaStorage: {
      slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      isAvailable: function () { return true; }
    }
  };
  const context = vm.createContext({ window: window, Date: Date, Intl: Intl });
  const appSource = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
  const calendarSource = fs.readFileSync(path.join(__dirname, "..", "js", "calendario.js"), "utf8");
  vm.runInContext(appSource, context);
  vm.runInContext(calendarSource, context);
  return window.SecretariaCalendar;
}

function getMonthMarkup(selectable, closedDates) {
  const calendar = createCalendar();
  const container = { className: "", innerHTML: "" };
  calendar.renderMonth(container, 2030, 4, [], { selectable: selectable, closedDates: closedDates || [] });
  return container.innerHTML;
}

function weekdayLabels(markup) {
  return Array.from(markup.matchAll(/<div class="weekday-label"[^>]*>(?:<abbr[^>]*>)?([^<]+)(?:<\/abbr>)?<\/div>/g), function (match) {
    return match[1];
  });
}

function dayNumbers(markup) {
  return Array.from(markup.matchAll(/<span class="day-number">(\d+)<\/span>/g), function (match) {
    return Number(match[1]);
  });
}

test("calendários mensal do aluno e da coordenação usam os mesmos dias e colunas", function () {
  const studentMarkup = getMonthMarkup(true);
  const coordinatorMarkup = getMonthMarkup(false);
  const expectedWeekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  assert.deepEqual(weekdayLabels(studentMarkup), expectedWeekdays);
  assert.deepEqual(weekdayLabels(coordinatorMarkup), expectedWeekdays);
  assert.deepEqual(dayNumbers(coordinatorMarkup), dayNumbers(studentMarkup));
  assert.equal(dayNumbers(studentMarkup)[0], 29);
  assert.match(coordinatorMarkup, /calendar-day-readonly/);
  assert.match(studentMarkup, /title="Segunda-feira"/);
  assert.match(coordinatorMarkup, /title="Domingo"/);
});

test("eventos mensais mantêm o nome acessível e separam horário e nome para adaptação visual", function () {
  const calendar = createCalendar();
  const container = { className: "", innerHTML: "" };
  const request = {
    id: "request-1",
    date: "2030-05-01",
    time: "09:00",
    name: "Aluna de Teste",
    status: "PENDENTE"
  };

  calendar.renderMonth(container, 2030, 4, [request], {});

  assert.match(container.innerHTML, /class="calendar-event month-calendar-event status-PENDENTE"/);
  assert.match(container.innerHTML, /aria-label="09:00 Aluna de Teste, PENDENTE"/);
  assert.match(container.innerHTML, /class="calendar-event-time">09:00<\/span>/);
  assert.match(container.innerHTML, /class="calendar-event-name">Aluna de Teste<\/span>/);
});

test("data bloqueada fica indisponível para o aluno e identificada no calendário da coordenação", function () {
  const closedDates = [{ date: "2030-05-01", reason: "Imprevisto" }];
  const studentMarkup = getMonthMarkup(true, closedDates);
  const coordinatorMarkup = getMonthMarkup(false, closedDates);

  assert.match(studentMarkup, /class="calendar-day is-blocked" data-date="2030-05-01" disabled/);
  assert.match(studentMarkup, /aria-label="[^"]*, sem atendimento"/);
  assert.match(coordinatorMarkup, /class="calendar-closure-label" title="Imprevisto">Sem atendimento/);
});
