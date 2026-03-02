/**
 * Newsletter — ConvertKit form submission via serverless proxy
 */
(function () {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const statusEl = form.querySelector('.newsletter-status');
      const submitBtn = form.querySelector('.newsletter-btn');
      const firstName = form.querySelector('[name="firstName"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();

      if (!email) return;

      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      statusEl.textContent = '';
      statusEl.className = 'newsletter-status';

      try {
        const res = await fetch('/.netlify/functions/newsletter-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, email })
        });

        const data = await res.json();

        if (res.ok) {
          statusEl.textContent = 'You\'re in. Welcome to the fold.';
          statusEl.classList.add('newsletter-success');
          form.reset();
        } else {
          throw new Error(data.error || 'Something went wrong');
        }
      } catch (err) {
        statusEl.textContent = 'Something went wrong. Try again?';
        statusEl.classList.add('newsletter-error');
      } finally {
        submitBtn.textContent = 'Subscribe';
        submitBtn.disabled = false;
      }
    });
  });
})();
