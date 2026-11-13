(function () {
  "use strict";

  const STORAGE_KEY = "secretaria-academica.v1";
  const SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  const ACTIVE_STATUSES = new Set(["PENDENTE", "APROVADA"]);

  function readState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { version: 1, requests: [] };
    }

    let state;
    try {
      state = JSON.parse(raw);
    } catch (error) {
      throw new Error("Os dados salvos estão inválidos. Limpe os dados do protótipo no navegador antes de continuar.");
    }
    if (!state || state.version !== 1 || !Array.isArray(state.requests)) {
      throw new Error("A estrutura dos dados locais não é compatível com esta versão do protótipo.");
    }
    return state;
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      throw new Error("Não foi possível salvar os dados neste navegador. Verifique o espaço disponível e as permissões de armazenamento.");
    }
  }

  function getRequests() {
    return readState().requests;
  }

  function hasActiveReservation(date, time, requests, exceptId) {
    return requests.some(function (request) {
      return request.id !== exceptId &&
        request.date === date &&
        request.time === time &&
        ACTIVE_STATUSES.has(request.status);
    });
  }

  function isAvailable(date, time, requests) {
    return !hasActiveReservation(date, time, requests);
  }

  function createRequest(details) {
    const state = readState();
    if (hasActiveReservation(details.date, details.time, state.requests)) {
      throw new Error("Este horário acabou de ser reservado. Escolha outra opção disponível.");
    }
    const request = Object.assign({}, details, {
      id: createId(),
      status: "PENDENTE",
      createdAt: new Date().toISOString()
    });
    state.requests.push(request);
    saveState(state);
    return request;
  }

  function updateStatus(id, nextStatus) {
    if (!["APROVADA", "RECUSADA"].includes(nextStatus)) {
      throw new Error("A ação solicitada não é válida.");
    }
    const state = readState();
    const request = state.requests.find(function (item) { return item.id === id; });
    if (!request) {
      throw new Error("A solicitação não foi encontrada. Atualize a página e tente novamente.");
    }
    if (request.status !== "PENDENTE") {
      throw new Error("Esta solicitação já foi analisada.");
    }
    if (nextStatus === "APROVADA" && hasActiveReservation(request.date, request.time, state.requests, request.id)) {
      throw new Error("Não é possível aprovar: este intervalo está reservado por outra solicitação pendente ou aprovada.");
    }
    request.status = nextStatus;
    request.updatedAt = new Date().toISOString();
    saveState(state);
    return request;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "req-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  window.SecretariaStorage = Object.freeze({
    slots: SLOTS.slice(),
    getRequests: getRequests,
    isAvailable: isAvailable,
    createRequest: createRequest,
    updateStatus: updateStatus
  });
}());
