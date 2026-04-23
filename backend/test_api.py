"""
Anju Trading — Full API Test Suite
Run: python test_api.py
Requires: pip install requests --break-system-packages
Backend must be running on http://localhost:8000
"""

import requests, json, sys, time
from datetime import datetime

BASE = "http://localhost:8000"
PASS = "\033[92m✅ PASS\033[0m"
FAIL = "\033[91m❌ FAIL\033[0m"
WARN = "\033[93m⚠️  WARN\033[0m"
HEAD = "\033[94m──────────────────────────────────\033[0m"

results = {"pass": 0, "fail": 0}

def check(label: str, cond: bool, detail: str = ""):
    if cond:
        print(f"  {PASS}  {label}")
        results["pass"] += 1
    else:
        print(f"  {FAIL}  {label}  {detail}")
        results["fail"] += 1
    return cond

def section(title: str):
    print(f"\n{HEAD}")
    print(f"  {title}")
    print(HEAD)

# ─────────────────────────────────────────────────────────────────────────────
section("1. HEALTH CHECK")
try:
    r = requests.get(f"{BASE}/", timeout=5)
    check("Backend is reachable", r.status_code == 200)
    check("Returns status key", "status" in r.json())
except Exception as e:
    check("Backend is reachable", False, str(e))
    print(f"\n  ⛔  Cannot connect to backend. Start it first:\n      cd backend && uvicorn main:app --reload --port 8000\n")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
section("2. CLIENT API")

# GET clients
r = requests.get(f"{BASE}/api/clients")
check("GET /api/clients → 200", r.status_code == 200)
clients = r.json()
check("Returns list", isinstance(clients, list))
if clients:
    c = clients[0]
    check("Client has 'name'",          "name"          in c)
    check("Client has 'payment_terms'", "payment_terms" in c)
    check("Client has 'address'",       "address"       in c)
    check("Client has 'gstin'",         "gstin"         in c)

# POST new client
test_client = {
    "name": "_TEST_CLIENT_AUTOTEST",
    "payment_terms": "CASH",
    "address": "123 Test Street, Test City, 641001",
    "gstin": "33TESTGSTIN123A1Z"
}
r = requests.post(f"{BASE}/api/clients", json=test_client)
check("POST /api/clients → 200", r.status_code == 200)

# Verify it appears
r = requests.get(f"{BASE}/api/clients")
names = [c["name"] for c in r.json()]
check("New client appears in list",      "_TEST_CLIENT_AUTOTEST" in names)

# Check address
created = next((c for c in r.json() if c["name"] == "_TEST_CLIENT_AUTOTEST"), None)
check("Address saved correctly",  created and created["address"] == "123 Test Street, Test City, 641001")
check("GSTIN saved correctly",    created and created["gstin"]   == "33TESTGSTIN123A1Z")

# DELETE
r = requests.delete(f"{BASE}/api/clients/_TEST_CLIENT_AUTOTEST")
check("DELETE /api/clients/:name → 200", r.status_code == 200)

# Confirm deleted
r = requests.get(f"{BASE}/api/clients")
names = [c["name"] for c in r.json()]
check("Deleted client gone from list", "_TEST_CLIENT_AUTOTEST" not in names)

# ─────────────────────────────────────────────────────────────────────────────
section("3. ITEM API")

r = requests.get(f"{BASE}/api/items")
check("GET /api/items → 200", r.status_code == 200)
items = r.json()
check("Returns list", isinstance(items, list))
if items:
    it = items[0]
    check("Item has 'name'", "name" in it)
    check("Item has 'unit'", "unit" in it)
    check("Item has 'rate'", "rate" in it)
    check("Item has 'gst'",  "gst"  in it)

# POST new item
test_item = {"name": "_TEST_ITEM_AUTOTEST", "unit": "KGS", "rate": 99.5, "gst": 5.0}
r = requests.post(f"{BASE}/api/items", json=test_item)
check("POST /api/items → 200", r.status_code == 200)

r = requests.get(f"{BASE}/api/items")
names = [i["name"] for i in r.json()]
check("New item appears in list", "_TEST_ITEM_AUTOTEST" in names)

created_item = next((i for i in r.json() if i["name"] == "_TEST_ITEM_AUTOTEST"), None)
check("Rate saved correctly", created_item and created_item["rate"] == 99.5)
check("GST saved correctly",  created_item and created_item["gst"]  == 5.0)

r = requests.delete(f"{BASE}/api/items/_TEST_ITEM_AUTOTEST")
check("DELETE /api/items/:name → 200", r.status_code == 200)

r = requests.get(f"{BASE}/api/items")
names = [i["name"] for i in r.json()]
check("Deleted item gone from list", "_TEST_ITEM_AUTOTEST" not in names)

# ─────────────────────────────────────────────────────────────────────────────
section("4. INVOICE — NEXT NUMBER")

