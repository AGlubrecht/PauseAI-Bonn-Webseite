// Mobile navigation toggle
(function () {
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.querySelector('.nav__menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', function () {
    var isOpen = menu.classList.toggle('nav__menu--open');
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.innerHTML = isOpen ? '&#10005;' : '&#9776;';
  });

  // Close menu when a link is clicked
  menu.querySelectorAll('.nav__link').forEach(function (link) {
    link.addEventListener('click', function () {
      menu.classList.remove('nav__menu--open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '&#9776;';
    });
  });
})();

// Nav color flip: white text when over dark hero
(function () {
  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero');
  if (!nav || !hero) return;

  var observer = new IntersectionObserver(function (entries) {
    // Hero is intersecting the viewport top (where the nav sits)
    nav.classList.toggle('nav--on-dark', entries[0].isIntersecting);
  }, {
    // Only observe the strip where the nav bar sits (top of viewport)
    rootMargin: '0px 0px -' + (window.innerHeight - nav.offsetHeight) + 'px 0px',
    threshold: 0
  });

  observer.observe(hero);
})();

// Events section: click to activate scrolling, click outside or Escape to deactivate
(function () {
  var scrollWrapper = document.querySelector('.section--events .events-scroll');
  if (!scrollWrapper) return;

  // Position inner scroll to first upcoming event on load (without scrolling the page)
  var firstUpcoming = scrollWrapper.querySelector('.event-card:not(.event-card--past)');
  if (firstUpcoming) {
    requestAnimationFrame(function () {
      scrollWrapper.style.overflowY = 'auto';
      scrollWrapper.scrollTop = firstUpcoming.offsetTop - scrollWrapper.offsetTop - 16;
      scrollWrapper.style.overflowY = '';
    });
  }

  var shadowWrap = document.querySelector('.section--events .events-shadow-wrap');
  var eventsSection = document.querySelector('.section--events');
  var active = false;

  function activate() {
    active = true;
    scrollWrapper.classList.add('events-scroll--active');
    if (shadowWrap) shadowWrap.classList.add('events-shadow-wrap--active');
    if (eventsSection) eventsSection.classList.add('section--events--active');
  }

  function deactivate() {
    active = false;
    scrollWrapper.classList.remove('events-scroll--active');
    if (shadowWrap) shadowWrap.classList.remove('events-shadow-wrap--active');
    if (eventsSection) eventsSection.classList.remove('section--events--active');
  }

  // First click activates, second click (anywhere) deactivates
  scrollWrapper.addEventListener('click', function (e) {
    if (!active) {
      activate();
      e.stopPropagation();
    }
  });

  document.addEventListener('click', function () {
    if (active) deactivate();
  });

  // Escape → deactivate
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && active) deactivate();
  });
})();
