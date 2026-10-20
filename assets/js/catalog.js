/*
  Tampilan dan filter katalog.
  Isi/ubah nama produk, harga, kategori, dan foto di products.js.
*/
(() => {
  function loadProducts() {
    try {
      const savedCatalog = localStorage.getItem('nagamasHonda.catalog.v1');
      if (savedCatalog) return JSON.parse(savedCatalog);
    } catch (error) {
      // Local-file browsers can block storage; fall back to the bundled catalog.
    }
    return window.NAGAMAS_PRODUCTS || [];
  }

  const products = loadProducts();
  const categoryLabels = {
    matic: 'Matic',
    bebek: 'Bebek',
    sport: 'Sport',
    listrik: 'Motor listrik'
  };
  const productGrid = document.getElementById('productGrid');
  const productSearch = document.getElementById('productSearch');
  const productTabs = [...document.querySelectorAll('.filter-tab')];
  const phoneNumber = window.NAGAMAS_PHONE || '6282135809898';
  let activeCategory = 'all';

  const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);

  function renderProducts() {
    const query = productSearch.value.trim().toLocaleLowerCase('id-ID');
    const visibleProducts = products
      .filter((product) => !product.hidden)
      .map((product) => ({
        ...product,
        variants: product.variants.filter((variant) => !variant.hidden)
      }))
      .filter((product) => product.variants.length > 0)
      .filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const searchableText = `${product.title} ${product.variants.map((variant) => variant.name).join(' ')}`;
      return matchesCategory && searchableText.toLocaleLowerCase('id-ID').includes(query);
      });

    if (window.revealObserver) {
      productGrid.querySelectorAll('[data-reveal="zoom"]').forEach((card) => {
        window.revealObserver.unobserve(card);
      });
    }

    if (!visibleProducts.length) {
      productGrid.innerHTML = '<div class="empty-state">Produk tidak ditemukan. Coba kata kunci atau kategori lain.</div>';
      return;
    }

    productGrid.innerHTML = visibleProducts.map((product, index) => {
      const isCutoutImage = product.image.toLowerCase().endsWith('.png');
      const variants = product.variants.map((variant) => `
        <li>
          <span class="variant-name">${variant.name}</span>
          <strong class="variant-price">${formatRupiah(variant.price)}</strong>
        </li>
      `).join('');
      const message = `Halo Nagamas Honda, saya tertarik dengan ${product.title}. Mohon info detail harga dan ketersediaan.`;

      return `
        <article class="series-card reveal-zoom" data-reveal="zoom" style="--reveal-delay:${(index % 3) * 90}ms">
          <div class="series-photo${isCutoutImage ? ' cutout' : ''}">
            <img src="${product.image}" alt="${product.title} — foto ilustrasi" loading="lazy">
          </div>
          <header class="series-head">
            <h3>${product.title}</h3>
            <span class="series-category">${categoryLabels[product.category] || product.category}</span>
          </header>
          <ul class="series-variants">${variants}</ul>
          <div class="series-footer">
            <a class="btn wa-link" data-wa-message="${message}" href="https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">
              Tanya seri ini di WhatsApp ↗
            </a>
          </div>
        </article>
      `;
    }).join('');

    if (window.revealObserver) {
      productGrid.querySelectorAll('[data-reveal="zoom"]').forEach((card) => window.revealObserver.observe(card));
    }
  }

  productTabs.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      productTabs.forEach((tab) => {
        const isActive = tab === button;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
      renderProducts();
    });
  });

  productSearch.addEventListener('input', renderProducts);
  renderProducts();
})();
