# Anju Trading — Billing System v3.0

Full-stack web billing application built with **Next.js 14** (frontend) + **FastAPI / Python 3.11** (backend) + **SQLite** (database).

---

## Project Structure

```
anju-trading/
│
├── backend/                        Python FastAPI backend
│   ├── main.py                     App entry point (startup, CORS, routers)
│   ├── database.py                 SQLite CRUD — invoice DB (year-based) + master DB
│   ├── invoice_generator.py        ReportLab PDF generation
│   ├── utils.py                    Billing year helper (April = new FY)
│   ├── requirements.txt
│   ├── test_api.py                 Full automated API test suite ← run this to test
│   ├── render.yaml                 Render.com deploy config
│   ├── client_master.xlsx          Seed data for clients (auto-imported on first run)
│   ├── item_master.xlsx            Seed data for items   (auto-imported on first run)
│   ├── invoice_template.png        Background for PDF invoices
│   ├── anju_master.db              ← auto-created: clients + items (never rotated)
│   ├── AnjuTrading_2025-26.db      ← auto-created: invoices for current FY
│   ├── backup/                     ← auto-created: old year DBs zipped here
│   └── routers/
│       ├── invoices.py             CRUD + PDF + dashboard
│       ├── clients.py              CRUD with address + GSTIN
│       └── items.py                CRUD with unit / rate / GST
│
└── frontend/                       Next.js 14 + TypeScript + Tailwind
    ├── next.config.js              API proxy → backend (local or Render URL)
    ├── vercel.json                 Vercel deploy config
    ├── .env.example                Environment variable template
    └── src/
        ├── app/
        │   ├── layout.tsx          Root layout — sidebar + toast
        │   ├── globals.css         Full design system (tokens, cards, tables…)
        │   ├── dashboard/          Stats cards, area chart, top clients
        │   ├── invoices/
        │   │   ├── page.tsx        List + search + delete
        │   │   ├── new/            New invoice form
        │   │   └── [id]/
        │   │       ├── page.tsx    Invoice detail view
        │   │       ├── edit/       Edit invoice form
        │   │       └── print/      In-app A4 print preview + engine
        │   ├── clients/            Directory + add/edit/delete + address + GSTIN
        │   └── items/              Master list + add/edit/delete
        ├── components/
        │   ├── Sidebar.tsx         Dark nav
        │   ├── InvoiceForm.tsx     Shared create/edit form with live totals
        │   └── Autocomplete.tsx    Fixed-position keyboard-navigable dropdown
        └── lib/
            ├── api.ts              Typed Axios wrappers for all endpoints
            └── utils.ts            formatCurrency, getBillingYear, todayStr
```

---

## Requirements

| Tool | Version |
|------|---------|
| **Python** | **3.11** (recommended) — 3.10+ works |
| **Node.js** | 18.x or 20.x LTS |
| **npm** | 9.x+ |

---

## Run Locally on Your Laptop (Personal Use)

### Step 1 — Open project in VS Code

```
File → Open Folder → select anju-trading/
```

### Step 2 — Backend setup (do once)

