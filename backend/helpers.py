from datetime import datetime, timedelta

def excel_date_to_str(excel_date: float) -> str:
    dt = datetime(1899, 12, 30) + timedelta(days=excel_date)
    return dt.strftime("%d %b %Y %H:%M")

def serialize_datetime_to_iso(v):
    """Convert datetime object to ISO8601 string for API responses."""
    if isinstance(v, datetime):
        return v.isoformat()
    return str(v)

PM_NAMES = {
    1: "Shah Ali",
    2: "Fatima Ally",
    3: "Rose Yang",
    4: "Demo PM 4",
}

SUPPLIER_NAMES = {
    16: "Cint",
    25: "PureSpectrum",
    23: "Fulcrum",
    15: "Nebu",
    13: "Dynata",
    30: "Toluna",
    17: "DataSpring",
    24: "Borderless",
}