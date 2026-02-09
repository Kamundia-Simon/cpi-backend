from datetime import datetime, timedelta

def excel_date_to_str(excel_date: float) -> str:
    dt = datetime(1899, 12, 30) + timedelta(days=excel_date)
    return dt.strftime("%d %b %Y %H:%M")

def serialize_datetime_to_iso(v):
    """Convert datetime object to ISO8601 string for API responses."""
    if isinstance(v, datetime):
        return v.isoformat()
    return str(v)