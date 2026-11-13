(function () {
  "use strict";

  const calendar = document.getElementById("student-calendar");
  if (!calendar) return;

  const message = document.getElementById("student-message");
  const monthLabel = document.getElementById("student-month-label");
  const selectedLabel = document.getElementById("selected-date-label");
  const slotsContainer = document.getElementById("available-slots");
  const timeInput = document.getElementById("meeting-time");
  const form = document.getElementById("request-form");
  const statusForm = document.getElementById("status-form");
  const results = document.getElementById("student-requests");
  const demoData = Object.freeze({
    name: "Aluno Fictício de Demonstração",
    ra: "RA-FICTICIO-001",
    cpf: "52998224725",
    course: "Curso Fictício de Demonstração",
    reason: "Reunião de demonstração do protótipo acadêmico."
  });
  const cursor = new Date();
  cursor.setDate(1);
  let selectedDate = "";

  function refreshCalendar() {
    window.SecretariaApp.safeRun(message, function () {
      const requests = window.SecretariaStorage.getRequests();
      monthLabel.textContent = window.SecretariaApp.monthLabel(cursor);
      window.SecretariaCalendar.renderMonth(calendar, cursor.getFullYear(), cursor.getMonth(), requests, {
        selectable: true,
        selectedDate: selectedDate
      });
      renderSlots(requests);
    });
  }

  function renderSlots(requests) {
    if (!selectedDate) return;
    const date = window.SecretariaApp.fromDateKey(selectedDate);
    selectedLabel.textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
    const available = window.SecretariaStorage.slots.filter(function (time) {
      return window.SecretariaApp.isTimeAvailableToday(date, time) &&
        window.SecretariaStorage.isAvailable(selectedDate, time, requests);
    });
    timeInput.value = "";
    if (available.length === 0) {
      slotsContainer.innerHTML = '<p class="helper-text">Não há horários disponíveis nesta data. Selecione outro dia útil.</p>';
      return;
    }
    slotsContainer.innerHTML = available.map(function (time) {
      return '<button type="button" class="slot-button" data-time="' + time + '" aria-pressed="false">' + time + "</button>";
    }).join("");
  }

  function refreshAfterStorageChange() {
    refreshCalendar();
    if (statusForm.dataset.lastRa) {
      lookupRequests(statusForm.dataset.lastRa, statusForm.dataset.lastCpf);
    }
  }

  document.getElementById("student-prev-month").addEventListener("click", function () {
    cursor.setMonth(cursor.getMonth() - 1);
    refreshCalendar();
  });
  document.getElementById("student-next-month").addEventListener("click", function () {
    cursor.setMonth(cursor.getMonth() + 1);
    refreshCalendar();
  });

  document.getElementById("fill-demo-data").addEventListener("click", function () {
    form.elements.name.value = demoData.name;
    form.elements.ra.value = demoData.ra;
    form.elements.cpf.value = formatCpf(demoData.cpf);
    form.elements.course.value = demoData.course;
    form.elements.reason.value = demoData.reason;
    statusForm.elements.ra.value = demoData.ra;
    statusForm.elements.cpf.value = formatCpf(demoData.cpf);
    window.SecretariaApp.showMessage(message, "Exemplo fictício preenchido. Escolha uma data e um horário e envie para testar o fluxo.", "info");
  });

  calendar.addEventListener("click", function (event) {
    const dayButton = event.target.closest("[data-date]");
    if (!dayButton || dayButton.disabled) return;
    selectedDate = dayButton.dataset.date;
    window.SecretariaApp.clearMessage(message);
    refreshCalendar();
  });

  slotsContainer.addEventListener("click", function (event) {
    const button = event.target.closest("[data-time]");
    if (!button) return;
    timeInput.value = button.dataset.time;
    slotsContainer.querySelectorAll(".slot-button").forEach(function (slot) {
      const selected = slot === button;
      slot.classList.toggle("selected", selected);
      slot.setAttribute("aria-pressed", String(selected));
    });
  });

  form.elements.cpf.addEventListener("input", function (event) {
    const digits = window.SecretariaApp.digits(event.target.value).slice(0, 11);
    event.target.value = digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });
  statusForm.elements.cpf.addEventListener("input", function (event) {
    const digits = window.SecretariaApp.digits(event.target.value).slice(0, 11);
    event.target.value = digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });

  function formatCpf(value) {
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    window.SecretariaApp.safeRun(message, function () {
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const ra = String(data.get("ra") || "").trim();
      const cpf = window.SecretariaApp.digits(data.get("cpf"));
      const course = String(data.get("course") || "").trim();
      const reason = String(data.get("reason") || "").trim();
      const time = timeInput.value;

      if (!selectedDate) throw new Error("Selecione uma data no calendário.");
      const date = window.SecretariaApp.fromDateKey(selectedDate);
      if (!window.SecretariaApp.isBookableDate(date) || !window.SecretariaApp.isTimeAvailableToday(date, time)) {
        throw new Error("A data ou o horário escolhido não está mais disponível.");
      }
      if (!time || !window.SecretariaStorage.slots.includes(time)) throw new Error("Selecione um dos horários disponíveis.");
      if (!name || !ra || !course || !reason) throw new Error("Preencha todos os campos obrigatórios.");
      if (!window.SecretariaApp.validCpf(cpf)) throw new Error("Informe um CPF válido.");

      window.SecretariaStorage.createRequest({
        name: name,
        ra: ra,
        cpf: cpf,
        course: course,
        date: selectedDate,
        time: time,
        reason: reason
      });
      form.reset();
      window.SecretariaApp.showMessage(message, "Solicitação enviada. O pedido está aguardando aprovação da coordenação; a reunião ainda não está confirmada.", "success");
      refreshAfterStorageChange();
    });
  });

  statusForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const ra = String(new FormData(statusForm).get("ra") || "").trim();
    const cpf = window.SecretariaApp.digits(new FormData(statusForm).get("cpf"));
    if (!ra || !window.SecretariaApp.validCpf(cpf)) {
      results.innerHTML = '<p class="helper-text">Informe um RA e o CPF válido utilizado na solicitação.</p>';
      return;
    }
    statusForm.dataset.lastRa = ra;
    statusForm.dataset.lastCpf = cpf;
    lookupRequests(ra, cpf);
  });

  function lookupRequests(ra, cpf) {
    window.SecretariaApp.safeRun(message, function () {
      const matches = window.SecretariaStorage.getRequests().filter(function (request) {
        return request.ra.toLocaleLowerCase() === ra.toLocaleLowerCase() && request.cpf === cpf;
      }).sort(function (first, second) { return second.createdAt.localeCompare(first.createdAt); });
      if (!matches.length) {
        results.innerHTML = '<p class="helper-text">Nenhuma solicitação correspondente foi encontrada neste navegador.</p>';
        return;
      }
      results.innerHTML = '<table class="status-results-table"><thead><tr><th>Data e horário</th><th>Curso</th><th>Status</th></tr></thead><tbody>' +
        matches.map(function (request) {
          return "<tr><td>" + window.SecretariaApp.escapeHtml(window.SecretariaApp.formatDate(request.date, { day: "2-digit", month: "2-digit", year: "numeric" })) +
            " · " + window.SecretariaApp.escapeHtml(request.time) + "</td><td>" + window.SecretariaApp.escapeHtml(request.course) +
            '</td><td><span class="status-pill ' + window.SecretariaApp.statusClass(request.status) + '">' + window.SecretariaApp.escapeHtml(request.status) + "</span></td></tr>";
        }).join("") + "</tbody></table>";
    });
  }

  window.addEventListener("storage", function (event) {
    if (event.key === "secretaria-academica.v1") refreshAfterStorageChange();
  });
  refreshCalendar();
}());
