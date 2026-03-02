/**
 * Cart — localStorage-based cart with Stripe Checkout integration
 */
(function () {
  const STORAGE_KEY = 'jaytrainer_cart';

  class Cart {
    constructor() {
      this.items = this.load();
      this.updateBadge();
      this.bindEvents();
    }

    load() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch {
        return [];
      }
    }

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      this.updateBadge();
    }

    add(item) {
      const existing = this.items.find(i => i.priceId === item.priceId);
      if (existing) {
        existing.quantity += 1;
      } else {
        this.items.push({ ...item, quantity: 1 });
      }
      this.save();
      this.openDrawer();
    }

    remove(priceId) {
      this.items = this.items.filter(i => i.priceId !== priceId);
      this.save();
      this.renderDrawer();
    }

    updateQuantity(priceId, delta) {
      const item = this.items.find(i => i.priceId === priceId);
      if (!item) return;
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.remove(priceId);
        return;
      }
      this.save();
      this.renderDrawer();
    }

    getTotal() {
      return this.items.reduce((sum, item) => {
        const price = parseFloat(item.displayPrice.replace(/[^0-9.]/g, '')) || 0;
        return sum + price * item.quantity;
      }, 0);
    }

    get count() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    updateBadge() {
      const badge = document.getElementById('cartBadge');
      if (!badge) return;
      const count = this.count;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    renderDrawer() {
      const itemsEl = document.getElementById('cartDrawerItems');
      const emptyEl = document.getElementById('cartDrawerEmpty');
      const footerEl = document.getElementById('cartDrawerFooter');
      const totalEl = document.getElementById('cartDrawerTotal');

      if (!itemsEl) return;

      if (this.items.length === 0) {
        itemsEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        footerEl.style.display = 'none';
        return;
      }

      emptyEl.style.display = 'none';
      itemsEl.style.display = 'block';
      footerEl.style.display = 'block';

      itemsEl.innerHTML = this.items.map(item => `
        <div class="cart-item" data-price-id="${item.priceId}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${item.displayPrice}${item.quantity > 1 ? ' x ' + item.quantity : ''}</div>
          </div>
          <button class="cart-item-remove" data-remove="${item.priceId}" aria-label="Remove">&times;</button>
        </div>
      `).join('');

      totalEl.textContent = '$' + this.getTotal().toFixed(2);

      // Bind remove buttons
      itemsEl.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => this.remove(btn.dataset.remove));
      });
    }

    openDrawer() {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartOverlay');
      if (!drawer) return;
      this.renderDrawer();
      drawer.classList.add('active');
      overlay.classList.add('active');
    }

    closeDrawer() {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartOverlay');
      if (!drawer) return;
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    }

    async checkout() {
      if (!this.items.length) return;
      const checkoutBtn = document.getElementById('cartCheckoutBtn');
      checkoutBtn.textContent = 'Processing...';
      checkoutBtn.disabled = true;

      try {
        const res = await fetch('/.netlify/functions/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: this.items.map(i => ({
              priceId: i.priceId,
              quantity: i.quantity
            }))
          })
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Checkout failed');
        }
      } catch (err) {
        checkoutBtn.textContent = 'Checkout';
        checkoutBtn.disabled = false;
        alert('Something went wrong. Please try again.');
      }
    }

    bindEvents() {
      // Add to cart buttons
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;
        e.preventDefault();
        this.add({
          name: btn.dataset.name,
          priceId: btn.dataset.price,
          displayPrice: btn.textContent.replace('Add to Cart — ', '').trim(),
          image: btn.dataset.image,
          type: btn.dataset.type
        });
      });

      // Cart icon opens drawer
      const cartIconLink = document.getElementById('cartIconLink');
      if (cartIconLink) {
        cartIconLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.openDrawer();
        });
      }

      // Close drawer
      const closeBtn = document.getElementById('cartDrawerClose');
      const overlay = document.getElementById('cartOverlay');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeDrawer());
      if (overlay) overlay.addEventListener('click', () => this.closeDrawer());

      // Checkout
      const checkoutBtn = document.getElementById('cartCheckoutBtn');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => this.checkout());
      }
    }
  }

  // Initialize
  window.cart = new Cart();
})();
