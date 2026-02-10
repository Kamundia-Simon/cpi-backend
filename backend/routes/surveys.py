from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import PointsDb, PmNames, SupplierNames, SurveyResponse, PointsResponse

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])

@router.get("", response_model=list[SurveyResponse])
def get_surveys(db: Session = Depends(get_db)):
    # Query to get survey details along with PM name and total paid
    results = (
        db.query(
            PointsDb.project.label("surveyName"),
            PmNames.pm_name.label("pm"),
            (func.sum(PointsDb.cpi)/100.0).label("totalPaid"),
            func.count().label("totalCompletes"),
            func.min(PointsDb.stime).label("startDate")
        )
        .join(PmNames, PointsDb.pm == PmNames.id)
        .group_by(PointsDb.project, PmNames.pm_name)
        .all()
    )
    
    surveys = []
    for result in results:
        surveys.append(SurveyResponse(
            surveyName=result.surveyName,
            pm=result.pm,
            totalPaid=result.totalPaid,
            totalCompletes=result.totalCompletes,
            startDate=result.startDate.strftime("%d %b %Y %H:%M")
        ))
    return surveys

@router.get("/{surveyName}/points", response_model=list[PointsResponse])
def get_survey_points(surveyName: str, db: Session = Depends(get_db)):
    results = (
        db.query(
            PointsDb.id,
            PointsDb.pid,
            PointsDb.cpi,
            SupplierNames.supplier_name.label("supplier"),
            PointsDb.stime,
        )
        .join(SupplierNames, PointsDb.supplier == SupplierNames.id)
        .filter(PointsDb.project == surveyName)
        .all()
    )
    return [
        PointsResponse(
            id=r.id,
            pid=r.pid,
            cpi=r.cpi,
            supplier=r.supplier,
            stime=r.stime,
        )
        for r in results
    ]