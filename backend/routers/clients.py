from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import database as db

router = APIRouter()


class ClientBody(BaseModel):
    name: str
    payment_terms: str = "CASH"
    address: str = ""
    gstin: str = ""


@router.get("/")
def get_clients():
    return db.get_all_clients()


@router.post("/")
def add_client(body: ClientBody):
    if not body.name.strip():
        raise HTTPException(400, "Party name is required")
    db.upsert_client(body.name, body.payment_terms, body.address, body.gstin)
    return {"message": f"Client '{body.name}' saved"}


@router.put("/{name}")
def update_client(name: str, body: ClientBody):
    db.upsert_client(body.name, body.payment_terms, body.address, body.gstin)
    return {"message": "Updated"}


@router.delete("/{name}")
def remove_client(name: str):
    db.delete_client(name)
    return {"message": f"Client '{name}' deleted"}
