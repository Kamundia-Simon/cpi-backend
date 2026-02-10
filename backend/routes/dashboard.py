from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import PointsDb, PMSummaryResponse

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

@router.get("/summary", response_model=PMSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_amount = db.query(func.sum(PointsDb.cpi)).scalar()
    total_projects = db.query(
        func.count(func.distinct(PointsDb.project))
    ).scalar()

    total_amount = (total_amount or 0) / 100.0
    total_projects = total_projects or 0

    if total_projects == 0:
        avg_per_project = 0.0
    else:
        avg_per_project = total_amount / total_projects

    return PMSummaryResponse(
        totalAmount=total_amount,
        avgPerProject=avg_per_project,
        totalProjects=total_projects,
    )