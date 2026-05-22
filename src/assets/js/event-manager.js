(function () {
  var dataEl = document.getElementById('events-data');
  if (!dataEl) return;

  var data = JSON.parse(dataEl.textContent);
  var events = data.events;
  var time = data.time;
  var location = data.location;
  var defaultEventTime = data.defaultEventTime;

  var todayStr = new Date().toISOString().slice(0, 10);

  // Find the first event whose date is today or in the future
  var nextEvent = null;
  for (var i = 0; i < events.length; i++) {
    if (events[i].date >= todayStr) {
      nextEvent = events[i];
      break;
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

  // Pull the formatted German date from the matching pre-rendered event card
  // (rendered server-side via the deDate filter). Single source of truth.
  function formatDate(dateStr) {
    var card = document.querySelector('.event-card[data-event-date="' + dateStr + '"]');
    return (card && card.getAttribute('data-event-date-de')) || dateStr;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

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

  var eventTime = nextEvent.time || time;
  var eventLocation = nextEvent.location || location;
  var eventCountdownTime = nextEvent.eventTime || defaultEventTime;

  if (metaEl) {
    metaEl.innerHTML = formatDate(nextEvent.date) + ' · ' + eventTime + '<br>' + eventLocation;
  }

  // Restart countdown with correct target
  if (countdownEl) {
    countdownEl.setAttribute('data-event-date', nextEvent.date);
    countdownEl.setAttribute('data-event-time', eventCountdownTime);
    var target = new Date(nextEvent.date + 'T' + eventCountdownTime + ':00').getTime();

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
