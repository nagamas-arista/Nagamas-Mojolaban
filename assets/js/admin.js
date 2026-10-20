(() => {
  const STORAGE_KEY = 'nagamasHonda.catalog.v1';
  const categoryNames = {
    matic: 'Matic',
    bebek: 'Bebek',
    sport: 'Sport',
    listrik: 'Motor listrik'
  };
  const adminList = document.getElementById('adminList');
  const productDialog = document.getElementById('productDialog');
  const seriesDialog = document.getElementById('seriesDialog');
  const productForm = document.getElementById('productForm');
  const seriesForm = document.getElementById('seriesForm');
  const seriesSelect = document.getElementById('seriesSelect');
  const newSeriesFields = document.getElementById('newSeriesFields');
  const searchInput = document.getElementById('adminSearch');
  let catalog = loadCatalog();

  function copyDefaults() {
    return JSON.parse(JSON.stringify(window.NAGAMAS_PRODUCTS || []));
  }

  function loadCatalog() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      // The admin still works for this session if storage is blocked by the browser.
    }
    return copyDefaults();
  }

  function saveCatalog() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
      document.getElementById('saveState').textContent = 'Tersimpan di browser';
    } catch (error) {
      document.getElementById('saveState').textContent = 'Penyimpanan browser tidak tersedia — ekspor katalog sebelum menutup halaman.';
    }
    renderCatalog();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatPrice(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }

  function updateMetrics() {
    const variants = catalog.flatMap((series) => series.variants.map((variant) => ({ series, variant })));
    const visibleProducts = variants.filter(({ series, variant }) => !series.hidden && !variant.hidden).length;
    document.getElementById('activeCount').textContent = visibleProducts;
    document.getElementById('seriesCount').textContent = catalog.length;
    document.getElementById('hiddenCount').textContent = variants.length - visibleProducts;
  }

  function renderCatalog() {
    const query = searchInput.value.trim().toLocaleLowerCase('id-ID');
    const matches = catalog.map((series, seriesIndex) => ({ series, seriesIndex })).filter(({ series }) => {
      const text = `${series.title} ${categoryNames[series.category] || series.category} ${series.variants.map((variant) => variant.name).join(' ')}`;
      return text.toLocaleLowerCase('id-ID').includes(query);
    });

    updateMetrics();
    if (!matches.length) {
      adminList.innerHTML = '<div class="empty">Produk tidak ditemukan.</div>';
      return;
    }

    adminList.innerHTML = matches.map(({ series, seriesIndex }) => `
      <article class="series${series.hidden ? ' is-hidden' : ''}">
        <header class="series-head">
          <div>
            <h2 class="series-title">${escapeHtml(series.title)}</h2>
            <div class="series-sub">${escapeHtml(categoryNames[series.category] || series.category)} · ${series.variants.length} tipe</div>
          </div>
          <div class="head-actions">
            <span class="status ${series.hidden ? 'hidden' : 'active'}">${series.hidden ? 'Tersembunyi' : 'Tampil'}</span>
            <button class="icon-button" type="button" data-action="edit-series" data-series="${seriesIndex}">Edit seri</button>
            <button class="icon-button" type="button" data-action="toggle-series" data-series="${seriesIndex}">${series.hidden ? 'Tampilkan' : 'Sembunyikan'}</button>
          </div>
        </header>
        <ul class="variants">
          ${series.variants.map((variant, variantIndex) => `
            <li class="variant${variant.hidden ? ' is-hidden' : ''}">
              <span class="variant-name">${escapeHtml(variant.name)}${variant.hidden ? ' · tersembunyi' : ''}</span>
              <strong class="variant-price">${formatPrice(variant.price)}</strong>
              <div class="variant-actions">
                <button class="icon-button" type="button" data-action="edit-product" data-series="${seriesIndex}" data-variant="${variantIndex}">Edit tipe</button>
                <button class="icon-button" type="button" data-action="toggle-product" data-series="${seriesIndex}" data-variant="${variantIndex}">${variant.hidden ? 'Tampilkan' : 'Sembunyikan'}</button>
              </div>
            </li>
          `).join('')}
        </ul>
      </article>
    `).join('');
  }

  function refreshSeriesOptions(selectedValue) {
    seriesSelect.innerHTML = '<option value="__new__">＋ Buat seri baru</option>' + catalog.map((series, index) =>
      `<option value="${index}">${escapeHtml(series.title)}</option>`
    ).join('');
    if (selectedValue !== undefined) seriesSelect.value = String(selectedValue);
    toggleNewSeriesFields();
  }

  function toggleNewSeriesFields() {
    const isNewSeries = seriesSelect.value === '__new__';
    newSeriesFields.classList.toggle('hidden-field', !isNewSeries);
    document.getElementById('newSeriesTitle').required = isNewSeries;
    document.getElementById('newSeriesImage').required = isNewSeries;
  }

  function openAddProduct() {
    productForm.reset();
    seriesSelect.disabled = false;
    document.getElementById('editingSeriesIndex').value = '';
    document.getElementById('editingVariantIndex').value = '';
    document.getElementById('productDialogTitle').textContent = 'Tambah produk';
    refreshSeriesOptions(catalog.length ? 0 : '__new__');
    productDialog.showModal();
  }

  function openEditProduct(seriesIndex, variantIndex) {
    const series = catalog[seriesIndex];
    const variant = series.variants[variantIndex];
    productForm.reset();
    seriesSelect.disabled = false;
    document.getElementById('editingSeriesIndex').value = seriesIndex;
    document.getElementById('editingVariantIndex').value = variantIndex;
    document.getElementById('productDialogTitle').textContent = 'Edit tipe produk';
    refreshSeriesOptions(seriesIndex);
    seriesSelect.disabled = true;
    document.getElementById('productName').value = variant.name;
    document.getElementById('productPrice').value = variant.price;
    productDialog.showModal();
  }

  function openEditSeries(seriesIndex) {
    const series = catalog[seriesIndex];
    document.getElementById('seriesIndex').value = seriesIndex;
    document.getElementById('seriesTitle').value = series.title;
    document.getElementById('seriesCategory').value = series.category;
    document.getElementById('seriesImage').value = series.image;
    seriesDialog.showModal();
  }

  function downloadFile(filename, contents, mimeType) {
    const file = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.getElementById('addProductButton').addEventListener('click', openAddProduct);
  seriesSelect.addEventListener('change', toggleNewSeriesFields);
  searchInput.addEventListener('input', renderCatalog);

  productForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const seriesIndexValue = document.getElementById('editingSeriesIndex').value;
    const variantIndexValue = document.getElementById('editingVariantIndex').value;
    const product = {
      name: document.getElementById('productName').value.trim(),
      price: Number(document.getElementById('productPrice').value)
    };
    if (!product.name || !Number.isFinite(product.price) || product.price < 0) return;

    if (seriesIndexValue !== '' && variantIndexValue !== '') {
      const series = catalog[Number(seriesIndexValue)];
      series.variants[Number(variantIndexValue)] = { ...series.variants[Number(variantIndexValue)], ...product };
    } else if (seriesSelect.value === '__new__') {
      catalog.push({
        title: document.getElementById('newSeriesTitle').value.trim(),
        category: document.getElementById('newSeriesCategory').value,
        image: document.getElementById('newSeriesImage').value.trim(),
        variants: [product]
      });
    } else {
      catalog[Number(seriesSelect.value)].variants.push(product);
    }

    seriesSelect.disabled = false;
    productDialog.close();
    saveCatalog();
  });

  seriesForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const index = Number(document.getElementById('seriesIndex').value);
    catalog[index] = {
      ...catalog[index],
      title: document.getElementById('seriesTitle').value.trim(),
      category: document.getElementById('seriesCategory').value,
      image: document.getElementById('seriesImage').value.trim()
    };
    seriesDialog.close();
    saveCatalog();
  });

  adminList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const seriesIndex = Number(button.dataset.series);
    const variantIndex = Number(button.dataset.variant);
    const series = catalog[seriesIndex];

    if (button.dataset.action === 'edit-product') openEditProduct(seriesIndex, variantIndex);
    if (button.dataset.action === 'edit-series') openEditSeries(seriesIndex);
    if (button.dataset.action === 'toggle-product') {
      series.variants[variantIndex].hidden = !series.variants[variantIndex].hidden;
      saveCatalog();
    }
    if (button.dataset.action === 'toggle-series') {
      series.hidden = !series.hidden;
      saveCatalog();
    }
  });

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
  });

  document.getElementById('exportButton').addEventListener('click', () => {
    const source = `/* Katalog produk Nagamas Honda. Dikelola dari halaman admin.html. */\nwindow.NAGAMAS_PRODUCTS = ${JSON.stringify(catalog, null, 2)};\n`;
    downloadFile('products.js', source, 'text/javascript;charset=utf-8');
  });

  document.getElementById('backupButton').addEventListener('click', () => {
    downloadFile('nagamas-katalog-backup.json', JSON.stringify(catalog, null, 2), 'application/json;charset=utf-8');
  });

  document.getElementById('importButton').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported) || imported.some((series) => !series.title || !Array.isArray(series.variants))) {
        throw new Error('Bentuk file katalog tidak sesuai.');
      }
      if (!window.confirm('Impor ini akan mengganti katalog yang tersimpan di browser. Lanjutkan?')) return;
      catalog = imported;
      saveCatalog();
    } catch (error) {
      window.alert('File tidak dapat dibaca. Gunakan file cadangan JSON dari halaman admin.');
    } finally {
      event.target.value = '';
    }
  });

  renderCatalog();
})();
