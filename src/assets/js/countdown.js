(function () {
  var el = document.querySelector('[data-event-date]');
  if (!el) return;

  var date = el.getAttribute('data-event-date');
  var time = el.getAttribute('data-event-time') || '18:00';
  var target = new Date(date + 'T' + time + ':00').getTime();

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function update() {
    var now = Date.now();
    var diff = target - now;

    if (diff <= 0) {
      el.textContent = 'Jetzt!';
      return;
    }

    var s = Math.floor(diff / 1000);
    var dd = Math.floor(s / 86400);
    s %= 86400;
    var hh = Math.floor(s / 3600);
    s %= 3600;
    var mm = Math.floor(s / 60);
    var ss = s % 60;

    el.textContent = pad(dd) + ':' + pad(hh) + ':' + pad(mm) + ':' + pad(ss);
  }

  update();
  setInterval(update, 1000);
})();
