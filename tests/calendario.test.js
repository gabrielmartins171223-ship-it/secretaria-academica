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

function getMonthMarkup(selectable) {
  const calendar = createCalendar();
  const container = { className: "", innerHTML: "" };
  calendar.renderMonth(container, 2030, 4, [], { selectable: selectable });
  return container.innerHTML;
}

function weekdayLabels(markup) {
  return Array.from(markup.matchAll(/<div class="weekday-label"[^>]*>([^<]+)<\/div>/g), function (match) {
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
});
