from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
from models import PointsDb, PMSummaryResponse

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

FULCRUM_ID = 23
def fulcrum_spend_expr():
    return func.IF(
        PointsDb.supplier == FULCRUM_ID,
        (PointsDb.cpi / 100.0 + 0.17) * 1.05,
        PointsDb.cpi / 100.0
    )

@router.get("/summary", response_model=PMSummaryResponse)
def get_dashboard_summary(
    month_start: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(PointsDb).filter(PointsDb.status == 1)
    if month_start:
        adjusted = datetime.fromisoformat(month_start) + timedelta(days=2)
        q = q.filter(PointsDb.stime >= adjusted)

    total_amount = q.with_entities(func.sum(fulcrum_spend_expr())).scalar()
    total_projects = q.with_entities(func.count(func.distinct(PointsDb.project))).scalar()

    total_amount = float(total_amount or 0)
    total_projects = total_projects or 0

    return PMSummaryResponse(
        totalAmount=total_amount,
        avgPerProject=total_amount / total_projects if total_projects > 0 else 0.0,
        totalProjects=total_projects,
    )