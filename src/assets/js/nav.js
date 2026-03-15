// Mobile navigation toggle
(function () {
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.querySelector('.nav__menu');
  var nav = document.querySelector('.nav');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', function () {
    var isOpen = menu.classList.toggle('nav__menu--open');
    toggle.classList.toggle('nav__toggle--open', isOpen);
    if (nav) nav.classList.toggle('nav--menu-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a link is clicked
  menu.querySelectorAll('.nav__link').forEach(function (link) {
    link.addEventListener('click', function () {
      menu.classList.remove('nav__menu--open');
      toggle.classList.remove('nav__toggle--open');
      if (nav) nav.classList.remove('nav--menu-open');
      toggle.setAttribute('aria-expanded', 'false');
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

// Hide navbar on scroll-down, show on scroll-up (mobile only)
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;

  var lastScrollY = window.scrollY;
  var threshold = 5;

  window.addEventListener('scroll', function () {
    if (window.innerWidth > 768) {
      nav.classList.remove('nav--hidden');
      return;
    }
    if (nav.classList.contains('nav--menu-open')) return;

    var currentY = window.scrollY;
    if (currentY - lastScrollY > threshold) {
      nav.classList.add('nav--hidden');
    } else if (lastScrollY - currentY > threshold) {
      nav.classList.remove('nav--hidden');
    }
    lastScrollY = currentY;
  }, { passive: true });
})();
