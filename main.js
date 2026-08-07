// ROUA — Main JavaScript
// Navigation: mobile toggle, scroll effect, dropdown menus (click + keyboard)

document.addEventListener('DOMContentLoaded', function() {
  // ---------- Mobile nav toggle ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // ---------- Navbar scroll effect ----------
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = function() {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Dropdown menus (click to toggle, hover still works via CSS) ----------
  const triggers = document.querySelectorAll('.nav-dropdown-trigger');

  triggers.forEach(function(trigger) {
    trigger.addEventListener('click', function(e) {
      // Only handle click on the trigger itself — let links inside the menu navigate
      e.preventDefault();
      e.stopPropagation();

      const parent = trigger.closest('.nav-item-has-dropdown');
      if (!parent) return;

      const wasOpen = parent.classList.contains('is-open');

      // Close all other dropdowns first
      document.querySelectorAll('.nav-item-has-dropdown.is-open').forEach(function(other) {
        if (other !== parent) {
          other.classList.remove('is-open');
          const t = other.querySelector('.nav-dropdown-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle this one
      parent.classList.toggle('is-open', !wasOpen);
      trigger.setAttribute('aria-expanded', !wasOpen ? 'true' : 'false');
    });

    // Keyboard support: Enter / Space already fire click(), so this is for arrow-key navigation (optional enhancement)
    trigger.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const parent = trigger.closest('.nav-item-has-dropdown');
        if (parent && parent.classList.contains('is-open')) {
          parent.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
          trigger.focus();
        }
      }
    });
  });

  // ---------- Click outside to close dropdowns ----------
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-item-has-dropdown')) {
      document.querySelectorAll('.nav-item-has-dropdown.is-open').forEach(function(open) {
        open.classList.remove('is-open');
        const t = open.querySelector('.nav-dropdown-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // ---------- Close dropdowns on Escape anywhere ----------
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav-item-has-dropdown.is-open').forEach(function(open) {
        open.classList.remove('is-open');
        const t = open.querySelector('.nav-dropdown-trigger');
        if (t) {
          t.setAttribute('aria-expanded', 'false');
          t.focus();
        }
      });
      // Also close mobile menu
      if (navLinks && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle && navToggle.classList.remove('open');
        navToggle && navToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // ---------- When mobile menu closes, also close all dropdowns ----------
  if (navToggle && navLinks) {
    const observer = new MutationObserver(function() {
      if (!navLinks.classList.contains('open')) {
        document.querySelectorAll('.nav-item-has-dropdown.is-open').forEach(function(open) {
          open.classList.remove('is-open');
          const t = open.querySelector('.nav-dropdown-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      }
    });
    observer.observe(navLinks, { attributes: true, attributeFilter: ['class'] });
  }
});
