from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

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
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_amount = (
        db.query(func.sum(fulcrum_spend_expr()))
        .filter(PointsDb.status == 1)
        .scalar()
    )
    total_projects = (
        db.query(func.count(func.distinct(PointsDb.project)))
        .filter(PointsDb.status == 1)
        .scalar()
    )

    total_amount = float(total_amount or 0)
    total_projects = total_projects or 0
    avg_per_project = total_amount / total_projects if total_projects > 0 else 0.0

    return PMSummaryResponse(
        totalAmount=total_amount,
        avgPerProject=avg_per_project,
        totalProjects=total_projects,
    )