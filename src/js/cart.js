/**
 * Cart — localStorage-based cart with Stripe Checkout integration
 */
(function () {
  const STORAGE_KEY = 'jaytrainer_cart';
  const FULL_DISCOGRAPHY_PRICE_ID = 'price_1TbO6VEOkdyXiRRFQIt1Naie';

  class Cart {
    constructor() {
      this.items = this.load();
      this.updateBadge();
      this.bindEvents();
    }

    load() {
      try {
        return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(item => (
          item.priceId === FULL_DISCOGRAPHY_PRICE_ID
            ? { ...item, displayPrice: '$99' }
            : item
        ));
      } catch {
        return [];
      }
    }

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      this.updateBadge();
    }

    getOptionsKey(options = {}) {
      return Object.keys(options)
        .sort()
        .map(key => `${key}:${options[key]}`)
        .join('|');
    }

    formatOptions(options = {}) {
      return Object.entries(options)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${value}`)
        .join(' · ');
    }

    add(item) {
      // Match on priceId + format + options to allow separate variants in the cart.
      const optionKey = this.getOptionsKey(item.options);
      const existing = this.items.find(i => (
        i.priceId === item.priceId &&
        i.format === item.format &&
        this.getOptionsKey(i.options) === optionKey
      ));
      if (existing) {
        existing.quantity += 1;
        existing.name = item.name;
        existing.displayPrice = item.displayPrice;
        existing.image = item.image;
        existing.type = item.type;
        existing.options = item.options;
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

      itemsEl.innerHTML = this.items.map((item, idx) => {
        const options = this.formatOptions(item.options);
        return `
        <div class="cart-item" data-cart-index="${idx}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}${item.format ? ' <span class="cart-item-format">' + item.format.toUpperCase() + '</span>' : ''}</div>
            ${options ? '<div class="cart-item-options">' + options + '</div>' : ''}
            <div class="cart-item-price">${item.displayPrice}${item.quantity > 1 ? ' x ' + item.quantity : ''}</div>
          </div>
          <button class="cart-item-remove" data-remove-index="${idx}" aria-label="Remove">&times;</button>
        </div>
      `;
      }).join('');

      totalEl.textContent = '$' + this.getTotal().toFixed(2);

      // Bind remove buttons
      itemsEl.querySelectorAll('[data-remove-index]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.removeIndex, 10);
          this.items.splice(idx, 1);
          this.save();
          this.renderDrawer();
        });
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
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: this.items.map(i => ({
              priceId: i.priceId,
              quantity: i.quantity,
              format: i.type === 'music' ? (i.format || 'mp3') : undefined,
              options: i.options || undefined,
              type: i.type,
              name: i.name
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
      // Format toggle buttons
      document.addEventListener('click', (e) => {
        const fmtBtn = e.target.closest('.format-btn');
        if (!fmtBtn) return;
        const selector = fmtBtn.closest('.format-selector');
        if (!selector) return;
        selector.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        fmtBtn.classList.add('active');
      });

      // Add to cart buttons
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;
        e.preventDefault();
        if (!btn.dataset.price) {
          alert('This item is not available for checkout yet.');
          return;
        }
        const merchItem = btn.closest('.merch-item');
        const optionControls = merchItem ? [...merchItem.querySelectorAll('[data-option-name]')] : [];
        const options = optionControls.reduce((selected, control) => {
          selected[control.dataset.optionName] = control.value;
          return selected;
        }, {});
        const missingOptions = optionControls.filter(control => !control.value);
        if (missingOptions.length) {
          alert('Please select a shirt size and color before adding this item to your cart.');
          missingOptions[0].focus();
          return;
        }
        // Music purchases use the selected audio format; merch should not inherit an album format label.
        const formatSelector = document.getElementById('formatSelector');
        const activeFormat = formatSelector
          ? (formatSelector.querySelector('.format-btn.active')?.dataset.format || 'mp3')
          : (btn.dataset.type === 'music' ? 'mp3' : '');
        this.add({
          name: btn.dataset.name,
          priceId: btn.dataset.price,
          displayPrice: btn.dataset.displayPrice || btn.textContent.replace('Add To Cart — ', '').trim(),
          image: btn.dataset.image,
          type: btn.dataset.type,
          format: activeFormat,
          options
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
