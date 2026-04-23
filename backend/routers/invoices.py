from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os

from database import (
    save_invoice, get_all_invoices, get_invoice_details,
    update_invoice, delete_invoice, get_next_invoice_no, get_dashboard_stats
)
from invoice_generator import generate_invoice_pdf
from utils import get_billing_year

router = APIRouter()


class InvoiceItem(BaseModel):
    item: str
    qty: float
    unit: str
    rate: float
    amount: float


class InvoiceCreate(BaseModel):
    inv_no: str
    date: str
    party: str
    delivery: str
    payment: str
    subtotal: float
    gst: float
    total: float
    gst_percent: float
    items: List[InvoiceItem]


@router.get("/")
def list_invoices():
    data = get_all_invoices()
    return [
        {"id": r[0], "inv_no": r[1], "date": r[2], "party": r[3], "total": r[4]}
        for r in data
    ]


@router.get("/next-no")
def next_invoice_no():
    no = get_next_invoice_no()
    billing_year = get_billing_year()
    return {"inv_no": no, "billing_year": billing_year}


@router.get("/dashboard")
def dashboard():
    return get_dashboard_stats()


@router.get("/{invoice_id}")
def get_invoice(invoice_id: int):
    invoice, items = get_invoice_details(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {
        "id": invoice_id,
        "inv_no": invoice[0],
        "date": invoice[1],
        "party": invoice[2],
        "delivery": invoice[3],
        "payment": invoice[4],
        "subtotal": invoice[5],
        "gst": invoice[6],
        "total": invoice[7],
        "gst_percent": invoice[8] if invoice[8] is not None else 0,
        "items": [
            {"item": i[0], "qty": i[1], "unit": i[2], "rate": i[3], "amount": i[4]}
            for i in items
        ]
    }


@router.post("/")
def create_invoice(data: InvoiceCreate):
    items = [i.dict() for i in data.items]
    invoice_id = save_invoice(
        data.inv_no, data.date, data.party, data.delivery,
        data.payment, data.subtotal, data.gst, data.total,
        data.gst_percent, items
    )
    return {"id": invoice_id, "message": "Invoice saved successfully"}


@router.put("/{invoice_id}")
def edit_invoice(invoice_id: int, data: InvoiceCreate):
    items = [i.dict() for i in data.items]
    update_invoice(
        invoice_id, data.inv_no, data.date, data.party, data.delivery,
        data.payment, data.subtotal, data.gst, data.total,
        data.gst_percent, items
    )
    return {"message": "Invoice updated successfully"}


@router.delete("/{invoice_id}")
def remove_invoice(invoice_id: int):
    delete_invoice(invoice_id)
    return {"message": "Invoice deleted successfully"}


@router.get("/{invoice_id}/pdf")
def download_pdf(invoice_id: int):
    invoice_data, items_data = get_invoice_details(invoice_id)
    if not invoice_data:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice_tuple = (
        invoice_data[0],  # inv_no
        invoice_data[1],  # date
        invoice_data[2],  # party
        invoice_data[3],  # delivery
        invoice_data[4],  # payment
        invoice_data[5],  # subtotal
        invoice_data[6],  # gst
        invoice_data[7],  # total
        invoice_data[8] if invoice_data[8] else 0,  # gst_percent
    )
    items_list = [
        {"item": i[0], "qty": i[1], "unit": i[2], "rate": i[3], "amount": i[4]}
        for i in items_data
    ]

    file_path = generate_invoice_pdf(invoice_tuple, items_list)

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"invoice_{invoice_data[0]}.pdf"
    )
