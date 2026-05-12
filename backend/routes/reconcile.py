from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import PointsDb, ReconcileResponse, ReconcilePayload

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
    
    usable_set = set(payload.pids)

    db_pids = {p.pid for p in all_points}
    usable_set = set(usable_pids)
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

    return ReconcileResponse(
        project=surveyName,
        total_in_db=len(all_points),
        total_usable=total_usable,
        total_marked_unusable=len(all_points) - total_usable,
        pids_not_found=pids_not_found,
    )