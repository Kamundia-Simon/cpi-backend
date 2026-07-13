from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import func, text, Integer
from models import PMSummaryResponse, PMResponse, SurveyResponse, PointsDb, SurveyMeta, ReconcileHistory
from helpers import PM_NAMES, correct_excel_datetime
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/pms", tags=["PMs"])

FULCRUM_ID = 23

def fulcrum_spend_expr():
    return func.IF(
        PointsDb.supplier == FULCRUM_ID,
        (PointsDb.cpi / 100.0 + 0.17) * 1.05,
        PointsDb.cpi / 100.0
    )
    
@router.get("/{pmId}/surveys", response_model=list[SurveyResponse])
def get_pm_surveys(
    pmId: int,
    month_start: Optional[str] = Query(default=None),
    month_end: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(
            PointsDb.project.label("surveyName"),
            PointsDb.pm.label("pmId"),
            func.sum(fulcrum_spend_expr()).label("totalPaid"),
            func.count().label("totalCompletes"),
            func.min(PointsDb.stime).label("startDate"),
            func.max(SurveyMeta.client).label("client"),
            func.max(SurveyMeta.description).label("askia_description"),
            func.coalesce(
                func.cast(
                    text("SUBSTRING_INDEX(GROUP_CONCAT(points.target ORDER BY points.stime DESC), ',', 1)"),
                    Integer,
                ),
                2000,
            ).label("target"),
            func.GROUP_CONCAT(func.DISTINCT(PointsDb.supplier)).label("supplier_ids"),
        )
        .outerjoin(SurveyMeta, PointsDb.surveyid == SurveyMeta.surveyid)
        .filter(PointsDb.pm == pmId, PointsDb.status == 1)
    )
    
    if month_start:
        adjusted_start = datetime.fromisoformat(month_start) + timedelta(days=2)
        query = query.filter(PointsDb.stime >= adjusted_start)
    if month_end:
        adjusted_end = datetime.fromisoformat(month_end) + timedelta(days=2)
        query = query.filter(PointsDb.stime < adjusted_end)

    results = query.group_by(PointsDb.project, PointsDb.pm).all()
    reconcile_map: dict[str, str | None] = {}
    for rh in db.query(
        ReconcileHistory.surveyid,
        func.max(ReconcileHistory.reconciled_at).label("latest"),
    ).group_by(ReconcileHistory.surveyid).all():
        reconcile_map[rh.surveyid] = rh.latest.isoformat() if rh.latest else None

    surveys = []

    for row in results:
        supplier_ids = [int(s) for s in (row.supplier_ids or "").split(",") if s]
        has_pl1 = FULCRUM_ID in supplier_ids
        reconciled_at = reconcile_map.get(row.surveyName)
        surveys.append(
            SurveyResponse(
                surveyName=row.surveyName,
                pm=PM_NAMES.get(row.pmId, f"Unknown PM {row.pmId}"),
                totalPaid=float(row.totalPaid or 0),
                totalCompletes=row.totalCompletes,
                startDate=correct_excel_datetime(row.startDate).strftime("%d %b %Y %H:%M"),
                client=row.client,
                askia_description=row.askia_description,
                target=row.target,
                last_reconciled=reconciled_at if reconciled_at else (None if has_pl1 else "auto"),
            )
        )

    return surveys

@router.get("/{pmId}/summary", response_model=PMSummaryResponse)
def get_pm_summary(pmId: int, db: Session = Depends(get_db)):
    total_amount = (
        db.query(func.sum(fulcrum_spend_expr()))
        .filter(PointsDb.pm == pmId, PointsDb.status == 1)
        .scalar()
    )

    total_projects = (
        db.query(func.count(func.distinct(PointsDb.project)))
        .filter(PointsDb.pm == pmId, PointsDb.status == 1)
        .scalar()
    )

    total_amount = float(total_amount or 0)
    total_projects = total_projects or 0
    avg_per_project = total_amount / total_projects if total_projects > 0 else 0.0


    return PMSummaryResponse(
        totalAmount=total_amount,
        avgPerProject=total_amount / total_projects if total_projects > 0 else 0.0,
        totalProjects=total_projects,
    )

@router.get("", response_model=list[PMResponse])
def get_pms():
    return [
        PMResponse(id=k, name=v)
        for k, v in PM_NAMES.items()
    ]