r = requests.get(f"{BASE}/api/invoices/next-no")
check("GET /api/invoices/next-no → 200", r.status_code == 200)
nxt = r.json()
check("Has 'inv_no' field",       "inv_no"       in nxt)
check("Has 'billing_year' field", "billing_year" in nxt)
print(f"    → Next invoice: #{nxt.get('inv_no')}  FY {nxt.get('billing_year')}")

# ─────────────────────────────────────────────────────────────────────────────
section("5. INVOICE CRUD")

today = datetime.now().strftime("%d-%m-%Y")
test_invoice = {
    "inv_no": "TEST001",
    "date": today,
    "party": "TEST PARTY",
    "delivery": "TEST PARTY",
    "payment": "Cash",
    "subtotal": 1000.0,
    "gst": 50.0,
    "total": 1050,
    "gst_percent": 5.0,
    "items": [
        {"item": "THREAD WHITE", "qty": 10, "unit": "NOS", "rate": 100.0, "amount": 1000.0}
    ]
}

# CREATE
r = requests.post(f"{BASE}/api/invoices", json=test_invoice)
check("POST /api/invoices → 200", r.status_code == 200)
inv_id = r.json().get("id")
check("Returns invoice id", inv_id is not None)
print(f"    → Created invoice id: {inv_id}")

# GET ONE
r = requests.get(f"{BASE}/api/invoices/{inv_id}")
check(f"GET /api/invoices/{inv_id} → 200", r.status_code == 200)
inv = r.json()
check("Party matches",     inv.get("party")   == "TEST PARTY")
check("Subtotal matches",  inv.get("subtotal") == 1000.0)
check("Items returned",    len(inv.get("items", [])) == 1)
check("Item name correct", inv["items"][0]["item"] == "THREAD WHITE")

# LIST
r = requests.get(f"{BASE}/api/invoices")
check("GET /api/invoices → 200", r.status_code == 200)
inv_list = r.json()
check("List contains test invoice", any(i["id"] == inv_id for i in inv_list))

# UPDATE
test_invoice["party"]    = "UPDATED PARTY"
test_invoice["subtotal"] = 2000.0
test_invoice["total"]    = 2100
test_invoice["gst"]      = 100.0
r = requests.put(f"{BASE}/api/invoices/{inv_id}", json=test_invoice)
check(f"PUT /api/invoices/{inv_id} → 200", r.status_code == 200)

r = requests.get(f"{BASE}/api/invoices/{inv_id}")
check("Party updated correctly",    r.json().get("party")    == "UPDATED PARTY")
check("Subtotal updated correctly", r.json().get("subtotal") == 2000.0)

# PDF
r = requests.get(f"{BASE}/api/invoices/{inv_id}/pdf", stream=True)
check(f"GET /api/invoices/{inv_id}/pdf → 200", r.status_code == 200)
check("Returns PDF content-type", "pdf" in r.headers.get("content-type","").lower() or "octet" in r.headers.get("content-type",""))

# DELETE
r = requests.delete(f"{BASE}/api/invoices/{inv_id}")
check(f"DELETE /api/invoices/{inv_id} → 200", r.status_code == 200)

r = requests.get(f"{BASE}/api/invoices/{inv_id}")
check("Deleted invoice returns 404", r.status_code == 404)

r = requests.get(f"{BASE}/api/invoices")
check("Invoice gone from list", not any(i["id"] == inv_id for i in r.json()))

# ─────────────────────────────────────────────────────────────────────────────
section("6. DASHBOARD")

r = requests.get(f"{BASE}/api/invoices/dashboard")
check("GET /api/invoices/dashboard → 200", r.status_code == 200)
dash = r.json()
for key in ["total_invoices","total_revenue","cash_invoices","credit_invoices","top_clients","daily_sales"]:
    check(f"Dashboard has '{key}'", key in dash)

# ─────────────────────────────────────────────────────────────────────────────
section("7. EDGE CASES")

# Non-existent invoice
r = requests.get(f"{BASE}/api/invoices/999999")
check("Non-existent invoice → 404", r.status_code == 404)

# Empty party name
r = requests.post(f"{BASE}/api/clients", json={"name": "", "payment_terms": "CASH"})
check("Empty client name → 400", r.status_code == 400)

# Empty item name
r = requests.post(f"{BASE}/api/items", json={"name": "", "unit": "NOS"})
check("Empty item name → 400", r.status_code == 400)

# ─────────────────────────────────────────────────────────────────────────────
section("RESULTS")
total = results["pass"] + results["fail"]
pct   = int(results["pass"] / total * 100) if total else 0
print(f"\n  Tests passed : {results['pass']} / {total}  ({pct}%)")
if results["fail"] == 0:
    print(f"  \033[92m🎉  All tests passed! Backend is healthy.\033[0m\n")
else:
    print(f"  \033[91m⚠️   {results['fail']} test(s) failed. See above.\033[0m\n")
    sys.exit(1)
