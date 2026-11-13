(function () {
  "use strict";

  const STORAGE_KEY = "secretaria-academica.v1";
  const SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  const ACTIVE_STATUSES = new Set(["PENDENTE", "APROVADA"]);
  const DEMO_REQUESTS = [
    { demoKey: "academic-record", name: "Ana Oliveira (Fictícia)", ra: "RA-DEMO-001", course: "Administração", reason: "Dúvida sobre aproveitamento de disciplinas cursadas anteriormente.", preferredSlot: 0 },
    { demoKey: "internship", name: "Bruno Santos (Fictício)", ra: "RA-DEMO-002", course: "Engenharia de Software", reason: "Orientação sobre documentação e horas do estágio supervisionado.", preferredSlot: 2 },
    { demoKey: "enrollment", name: "Carla Souza (Fictícia)", ra: "RA-DEMO-003", course: "Pedagogia", reason: "Solicitar orientação sobre ajuste de matrícula e pré-requisitos.", preferredSlot: 4 },
    { demoKey: "course-completion", name: "Diego Lima (Fictício)", ra: "RA-DEMO-004", course: "Ciências Contábeis", reason: "Conferir disciplinas pendentes para a conclusão do curso.", preferredSlot: 5 },
    { demoKey: "academic-records", name: "Elisa Martins (Fictícia)", ra: "RA-DEMO-005", course: "Psicologia", reason: "Esclarecer emissão de histórico e declaração acadêmica.", preferredSlot: 1 },
    { demoKey: "class-schedule", name: "Felipe Costa (Fictício)", ra: "RA-DEMO-006", course: "Sistemas de Informação", reason: "Conversar sobre conflito de horários entre disciplinas optativas.", preferredSlot: 3 },
    { demoKey: "course-transfer", name: "Giovana Alves (Fictícia)", ra: "RA-DEMO-007", course: "Direito", reason: "Orientação sobre equivalência de disciplinas e transferência interna.", preferredSlot: 0 },
    { demoKey: "scholarship", name: "Henrique Rocha (Fictício)", ra: "RA-DEMO-008", course: "Enfermagem", reason: "Consultar procedimentos acadêmicos relacionados à bolsa estudantil.", preferredSlot: 5 },
    { demoKey: "graduation", name: "Isabela Ferreira (Fictícia)", ra: "RA-DEMO-009", course: "Arquitetura e Urbanismo", reason: "Tirar dúvidas sobre os requisitos para colação de grau.", preferredSlot: 2 }
  ];

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

  function seedDemoRequests() {
    const state = readState();
    const existingKeys = new Set(state.requests.map(function (request) { return request.demoKey; }).filter(Boolean));
    const missing = DEMO_REQUESTS.filter(function (request) { return !existingKeys.has(request.demoKey); });
    if (missing.length === 0) {
      return { created: 0, firstDate: "", count: DEMO_REQUESTS.length };
    }

    const requests = state.requests.slice();
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    let firstDate = "";
    let scheduled = 0;
    let inspectedDays = 0;

    while (scheduled < missing.length && inspectedDays < 90) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      date.setDate(date.getDate() + 1);
      inspectedDays += 1;
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;

      const dateKey = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0")
      ].join("-");
      const sample = missing[scheduled];
      const orderedSlots = SLOTS.slice(sample.preferredSlot).concat(SLOTS.slice(0, sample.preferredSlot));
      const time = orderedSlots.find(function (slot) {
        return isAvailable(dateKey, slot, requests);
      });
      if (!time) continue;

      requests.push({
        id: "demo-" + sample.demoKey,
        demoKey: sample.demoKey,
        name: sample.name,
        ra: sample.ra,
        cpf: "52998224725",
        course: sample.course,
        date: dateKey,
        time: time,
        reason: sample.reason,
        status: "PENDENTE",
        createdAt: new Date().toISOString(),
        source: "DEMO"
      });
      if (!firstDate) firstDate = dateKey;
      scheduled += 1;
    }

    if (scheduled !== missing.length) {
      throw new Error("Não foi possível encontrar horários livres suficientes para gerar os exemplos. Tente novamente depois.");
    }

    saveState(Object.assign({}, state, { requests: requests }));
    return { created: scheduled, firstDate: firstDate, count: DEMO_REQUESTS.length };
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
    seedDemoRequests: seedDemoRequests,
    updateStatus: updateStatus
  });
}());
