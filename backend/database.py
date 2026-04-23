import sqlite3
import zipfile
import os
from utils import get_billing_year


# ─── helpers ────────────────────────────────────────────────────────────────

def _invoice_db_name(year: str) -> str:
    return os.path.join(_db_dir(), f"AnjuTrading_{year}.db")

def connect():
    """Connect to the current financial-year invoice DB."""
    year = get_billing_year()
    return sqlite3.connect(_invoice_db_name(year))

def master_connect():
    """Single persistent DB for clients & items (never rotated)."""
    path = os.path.join(_db_dir(), "anju_master.db")
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA journal_mode=WAL")   # faster concurrent reads
    return conn


# ─── year-change: archive old invoice DBs ───────────────────────────────────

def handle_year_change():
    current_year  = get_billing_year()
    current_db    = _invoice_db_name(current_year)
    backup_dir    = os.path.join(_db_dir(), "backup")

    for fname in os.listdir(_db_dir()):
        if fname.startswith("AnjuTrading_") and fname.endswith(".db"):
            full = os.path.join(_db_dir(), fname)
            if full != current_db:
                os.makedirs(backup_dir, exist_ok=True)
                zip_path = os.path.join(backup_dir, fname + ".zip")
                if not os.path.exists(zip_path):          # don't double-zip
                    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                        zf.write(full, fname)
                    print(f"🔁  Archived {fname} → backup/{fname}.zip")
                os.remove(full)


# ─── init ───────────────────────────────────────────────────────────────────

def init_db():
    # Invoice DB (per financial year)
    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS invoices (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            inv_no      TEXT,
            date        TEXT,
            party       TEXT,
            delivery    TEXT,
            payment     TEXT,
            subtotal    REAL,
            gst         REAL,
            total       REAL,
            gst_percent REAL DEFAULT 0
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS invoice_items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id  INTEGER,
            item        TEXT,
            qty         REAL,
            unit        TEXT,
            rate        REAL,
            amount      REAL
        )
    """)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.commit()
    conn.close()

    # Master DB (clients + items — persists forever)
    mconn = master_connect()
    mconn.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT UNIQUE NOT NULL,
            payment_terms TEXT DEFAULT 'CASH',
            address       TEXT DEFAULT '',
            gstin         TEXT DEFAULT ''
        )
    """)
    mconn.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT UNIQUE NOT NULL,
            unit    TEXT DEFAULT 'NOS',
            rate    REAL DEFAULT 0,
            gst     REAL DEFAULT 0
        )
    """)
    mconn.commit()
    mconn.close()


# ─── invoice CRUD ────────────────────────────────────────────────────────────

def save_invoice(inv_no, date, party, delivery, payment,
                 subtotal, gst, total, gst_percent, items):
    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO invoices
            (inv_no, date, party, delivery, payment, subtotal, gst, total, gst_percent)
        VALUES (?,?,?,?,?,?,?,?,?)
    """, (inv_no, date, party, delivery, payment,
          subtotal, gst, total, gst_percent))
    inv_id = cur.lastrowid
    cur.executemany("""
        INSERT INTO invoice_items (invoice_id, item, qty, unit, rate, amount)
        VALUES (?,?,?,?,?,?)
    """, [(inv_id, i["item"], i["qty"], i["unit"], i["rate"], i["amount"])
          for i in items])
    conn.commit()
    conn.close()
    return inv_id


def get_all_invoices():
    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, inv_no, date, party, total
        FROM invoices ORDER BY id DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return rows


def get_invoice_details(invoice_id):
    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        SELECT inv_no, date, party, delivery, payment,
               subtotal, gst, total, gst_percent
        FROM invoices WHERE id=?
    """, (invoice_id,))
    inv = cur.fetchone()
    cur.execute("""
        SELECT item, qty, unit, rate, amount
        FROM invoice_items WHERE invoice_id=?
    """, (invoice_id,))
    items = cur.fetchall()
    conn.close()
    return inv, items


def update_invoice(invoice_id, inv_no, date, party, delivery, payment,
                   subtotal, gst, total, gst_percent, items):
    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE invoices
        SET inv_no=?, date=?, party=?, delivery=?, payment=?,
            subtotal=?, gst=?, total=?, gst_percent=?
        WHERE id=?
    """, (inv_no, date, party, delivery, payment,
          subtotal, gst, total, gst_percent, invoice_id))
    cur.execute("DELETE FROM invoice_items WHERE invoice_id=?", (invoice_id,))
    cur.executemany("""
        INSERT INTO invoice_items (invoice_id, item, qty, unit, rate, amount)
        VALUES (?,?,?,?,?,?)
    """, [(invoice_id, i["item"], i["qty"], i["unit"], i["rate"], i["amount"])
          for i in items])
    conn.commit()
    conn.close()


def delete_invoice(invoice_id):
    conn = connect()
    cur  = conn.cursor()
    cur.execute("DELETE FROM invoice_items WHERE invoice_id=?", (invoice_id,))
    cur.execute("DELETE FROM invoices WHERE id=?", (invoice_id,))
    conn.commit()
    conn.close()


def get_next_invoice_no():
    conn = connect()
    cur  = conn.cursor()
    cur.execute("SELECT inv_no FROM invoices ORDER BY id DESC LIMIT 1")
    row = cur.fetchone()
    conn.close()
    if not row:
        return "1"
    try:
        return str(int(row[0]) + 1)
    except Exception:
        return "1"


