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
