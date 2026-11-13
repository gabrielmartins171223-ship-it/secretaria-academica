(function () {
  "use strict";

  const calendar = document.getElementById("coordinator-calendar");
  if (!calendar) return;

  const message = document.getElementById("coordinator-message");
  const periodLabel = document.getElementById("coordinator-period-label");
  const requestList = document.getElementById("request-list");
  const filter = document.getElementById("request-filter");
  const dialog = document.getElementById("request-dialog");
  const dialogContent = document.getElementById("dialog-content");
  const dialogActions = document.getElementById("dialog-actions");
  const cursor = new Date();
  let view = "month";

  function refresh() {
    window.SecretariaApp.safeRun(message, function () {
      const requests = window.SecretariaStorage.getRequests();
      renderMetrics(requests);
      renderCalendar(requests);
      renderRequestList(requests);
    });
  }

  function renderMetrics(requests) {
    document.getElementById("pending-count").textContent = requests.filter(function (item) { return item.status === "PENDENTE"; }).length;
    document.getElementById("approved-count").textContent = requests.filter(function (item) { return item.status === "APROVADA"; }).length;
    document.getElementById("refused-count").textContent = requests.filter(function (item) { return item.status === "RECUSADA"; }).length;
  }

  function renderCalendar(requests) {
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
    window.SecretariaCalendar.renderPeriod(calendar, cursor, view, requests);
  }

  function renderRequestList(requests) {
    const selected = filter.value;
    const filtered = requests.filter(function (request) {
      return selected === "all" || request.status === selected;
    }).sort(function (first, second) {
      const dateOrder = first.date.localeCompare(second.date);
      return dateOrder || first.time.localeCompare(second.time);
    });
    if (!filtered.length) {
      requestList.innerHTML = '<div class="empty-list">Nenhuma solicitação para este filtro.<br>Os novos pedidos aparecerão aqui.</div>';
      return;
    }
    requestList.innerHTML = filtered.map(function (request) {
      const name = window.SecretariaApp.escapeHtml(request.name);
      const date = window.SecretariaApp.escapeHtml(window.SecretariaApp.formatDate(request.date, { day: "2-digit", month: "short" }));
      return '<button type="button" class="request-card" data-request-id="' + window.SecretariaApp.escapeHtml(request.id) + '">' +
        '<span class="request-card-heading"><span class="request-card-name">' + name + '</span><span class="request-status ' +
        window.SecretariaApp.statusClass(request.status) + '">' + window.SecretariaApp.escapeHtml(request.status) + "</span></span>" +
        '<span class="request-card-meta"><span>' + date + " · " + window.SecretariaApp.escapeHtml(request.time) + "</span>" +
        "<span>" + window.SecretariaApp.escapeHtml(request.course) + "</span></span>" +
        '<span class="request-card-reason">' + window.SecretariaApp.escapeHtml(request.reason) + "</span></button>";
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
  document.querySelectorAll(".view-switch button").forEach(function (button) {
    button.addEventListener("click", function () {
      view = button.dataset.view;
      document.querySelectorAll(".view-switch button").forEach(function (item) {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
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
