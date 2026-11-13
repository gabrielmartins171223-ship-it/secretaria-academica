(function () {
  "use strict";

  function mondayIndex(day) {
    return (day + 6) % 7;
  }

  function renderMonth(container, year, month, requests, options) {
    const settings = options || {};
    const selectedKey = settings.selectedDate || "";
    const now = new Date();
    const start = new Date(year, month, 1);
    const offset = mondayIndex(start.getDay());
    const total = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
    let markup = weekdayHeader();

    for (let index = 0; index < total; index += 1) {
      const day = new Date(year, month, 1 - offset + index);
      const key = window.SecretariaApp.localDateKey(day);
      const inMonth = day.getMonth() === month;
      const past = window.SecretariaApp.isDatePast(day);
      const today = key === window.SecretariaApp.localDateKey(now);
      const disabled = settings.selectable && (!window.SecretariaApp.isBookableDate(day));
      const classes = ["calendar-day"];
      if (!inMonth) classes.push("outside-month");
      if (past) classes.push("is-past");
      if (today) classes.push("is-today");
      if (key === selectedKey) classes.push("is-selected");
      const dayRequests = requests.filter(function (request) { return request.date === key; });
      const indicators = settings.selectable ? studentIndicators(day, dayRequests) : "";
      const events = settings.selectable ? "" : monthEvents(dayRequests);
      const label = ariaDay(day, dayRequests, settings.selectable);
      if (settings.selectable) {
        markup += '<button type="button" class="' + classes.join(" ") + '" data-date="' + key + '"' +
          (disabled ? " disabled" : "") + ' aria-label="' + label + '">';
      } else {
        markup += '<div class="' + classes.join(" ") + '" role="group" aria-label="' + label + '">';
      }
      markup += '<span class="day-number">' + day.getDate() + "</span>" + indicators + events +
        (settings.selectable ? "</button>" : "</div>");
    }
    container.className = "calendar-grid month-grid";
    container.innerHTML = markup;
  }

  function renderPeriod(container, cursor, view, requests) {
    if (view === "month") {
      renderMonth(container, cursor.getFullYear(), cursor.getMonth(), requests, {});
      return;
    }
    if (view === "day") {
      renderDays(container, [new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())], requests, true);
      return;
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - mondayIndex(cursor.getDay()));
    const dates = [];
    for (let index = 0; index < 7; index += 1) {
      dates.push(new Date(first.getFullYear(), first.getMonth(), first.getDate() + index));
    }
    renderDays(container, dates, requests, false);
  }

  function weekdayHeader() {
    return window.SecretariaApp.weekdays.map(function (day) {
      return '<div class="weekday-label" aria-hidden="true">' + day + "</div>";
    }).join("");
  }

  function studentIndicators(date, requests) {
    const now = new Date();
    const slots = window.SecretariaStorage.slots;
    const available = window.SecretariaApp.isBookableDate(date) &&
      slots.some(function (time) {
        return window.SecretariaApp.isTimeAvailableToday(date, time) &&
          window.SecretariaStorage.isAvailable(window.SecretariaApp.localDateKey(date), time, requests);
      });
    let html = '<span class="day-indicators" aria-hidden="true">';
    if (available) html += '<i class="legend-dot available-dot"></i>';
    if (requests.some(function (request) { return request.status === "PENDENTE" || request.status === "APROVADA"; })) {
      html += '<i class="legend-dot pending-dot"></i>';
    }
    if (!available && !window.SecretariaApp.isDatePast(date) && !requests.some(function (request) { return request.status === "PENDENTE" || request.status === "APROVADA"; }) &&
      (!window.SecretariaApp.isBusinessDay(date) || date < now)) {
      html += '<i class="legend-dot unavailable-dot"></i>';
    }
    return html + "</span>";
  }

  function monthEvents(requests) {
    const visible = requests.slice(0, 2).map(function (request) {
      const name = window.SecretariaApp.escapeHtml(request.name);
      const time = window.SecretariaApp.escapeHtml(request.time);
      return '<button type="button" class="calendar-event status-' + request.status + '" data-request-id="' +
        window.SecretariaApp.escapeHtml(request.id) + '" aria-label="' + time + " " + name + ", " + request.status + '">' + time + " " + name + "</button>";
    }).join("");
    const more = requests.length > 2 ? '<span class="calendar-more">+' + (requests.length - 2) + " mais</span>" : "";
    return visible + more;
  }

  function renderDays(container, dates, requests, isDay) {
    const classes = isDay ? "calendar-grid day-grid" : "calendar-grid week-grid";
    const columns = dates.map(function (date) {
      const key = window.SecretariaApp.localDateKey(date);
      const items = requests.filter(function (request) { return request.date === key; })
        .sort(function (first, second) { return first.time.localeCompare(second.time); });
      const heading = '<div class="week-column-heading">' + shortWeekday(date) +
        '<strong>' + date.getDate() + " " + monthShort(date) + "</strong></div>";
      const events = items.map(function (request) {
        const label = window.SecretariaApp.escapeHtml(request.time + " · " + request.name + " · " + request.status);
        return '<button type="button" class="calendar-event status-' + request.status + '" data-request-id="' +
          window.SecretariaApp.escapeHtml(request.id) + '" aria-label="' + label + '">' + label + "</button>";
      }).join("");
      return '<div class="' + (isDay ? "day-column" : "week-column") + '">' + heading +
        '<div class="' + (isDay ? "day-events" : "week-events") + '">' +
        (events || '<span class="calendar-more">Sem compromissos</span>') + "</div></div>";
    }).join("");
    container.className = classes;
    container.innerHTML = columns;
  }

  function shortWeekday(date) {
    return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");
  }

  function monthShort(date) {
    return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
  }

  function ariaDay(date, requests, selectable) {
    const formatted = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(date);
    if (selectable) return formatted + (window.SecretariaApp.isBookableDate(date) ? ", selecionável" : ", indisponível");
    return formatted + (requests.length ? ", " + requests.length + " solicitação(ões)" : "");
  }

  window.SecretariaCalendar = Object.freeze({
    renderMonth: renderMonth,
    renderPeriod: renderPeriod
  });
}());
