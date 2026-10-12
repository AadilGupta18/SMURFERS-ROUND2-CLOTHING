const products = window.RIYASAT_PRODUCTS;

const state = {
  filter: 'all',
  sort: 'featured',
  selectedProductId: products[0].id,
  theme: 'dark'
};

const productGrid = document.getElementById('productGrid');
const filterButtons = document.querySelectorAll('.filter-button');
const sortSelect = document.getElementById('sortSelect');
const modal = document.getElementById('quickViewModal');
const countdownText = document.getElementById('countdownText');

function formatPrice(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('riyasat-cart') || '[]');
  const count = cart.reduce((total, item) => total + Number(item.quantity), 0);
  document.querySelectorAll('[data-cart-count]').forEach((counter) => {
    counter.textContent = String(count);
  });
}

function markActiveNavigation() {
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[href]').forEach((link) => {
    const linkedFile = link.getAttribute('href').split('?')[0].split('/').pop();
    const active = linkedFile === currentFile;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function initHomeAnimations() {
  const targets = document.querySelectorAll([
    '.hero-copy > *',
    '.hero-visual',
    '.hero-meta > div',
    '.brand-statement',
    '.brand-glance .section-heading > *',
    '.glance-card',
    '.story-media',
    '.story-copy > *',
    '.story-facts > div',
    '.shop .section-heading > *',
    '.shop-controls > *',
    '.product-card',
    '.lookbook .section-heading > *',
    '.lookbook-card',
    '.size-guide .section-heading > *',
    '.guide-table-wrap',
    '.size-notes > div',
    '.site-footer > *'
  ].join(','));

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

  targets.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 55}ms`);
    observer.observe(element);
  });

  window.setTimeout(() => {
    targets.forEach((element) => element.classList.add('is-visible'));
    observer.disconnect();
  }, 1400);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getProductsForDisplay() {
  const filtered = state.filter === 'all'
    ? [...products]
    : products.filter((product) => product.categoryKey === state.filter);

  const sorted = [...filtered];
  if (state.sort === 'low-high') {
    sorted.sort((a, b) => a.price - b.price);
  } else if (state.sort === 'high-low') {
    sorted.sort((a, b) => b.price - a.price);
  }
  return sorted;
}

function renderProducts() {
  const list = getProductsForDisplay();
  const likedIds = JSON.parse(localStorage.getItem('riyasat-likes') || '[]');

  productGrid.innerHTML = list.map((product) => `
    <article class="product-card ${product.soldOut ? 'sold' : ''}" data-id="${product.id}" tabindex="0" role="link" aria-label="View ${escapeHtml(product.name)}">
      <div class="product-image" style="background-image: linear-gradient(rgba(15,15,15,0.12), rgba(15,15,15,0.18)), url('${product.image}')">
        ${product.soldOut ? '<span class="sold-out-badge">Sold out</span>' : ''}
      </div>
      <div class="product-info">
        <div class="product-head">
          <h3><a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3>
        </div>
        <div class="product-meta">${escapeHtml(product.category)} / ${escapeHtml(product.fit)}</div>
        <div class="product-fit">${escapeHtml(product.fit)}</div>
        <ul class="product-specs">
          <li><span>Colours</span>${product.colors.join(', ')}</li>
          <li><span>Sizes</span>${product.sizes.join(', ')}</li>
        </ul>
        <div class="product-footer">
          <div class="price">${formatPrice(product.price)}</div>
          <div class="action-row">
            <button class="text-button add-to-cart" type="button" data-id="${product.id}" ${product.soldOut ? 'disabled' : ''}>Add to cart</button>
            <button class="text-button like-button ${likedIds.includes(product.id) ? 'is-liked' : ''}" type="button" data-id="${product.id}" aria-label="${likedIds.includes(product.id) ? 'Unlike' : 'Like'} ${escapeHtml(product.name)}" aria-pressed="${likedIds.includes(product.id)}">${likedIds.includes(product.id) ? '♥' : '♡'}</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = event.currentTarget.dataset.id;
      const cart = JSON.parse(localStorage.getItem('riyasat-cart') || '[]');
      const existing = cart.find((item) => item.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id, quantity: 1, colour: '', size: '' });
      }
      localStorage.setItem('riyasat-cart', JSON.stringify(cart));
      updateCartCount();
      event.currentTarget.textContent = 'Added';
      window.setTimeout(() => { event.currentTarget.textContent = 'Add to cart'; }, 1200);
    });
  });

  document.querySelectorAll('.like-button').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = event.currentTarget.dataset.id;
      const liked = JSON.parse(localStorage.getItem('riyasat-likes') || '[]');
      const index = liked.indexOf(id);
      if (index >= 0) {
        liked.splice(index, 1);
      } else {
        liked.push(id);
      }
      localStorage.setItem('riyasat-likes', JSON.stringify(liked));
      renderProducts();
    });
  });

  document.querySelectorAll('.product-card').forEach((card) => {
    const openProduct = (event) => {
      if (event.target.closest('button, a')) return;
      const id = card.dataset.id;
      if (id) window.location.href = `product.html?id=${encodeURIComponent(id)}`;
    };
    card.addEventListener('click', openProduct);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProduct(event);
      }
    });
  });
}

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀' : '☾';
  }
  state.theme = theme;
}

function openQuickView(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  state.selectedProductId = product.id;

  document.getElementById('modalCategory').textContent = product.category;
  document.getElementById('modalTitle').textContent = product.name;
  document.getElementById('modalPrice').textContent = formatPrice(product.price);
  document.querySelector('.quick-view-image').style.backgroundImage = `linear-gradient(rgba(15,15,15,0.16), rgba(15,15,15,0.25)), url('${product.image}')`;

  const specList = document.getElementById('modalSpecs');
  specList.innerHTML = `
    <li><strong>Fit:</strong> ${escapeHtml(product.fit)}</li>
    <li><strong>Colours:</strong> ${escapeHtml(product.colors.join(', '))}</li>
    <li><strong>Sizes:</strong> ${escapeHtml(product.sizes.join(', '))}</li>
    <li><strong>Details:</strong> ${escapeHtml(product.description)}</li>
  `;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeQuickView() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function attachSiteEvents() {
  document.getElementById('themeToggle').addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  document.querySelector('.modal-close').addEventListener('click', closeQuickView);
  document.querySelector('.modal-backdrop').addEventListener('click', closeQuickView);
  document.querySelector('.modal-cta').addEventListener('click', () => {
    const selected = products.find((entry) => entry.id === state.selectedProductId);
    if (selected) {
      window.location.href = `order.html?id=${encodeURIComponent(selected.id)}`;
    }
  });
}

function initCountdown() {
  const target = new Date();
  target.setHours(target.getHours() + 72);

  function tick() {
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) {
      countdownText.textContent = 'Live now';
      return;
    }

    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
    const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
    countdownText.textContent = `${hours}:${minutes}:${seconds}`;
  }

  tick();
  setInterval(tick, 1000);
}

function initFilterAndSort() {
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      filterButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
      renderProducts();
    });
  });

  sortSelect.addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderProducts();
  });
}

function init() {
  setTheme('dark');
  markActiveNavigation();
  initFilterAndSort();
  renderProducts();
  attachSiteEvents();
  initCountdown();
  updateCartCount();
  initHomeAnimations();
}

if (document.documentElement.dataset.siteLayoutReady === 'true') init();
else document.addEventListener('site-layout:ready', init, { once: true });
