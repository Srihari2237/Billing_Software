from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from database import init_db, handle_year_change, seed_from_excel
from routers import invoices, clients, items

app = FastAPI(title="Anju Trading API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    handle_year_change()
    init_db()
    # Seed master DB from Excel files on first run
    base = os.path.dirname(os.path.abspath(__file__))
    seed_from_excel(
        os.path.join(base, "client_master.xlsx"),
        os.path.join(base, "item_master.xlsx"),
    )

app.include_router(invoices.router, prefix="/api/invoices", tags=["invoices"])
app.include_router(clients.router,  prefix="/api/clients",  tags=["clients"])
app.include_router(items.router,    prefix="/api/items",    tags=["items"])

@app.get("/")
def root():
    return {"status": "Anju Trading API v2.1 running"}
