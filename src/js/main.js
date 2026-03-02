// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => revealObserver.observe(el));

// Tracklist toggles
document.querySelectorAll('.card-tracklist-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const tracklist = btn.nextElementSibling;
    const isOpen = tracklist.classList.contains('open');
    tracklist.classList.toggle('open');
    btn.setAttribute('aria-expanded', !isOpen);
    btn.textContent = isOpen ? 'Tracklist' : 'Hide Tracklist';
  });
});

// Nav scroll
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});
