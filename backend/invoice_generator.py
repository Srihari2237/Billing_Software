from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from num2words import num2words
import os


def get_billing_year(date_str: str) -> str:
    d = datetime.strptime(date_str, "%d-%m-%Y")
    year = d.year
    if d.month >= 4:
        return f"{year}-{str(year + 1)[-2:]}"
    else:
        return f"{year - 1}-{str(year)[-2:]}"


def generate_invoice_pdf(invoice: tuple, items: list) -> str:
    inv_no = invoice[0]
    date = invoice[1]
    party = invoice[2]
    subtotal = float(invoice[5])
    gst = float(invoice[6])
    total = float(invoice[7])
    gst_percent = float(invoice[8]) if invoice[8] else 0

    output_dir = os.path.join(os.path.dirname(__file__), "generated_pdfs")
    os.makedirs(output_dir, exist_ok=True)
    file = os.path.join(output_dir, f"invoice_{inv_no}.pdf")

    c = canvas.Canvas(file, pagesize=A4)
    width, height = A4

    base_dir = os.path.dirname(__file__)
    img_path = os.path.join(base_dir, "invoice_template.png")

    if os.path.exists(img_path):
        bg = ImageReader(img_path)
        c.drawImage(bg, 0, 0, width=width, height=height)

    c.setFont("Helvetica", 10)
    c.drawString(50, 700, str(party))

    billing_year = get_billing_year(date)
    formatted_inv = f"{str(inv_no).zfill(3)} / {billing_year}"
    c.drawString(390, 709, formatted_inv)
    c.drawString(390, 685, str(date))

    y = 550
    for i, item in enumerate(items, start=1):
        c.setFont("Helvetica", 10)
        c.drawString(50, y, str(i))
        c.drawString(90, y, str(item["item"]))
        c.drawRightString(360, y, str(item["qty"]))
        c.drawRightString(450, y, str(item["rate"]))
        c.drawRightString(550, y, str(item["amount"]))
        y -= 22

    base_y = 265
    half_gst = gst_percent / 2
    cgst = gst / 2
    sgst = gst / 2

    c.setFont("Helvetica", 10)
    c.drawRightString(550, base_y, f"{subtotal:.2f}")
    c.drawString(420, base_y - 29, f"{half_gst:.1f}%")
    c.drawRightString(550, base_y - 29, f"{cgst:.2f}")
    c.drawString(420, base_y - 49, f"{half_gst:.1f}%")
    c.drawRightString(550, base_y - 49, f"{sgst:.2f}")

    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(550, base_y - 68, f"{total:.2f}")

    round_off = round(total) - total
    c.setFont("Helvetica", 10)
    c.drawRightString(550, base_y - 87, f"{round_off:.2f}")

    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(550, base_y - 113, f"{round(total):.2f}")

    nett_value = round(total)
    amount_words = num2words(nett_value, lang="en_IN").title()
    amount_words = "Rupees " + amount_words + " Only"
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, base_y - 170, amount_words)

    c.save()
    return file
