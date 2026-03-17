from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import func
from models import PMSummaryResponse, PMResponse, SurveyResponse, PointsDb
from helpers import PM_NAMES, correct_excel_datetime
router = APIRouter(prefix="/api/pms", tags=["PMs"])

@router.get("/{pmId}/surveys", response_model=list[SurveyResponse])
def get_pm_surveys(
    pmId: int,
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            PointsDb.project.label("surveyName"),
            PointsDb.pm.label("pmId"),
            (func.sum(PointsDb.cpi) / 100.0).label("totalPaid"),
            func.count().label("totalCompletes"),
            func.min(PointsDb.stime).label("startDate"),
        )
        .filter(PointsDb.pm == pmId)
        .group_by(PointsDb.project, PointsDb.pm)
        .all()
    )

    surveys = []

    for row in results:
        surveys.append(
            SurveyResponse(
                surveyName=row.surveyName,
                pm=PM_NAMES.get(row.pmId, f"Unknown PM {row.pmId}"),
                totalPaid=float(row.totalPaid),
                totalCompletes=row.totalCompletes,
                startDate=correct_excel_datetime(row.startDate).strftime("%d %b %Y %H:%M"),
            )
        )

    return surveys

@router.get("/{pmId}/summary", response_model=PMSummaryResponse)
def get_pm_summary(
    pmId: int,
    db: Session = Depends(get_db)
):
    total_amount = (
        db.query(func.sum(PointsDb.cpi))
        .filter(PointsDb.pm == pmId)
        .scalar()
    )

    total_projects = (
        db.query(func.count(func.distinct(PointsDb.project)))
        .filter(PointsDb.pm == pmId)
        .scalar()
    )

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

@router.get("", response_model=list[PMResponse])
def get_pms():
    return [
        PMResponse(id=k, name=v)
        for k, v in PM_NAMES.items()
    ]