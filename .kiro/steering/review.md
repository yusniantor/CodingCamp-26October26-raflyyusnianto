# Expense & Budget Visualizer — Implementation Review

The change delivers a fully client-side expense tracker with Chart.js doughnut visualisation, custom categories, monthly summaries, and a dark/light theme toggle. All logic lives in a single IIFE in `js/script.js`, all styling in `css/style.css`, with no build step or backend dependency. Data persists in `localStorage` under three keyed entries. The design uses CSS custom properties for theme switching, a two-column grid layout, and scrollable transaction list.

**Watch for:** The `customCategoryList` element in the HTML is rendered as a `<ul>` but the CSS targets `.custom-category-list` as a flex container while JS appends `<li>` children — these are consistent. No blocking structural issues found. All required IDs and functions are present and correctly wired.

**Verdict**: APPROVED

---

## High-level view

All 17 required IDs are present in `index.html`, Chart.js CDN is loaded before `script.js`, and asset paths are relative — the page will work on `file://` and any subdirectory deployment. The CSS has both `:root` and `[data-theme="dark"]` blocks with all design tokens, a `.hidden` utility class, responsive breakpoints at `767px` and `1023px`, and `#transactionList` capped at `max-height: 400px` with `overflow-y: auto`. The JavaScript IIFE defines every required function, uses `type: 'doughnut'` with `cutout: '60%'`, renders transactions newest-first via `.slice().reverse()`, formats currency with `toLocaleString('id-ID')`, and uses Indonesian month names from `ID_MONTHS`. Both `css/` and `js/` contain exactly one file each. The README covers project title, features, tech stack, folder structure, local run instructions, and GitHub Pages deployment steps.

---

<details>
<summary>Issues (0)</summary>

No blocking issues found. All acceptance criteria pass.

</details>

---

<details>
<summary>Details</summary>

## Criterion 1 — index.html required IDs and script loading order

All 17 IDs from the acceptance checklist are present:

| ID | Element |
|----|---------|
| `totalAmount` | `<p>` in summary card |
| `transactionCount` | `<p>` in summary card |
| `pieChart` | `<canvas>` |
| `chartEmpty` | `<p class="empty-state hidden">` |
| `monthlySummaryList` | `<ul>` |
| `monthlyEmpty` | `<p class="empty-state">` |
| `expenseForm` | `<form novalidate>` |
| `itemName` | `<input type="text">` |
| `amount` | `<input type="number">` |
| `category` | `<select>` |
| `nameError` | `<span class="error-msg" role="alert">` |
| `amountError` | `<span class="error-msg" role="alert">` |
| `categoryError` | `<span class="error-msg" role="alert">` |
| `newCategory` | `<input type="text">` |
| `addCategoryBtn` | `<button>` |
| `categoryAddError` | `<span class="error-msg" role="alert">` |
| `customCategoryList` | `<ul>` |
| `transactionList` | `<ul>` |
| `listEmpty` | `<p class="empty-state">` |
| `themeToggle` | `<button>` in header |

Chart.js CDN (`cdn.jsdelivr.net/npm/chart.js`) appears before `<script src="js/script.js">` at the bottom of `<body>`. The stylesheet is linked as `css/style.css` (relative). **PASS.**

## Criterion 2 — css/style.css tokens, utilities, and breakpoints

`:root` defines 12 design tokens: `--bg-primary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--accent`, `--accent-hover`, `--danger`, `--success`, `--border`, `--shadow`, `--radius`, `--font`. `[data-theme="dark"]` overrides six of them. The `.hidden` utility is declared as `display: none !important`. Responsive breakpoints are at `max-width: 1023px` (tablet) and `max-width: 767px` (mobile). `#transactionList` has `max-height: 400px` and `overflow-y: auto`, with a mobile override reducing it to `340px`. **PASS.**

## Criterion 3 — js/script.js function inventory and behavioural contracts

Every function named in the acceptance criteria is defined inside the IIFE:

`init`, `loadState`, `saveTransactions`, `saveCategories`, `saveTheme`, `addTransaction`, `deleteTransaction`, `addCustomCategory`, `deleteCustomCategory`, `getAllCategories`, `getCategoryColor`, `calcTotal`, `calcByCategory`, `calcMonthlySummary`, `formatIDR`, `validateForm`, `renderSummaryCards`, `renderTransactionList`, `renderChart`, `renderMonthlySummary`, `renderCategoryDropdown`, `renderCustomCategoryList`, `renderAll`, `applyTheme`, `initEvents`.

Chart type is `'doughnut'` with `cutout: '60%'`. Indonesian month names are declared in `ID_MONTHS` and used in `calcMonthlySummary`. `formatIDR` uses `Number(amount).toLocaleString('id-ID')`. Transactions are rendered newest-first via `state.transactions.slice().reverse()`. **PASS.**

## Criterion 4 — README.md content

The README contains: project title ("Expense & Budget Visualizer"), MVP and optional features, a tech stack table, folder structure code block, local run instructions with shell commands, and a GitHub Pages deployment walkthrough (Settings → Pages → branch `main` → root). **PASS.**

## Criterion 5 — No extra files in css/ or js/

`css/` contains only `style.css`. `js/` contains only `script.js`. **PASS.**

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|------|-------------|
| `index.html` | Full single-page application markup with all required IDs, CDN script tag, and relative asset paths |
| `css/style.css` | Complete stylesheet: design tokens, dark theme, reset, layout grid, all component styles, responsive breakpoints |
| `js/script.js` | Full application logic IIFE: state management, localStorage persistence, business logic, rendering, event wiring |
| `README.md` | Project documentation covering features, tech stack, folder structure, local run, and GitHub Pages deployment |

Full diff: `git diff main` against the repository root.

</details>
