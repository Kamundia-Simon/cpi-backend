from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from collections import defaultdict

from database import get_db
from models import PointsDb, SupplierSpendRow
from helpers import SUPPLIER_NAMES, correct_excel_datetime

FULCRUM_ID = 23
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/supplier-spend", response_model=list[SupplierSpendRow])
def get_supplier_spend(
    pm_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(
        PointsDb.supplier,
        PointsDb.stime,
        PointsDb.cpi,
    ).filter(PointsDb.status == 1) 

    if pm_id is not None:
        query = query.filter(PointsDb.pm == pm_id)

    results = query.all()
    
    buckets: dict[tuple, dict] = defaultdict(lambda: {"spend": 0.0, "completes": 0})

    for row in results:
        dt = correct_excel_datetime(row.stime)
        sort_key = dt.strftime("%Y-%m") 
        month_label = dt.strftime("%b %Y") 
        supplier_name = SUPPLIER_NAMES.get(row.supplier, f"Supplier {row.supplier}")

        if row.supplier == FULCRUM_ID:
            spend = (row.cpi / 100 + 0.17) * 1.05
        else:
            spend = row.cpi / 100

        key = (sort_key, month_label, supplier_name)
        buckets[key]["spend"] += spend
        buckets[key]["completes"] += 1

    return [
        SupplierSpendRow(
            month=month_label,
            supplier=supplier_name,
            spend=round(bucket["spend"], 2),
            completes=bucket["completes"],
        )
        for (sort_key, month_label, supplier_name), bucket in sorted(
            buckets.items(), key=lambda x: x[0][0]
        )
    ]
