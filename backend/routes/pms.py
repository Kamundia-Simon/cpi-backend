from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import func
from models import PMSummaryResponse, PmNames, PMResponse, SurveyResponse, PointsDb

router = APIRouter(prefix="/api/pms", tags=["PMs"])

@router.get("/{pmId}/surveys", response_model=list[SurveyResponse])
def get_pm_surveys(
    pmId: int,
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            PointsDb.project.label("surveyName"),
            PmNames.pm_name.label("pm"),
            (func.sum(PointsDb.cpi) / 100.0).label("totalPaid"),
            func.count().label("totalCompletes"),
            func.min(PointsDb.stime).label("startDate"),
        )
        .join(PmNames, PointsDb.pm == PmNames.id)
        .filter(PointsDb.pm == pmId)
        .group_by(PointsDb.project, PmNames.pm_name)
        .all()
    )

    surveys = []

    for row in results:
        surveys.append(
            SurveyResponse(
                surveyName=row.surveyName,
                pm=row.pm,
                totalPaid=float(row.totalPaid),
                totalCompletes=row.totalCompletes,
                startDate=row.startDate.strftime("%d %b %Y %H:%M"),
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
def get_pms(db: Session = Depends(get_db)):
    pms = db.query(PmNames).all()
    return [PMResponse(id=pm.id, name=pm.pm_name) for pm in pms]
