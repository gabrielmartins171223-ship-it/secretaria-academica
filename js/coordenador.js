(function () {
  "use strict";

  const calendar = document.getElementById("coordinator-calendar");
  if (!calendar) return;

  const message = document.getElementById("coordinator-message");
  const periodLabel = document.getElementById("coordinator-period-label");
  const requestList = document.getElementById("request-list");
  const requestCount = document.getElementById("request-count");
  const filter = document.getElementById("request-filter");
  const dialog = document.getElementById("request-dialog");
  const dialogContent = document.getElementById("dialog-content");
  const dialogActions = document.getElementById("dialog-actions");
  const closureDialog = document.getElementById("closure-dialog");
  const closureForm = document.getElementById("closure-form");
  const closureDate = document.getElementById("closure-date");
  const closureList = document.getElementById("closure-list");
  const closureMessage = document.getElementById("closure-message");
  let cursor = new Date();
  let view = "month";

  function refresh() {
    window.SecretariaApp.safeRun(message, function () {
      const requests = window.SecretariaStorage.getRequests();
      const closedDates = window.SecretariaStorage.getClosures();
      renderMetrics(requests);
      renderCalendar(requests, closedDates);
      renderRequestList(requests);
      renderClosureList(closedDates);
    });
  }

  function renderMetrics(requests) {
    document.getElementById("pending-count").textContent = requests.filter(function (item) { return item.status === "PENDENTE"; }).length;
    document.getElementById("approved-count").textContent = requests.filter(function (item) { return item.status === "APROVADA"; }).length;
    document.getElementById("refused-count").textContent = requests.filter(function (item) { return item.status === "RECUSADA"; }).length;
  }

  function renderCalendar(requests, closedDates) {
    if (view === "month") {
      periodLabel.textContent = window.SecretariaApp.monthLabel(cursor);
    } else if (view === "day") {
      periodLabel.textContent = window.SecretariaApp.formatDate(window.SecretariaApp.localDateKey(cursor), { day: "numeric", month: "short", year: "numeric" });
    } else {
      const start = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - ((cursor.getDay() + 6) % 7));
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      periodLabel.textContent = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(start) + " – " +
        new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" }).format(end);
    }
    window.SecretariaCalendar.renderPeriod(calendar, cursor, view, requests, closedDates);
  }

  function renderClosureList(closedDates) {
    const ordered = closedDates.slice().sort(function (first, second) {
      return first.date.localeCompare(second.date);
    });
    if (!ordered.length) {
      closureList.innerHTML = '<div class="closure-empty"><span class="closure-empty-icon" aria-hidden="true">✓</span>' +
        "<strong>Nenhuma data bloqueada</strong><span>Quando precisar, marque um dia sem atendimento.</span></div>";
      return;
    }
    closureList.innerHTML = ordered.map(function (closure) {
      const date = window.SecretariaApp.escapeHtml(window.SecretariaApp.formatDate(closure.date, {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      }));
      const reason = window.SecretariaApp.escapeHtml(closure.reason || "Motivo não informado");
      return '<article class="closure-card"><span class="closure-card-icon" aria-hidden="true">×</span>' +
        '<div class="closure-card-copy"><strong>' + date + "</strong><span>" + reason + "</span></div>" +
        '<button type="button" class="button button-secondary closure-release" data-unblock-date="' +
        window.SecretariaApp.escapeHtml(closure.date) + '" aria-label="Liberar ' + date + '">Liberar data</button></article>';
    }).join("");
  }

  function renderRequestList(requests) {
    const selected = filter.value;
    const filtered = requests.filter(function (request) {
      return selected === "all" || request.status === selected;
    }).sort(function (first, second) {
      const dateOrder = first.date.localeCompare(second.date);
      return dateOrder || first.time.localeCompare(second.time);
    });
    requestCount.textContent = filtered.length;
    requestCount.setAttribute("aria-label", filtered.length + (filtered.length === 1 ? " solicitação" : " solicitações"));
    if (!filtered.length) {
      const emptyMessage = selected === "all" ? "Nenhuma solicitação recebida ainda." : "Nenhuma solicitação neste filtro.";
      requestList.innerHTML = '<div class="empty-list">' +
        '<span class="empty-list-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" focusable="false">' +
        '<path d="M5 6.5h14A1.5 1.5 0 0 1 20.5 8v10A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V8A1.5 1.5 0 0 1 5 6.5Z" stroke="currentColor" stroke-width="1.6"/>' +
        '<path d="m4.5 8 7.5 5 7.5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        "<strong>" + emptyMessage + "</strong><span>Novos pedidos aparecerão aqui.</span></div>";
      return;
    }
    requestList.innerHTML = filtered.map(function (request) {
      const name = window.SecretariaApp.escapeHtml(request.name);
      const date = window.SecretariaApp.escapeHtml(window.SecretariaApp.formatDate(request.date, { day: "2-digit", month: "short" }));
      const course = window.SecretariaApp.escapeHtml(request.course);
      const time = window.SecretariaApp.escapeHtml(request.time);
      const reason = window.SecretariaApp.escapeHtml(request.reason);
      const status = window.SecretariaApp.statusClass(request.status);
      return '<button type="button" class="request-card ' + status + '" data-request-id="' + window.SecretariaApp.escapeHtml(request.id) + '">' +
        '<span class="request-card-heading"><span class="request-card-name">' + name + '</span><span class="request-status ' +
        status + '">' + window.SecretariaApp.escapeHtml(request.status) + "</span></span>" +
        '<span class="request-card-meta"><span class="request-card-date"><svg viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">' +
        '<rect x="4" y="5.5" width="16" height="15" rx="2" stroke="currentColor" stroke-width="1.6"/>' +
        '<path d="M8 3.5v4M16 3.5v4M4 9.5h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
        "</svg>" + date + '</span><span class="request-card-time"><svg viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/>' +
        '<path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        "</svg>" + time + "</span></span>" +
        '<span class="request-card-course">' + course + "</span>" +
        '<span class="request-card-reason"><span class="request-card-reason-label">Motivo</span>' +
        '<span class="request-card-reason-text">' + reason + "</span></span></button>";
    }).join("");
  }

  function openRequest(id) {
    window.SecretariaApp.safeRun(message, function () {
      const request = window.SecretariaStorage.getRequests().find(function (item) { return item.id === id; });
      if (!request) throw new Error("A solicitação não foi encontrada. Atualize a página.");
      dialogContent.innerHTML = '<div class="detail-grid">' +
        detail("Aluno", request.name) +
        detail("RA", request.ra) +
        detail("CPF", formatCpf(request.cpf)) +
        detail("Curso", request.course) +
        detail("Data", window.SecretariaApp.formatDate(request.date)) +
        detail("Horário", request.time) +
        detail("Status", request.status) +
        detail("Motivo", request.reason, true) +
        "</div>";
      dialogActions.innerHTML = "";
      if (request.status === "PENDENTE") {
        dialogActions.innerHTML = '<button type="button" class="button button-refuse" data-action="RECUSADA">Recusar</button>' +
          '<button type="button" class="button button-approve" data-action="APROVADA">Aceitar reunião</button>';
      } else {
        dialogActions.innerHTML = '<p class="dialog-status">Esta solicitação já foi analisada: ' + window.SecretariaApp.escapeHtml(request.status) + ".</p>";
      }
      dialog.showModal();
      dialogActions.dataset.requestId = id;
    });
  }

  function detail(label, value, full) {
    return '<div class="detail-item' + (full ? " full-width" : "") + '"><span>' + window.SecretariaApp.escapeHtml(label) +
      "</span><strong>" + window.SecretariaApp.escapeHtml(value) + "</strong></div>";
  }

  function formatCpf(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length !== 11) return "Não informado";
    return digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6, 9) + "-" + digits.slice(9);
  }

  function setView(nextView) {
    view = nextView;
    document.querySelectorAll(".view-switch button").forEach(function (button) {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setCalendarDate(date) {
    cursor = window.SecretariaApp.fromDateKey(date);
    setView("month");
  }

  document.getElementById("coordinator-prev").addEventListener("click", function () {
    if (view === "month") cursor.setMonth(cursor.getMonth() - 1);
    else if (view === "week") cursor.setDate(cursor.getDate() - 7);
    else cursor.setDate(cursor.getDate() - 1);
    refresh();
  });
  document.getElementById("coordinator-next").addEventListener("click", function () {
    if (view === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (view === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
    refresh();
  });
  document.getElementById("coordinator-today").addEventListener("click", function () {
    const today = new Date();
    cursor.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
    refresh();
  });
  document.getElementById("generate-demo-requests").addEventListener("click", function () {
    window.SecretariaApp.safeRun(message, function () {
      const result = window.SecretariaStorage.seedDemoRequests();
      setCalendarDate(result.firstDate);
      filter.value = "PENDENTE";
      refresh();
      window.SecretariaApp.showMessage(message, result.created + " novos exemplos aleatórios foram adicionados. Todos começam pendentes e você pode analisá-los nesta tela.", "success");
    });
  });
  document.getElementById("delete-all-data").addEventListener("click", function () {
    window.SecretariaApp.safeRun(message, function () {
      const requestCount = window.SecretariaStorage.getRequests().length;
      const closureCount = window.SecretariaStorage.getClosures().length;
      if (requestCount + closureCount > 0 && !window.confirm("Apagar todos os dados salvos? Serão removidas " +
        requestCount + (requestCount === 1 ? " solicitação e " : " solicitações e ") +
        closureCount + (closureCount === 1 ? " data sem atendimento." : " datas sem atendimento.") +
        " Esta ação não pode ser desfeita.")) return;
      const deleted = window.SecretariaStorage.deleteAllData();
      refresh();
      const didDelete = deleted.requests + deleted.closures > 0;
      window.SecretariaApp.showMessage(message, didDelete ?
        "Dados apagados: " + deleted.requests + " solicitações e " + deleted.closures + " datas sem atendimento." :
        "Os dados já estavam apagados; calendário e lista foram atualizados.", didDelete ? "success" : "info");
    });
  });
  document.getElementById("open-closure-dialog").addEventListener("click", function () {
    closureForm.reset();
    closureDate.min = window.SecretariaApp.localDateKey(new Date());
    window.SecretariaApp.clearMessage(closureMessage);
    window.SecretariaApp.clearMessage(message);
    closureDialog.showModal();
  });
  document.getElementById("close-closure-dialog").addEventListener("click", function () { closureDialog.close(); });
  document.getElementById("cancel-closure").addEventListener("click", function () { closureDialog.close(); });
  closureDialog.addEventListener("click", function (event) {
    if (event.target === closureDialog) closureDialog.close();
  });
  closureForm.addEventListener("submit", function (event) {
    event.preventDefault();
    window.SecretariaApp.safeRun(closureMessage, function () {
      const data = new FormData(closureForm);
      const date = String(data.get("date") || "");
      const reason = String(data.get("reason") || "").trim();
      window.SecretariaStorage.blockDate(date, reason);
      closureDialog.close();
      closureForm.reset();
      window.SecretariaApp.clearMessage(closureMessage);
      setCalendarDate(date);
      refresh();
      window.SecretariaApp.showMessage(message, "Data marcada sem atendimento. Os alunos não poderão agendar nesse dia.", "success");
    });
  });
  closureList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-unblock-date]");
    if (!button) return;
    const date = button.dataset.unblockDate;
    window.SecretariaApp.safeRun(message, function () {
      if (!window.confirm("Liberar esta data para novos agendamentos?")) return;
      window.SecretariaStorage.unblockDate(date);
      refresh();
      window.SecretariaApp.showMessage(message, "Data liberada para novos agendamentos.", "success");
    });
  });
  document.querySelectorAll(".view-switch button").forEach(function (button) {
    button.addEventListener("click", function () {
      setView(button.dataset.view);
      refresh();
    });
  });
  filter.addEventListener("change", refresh);

  function handleRequestClick(event) {
    const target = event.target.closest("[data-request-id]");
    if (target) openRequest(target.dataset.requestId);
  }
  calendar.addEventListener("click", handleRequestClick);
  requestList.addEventListener("click", handleRequestClick);
  document.getElementById("close-dialog").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
  dialogActions.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const id = dialogActions.dataset.requestId;
    const action = button.dataset.action;
    window.SecretariaApp.safeRun(message, function () {
      window.SecretariaStorage.updateStatus(id, action);
      dialog.close();
      window.SecretariaApp.showMessage(message, action === "APROVADA" ? "Reunião aprovada e horário confirmado." : "Solicitação recusada. O horário está disponível para novos pedidos.", "success");
      refresh();
    });
  });
  window.addEventListener("storage", function (event) {
    if (event.key === "secretaria-academica.v1") refresh();
  });
  refresh();
}());
