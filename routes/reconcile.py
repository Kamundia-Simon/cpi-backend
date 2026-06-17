from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import PointsDb, ReconcileResponse, ReconcilePayload, ReconcileHistory, ReconcileHistoryResponse,PMReconcileResponse, PMReconcileSurveyResult
from datetime import datetime
from collections import defaultdict

router = APIRouter()

CINT_SUPPLIER_ID = 23

@router.post("/api/surveys/{surveyName}/reconcile", response_model=ReconcileResponse)
def reconcile_survey(
    surveyName: str,
    payload: ReconcilePayload,
    db: Session = Depends(get_db),
):
    if not payload.pids:
        raise HTTPException(status_code=400, detail="No PIDs provided")

    # Only Cint (supplier 23) rows for this survey
    all_cint = db.query(PointsDb).filter(
        PointsDb.project == surveyName,
        PointsDb.supplier == CINT_SUPPLIER_ID,
    ).all()

    if not all_cint:
        raise HTTPException(status_code=404, detail="No Cint rows found for this survey")

    usable_set = set(payload.pids)           # uploaded list = valid Cint PIDs
    cint_pids_in_db = {p.pid for p in all_cint}
    active_cint_pids = {p.pid for p in all_cint if p.status == 1}
    excluded_cint_pids = {p.pid for p in all_cint if p.status == 2}

    to_invalidate = active_cint_pids - usable_set          # active Cint PIDs missing from valid list
    to_restore = excluded_cint_pids & usable_set           # previously excluded but now confirmed valid
    pids_not_in_db = list(usable_set - cint_pids_in_db)   # valid PIDs not in our DB

    try:
        if to_invalidate:
            db.query(PointsDb).filter(
                PointsDb.project == surveyName,
                PointsDb.supplier == CINT_SUPPLIER_ID,
                PointsDb.pid.in_(to_invalidate),
                PointsDb.status == 1,
            ).update({"status": 2}, synchronize_session=False)
        if to_restore:
            db.query(PointsDb).filter(
                PointsDb.project == surveyName,
                PointsDb.supplier == CINT_SUPPLIER_ID,
                PointsDb.pid.in_(to_restore),
                PointsDb.status == 2,
            ).update({"status": 1}, synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Reconciliation failed")

    total_usable = db.query(func.count(PointsDb.id)).filter(
        PointsDb.project == surveyName, PointsDb.status == 1,
    ).scalar() or 0
    total_unusable = db.query(func.count(PointsDb.id)).filter(
        PointsDb.project == surveyName, PointsDb.status == 2,
    ).scalar() or 0

    db.add(ReconcileHistory(
        surveyid=surveyName,
        reconciled_at=datetime.utcnow(),
        total_ids=len(all_cint),
        usable=total_usable,
        unusable=total_unusable,
        not_found=len(pids_not_in_db),
    ))
    db.commit()

    return ReconcileResponse(
        project=surveyName,
        total_in_db=len(all_cint),
        total_usable=total_usable,
        total_marked_unusable=len(to_invalidate),
        total_restored=len(to_restore),
        pids_not_found=pids_not_in_db,
    )
    
@router.get("/api/surveys/{surveyName}/reconcile/history", response_model=list[ReconcileHistoryResponse])
def get_reconcile_history(surveyName: str, db: Session = Depends(get_db)):
    entries = (
        db.query(ReconcileHistory)
        .filter(ReconcileHistory.surveyid == surveyName)
        .order_by(ReconcileHistory.reconciled_at.desc())
        .all()
    )
    return [
        ReconcileHistoryResponse(
            id=e.id,
            surveyid=e.surveyid,
            reconciled_at=e.reconciled_at.isoformat(),
            total_ids=e.total_ids,
            usable=e.usable,
            unusable=e.unusable,
            not_found=e.not_found,
        )
        for e in entries
    ]
    
@router.post("/api/pms/{pmId}/reconcile", response_model=PMReconcileResponse)
def reconcile_pm(pmId: int, payload: ReconcilePayload, db: Session = Depends(get_db)):
    if not payload.pids:
        raise HTTPException(status_code=400, detail="No PIDs provided")

    usable_set = set(payload.pids)   # uploaded list = valid Cint PIDs

    # All Cint (supplier 23) rows for this PM
    all_cint = (
        db.query(PointsDb.pid, PointsDb.project, PointsDb.status)
        .filter(PointsDb.pm == pmId, PointsDb.supplier == CINT_SUPPLIER_ID)
        .all()
    )

    if not all_cint:
        raise HTTPException(status_code=404, detail="No Cint rows found for this PM")

    # Identify which surveys this file covers — only surveys with at least one PID in the uploaded list
    covered_surveys = {r.project for r in all_cint if r.pid in usable_set}
    if not covered_surveys:
        raise HTTPException(status_code=404, detail="No matching Cint PIDs found for this PM")

    # Restrict all operations to only those covered surveys
    relevant_cint = [r for r in all_cint if r.project in covered_surveys]
    cint_pids_in_db = {r.pid for r in relevant_cint}
    active_cint_pids = {r.pid for r in relevant_cint if r.status == 1}
    excluded_cint_pids = {r.pid for r in relevant_cint if r.status == 2}

    to_invalidate = active_cint_pids - usable_set          # active Cint PIDs missing from valid list
    to_restore = excluded_cint_pids & usable_set           # previously excluded but now confirmed valid
    already_excluded = len(excluded_cint_pids - usable_set)
    pids_not_in_db = list(usable_set - cint_pids_in_db)   # valid PIDs not in our DB

    # Group to_invalidate by project
    by_project: dict[str, list[str]] = defaultdict(list)
    for r in relevant_cint:
        if r.pid in to_invalidate:
            by_project[r.project].append(r.pid)

    try:
        if to_invalidate:
            db.query(PointsDb).filter(
                PointsDb.pm == pmId,
                PointsDb.supplier == CINT_SUPPLIER_ID,
                PointsDb.project.in_(covered_surveys),
                PointsDb.pid.in_(to_invalidate),
                PointsDb.status == 1,
            ).update({"status": 2}, synchronize_session=False)
        if to_restore:
            db.query(PointsDb).filter(
                PointsDb.pm == pmId,
                PointsDb.supplier == CINT_SUPPLIER_ID,
                PointsDb.project.in_(covered_surveys),
                PointsDb.pid.in_(to_restore),
                PointsDb.status == 2,
            ).update({"status": 1}, synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Reconciliation failed")

    now = datetime.utcnow()
    results = []
    for project_name, pids_in_project in by_project.items():
        total_in_db = db.query(func.count(PointsDb.id)).filter(PointsDb.project == project_name).scalar() or 0
        total_usable = db.query(func.count(PointsDb.id)).filter(PointsDb.project == project_name, PointsDb.status == 1).scalar() or 0
        total_unusable = db.query(func.count(PointsDb.id)).filter(PointsDb.project == project_name, PointsDb.status == 2).scalar() or 0
        db.add(ReconcileHistory(
            surveyid=project_name,
            reconciled_at=now,
            total_ids=total_in_db,
            usable=total_usable,
            unusable=total_unusable,
            not_found=len(pids_not_in_db),
        ))
        results.append(PMReconcileSurveyResult(survey=project_name, excluded=len(pids_in_project)))

    db.commit()

    return PMReconcileResponse(
        surveys_affected=results,
        total_excluded=len(to_invalidate),
        total_restored=len(to_restore),
        already_excluded=already_excluded,
        pids_not_found=pids_not_in_db,
    )