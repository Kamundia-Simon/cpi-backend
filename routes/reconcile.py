import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from PIL import Image
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import PointsDb, ReconcileBatchResponse, ReconcileResponse, ReconcilePayload, ReconcileHistory, ReconcileHistoryResponse,PMReconcileResponse, PMReconcileSurveyResult
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
    
    batch_id = str(uuid.uuid4())
    db.add(ReconcileHistory(
        surveyid=surveyName,
        reconciled_at=datetime.utcnow(),
        total_ids=len(all_cint),
        usable=total_usable,
        unusable=total_unusable,
        not_found=len(pids_not_in_db),
        batch_id=batch_id,
    ))
    db.commit()

    return ReconcileResponse(
        project=surveyName,
        total_in_db=len(all_cint),
        total_usable=total_usable,
        total_marked_unusable=len(to_invalidate),
        total_restored=len(to_restore),
        pids_not_found=pids_not_in_db,
        batch_id=batch_id,
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
            batch_id=e.batch_id,
            has_screenshot=e.screenshot is not None,
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
    batch_id = str(uuid.uuid4())
    results = []
    for project_name in covered_surveys:
        pids_in_project = by_project.get(project_name, [])
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
            batch_id=batch_id,
        ))
        results.append(PMReconcileSurveyResult(survey=project_name, excluded=len(pids_in_project)))

    db.commit()

    return PMReconcileResponse(
        surveys_affected=results,
        total_excluded=len(to_invalidate),
        total_restored=len(to_restore),
        already_excluded=already_excluded,
        pids_not_found=pids_not_in_db,
        batch_id=batch_id,
    )

MAX_SCREENSHOT_DIM = 1600

def _compress_screenshot(raw: bytes) -> bytes:
    img = Image.open(io.BytesIO(raw))
    img = img.convert("RGB")
    if img.width > MAX_SCREENSHOT_DIM:
        ratio = MAX_SCREENSHOT_DIM / img.width
        img = img.resize((MAX_SCREENSHOT_DIM, int(img.height * ratio)))
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=80)
    return out.getvalue()


@router.post("/api/reconcile/batches/{batchId}/screenshot")
def upload_batch_screenshot(batchId: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    rows = db.query(ReconcileHistory).filter(ReconcileHistory.batch_id == batchId).all()
    if not rows:
        raise HTTPException(status_code=404, detail="Reconciliation batch not found")

    raw = file.file.read()
    try:
        compressed = _compress_screenshot(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    for row in rows:
        row.screenshot = compressed
        row.screenshot_mime = "image/jpeg"
    db.commit()
    return {"batch_id": batchId, "surveys": [r.surveyid for r in rows]}


@router.get("/api/reconcile/batches/{batchId}/screenshot")
def get_batch_screenshot(batchId: str, db: Session = Depends(get_db)):
    row = (
        db.query(ReconcileHistory)
        .filter(ReconcileHistory.batch_id == batchId, ReconcileHistory.screenshot.isnot(None))
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="No screenshot for this batch")
    return Response(content=row.screenshot, media_type=row.screenshot_mime or "image/jpeg")


@router.get("/api/pms/{pmId}/reconcile/history", response_model=list[ReconcileBatchResponse])
def get_pm_reconcile_history(pmId: int, db: Session = Depends(get_db)):
    pm_surveys = {r.project for r in db.query(PointsDb.project).filter(PointsDb.pm == pmId).distinct()}
    entries = (
        db.query(ReconcileHistory)
        .filter(ReconcileHistory.surveyid.in_(pm_surveys), ReconcileHistory.batch_id.isnot(None))
        .order_by(ReconcileHistory.reconciled_at.desc())
        .all()
    )
    batches: dict[str, ReconcileBatchResponse] = {}
    for e in entries:
        if e.batch_id not in batches:
            batches[e.batch_id] = ReconcileBatchResponse(
                batch_id=e.batch_id,
                reconciled_at=e.reconciled_at.isoformat(),
                surveys=[],
                has_screenshot=e.screenshot is not None,
            )
        batches[e.batch_id].surveys.append(e.surveyid)
    return list(batches.values())