(function () {
  "use strict";

  const STORAGE_KEY = "secretaria-academica.v1";
  const SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  const ACTIVE_STATUSES = new Set(["PENDENTE", "APROVADA"]);
  const DEMO_REQUESTS = [
    { name: "Ana Oliveira (Fictícia)", course: "Administração", reason: "Dúvida sobre aproveitamento de disciplinas cursadas anteriormente." },
    { name: "Bruno Santos (Fictício)", course: "Engenharia de Software", reason: "Orientação sobre documentação e horas do estágio supervisionado." },
    { name: "Carla Souza (Fictícia)", course: "Pedagogia", reason: "Solicitar orientação sobre ajuste de matrícula e pré-requisitos." },
    { name: "Diego Lima (Fictício)", course: "Ciências Contábeis", reason: "Conferir disciplinas pendentes para a conclusão do curso." },
    { name: "Elisa Martins (Fictícia)", course: "Psicologia", reason: "Esclarecer emissão de histórico e declaração acadêmica." },
    { name: "Felipe Costa (Fictício)", course: "Sistemas de Informação", reason: "Conversar sobre conflito de horários entre disciplinas optativas." },
    { name: "Giovana Alves (Fictícia)", course: "Direito", reason: "Orientação sobre equivalência de disciplinas e transferência interna." },
    { name: "Henrique Rocha (Fictício)", course: "Enfermagem", reason: "Consultar procedimentos acadêmicos relacionados à bolsa estudantil." },
    { name: "Isabela Ferreira (Fictícia)", course: "Arquitetura e Urbanismo", reason: "Tirar dúvidas sobre os requisitos para colação de grau." },
    { name: "João Martins (Fictício)", course: "Design", reason: "Analisar atividades complementares e aproveitamento de horas." },
    { name: "Larissa Almeida (Fictícia)", course: "Nutrição", reason: "Solicitar orientação sobre trancamento e retorno ao curso." },
    { name: "Mateus Ribeiro (Fictício)", course: "Engenharia Civil", reason: "Revisar plano de estudos e dependências acadêmicas." },
    { name: "Mariana Carvalho (Fictícia)", course: "Medicina Veterinária", reason: "Esclarecer prazos e documentos para atividades de extensão." },
    { name: "Pedro Nascimento (Fictício)", course: "Jornalismo", reason: "Conversar sobre equivalência curricular após transferência." },
    { name: "Rafaela Gomes (Fictícia)", course: "Biomedicina", reason: "Revisar pendências acadêmicas e o planejamento do semestre." },
    { name: "Samuel Ferreira (Fictício)", course: "Educação Física", reason: "Solicitar orientação para estágio e validação das horas." },
    { name: "Tainá Barbosa (Fictícia)", course: "Letras", reason: "Tirar dúvidas sobre atividades complementares obrigatórias." },
    { name: "Vitor Mendes (Fictício)", course: "Economia", reason: "Analisar opções para adaptação de horário entre disciplinas." },
    { name: "Yasmin Cardoso (Fictícia)", course: "Farmácia", reason: "Consultar procedimentos para solicitar revisão de nota." },
    { name: "Arthur Lopes (Fictício)", course: "Fisioterapia", reason: "Conferir documentação para participação em projeto acadêmico." },
    { name: "Beatriz Freitas (Fictícia)", course: "Comunicação Social", reason: "Receber orientação sobre intercâmbio e aproveitamento de créditos." },
    { name: "Caio Azevedo (Fictício)", course: "Engenharia Elétrica", reason: "Planejar matrícula em disciplinas com pré-requisitos." }
  ];
  const DEMO_REQUEST_COUNT = 9;

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

  function shuffle(items) {
    const shuffled = items.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      const current = shuffled[index];
      shuffled[index] = shuffled[target];
      shuffled[target] = current;
    }
    return shuffled;
  }

  function seedDemoRequests() {
    const state = readState();
    const requests = state.requests.slice();
    const candidateSlots = [];
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    for (let offset = 0; offset < 180; offset += 1) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
      const dateKey = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0")
      ].join("-");
      SLOTS.forEach(function (time) {
        if (isAvailable(dateKey, time, requests) &&
          (dateKey !== localDateKey(new Date()) || time > currentTime())) {
          candidateSlots.push({ date: dateKey, time: time });
        }
      });
    }

    if (candidateSlots.length < DEMO_REQUEST_COUNT) {
      throw new Error("Não há horários livres suficientes para gerar os exemplos. Tente novamente depois.");
    }

    const samples = shuffle(DEMO_REQUESTS).slice(0, DEMO_REQUEST_COUNT);
    const selectedSlots = shuffle(candidateSlots).slice(0, DEMO_REQUEST_COUNT);
    let firstDate = selectedSlots[0].date;
    const createdAt = new Date().toISOString();
    samples.forEach(function (sample, index) {
      const id = createId();
      const slot = selectedSlots[index];
      if (slot.date < firstDate) firstDate = slot.date;
      requests.push({
        id: "demo-" + id,
        demoKey: "demo-" + id,
        name: sample.name,
        ra: "RA-DEMO-" + id.replace(/\W/g, "").slice(-8).toUpperCase(),
        cpf: "52998224725",
        course: sample.course,
        date: slot.date,
        time: slot.time,
        reason: sample.reason,
        status: "PENDENTE",
        createdAt: createdAt,
        source: "DEMO"
      });
    });

    saveState(Object.assign({}, state, { requests: requests }));
    return { created: DEMO_REQUEST_COUNT, firstDate: firstDate, count: DEMO_REQUEST_COUNT };
  }

  function localDateKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function currentTime() {
    const now = new Date();
    return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
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
