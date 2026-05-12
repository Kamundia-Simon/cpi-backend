from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import PointsDb, SurveyResponse, PointsResponse, SurveyMeta
from helpers import PM_NAMES, SUPPLIER_NAMES, correct_excel_datetime
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])

FULCRUM_ID = 23

def fulcrum_spend_expr():
    return func.IF(
        PointsDb.supplier == FULCRUM_ID,
        (PointsDb.cpi / 100.0 + 0.17) * 1.05,
        PointsDb.cpi / 100.0
    )


@router.get("", response_model=list[SurveyResponse])
def get_surveys(
    month_start: Optional[str] = Query(default=None),
    month_end: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(
        PointsDb.project.label("surveyName"),
        PointsDb.pm.label("pmId"),
        func.sum(fulcrum_spend_expr()).label("totalPaid"),
        func.count().label("totalCompletes"),
        func.min(PointsDb.stime).label("startDate"),
        func.max(SurveyMeta.client).label("client"),
        func.max(SurveyMeta.description).label("askia_description"),
        func.max(PointsDb.surveytype).label("surveytype"),
        func.max(PointsDb.target).label("target"),
        func.max(SurveyMeta.last_ir).label("ir"),
        func.GROUP_CONCAT(func.DISTINCT(PointsDb.supplier)).label("supplier_ids"),
    ).outerjoin(
        SurveyMeta, PointsDb.surveyid == SurveyMeta.surveyid
    ).filter(PointsDb.status == 1)

    if month_start:
        adjusted_start = datetime.fromisoformat(month_start) + timedelta(days=2)
        query = query.filter(PointsDb.stime >= adjusted_start)
    if month_end:
        adjusted_end = datetime.fromisoformat(month_end) + timedelta(days=2)
        query = query.filter(PointsDb.stime < adjusted_end)

    results = query.group_by(PointsDb.project, PointsDb.pm).all()
    
    surveys = []
    for r in results:
        supplier_ids = [int(s) for s in (r.supplier_ids or "").split(",") if s]
        supplier_names = [SUPPLIER_NAMES.get(sid, f"Supplier {sid}") for sid in supplier_ids]
        surveys.append(SurveyResponse(
            surveyName=r.surveyName,
            pm=PM_NAMES.get(r.pmId, f"Unknown PM {r.pmId}"),
            totalPaid=round(r.totalPaid or 0, 2),
            totalCompletes=r.totalCompletes,
            startDate=correct_excel_datetime(r.startDate).strftime("%d %b %Y %H:%M"),
            client=r.client,
            askia_description=r.askia_description,
            surveytype=r.surveytype,
            target=r.target,
            ir=r.ir,
            suppliers=supplier_names
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
        .filter(PointsDb.project == surveyName, PointsDb.status == 1)

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