/**
 * SoftRouter — PJAX-style navigation to keep the audio player alive.
 * Intercepts internal link clicks, fetches the new page, swaps <main> content.
 * The player bar, nav, footer, and cart drawer persist across navigations.
 */
(function () {
  const mainEl = document.getElementById('main-content');
  if (!mainEl) return;

  // Check if a link should be intercepted
  function isInternalLink(anchor) {
    if (!anchor || !anchor.href) return false;
    if (anchor.target === '_blank') return false;
    if (anchor.hasAttribute('download')) return false;
    if (anchor.href.startsWith('mailto:') || anchor.href.startsWith('tel:')) return false;
    try {
      const url = new URL(anchor.href);
      return url.origin === location.origin;
    } catch {
      return false;
    }
  }

  // Fetch a page and swap <main> content
  async function navigate(url, pushState) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        // Fall back to normal navigation on error
        location.href = url;
        return;
      }

      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract new main content
      const newMain = doc.getElementById('main-content');
      if (!newMain) {
        location.href = url;
        return;
      }

      // Swap content
      mainEl.innerHTML = newMain.innerHTML;

      // Update title
      document.title = doc.title;

      // Update URL
      if (pushState) {
        history.pushState({ softNav: true }, '', url);
      }

      // Scroll to top
      window.scrollTo(0, 0);

      // Close mobile nav if open
      const navLinks = document.querySelector('.nav-links');
      const navToggle = document.querySelector('.nav-toggle');
      if (navLinks) navLinks.classList.remove('open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');

      // Re-initialize page-specific behaviors
      reinitPage();
    } catch (e) {
      // On any failure, fall back to normal navigation
      location.href = url;
    }
  }

  // Re-initialize behaviors on newly swapped content
  function reinitPage() {
    // Scroll reveals
    const reveals = mainEl.querySelectorAll('.reveal');
    if (reveals.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      reveals.forEach(el => observer.observe(el));
    }

    // Tracklist toggles
    mainEl.querySelectorAll('.card-tracklist-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const tracklist = btn.nextElementSibling;
        const isOpen = tracklist.classList.contains('open');
        tracklist.classList.toggle('open');
        btn.setAttribute('aria-expanded', !isOpen);
        btn.textContent = isOpen ? 'Tracklist' : 'Hide Tracklist';
      });
    });

    // Update active nav link
    const currentPath = location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Reset nav scroll state
    const nav = document.querySelector('nav');
    if (nav) {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  }

  // Intercept link clicks
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;
    if (!isInternalLink(anchor)) return;

    // Don't intercept modified clicks (ctrl+click, cmd+click, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const url = new URL(anchor.href);

    // Don't intercept hash-only links on the same page
    if (url.pathname === location.pathname && url.hash) return;

    // Don't intercept if already on this exact page
    if (url.href === location.href) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    navigate(anchor.href, true);
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    navigate(location.href, false);
  });

  // Mark initial state so popstate works properly
  history.replaceState({ softNav: true }, '', location.href);
})();
