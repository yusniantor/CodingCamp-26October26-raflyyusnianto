/**
 * Expense & Budget Visualizer
 * script.js — All application logic in a single IIFE
 * No frameworks, no modules, no build step — plain ES6+
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     CONSTANTS
     ══════════════════════════════════════════════════════════ */

  /** Default categories that are always available (never stored in LS). */
  const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

  /** Fixed colour palette; cycles if more than 8 categories exist. */
  const CATEGORY_COLORS = [
    '#6C63FF', // violet  — slot 0 (Food by default)
    '#FF6584', // pink    — slot 1 (Transport by default)
    '#43D9AD', // teal    — slot 2 (Fun by default)
    '#FFB347', // orange  — custom slot 3
    '#56CFE1', // sky     — custom slot 4
    '#FF6B6B', // coral   — custom slot 5
    '#C77DFF', // purple  — custom slot 6
    '#80B918', // lime    — custom slot 7
  ];

  /** LocalStorage key constants. */
  const LS = {
    TX:    'ebv_transactions',
    CAT:   'ebv_categories',
    THEME: 'ebv_theme',
  };

  /** Indonesian month names for monthly summary display. */
  const ID_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  /* ══════════════════════════════════════════════════════════
     STATE
     ══════════════════════════════════════════════════════════ */

  /**
   * Application state — single source of truth.
   * @type {{ transactions: Array, customCategories: Array<string>, theme: string }}
   */
  let state = {
    transactions:     [],
    customCategories: [],
    theme:            'light',
  };

  /** Holds the Chart.js instance so we can update it without recreating. */
  let chartInstance = null;

  /* ══════════════════════════════════════════════════════════
     STORAGE
     ══════════════════════════════════════════════════════════ */

  /**
   * Hydrate `state` from localStorage on boot.
   * Falls back to defaults if keys are missing or JSON is corrupt.
   */
  function loadState() {
    try {
      const tx = localStorage.getItem(LS.TX);
      if (tx) state.transactions = JSON.parse(tx);
    } catch (e) {
      console.warn('Failed to parse transactions from localStorage:', e);
      state.transactions = [];
    }

    try {
      const cat = localStorage.getItem(LS.CAT);
      if (cat) state.customCategories = JSON.parse(cat);
    } catch (e) {
      console.warn('Failed to parse categories from localStorage:', e);
      state.customCategories = [];
    }

    try {
      const theme = localStorage.getItem(LS.THEME);
      if (theme === 'dark' || theme === 'light') state.theme = theme;
    } catch (e) {
      console.warn('Failed to read theme from localStorage:', e);
      state.theme = 'light';
    }
  }

  /** Persist the current transactions array to localStorage. */
  function saveTransactions() {
    try {
      localStorage.setItem(LS.TX, JSON.stringify(state.transactions));
    } catch (e) {
      console.error('Could not save transactions:', e);
    }
  }

  /** Persist the custom categories array to localStorage. */
  function saveCategories() {
    try {
      localStorage.setItem(LS.CAT, JSON.stringify(state.customCategories));
    } catch (e) {
      console.error('Could not save categories:', e);
    }
  }

  /** Persist the current theme preference to localStorage. */
  function saveTheme() {
    try {
      localStorage.setItem(LS.THEME, state.theme);
    } catch (e) {
      console.error('Could not save theme:', e);
    }
  }

  /* ══════════════════════════════════════════════════════════
     BUSINESS LOGIC
     ══════════════════════════════════════════════════════════ */

  /**
   * Add a new transaction to state and persist.
   * @param {string} name
   * @param {number} amount  — positive integer (IDR)
   * @param {string} category
   */
  function addTransaction(name, amount, category) {
    const tx = {
      id:       Date.now().toString(),
      name:     name.trim(),
      amount:   Number(amount),
      category: category,
      date:     new Date().toISOString(),
    };
    state.transactions.push(tx);
    saveTransactions();
  }

  /**
   * Remove a transaction by id and persist.
   * @param {string} id
   */
  function deleteTransaction(id) {
    state.transactions = state.transactions.filter(tx => tx.id !== id);
    saveTransactions();
  }

  /**
   * Add a custom category after validating it is unique.
   * Returns an error string on failure, or null on success.
   * @param {string} label
   * @returns {string|null}
   */
  function addCustomCategory(label) {
    const trimmed = label.trim();
    if (!trimmed) return 'Category name cannot be empty.';

    const exists = getAllCategories().some(
      c => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return 'That category already exists.';

    state.customCategories.push(trimmed);
    saveCategories();
    return null;
  }

  /**
   * Delete a custom category.
   * Blocks deletion if any transaction currently uses this category.
   * @param {string} label
   * @returns {boolean} true if deleted, false if blocked
   */
  function deleteCustomCategory(label) {
    const inUse = state.transactions.some(tx => tx.category === label);
    if (inUse) {
      alert(
        `Cannot delete "${label}" — it is used by one or more transactions.\n` +
        'Delete those transactions first.'
      );
      return false;
    }
    state.customCategories = state.customCategories.filter(c => c !== label);
    saveCategories();
    return true;
  }

  /**
   * Returns the full ordered list of categories (defaults first, then custom).
   * @returns {string[]}
   */
  function getAllCategories() {
    return [...DEFAULT_CATEGORIES, ...state.customCategories];
  }

  /**
   * Map a category name to a colour from the palette.
   * Wraps around if there are more categories than palette entries.
   * @param {string} category
   * @returns {string} hex colour
   */
  function getCategoryColor(category) {
    const idx = getAllCategories().indexOf(category);
    if (idx === -1) return CATEGORY_COLORS[0];
    return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  }

  /**
   * Sum all transaction amounts.
   * @returns {number}
   */
  function calcTotal() {
    return state.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }

  /**
   * Aggregate transaction amounts by category.
   * @returns {Object.<string, number>}
   */
  function calcByCategory() {
    return state.transactions.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {});
  }

  /**
   * Group transactions by calendar month and return sorted descending.
   * @returns {Array<{label: string, total: number, key: string}>}
   */
  function calcMonthlySummary() {
    const map = {};
    state.transactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = {
          key,
          label: `${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
          total: 0,
        };
      }
      map[key].total += tx.amount;
    });

    // Sort descending by YYYY-MM key
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }

  /**
   * Format a number as Indonesian Rupiah.
   * e.g. formatIDR(1500000) → "Rp 1.500.000"
   * @param {number} amount
   * @returns {string}
   */
  function formatIDR(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
  }

  /**
   * Validate the add-expense form fields.
   * @param {string} name
   * @param {string} amount  — raw input string
   * @param {string} category
   * @returns {{ nameError: string, amountError: string, categoryError: string }}
   */
  function validateForm(name, amount, category) {
    const errors = { nameError: '', amountError: '', categoryError: '' };

    if (!name || !name.trim()) {
      errors.nameError = 'Item name is required.';
    }

    const num = Number(amount);
    if (!amount || amount === '') {
      errors.amountError = 'Amount is required.';
    } else if (isNaN(num) || num <= 0) {
      errors.amountError = 'Amount must be a positive number.';
    }

    if (!category || category === '' || category === '__placeholder__') {
      errors.categoryError = 'Please select a category.';
    }

    return errors;
  }

  /* ══════════════════════════════════════════════════════════
     RENDERING
     ══════════════════════════════════════════════════════════ */

  /**
   * Update the summary card (total amount and transaction count).
   */
  function renderSummaryCards() {
    const totalEl = document.getElementById('totalAmount');
    const countEl = document.getElementById('transactionCount');
    if (totalEl) totalEl.innerHTML = formatIDR(calcTotal());
    if (countEl) {
      const n = state.transactions.length;
      countEl.textContent = `${n} transaction${n !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Rebuild the transaction list in the DOM (newest first).
   * Shows/hides the empty-state message.
   */
  function renderTransactionList() {
    const listEl   = document.getElementById('transactionList');
    const emptyEl  = document.getElementById('listEmpty');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (state.transactions.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    // Newest first — slice so we don't mutate original array
    const sorted = state.transactions.slice().reverse();

    sorted.forEach(tx => {
      const li = document.createElement('li');
      li.className = 'tx-item';

      const color = getCategoryColor(tx.category);

      // Format date in Indonesian locale: dd MMM YYYY, HH:mm
      const d = new Date(tx.date);
      const dateStr = d.toLocaleDateString('id-ID', {
        day:   '2-digit',
        month: 'short',
        year:  'numeric',
      }) + ', ' + d.toLocaleTimeString('id-ID', {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      li.innerHTML = `
        <div class="tx-info">
          <div class="tx-name" title="${escapeHTML(tx.name)}">${escapeHTML(tx.name)}</div>
          <div class="tx-meta">${dateStr}</div>
        </div>
        <div class="tx-right">
          <span class="tx-amount">${formatIDR(tx.amount)}</span>
          <span class="tx-category" style="background-color:${color}">${escapeHTML(tx.category)}</span>
        </div>
        <button
          class="btn btn-danger"
          data-id="${tx.id}"
          aria-label="Hapus ${escapeHTML(tx.name)}"
          title="Delete transaction"
        >✕</button>
      `;

      listEl.appendChild(li);
    });
  }

  /**
   * Create or update the Chart.js doughnut chart.
   * Uses a single instance to avoid re-creating on every render.
   */
  function renderChart() {
    const canvas   = document.getElementById('pieChart');
    const emptyEl  = document.getElementById('chartEmpty');
    if (!canvas) return;

    if (state.transactions.length === 0) {
      // No data — destroy any existing chart and show placeholder
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      canvas.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    // Data exists — show canvas, hide placeholder
    canvas.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');

    const byCategory = calcByCategory();
    const labels     = Object.keys(byCategory);
    const data       = Object.values(byCategory);
    const colors     = labels.map(getCategoryColor);

    if (chartInstance === null) {
      // Create new chart instance
      const ctx = canvas.getContext('2d');
      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data:            data,
            backgroundColor: colors,
            borderWidth:     2,
            borderColor:     'transparent',
            hoverBorderWidth: 3,
            hoverBorderColor: '#fff',
          }],
        },
        options: {
          cutout: '60%',
          responsive: true,
          maintainAspectRatio: true,
          animation: { duration: 400 },
          plugins: {
            legend: {
              display:  true,
              position: 'bottom',
              labels: {
                font:        { family: "'Inter', system-ui, sans-serif", size: 12 },
                padding:     12,
                usePointStyle: true,
                pointStyle:  'circle',
              },
            },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  const label  = ctx.label || '';
                  const value  = ctx.parsed;
                  const total  = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct    = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return ` ${label}: ${formatIDR(value)} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    } else {
      // Update existing chart without recreating
      chartInstance.data.labels                          = labels;
      chartInstance.data.datasets[0].data               = data;
      chartInstance.data.datasets[0].backgroundColor    = colors;
      chartInstance.update();
    }
  }

  /**
   * Rebuild the monthly summary list.
   * Shows/hides the empty-state message.
   */
  function renderMonthlySummary() {
    const listEl  = document.getElementById('monthlySummaryList');
    const emptyEl = document.getElementById('monthlyEmpty');
    if (!listEl) return;

    listEl.innerHTML = '';

    const summary = calcMonthlySummary();

    if (summary.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    summary.forEach(({ label, total }) => {
      const li = document.createElement('li');
      li.className = 'monthly-item';
      li.innerHTML = `
        <span class="monthly-label">${escapeHTML(label)}</span>
        <span class="monthly-amount">${formatIDR(total)}</span>
      `;
      listEl.appendChild(li);
    });
  }

  /**
   * Repopulate the category <select> from the current category list.
   * Attempts to preserve the previously selected value.
   */
  function renderCategoryDropdown() {
    const select = document.getElementById('category');
    if (!select) return;

    const previous = select.value;
    select.innerHTML = '';

    // Disabled placeholder option
    const placeholder = document.createElement('option');
    placeholder.value    = '__placeholder__';
    placeholder.textContent = 'Select category';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    getAllCategories().forEach(cat => {
      const opt = document.createElement('option');
      opt.value       = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    // Restore previous selection if it still exists
    if (previous && previous !== '__placeholder__') {
      const match = Array.from(select.options).find(o => o.value === previous);
      if (match) select.value = previous;
    }
  }

  /**
   * Rebuild the custom-categories tag list below the add-category input.
   */
  function renderCustomCategoryList() {
    const listEl = document.getElementById('customCategoryList');
    if (!listEl) return;

    listEl.innerHTML = '';

    state.customCategories.forEach(cat => {
      const li = document.createElement('li');
      const color = getCategoryColor(cat);
      li.className = 'cat-tag';
      li.style.backgroundColor = color;
      li.innerHTML = `
        <span>${escapeHTML(cat)}</span>
        <button
          class="cat-tag-delete"
          data-cat="${escapeHTML(cat)}"
          aria-label="Delete category ${escapeHTML(cat)}"
          title="Delete category"
        >×</button>
      `;
      listEl.appendChild(li);
    });
  }

  /**
   * Call all renderers in the correct dependency order.
   */
  function renderAll() {
    renderSummaryCards();
    renderCategoryDropdown();
    renderCustomCategoryList();
    renderTransactionList();
    renderChart();
    renderMonthlySummary();
  }

  /* ══════════════════════════════════════════════════════════
     THEME
     ══════════════════════════════════════════════════════════ */

  /**
   * Apply a theme to the document and update the toggle button.
   * Called before first render to avoid flash.
   * @param {'light'|'dark'} theme
   */
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    if (theme === 'light') {
      // Light mode: clicking will switch to dark
      btn.textContent  = '🌙';
      btn.setAttribute('aria-label', 'Switch to dark mode');
    } else {
      // Dark mode: clicking will switch to light
      btn.textContent  = '☀️';
      btn.setAttribute('aria-label', 'Switch to light mode');
    }
  }

  /* ══════════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════════ */

  /**
   * Escape HTML entities to prevent XSS when injecting user content.
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  /**
   * Clear inline error messages for the expense form.
   */
  function clearFormErrors() {
    const ids = ['nameError', 'amountError', 'categoryError'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  }

  /**
   * Display inline form errors returned by validateForm().
   * @param {{ nameError: string, amountError: string, categoryError: string }} errors
   */
  function showFormErrors(errors) {
    const nameEl     = document.getElementById('nameError');
    const amountEl   = document.getElementById('amountError');
    const categoryEl = document.getElementById('categoryError');
    if (nameEl)     nameEl.textContent     = errors.nameError     || '';
    if (amountEl)   amountEl.textContent   = errors.amountError   || '';
    if (categoryEl) categoryEl.textContent = errors.categoryError || '';
  }

  /* ══════════════════════════════════════════════════════════
     EVENT WIRING
     ══════════════════════════════════════════════════════════ */

  function initEvents() {
    /* ── Expense Form submit ── */
    const form = document.getElementById('expenseForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearFormErrors();

        const name     = document.getElementById('itemName').value;
        const amount   = document.getElementById('amount').value;
        const category = document.getElementById('category').value;

        const errors = validateForm(name, amount, category);
        const hasErrors = Object.values(errors).some(v => v !== '');

        if (hasErrors) {
          showFormErrors(errors);
          return;
        }

        addTransaction(name, Number(amount), category);
        renderAll();
        form.reset();
        // Re-render dropdown after form reset (reset clears select to first option)
        renderCategoryDropdown();
        clearFormErrors();
      });
    }

    /* ── Transaction List — delete delegation ── */
    const txList = document.getElementById('transactionList');
    if (txList) {
      txList.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-id]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (id) {
          deleteTransaction(id);
          renderAll();
        }
      });
    }

    /* ── Add Custom Category button ── */
    const addCatBtn = document.getElementById('addCategoryBtn');
    const newCatInput = document.getElementById('newCategory');
    const catAddError = document.getElementById('categoryAddError');

    if (addCatBtn && newCatInput) {
      addCatBtn.addEventListener('click', function () {
        const label = newCatInput.value;
        if (catAddError) catAddError.textContent = '';

        const error = addCustomCategory(label);
        if (error) {
          if (catAddError) catAddError.textContent = error;
          return;
        }

        newCatInput.value = '';
        renderCategoryDropdown();
        renderCustomCategoryList();
      });

      // Also allow pressing Enter in the input field
      newCatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCatBtn.click();
        }
      });
    }

    /* ── Custom Category List — delete delegation ── */
    const customCatList = document.getElementById('customCategoryList');
    if (customCatList) {
      customCatList.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-cat]');
        if (!btn) return;
        const label = btn.dataset.cat;
        if (label) {
          const success = deleteCustomCategory(label);
          if (success) {
            renderCategoryDropdown();
            renderCustomCategoryList();
          }
        }
      });
    }

    /* ── Theme Toggle ── */
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        saveTheme();
        applyTheme(state.theme);
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════════ */

  /**
   * Boot sequence:
   * 1. Hydrate state from localStorage
   * 2. Apply saved theme synchronously (prevents flash)
   * 3. Render all UI components
   * 4. Wire up event listeners
   */
  function init() {
    loadState();
    applyTheme(state.theme);
    renderAll();
    initEvents();
  }

  init();

})();
