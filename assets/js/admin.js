(() => {
  const GITHUB_CONFIG = {
    owner: 'nagamas-arista',
    repo: 'Nagamas-Mojolaban',
    branch: 'main'
  };
  const GITHUB_FILE_PATH = 'assets/js/products.js';
  const STORAGE_KEY = 'nagamasHonda.catalog.v1';
  const categoryNames = { matic: 'Matic', bebek: 'Bebek', sport: 'Sport', listrik: 'Motor listrik' };
  const adminList = document.getElementById('adminList');
  const productDialog = document.getElementById('productDialog');
  const seriesDialog = document.getElementById('seriesDialog');
  const productForm = document.getElementById('productForm');
  const seriesForm = document.getElementById('seriesForm');
  const seriesSelect = document.getElementById('seriesSelect');
  const newSeriesFields = document.getElementById('newSeriesFields');
  const searchInput = document.getElementById('adminSearch');
  const githubState = document.getElementById('githubState');
  const githubConnectButton = document.getElementById('githubConnect');
  let catalog = [];
  let catalogLoaded = false;
  let githubToken = '';
  let saveTimer = null;
  let saveQueue = Promise.resolve();

  function setGithubStatus(message, type = '') {
    githubState.textContent = message;
    githubState.className = `connection-state${type ? ` ${type}` : ''}`;
  }

  function configIsReady() {
    return !GITHUB_CONFIG.owner.startsWith('GANTI_') &&
      !GITHUB_CONFIG.repo.startsWith('GANTI_') &&
      /^[A-Za-z0-9-]+$/.test(GITHUB_CONFIG.owner) &&
      /^[A-Za-z0-9_.-]+$/.test(GITHUB_CONFIG.repo) &&
      Boolean(GITHUB_CONFIG.branch);
  }

  function copyDefaults() {
    return JSON.parse(JSON.stringify(window.NAGAMAS_PRODUCTS || []));
  }

  function saveLocalCatalog() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    } catch (error) {
      // GitHub remains the source of truth; local storage is only a convenience.
    }
  }

  function saveCatalog({ syncGithub = true } = {}) {
    saveLocalCatalog();
    renderCatalog();
    if (syncGithub) scheduleGithubSave();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatPrice(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }

  function renderCatalog() {
    if (!catalogLoaded) {
      adminList.innerHTML = '<div class="empty">Hubungkan GitHub untuk memuat produk toko.</div>';
      return;
    }
    const query = searchInput.value.trim().toLocaleLowerCase('id-ID');
    const matches = catalog.map((series, seriesIndex) => ({ series, seriesIndex })).filter(({ series }) => {
      const text = `${series.title} ${categoryNames[series.category] || series.category} ${series.variants.map((variant) => variant.name).join(' ')}`;
      return text.toLocaleLowerCase('id-ID').includes(query);
    });
    if (!matches.length) {
      adminList.innerHTML = '<div class="empty">Produk tidak ditemukan.</div>';
      return;
    }
    adminList.innerHTML = matches.map(({ series, seriesIndex }) => `
      <article class="series${series.hidden ? ' is-hidden' : ''}">
        <header class="series-head">
          <div><h2 class="series-title">${escapeHtml(series.title)}</h2><div class="series-sub">${escapeHtml(categoryNames[series.category] || series.category)} · ${series.variants.length} tipe</div></div>
          <div class="head-actions"><span class="status${series.hidden ? ' hidden' : ''}">${series.hidden ? 'Tersembunyi' : 'Tampil'}</span><button class="icon-button" type="button" data-action="edit-series" data-series="${seriesIndex}">Edit seri</button><button class="icon-button" type="button" data-action="toggle-series" data-series="${seriesIndex}">${series.hidden ? 'Tampilkan' : 'Sembunyikan'}</button></div>
        </header>
        <ul class="variants">${series.variants.map((variant, variantIndex) => `
          <li class="variant${variant.hidden ? ' is-hidden' : ''}"><span class="variant-name">${escapeHtml(variant.name)}${variant.hidden ? ' · tersembunyi' : ''}</span><strong class="variant-price">${formatPrice(variant.price)}</strong>
            <div class="variant-actions"><button class="icon-button" type="button" data-action="edit-product" data-series="${seriesIndex}" data-variant="${variantIndex}">Edit tipe</button><button class="icon-button" type="button" data-action="toggle-product" data-series="${seriesIndex}" data-variant="${variantIndex}">${variant.hidden ? 'Tampilkan' : 'Sembunyikan'}</button></div>
          </li>`).join('')}
        </ul>
      </article>`).join('');
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
    if (!catalogLoaded) {
      setGithubStatus('Hubungkan GitHub terlebih dahulu untuk memuat katalog.', 'error');
      return;
    }
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

  async function githubRequest(url, token, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.headers || {})
      }
    });
    const result = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const detail = result && result.message ? result.message : `HTTP ${response.status}`;
      throw new Error(`GitHub menolak permintaan: ${detail}`);
    }
    return result;
  }

  function githubFileUrl() {
    const path = GITHUB_FILE_PATH.split('/').map(encodeURIComponent).join('/');
    return `https://api.github.com/repos/${encodeURIComponent(GITHUB_CONFIG.owner)}/${encodeURIComponent(GITHUB_CONFIG.repo)}/contents/${path}?ref=${encodeURIComponent(GITHUB_CONFIG.branch)}`;
  }

  function decodeCatalogFile(file) {
    const binary = atob((file.content || '').replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const source = new TextDecoder().decode(bytes);
    const match = source.match(/window\.NAGAMAS_PRODUCTS\s*=\s*([\s\S]*?);\s*$/);
    if (!match) throw new Error('File products.js tidak memiliki format katalog yang dikenal.');
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch (jsonError) {
      // Katalog versi awal memakai object literal JavaScript (single quotes dan key tanpa kutip).
      parsed = JSON.parse(legacyCatalogToJson(match[1]));
    }
    if (!Array.isArray(parsed) || parsed.some((series) => !series.title || !Array.isArray(series.variants))) {
      throw new Error('Isi katalog di GitHub tidak valid.');
    }
    return parsed;
  }

  function legacyCatalogToJson(value) {
    let output = '';
    let inSingleQuote = false;
    let escaped = false;
    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      if (!inSingleQuote) {
        if (character === "'") {
          inSingleQuote = true;
          output += '"';
        } else {
          output += character;
        }
        continue;
      }
      if (escaped) {
        if (character === "'") output += "'";
        else if (character === '"') output += '\\"';
        else if (character === '\\') output += '\\\\';
        else output += `\\${character}`;
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === "'") {
        inSingleQuote = false;
        output += '"';
      } else if (character === '"') {
        output += '\\"';
      } else {
        output += character;
      }
    }
    if (inSingleQuote || escaped) throw new Error('Teks produk di products.js tidak lengkap.');
    return output
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
      .replace(/,\s*([}\]])/g, '$1');
  }

  async function connectGithub() {
    const tokenInput = document.getElementById('githubToken');
    const token = tokenInput.value.trim();
    if (!configIsReady()) {
      setGithubStatus('Isi GITHUB_CONFIG di assets/js/admin.js dengan nama akun dan repository GitHub Anda.', 'error');
      return;
    }
    if (!token) {
      setGithubStatus('Tempel token GitHub terlebih dahulu.', 'error');
      tokenInput.focus();
      return;
    }
    githubConnectButton.disabled = true;
    setGithubStatus('Menghubungkan dan memuat katalog…');
    try {
      const file = await githubRequest(githubFileUrl(), token);
      catalog = decodeCatalogFile(file);
      catalogLoaded = true;
      githubToken = token;
      tokenInput.value = '';
      searchInput.hidden = false;
      saveCatalog({ syncGithub: false });
      setGithubStatus('Terhubung. Perubahan katalog akan disimpan otomatis ke GitHub.', 'success');
    } catch (error) {
      githubToken = '';
      setGithubStatus(error.message, 'error');
    } finally {
      githubConnectButton.disabled = false;
    }
  }

  function encodeBase64Utf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }
    return btoa(binary);
  }

  async function commitSnapshot(snapshot) {
    if (!githubToken || !catalogLoaded) return;
    try {
      setGithubStatus('Menyimpan perubahan ke GitHub…');
      const url = githubFileUrl();
      const currentFile = await githubRequest(url, githubToken);
      const source = `/* Katalog produk Nagamas Honda. Dikelola dari halaman admin.html. */\nwindow.NAGAMAS_PRODUCTS = ${JSON.stringify(snapshot, null, 2)};\n`;
      await githubRequest(url.split('?')[0], githubToken, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Perbarui katalog produk Nagamas Honda',
          content: encodeBase64Utf8(source),
          sha: currentFile.sha,
          branch: GITHUB_CONFIG.branch
        })
      });
      setGithubStatus('Perubahan berhasil disimpan otomatis ke GitHub.', 'success');
    } catch (error) {
      setGithubStatus(`Perubahan ada di browser, tetapi gagal dikirim ke GitHub: ${error.message}`, 'error');
    }
  }

  function scheduleGithubSave() {
    if (!githubToken || !catalogLoaded) return;
    window.clearTimeout(saveTimer);
    setGithubStatus('Perubahan tersimpan sementara. Menyinkronkan ke GitHub…');
    saveTimer = window.setTimeout(() => {
      const snapshot = JSON.parse(JSON.stringify(catalog));
      saveQueue = saveQueue.then(() => commitSnapshot(snapshot));
    }, 700);
  }

  githubConnectButton.addEventListener('click', connectGithub);
  document.getElementById('addProductButton').addEventListener('click', openAddProduct);
  seriesSelect.addEventListener('change', toggleNewSeriesFields);
  searchInput.addEventListener('input', renderCatalog);

  productForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const seriesIndexValue = document.getElementById('editingSeriesIndex').value;
    const variantIndexValue = document.getElementById('editingVariantIndex').value;
    const product = { name: document.getElementById('productName').value.trim(), price: Number(document.getElementById('productPrice').value) };
    if (!product.name || !Number.isFinite(product.price) || product.price < 0) return;
    if (seriesIndexValue !== '' && variantIndexValue !== '') {
      const series = catalog[Number(seriesIndexValue)];
      series.variants[Number(variantIndexValue)] = { ...series.variants[Number(variantIndexValue)], ...product };
    } else if (seriesSelect.value === '__new__') {
      catalog.push({ title: document.getElementById('newSeriesTitle').value.trim(), category: document.getElementById('newSeriesCategory').value, image: document.getElementById('newSeriesImage').value.trim(), variants: [product] });
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
    catalog[index] = { ...catalog[index], title: document.getElementById('seriesTitle').value.trim(), category: document.getElementById('seriesCategory').value, image: document.getElementById('seriesImage').value.trim() };
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

  renderCatalog();
})();
