from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import PointsDb, ReconcileResponse, ReconcilePayload, ReconcileHistory, ReconcileHistoryResponse
from datetime import datetime

router = APIRouter()

@router.post("/api/surveys/{surveyName}/reconcile", response_model=ReconcileResponse)
def reconcile_survey(
    surveyName: str,
    payload: ReconcilePayload,
    db: Session = Depends(get_db),
):
    if not payload.pids:
        raise HTTPException(status_code=400, detail="No PIDs provided")

    all_points = db.query(PointsDb).filter(PointsDb.project == surveyName).all()

    if not all_points:
        raise HTTPException(status_code=404, detail="Survey not found")
    

    db_pids = {p.pid for p in all_points}
    usable_set = set(payload.pids)
    pids_not_found = list(usable_set - db_pids)
    
    try:
        db.query(PointsDb).filter(
            PointsDb.project == surveyName
        ).update({"status": 2}, synchronize_session=False)

        db.query(PointsDb).filter(
            PointsDb.project == surveyName,
            PointsDb.pid.in_(usable_set)
        ).update({"status": 1}, synchronize_session=False)

        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Reconciliation failed")
    
    total_usable = db.query(PointsDb).filter(
        PointsDb.project == surveyName,
        PointsDb.status == 1
    ).count()
    
    total_marked_unusable = len(all_points) - total_usable

    history_entry = ReconcileHistory(
        surveyid=surveyName, 
        reconciled_at=datetime.utcnow(),
        total_ids=len(all_points),
        usable=total_usable,
        unusable=total_marked_unusable,
        not_found=len(pids_not_found),
    )
    db.add(history_entry)
    db.commit()

    return ReconcileResponse(
        project=surveyName,
        total_in_db=len(all_points),
        total_usable=total_usable,
        total_marked_unusable=total_marked_unusable,
        pids_not_found=pids_not_found,
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