Open a terminal in VS Code (`Ctrl+``):

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac / Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3 — Start backend

```bash
# (inside backend/ with venv active)
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

On first run it will:
- Create `anju_master.db` and seed clients + items from the Excel files
- Create `AnjuTrading_2025-26.db` (or current FY) for invoices
- If old-year DBs exist, zip them to `backup/`

### Step 4 — Frontend setup (do once)

Open a **second terminal**:

```bash
cd frontend
npm install
```

### Step 5 — Start frontend

```bash
npm run dev
```

Open **http://localhost:3000** ✅

### Quick Start (Windows — after first setup)

Double-click **`start.bat`** in the project root — it opens both servers automatically.

---

## Test Every API Automatically

With the backend running, open a terminal in `backend/` and run:

```bash
cd backend
venv\Scripts\activate      # or: source venv/bin/activate
python test_api.py
```

This runs **35+ tests** covering:
- Health check
- Client CRUD (create, read, address/GSTIN validation, delete)
- Item CRUD (create, read, rate/GST validation, delete)
- Invoice CRUD (create, read, update, list, PDF, delete)
- Dashboard stats
- Edge cases (404 on missing, 400 on empty name)

Expected output on a healthy backend:
```
  ✅ PASS  Backend is reachable
  ✅ PASS  Returns status key
  ...
  Tests passed : 35 / 35  (100%)
  🎉  All tests passed! Backend is healthy.
```

---

## Database Files

| File | Purpose | Backed up? |
|------|---------|-----------|
| `anju_master.db` | All clients + items — lives forever | No (persistent master) |
| `AnjuTrading_2025-26.db` | Invoices for FY 2025-26 | Auto on April 1 |
| `AnjuTrading_2026-27.db` | Invoices for FY 2026-27 | Auto on April 1 next year |
| `backup/*.db.zip` | Compressed old-year invoice DBs | — |

**Year change logic:** On every startup, if the current financial year (April–March) is different from existing invoice DBs, the old ones are zipped into `backup/` and a fresh DB is created. Invoice numbers restart from 1.

---

## Invoice Print Template (A4 Layout)

The print page (`/invoices/{id}/print`) renders an exact A4-sized preview with these sections:

| Section | Height | Contents |
|---------|--------|----------|
| Shop Header | 45 mm | Dark navy background, ANJU TRADING, address, amber INVOICE badge |
| Bill To / Invoice Info | 50 mm | Party name, address (comma → new line), GSTIN pill, Invoice No / Date / Payment |
| Items Table | 110 mm | S.No, Particulars, Qty, Unit, Rate, Amount — filled with empty rows to A4 |
| GST / Totals | 40 mm | E.&O.E left · Sub Total / CGST / SGST / Total / Round Off / dark Nett bar right |
| Authorised Signatory | 30 mm | Amount in words left · For ANJU TRADING + signature line right |

Click **🖨 Print / Save PDF** → browser print dialog opens. Choose printer for hardcopy or "Save as PDF".

---

## Deploy to Render + Vercel (for friends to test)

### Backend → Render.com (free tier)

1. Push the `anju-trading/` folder to a **GitHub repository**
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Python version:** 3.11
5. Add a **Disk** (Render Dashboard → your service → Disks):
   - Mount path: `/data`
   - Size: 1 GB (free)
6. Add **Environment Variable:**
   - `DATA_DIR` = `/data`
7. Click **Deploy** — Render gives you a URL like `https://anju-trading-api.onrender.com`

> **Important:** Free Render instances sleep after 15 min inactivity (cold start ~30s). Upgrade to Starter ($7/mo) for always-on.

### Frontend → Vercel.com (free)

1. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo
2. Settings:
   - **Root directory:** `frontend`
   - **Framework:** Next.js (auto-detected)
3. Add **Environment Variable** in Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL` = `https://anju-trading-api.onrender.com`  ← your Render URL
4. Also update `frontend/vercel.json`:
   ```json
   "destination": "https://anju-trading-api.onrender.com/api/:path*"
   ```
5. Deploy — Vercel gives you `https://anju-trading.vercel.app`

Share that link with your friends for testing!

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List all invoices (current FY) |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/{id}` | Get invoice detail |
| PUT | `/api/invoices/{id}` | Update invoice |
| DELETE | `/api/invoices/{id}` | Delete invoice |
| GET | `/api/invoices/{id}/pdf` | Download PDF |
| GET | `/api/invoices/next-no` | Next invoice number + billing year |
| GET | `/api/invoices/dashboard` | Stats for dashboard |
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Add client (name, payment_terms, address, gstin) |
| PUT | `/api/clients/{name}` | Update client |
| DELETE | `/api/clients/{name}` | Delete client |
| GET | `/api/items` | List all items |
| POST | `/api/items` | Add item (name, unit, rate, gst) |
| PUT | `/api/items/{name}` | Update item |
| DELETE | `/api/items/{name}` | Delete item |

Interactive docs (local): **http://localhost:8000/docs**

---

## VS Code Tips

- Press **F5** to launch the backend via the included `.vscode/launch.json`
- Install recommended extensions when VS Code prompts (see `.vscode/extensions.json`)
- The Python interpreter is auto-configured to `backend/venv/`

---

## Changelog

| Version | Changes |
|---------|---------|
| v1.0 | Original Tkinter desktop app |
| v2.0 | Migrated to Next.js + FastAPI |
| v2.1 | In-app print engine, add/delete clients + items, WAL DB mode |
| v3.0 | Exact A4 print layout (cm sections), comma-split address, GSTIN pill, amount-in-words in signatory, full API test suite, Render + Vercel deploy configs |
