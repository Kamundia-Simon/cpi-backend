from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import PointsDb, SurveyResponse, PointsResponse
from helpers import PM_NAMES, SUPPLIER_NAMES, correct_excel_datetime

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])

@router.get("", response_model=list[SurveyResponse])
def get_surveys(db: Session = Depends(get_db)):
    # Query to get survey details along with PM name and total paid
    results = (
        db.query(
            PointsDb.project.label("surveyName"),
            PointsDb.pm.label("pmId"),
            (func.sum(PointsDb.cpi)/100.0).label("totalPaid"),
            func.count().label("totalCompletes"),
            func.min(PointsDb.stime).label("startDate")
        )
        .group_by(PointsDb.project, PointsDb.pm)
        .all()
    )
    
    surveys = []
    for result in results:
        surveys.append(SurveyResponse(
            surveyName=result.surveyName,
            pm=PM_NAMES.get(result.pmId, f"Unknown PM {result.pmId}"),
            totalPaid=result.totalPaid,
            totalCompletes=result.totalCompletes,
            startDate=correct_excel_datetime(result.startDate).strftime("%d %b %Y %H:%M")
        ))
    return surveys

@router.get("/{surveyName}/points", response_model=list[PointsResponse])
def get_survey_points(surveyName: str, db: Session = Depends(get_db)):
    results = (
        db.query(
            PointsDb.id,
            PointsDb.pid,
            PointsDb.cpi,
            PointsDb.supplier,
            PointsDb.stime,
        )
        .filter(PointsDb.project == surveyName)
        .all()
    )
    return [
        PointsResponse(
            id=r.id,
            pid=r.pid,
            cpi=r.cpi,
            supplier=SUPPLIER_NAMES.get(r.supplier, f"Unknown Supplier {r.supplier}"),
            stime=r.stime,
            suppname=None,
        )
        for r in results
    ]