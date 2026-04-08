(function () {
  var dataEl = document.getElementById('events-data');
  if (!dataEl) return;

  var data = JSON.parse(dataEl.textContent);
  var events = data.events;
  var time = data.time;
  var location = data.location;

  var now = new Date();
  var todayStr = now.toISOString().slice(0, 10);

  // Find the first event whose date is today or in the future
  var nextEvent = null;
  for (var i = 0; i < events.length; i++) {
    if (events[i].date >= todayStr) {
      nextEvent = events[i];
      break;
    }
  }

  // --- Update event card list (derive status from date) ---
  var cards = document.querySelectorAll('.event-card[data-event-date]');
  for (var j = 0; j < cards.length; j++) {
    var card = cards[j];
    var cardDate = card.getAttribute('data-event-date');
    var badge = card.querySelector('.event-card__badge');
    var body = card.querySelector('.event-card__body');

    if (cardDate < todayStr) {
      // Past: dim it, remove badge
      card.classList.add('event-card--past');
      card.classList.remove('event-card--tba');
      if (badge) badge.remove();
    } else {
      // Future: ensure upcoming styling, add badge if missing
      card.classList.remove('event-card--past');
      if (!badge && body) {
        var span = document.createElement('span');
        span.className = 'event-card__badge event-card__badge--upcoming';
        span.textContent = 'Coming Up';
        body.appendChild(span);
      }
    }
  }

  // --- Scroll events list so next event is at top ---
  if (nextEvent) {
    var nextCard = document.querySelector('.event-card[data-event-date="' + nextEvent.date + '"]');
    var scrollContainer = document.querySelector('.events-scroll');
    if (nextCard && scrollContainer) {
      requestAnimationFrame(function () {
        var cardTop = nextCard.getBoundingClientRect().top;
        var containerTop = scrollContainer.getBoundingClientRect().top;
        scrollContainer.scrollTop = scrollContainer.scrollTop + cardTop - containerTop - 16;
      });
    }
  }

  // --- Update hero card ---
  var heroWrapper = document.querySelector('.hero-event-wrapper');
  if (!heroWrapper) return;

  if (!nextEvent) {
    heroWrapper.style.display = 'none';
    return;
  }

  var deWeekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  var deMonths = ['Januar', 'Februar', 'M\u00e4rz', 'April', 'Mai', 'Juni',
                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  function formatDate(dateStr) {
    var parts = dateStr.split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    return deWeekdays[d.getDay()] + ' ' + parts[2] + '. ' + deMonths[d.getMonth()];
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Update hero content
  var titleEl = heroWrapper.querySelector('.hero-event__title');
  var subtitleEl = heroWrapper.querySelector('.hero-event__subtitle');
  var metaEl = heroWrapper.querySelector('.hero-event__meta');
  var countdownEl = heroWrapper.querySelector('.hero-event__countdown');

  if (titleEl) titleEl.textContent = nextEvent.title;

  if (subtitleEl) {
    if (nextEvent.subtitle) {
      subtitleEl.textContent = nextEvent.subtitle;
      subtitleEl.style.display = '';
    } else {
      subtitleEl.style.display = 'none';
    }
  }

  if (metaEl) {
    metaEl.innerHTML = formatDate(nextEvent.date) + ' \u00b7 ' + time + '<br>' + location;
  }

  // Restart countdown with correct target
  if (countdownEl) {
    countdownEl.setAttribute('data-event-date', nextEvent.date);
    var target = new Date(nextEvent.date + 'T18:00:00').getTime();

    function updateCountdown() {
      var diff = target - Date.now();
      if (diff <= 0) {
        countdownEl.textContent = 'Jetzt!';
        return;
      }
      var s = Math.floor(diff / 1000);
      var dd = Math.floor(s / 86400); s %= 86400;
      var hh = Math.floor(s / 3600); s %= 3600;
      var mm = Math.floor(s / 60);
      var ss = s % 60;
      countdownEl.textContent = pad(dd) + ':' + pad(hh) + ':' + pad(mm) + ':' + pad(ss);
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
})();
