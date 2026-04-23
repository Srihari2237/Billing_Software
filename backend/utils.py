from datetime import datetime


def get_billing_year(date: str = None) -> str:
    if not date:
        d = datetime.now()
    else:
        d = datetime.strptime(date, "%d-%m-%Y")
    year = d.year
    if d.month >= 4:
        return f"{year}-{str(year + 1)[-2:]}"
    else:
        return f"{year - 1}-{str(year)[-2:]}"
