(function () {
  "use strict";

  const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  function localDateKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function fromDateKey(key) {
    const parts = key.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatDate(key, options) {
    const date = fromDateKey(key);
    return new Intl.DateTimeFormat("pt-BR", options || { day: "numeric", month: "long", year: "numeric" }).format(date);
  }

  function monthLabel(date) {
    return MONTHS[date.getMonth()] + " " + date.getFullYear();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function validCpf(value) {
    const cpf = digits(value);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }
    function checkDigit(length) {
      let sum = 0;
      for (let index = 0; index < length; index += 1) {
        sum += Number(cpf[index]) * (length + 1 - index);
      }
      const remainder = (sum * 10) % 11;
      return (remainder === 10 ? 0 : remainder) === Number(cpf[length]);
    }
    return checkDigit(9) && checkDigit(10);
  }

  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = "message-banner " + type;
    element.hidden = false;
  }

  function clearMessage(element) {
    element.hidden = true;
    element.textContent = "";
    element.className = "message-banner";
  }

  function statusClass(status) {
    return "status-" + String(status || "").toLowerCase();
  }

  function isBusinessDay(date) {
    return date.getDay() !== 0 && date.getDay() !== 6;
  }

  function isDatePast(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function isBookableDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBusinessDay(date) && date >= today;
  }

  function isTimeAvailableToday(date, time) {
    const today = new Date();
    if (localDateKey(date) !== localDateKey(today)) {
      return true;
    }
    const nowTime = String(today.getHours()).padStart(2, "0") + ":" + String(today.getMinutes()).padStart(2, "0");
    return time > nowTime;
  }

  function safeRun(messageElement, callback) {
    try {
      callback();
    } catch (error) {
      showMessage(messageElement, error.message || "Ocorreu um erro ao acessar os dados do protótipo.", "error");
    }
  }

  window.SecretariaApp = Object.freeze({
    localDateKey: localDateKey,
    fromDateKey: fromDateKey,
    formatDate: formatDate,
    monthLabel: monthLabel,
    escapeHtml: escapeHtml,
    digits: digits,
    validCpf: validCpf,
    showMessage: showMessage,
    clearMessage: clearMessage,
    statusClass: statusClass,
    isBusinessDay: isBusinessDay,
    isDatePast: isDatePast,
    isBookableDate: isBookableDate,
    isTimeAvailableToday: isTimeAvailableToday,
    safeRun: safeRun,
    weekdays: WEEKDAYS
  });
}());
