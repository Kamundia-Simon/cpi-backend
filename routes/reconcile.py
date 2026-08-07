import io
import os
import uuid
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from PIL import Image
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import PointsDb, ReconcileBatchResponse, ReconcileResponse, ReconcilePayload, ReconcileHistory, ReconcileHistoryResponse,PMReconcileResponse, PMReconcileSurveyResult
from helpers import SUPPLIER_NAMES, RECONCILABLE_SUPPLIERS
from dependencies import get_current_user
from datetime import datetime
from collections import defaultdict

load_dotenv()

router = APIRouter()
RECONCILABLE_SUPPLIER_IDS = set(RECONCILABLE_SUPPLIERS)


def _pm_email_map() -> dict[str, int]:
    out: dict[str, int] = {}
    for part in os.getenv("PM_EMAILS", "").split(","):
        part = part.strip()
        if ":" not in part:
            continue
        email, pm = part.rsplit(":", 1)
        try:
            out[email.strip().lower()] = int(pm.strip())
        except ValueError:
            continue
    return out


def _reconcile_admin_emails() -> set[str]:
    raw = os.getenv("RECONCILE_ADMIN_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def _present_reconcilable(db: Session, base_filters: list) -> list[int]:
    return sorted(
        r[0] for r in db.query(PointsDb.supplier)
        .filter(*base_filters, PointsDb.supplier.in_(RECONCILABLE_SUPPLIER_IDS))
        .distinct()
        .all()
    )


def _resolve_supplier(db: Session, base_filters: list, requested: int | None) -> int:
    present = _present_reconcilable(db, base_filters)
    if requested is not None:
        if requested not in RECONCILABLE_SUPPLIER_IDS:
            raise HTTPException(status_code=400, detail="Unsupported supplier for reconciliation")
        if requested not in present:
            raise HTTPException(
                status_code=404,
                detail=f"No {SUPPLIER_NAMES.get(requested, requested)} rows found",
            )
        return requested
    if not present:
        raise HTTPException(status_code=404, detail="No reconcilable rows found")
    if len(present) > 1:
        names = ", ".join(SUPPLIER_NAMES.get(s, str(s)) for s in present)
        raise HTTPException(
            status_code=400,
            detail=f"This has both {names} — specify which supplier you are reconciling",
        )
    return present[0]

@router.post("/api/surveys/{surveyName}/reconcile", response_model=ReconcileResponse)
def reconcile_survey(
    surveyName: str,
    payload: ReconcilePayload,
    db: Session = Depends(get_db),
):
    if not payload.pids:
        raise HTTPException(status_code=400, detail="No PIDs provided")

    supplier_id = _resolve_supplier(db, [PointsDb.project == surveyName], payload.supplier_id)

    # Only this supplier's rows for this survey
    all_cint = db.query(PointsDb).filter(
        PointsDb.project == surveyName,
        PointsDb.supplier == supplier_id,
    ).all()

    usable_set = set(payload.pids)           # uploaded list = valid PIDs for this supplier
    cint_pids_in_db = {p.pid for p in all_cint}
    active_cint_pids = {p.pid for p in all_cint if p.status == 1}
    excluded_cint_pids = {p.pid for p in all_cint if p.status == 2}

    to_invalidate = active_cint_pids - usable_set          # active PIDs missing from valid list
    to_restore = excluded_cint_pids & usable_set           # previously excluded but now confirmed valid
    pids_not_in_db = list(usable_set - cint_pids_in_db)   # valid PIDs not in our DB

    try:
        if to_invalidate:
            db.query(PointsDb).filter(
                PointsDb.project == surveyName,
                PointsDb.supplier == supplier_id,
                PointsDb.pid.in_(to_invalidate),
                PointsDb.status == 1,
            ).update({"status": 2}, synchronize_session=False)
        if to_restore:
            db.query(PointsDb).filter(
                PointsDb.project == surveyName,
                PointsDb.supplier == supplier_id,
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
        supplier=supplier_id,
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
        supplier=supplier_id,
    )


@router.get("/api/reconcile/permission")
def get_reconcile_permission(
    pm_id: int | None = None,
    survey: str | None = None,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Whether the signed-in user owns the PM/survey being viewed.

    UX gate only — the reconcile endpoints themselves are not restricted.
    """
    email = (user.get("email") or "").lower()
    if email in _reconcile_admin_emails():
        return {"can_reconcile": True, "reason": "admin"}

    owned_pm = _pm_email_map().get(email)
    if owned_pm is None:
        return {"can_reconcile": False, "reason": "unmapped"}

    target_pm = pm_id
    if target_pm is None and survey:
        row = db.query(PointsDb.pm).filter(PointsDb.project == survey).first()
        if not row:
            return {"can_reconcile": False, "reason": "unknown_survey"}
        target_pm = row[0]

    if target_pm is None:
        return {"can_reconcile": False, "reason": "no_target"}
    if owned_pm == target_pm:
        return {"can_reconcile": True, "reason": "owner"}
    return {"can_reconcile": False, "reason": "not_owner"}


@router.get("/api/surveys/{surveyName}/reconcile/suppliers")
def get_survey_reconcile_suppliers(surveyName: str, db: Session = Depends(get_db)):
    return [
        {"id": sid, "label": SUPPLIER_NAMES.get(sid, str(sid)), "panel": RECONCILABLE_SUPPLIERS[sid]}
        for sid in _present_reconcilable(db, [PointsDb.project == surveyName])
    ]


@router.get("/api/pms/{pmId}/reconcile/suppliers")
def get_pm_reconcile_suppliers(pmId: int, db: Session = Depends(get_db)):
    return [
        {"id": sid, "label": SUPPLIER_NAMES.get(sid, str(sid)), "panel": RECONCILABLE_SUPPLIERS[sid]}
        for sid in _present_reconcilable(db, [PointsDb.pm == pmId])
    ]


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
            supplier=e.supplier,
        )
        for e in entries
    ]
    
@router.post("/api/pms/{pmId}/reconcile", response_model=PMReconcileResponse)
def reconcile_pm(pmId: int, payload: ReconcilePayload, db: Session = Depends(get_db)):
    if not payload.pids:
        raise HTTPException(status_code=400, detail="No PIDs provided")

    supplier_id = _resolve_supplier(db, [PointsDb.pm == pmId], payload.supplier_id)

    usable_set = set(payload.pids)   # uploaded list = valid PIDs for this supplier

    # All rows for this PM from the supplier being reconciled
    all_cint = (
        db.query(PointsDb.pid, PointsDb.project, PointsDb.status)
        .filter(PointsDb.pm == pmId, PointsDb.supplier == supplier_id)
        .all()
    )

    # Identify which surveys this file covers — only surveys with at least one PID in the uploaded list
    covered_surveys = {r.project for r in all_cint if r.pid in usable_set}
    if not covered_surveys:
        raise HTTPException(status_code=404, detail="No matching PIDs found for this PM")

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
                PointsDb.supplier == supplier_id,
                PointsDb.project.in_(covered_surveys),
                PointsDb.pid.in_(to_invalidate),
                PointsDb.status == 1,
            ).update({"status": 2}, synchronize_session=False)
        if to_restore:
            db.query(PointsDb).filter(
                PointsDb.pm == pmId,
                PointsDb.supplier == supplier_id,
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
            supplier=supplier_id,
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
                supplier=e.supplier,
            )
        batches[e.batch_id].surveys.append(e.surveyid)
    return list(batches.values())