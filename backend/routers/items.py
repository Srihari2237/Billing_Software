from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import database as db

router = APIRouter()


class ItemBody(BaseModel):
    name: str
    unit: str = "NOS"
    rate: float = 0.0
    gst: float = 0.0


@router.get("/")
def get_items():
    return db.get_all_items()


@router.post("/")
def add_item(body: ItemBody):
    if not body.name.strip():
        raise HTTPException(400, "Item name is required")
    db.upsert_item(body.name, body.unit, body.rate, body.gst)
    return {"message": f"Item '{body.name}' saved"}


@router.put("/{name}")
def update_item(name: str, body: ItemBody):
    db.upsert_item(body.name, body.unit, body.rate, body.gst)
    return {"message": "Updated"}


@router.delete("/{name}")
def remove_item(name: str):
    db.delete_item(name)
    return {"message": f"Item '{name}' deleted"}
