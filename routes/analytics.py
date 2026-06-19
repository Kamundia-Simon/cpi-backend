from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case, literal_column
from datetime import datetime
from database import get_db
from models import PointsDb, SupplierSpendRow
from helpers import SUPPLIER_NAMES

FULCRUM_ID = 23
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/supplier-spend", response_model=list[SupplierSpendRow])
def get_supplier_spend(
    pm_id: Optional[int] = Query(default=None),
    month_start: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    spend_expr = case(
        (PointsDb.supplier == FULCRUM_ID, (PointsDb.cpi / 100.0 + 0.17) * 1.05),
        else_=PointsDb.cpi / 100.0,
    )
    month_expr = func.date_format(
        func.date_sub(PointsDb.stime, literal_column("INTERVAL 2 DAY")),
        "%Y-%m",
    )

    q = (
        db.query(
            month_expr.label("sort_key"),
            PointsDb.supplier,
            func.sum(spend_expr).label("spend"),
            func.count().label("completes"),
        )
        .filter(PointsDb.status == 1)
    )
    if pm_id is not None:
        q = q.filter(PointsDb.pm == pm_id)
    
    if month_start:
        from datetime import timedelta
        adjusted = datetime.fromisoformat(month_start) + timedelta(days=2)
        q = q.filter(PointsDb.stime >= adjusted)

    rows = q.group_by(month_expr, PointsDb.supplier).order_by(month_expr).all()

    from datetime import datetime as dt
    result = []
    for r in rows:
        try:
            label = dt.strptime(r.sort_key, "%Y-%m").strftime("%b %Y")
        except Exception:
            label = r.sort_key
        result.append(SupplierSpendRow(
            month=label,
            supplier=SUPPLIER_NAMES.get(r.supplier, f"Supplier {r.supplier}"),
            spend=round(float(r.spend or 0), 2),
            completes=r.completes,
        ))
    return result