def get_dashboard_stats():
    conn = connect()
    cur  = conn.cursor()
    cur.execute("SELECT COUNT(*), COALESCE(SUM(total),0), COALESCE(SUM(subtotal),0) FROM invoices")
    total_inv, total_rev, total_sub = cur.fetchone()
    cur.execute("SELECT COUNT(*) FROM invoices WHERE LOWER(payment)='cash'")
    cash_count   = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM invoices WHERE LOWER(payment)='credit'")
    credit_count = cur.fetchone()[0]
    cur.execute("""
        SELECT party, SUM(total) t FROM invoices
        GROUP BY party ORDER BY t DESC LIMIT 5
    """)
    top_clients = cur.fetchall()
    cur.execute("""
        SELECT date, SUM(total) t FROM invoices
        GROUP BY date ORDER BY date DESC LIMIT 30
    """)
    daily_sales = cur.fetchall()
    conn.close()
    return {
        "total_invoices":  int(total_inv),
        "total_revenue":   round(float(total_rev), 2),
        "total_subtotal":  round(float(total_sub), 2),
        "cash_invoices":   int(cash_count),
        "credit_invoices": int(credit_count),
        "top_clients":  [{"party": r[0], "total": round(r[1], 2)} for r in top_clients],
        "daily_sales":  [{"date":  r[0], "total": round(r[1], 2)} for r in daily_sales],
    }


# ─── client CRUD (master DB) ─────────────────────────────────────────────────

def get_all_clients():
    conn = master_connect()
    rows = conn.execute(
        "SELECT name, payment_terms, address, gstin FROM clients ORDER BY name"
    ).fetchall()
    conn.close()
    return [{"name": r[0], "payment_terms": r[1],
             "address": r[2] or "", "gstin": r[3] or ""}
            for r in rows]


def upsert_client(name, payment_terms, address, gstin):
    conn = master_connect()
    conn.execute("""
        INSERT INTO clients (name, payment_terms, address, gstin)
        VALUES (?,?,?,?)
        ON CONFLICT(name) DO UPDATE
            SET payment_terms=excluded.payment_terms,
                address=excluded.address,
                gstin=excluded.gstin
    """, (name.strip().upper(), payment_terms.upper(),
          address.strip(), gstin.strip().upper()))
    conn.commit()
    conn.close()


def delete_client(name):
    conn = master_connect()
    conn.execute("DELETE FROM clients WHERE name=?", (name.upper(),))
    conn.commit()
    conn.close()


# ─── item CRUD (master DB) ───────────────────────────────────────────────────

def get_all_items():
    conn = master_connect()
    rows = conn.execute(
        "SELECT name, unit, rate, gst FROM items ORDER BY name"
    ).fetchall()
    conn.close()
    return [{"name": r[0], "unit": r[1], "rate": r[2], "gst": r[3]} for r in rows]


def upsert_item(name, unit, rate, gst):
    conn = master_connect()
    conn.execute("""
        INSERT INTO items (name, unit, rate, gst)
        VALUES (?,?,?,?)
        ON CONFLICT(name) DO UPDATE
            SET unit=excluded.unit,
                rate=excluded.rate,
                gst=excluded.gst
    """, (name.strip().upper(), unit, float(rate), float(gst)))
    conn.commit()
    conn.close()


def delete_item(name):
    conn = master_connect()
    conn.execute("DELETE FROM items WHERE name=?", (name.upper(),))
    conn.commit()
    conn.close()


def seed_from_excel(client_file: str, item_file: str):
    """One-time seed from Excel into master DB (skips existing rows)."""
    import pandas as pd
    conn = master_connect()
    try:
        df = pd.read_excel(client_file)
        df.columns = df.columns.str.strip()
        for _, row in df.iterrows():
            name = str(row.get("Party Name", "")).strip()
            pt   = str(row.get("Payment Terms", "CASH")).strip()
            if name and name.lower() != "nan":
                conn.execute(
                    "INSERT OR IGNORE INTO clients (name, payment_terms) VALUES (?,?)",
                    (name.upper(), pt.upper())
                )
    except Exception as e:
        print(f"⚠️  client seed skipped: {e}")
    try:
        df2 = pd.read_excel(item_file)
        for _, row in df2.iterrows():
            name = str(row.get("Item Name", "")).strip()
            unit = str(row.get("Unit", "NOS")).strip()
            rate = row.get("Default Rate", 0)
            gst  = row.get("GST %", 0)
            if name and name.lower() != "nan":
                conn.execute(
                    "INSERT OR IGNORE INTO items (name, unit, rate, gst) VALUES (?,?,?,?)",
                    (name.upper(), unit,
                     float(rate) if str(rate) != "nan" else 0.0,
                     float(gst)  if str(gst)  != "nan" else 0.0)
                )
    except Exception as e:
        print(f"⚠️  item seed skipped: {e}")
    conn.commit()
    conn.close()

# ─── Render/production: use DATA_DIR env var for DB location ────────────────
import os as _os
def _db_dir() -> str:  # noqa: F811  (intentional override)
    return _os.environ.get("DATA_DIR", _os.path.dirname(_os.path.abspath(__file__)))
