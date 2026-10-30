# Expense & Budget Visualizer

> 📸 Screenshot placeholder — open index.html to see the live app

A modern, responsive, client-side expense tracker built with vanilla HTML, CSS, and JavaScript. Record daily expenses, monitor total spending, and visualize your spending distribution — all without a backend server.

---

## Features

### MVP Features
- **Input Form** — Add expenses with item name, amount (IDR), and category; inline validation on all fields.
- **Transaction List** — Scrollable list showing item name, amount, category badge, and date/time; delete any entry instantly.
- **Total Balance** — Prominently displayed total spending that updates in real time on every add/delete.
- **Spending Chart** — Doughnut chart (Chart.js) showing spending distribution by category; updates automatically.

### Optional Challenges (All Implemented)
- **Custom Categories** — Create and delete your own expense categories; guards against deleting a category that is still in use.
- **Monthly Summary** — Spending totals grouped by month, displayed in Indonesian month names, sorted newest first.
- **Dark / Light Mode** — Toggle between themes; preference persists across sessions without a flash on reload.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (semantic elements) |
| Styling | CSS3 (custom properties, Flexbox, Grid) |
| Logic | Vanilla JavaScript ES6+ (single IIFE) |
| Charts | [Chart.js](https://www.chartjs.org/) via CDN |
| Storage | Browser `localStorage` API |

No frameworks, no bundler, no build step required.

---

## Folder Structure

```
Expense-Budget-Visualizer/
├── index.html          ← Single HTML page
├── css/
│   └── style.css       ← All styles (single file)
├── js/
│   └── script.js       ← All logic (single file, IIFE)
├── README.md
└── .kiro/              ← Kiro specs (do not edit)
```

---

## Run Locally

1. Clone or download this repository.
2. Open `index.html` directly in your browser — no local server needed.

```bash
# macOS / Linux
open index.html

# Windows
start index.html
```

The app runs entirely on the `file://` protocol. All data is saved in your browser's `localStorage`.

---

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Under *Source*, select **Deploy from a branch**.
4. Choose branch **`main`** and folder **`/ (root)`**.
5. Click **Save**.

GitHub Pages will serve `index.html` from the repository root. All asset paths are relative, so the app works correctly in a subdirectory (e.g. `https://username.github.io/Expense-Budget-Visualizer/`).

---

## localStorage Notes

| Key | Contents |
|-----|---------|
| `ebv_transactions` | JSON array of all transaction objects |
| `ebv_categories` | JSON array of user-created category names |
| `ebv_theme` | `"light"` or `"dark"` |

- Data persists across page refreshes, tab closes, and browser restarts.
- Clearing browser data / site data will erase all stored expenses.
- The app falls back to empty defaults if stored data is corrupt.

---

## Currency Format

All monetary values use **Indonesian Rupiah (IDR)**: `Rp 1.500.000`  
Dots (`.`) serve as thousand separators per the `id-ID` locale.
