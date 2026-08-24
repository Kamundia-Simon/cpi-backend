import logging
import threading
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text, Integer
from database import get_db, SessionLocal
from models import PointsDb, SurveyMeta
from services.quotas import fetch_all_surveys, fetch_finalstatus, calculate_ir, parse_client
from sqlalchemy.dialects.mysql import insert as mysql_insert

router = APIRouter(prefix="/api/meta", tags=["Meta"])
logger = logging.getLogger(__name__)

# The dashboard fires the sync on every mount and a full run takes ~1 minute of
# sequential Askia calls, so only allow one at a time instead of stacking runs.
_sync_lock = threading.Lock()
_last_sync_result: dict | None = None


def _run_meta_sync() -> dict:
    """Full meta sync.

    Opens its own session so it can run detached from the request that started
    it (see the `/sync` endpoint's background mode).
    """
    global _last_sync_result

    if not _sync_lock.acquire(blocking=False):
        return {"status": "skipped", "reason": "a sync is already running"}

    started_at = datetime.utcnow()
    db = SessionLocal()
    try:
        # Ordered most-recently-active first: if the run is cut short, the
        # surveys that get dropped are old/closed ones (already populated, or
        # no longer retrievable from Askia anyway) rather than live ones.
        survey_rows = (
            db.query(
                PointsDb.surveyid,
                func.max(PointsDb.project).label("project"),
                func.coalesce(
                    func.cast(
                        text("SUBSTRING_INDEX(GROUP_CONCAT(points.server ORDER BY points.stime DESC), ',', 1)"),
                        Integer,
                    ),
                    1,
                ).label("server"),
            )
            .filter(PointsDb.surveyid.isnot(None))
            .group_by(PointsDb.surveyid)
            .order_by(func.max(PointsDb.stime).desc())
            .all()
        )
        id_to_name: dict[int, str] = {row.surveyid: row.project for row in survey_rows}
        id_to_server: dict[int, int] = {row.surveyid: row.server for row in survey_rows}

        askia_by_name: dict[str, dict] = {}
        askia_error_parts: list[str] = []
        askia_count = 0
        for server_id in (1, 2):
            try:
                surveys_list = fetch_all_surveys(server=server_id)
                askia_count += len(surveys_list)
                for s in surveys_list:
                    name = (s.get("Name") or "").strip()
                    if name:
                        askia_by_name[name] = s
            except Exception as e:
                askia_error_parts.append(f"server {server_id}: {e}")
                logger.warning("meta sync: fetch_all_surveys(server=%s) failed: %s", server_id, e)
        askia_error = "; ".join(askia_error_parts) or None

        debug_per_survey = []
        skipped_unlisted = 0
        for numeric_id, project_name in id_to_name.items():
            askia_info = askia_by_name.get(project_name, {})
            matched_askia = bool(askia_info)
            askia_api_id = askia_info.get("Id")
            desc = askia_info.get("Description", "")

            survey_server = id_to_server.get(numeric_id, 1)
            fs = None
            ir_value = None
            fs_error = None
            # Askia only lists active surveys. A survey it doesn't list returns
            # nothing from the per-survey Quota lookup either, so skip the call.
            if matched_askia:
                try:
                    fs = fetch_finalstatus(numeric_id, server=survey_server)
                    if fs:
                        ir_value = calculate_ir(fs)
                except Exception as e:
                    fs_error = str(e)
                    logger.warning(
                        "meta sync: finalstatus failed for %s (surveyid=%s, server=%s): %s",
                        project_name, numeric_id, survey_server, e,
                    )
            else:
                skipped_unlisted += 1

            stmt = mysql_insert(SurveyMeta).values(
                surveyid=numeric_id,
                description=desc or None,
                client=parse_client(desc) if desc else None,
                last_ir=ir_value,
                irtime=datetime.utcnow() if ir_value is not None else None,
            ).on_duplicate_key_update(
                description=func.coalesce(SurveyMeta.description, desc or None),
                client=func.coalesce(SurveyMeta.client, parse_client(desc) if desc else None),
                last_ir=ir_value if ir_value is not None else SurveyMeta.last_ir,
                irtime=datetime.utcnow() if ir_value is not None else SurveyMeta.irtime,
            )
            db.execute(stmt)
            db.commit()

            debug_per_survey.append({
                "project": project_name,
                "points_surveyid": numeric_id,
                "server": survey_server,
                "matched_askia_name": matched_askia,
                "askia_api_id": askia_api_id,
                "ids_match": numeric_id == askia_api_id if askia_api_id else None,
                "description": desc or None,
                "finalstatus_found": fs is not None,
                "ir": ir_value,
                "fs_error": fs_error,
            })

        result = {
            "status": "completed",
            "started_at": started_at.isoformat(),
            "finished_at": datetime.utcnow().isoformat(),
            "duration_seconds": round((datetime.utcnow() - started_at).total_seconds(), 1),
            "total": len(id_to_name),
            "skipped_unlisted": skipped_unlisted,
            "askia_fetched": askia_count,
            "askia_error": askia_error,
            "askia_sample_names": list(askia_by_name.keys())[:15],
            "surveys": debug_per_survey,
        }
        _last_sync_result = result
        logger.info(
            "meta sync completed in %ss (%s surveys, %s skipped as unlisted)",
            result["duration_seconds"], result["total"], skipped_unlisted,
        )
        return result
    except Exception as e:
        logger.exception("meta sync failed")
        _last_sync_result = {
            "status": "failed",
            "started_at": started_at.isoformat(),
            "failed_at": datetime.utcnow().isoformat(),
            "error": f"{type(e).__name__}: {e}",
        }
        return _last_sync_result
    finally:
        db.close()
        _sync_lock.release()


@router.post("/sync")
def sync_survey_meta(
    background_tasks: BackgroundTasks,
    wait: bool = Query(default=False, description="Run synchronously and return the full report"),
):
    """Kick off the Askia metadata sync.

    Runs in the background by default so the caller isn't holding a connection
    open for the length of the run — poll `GET /api/meta/sync/status` for the
    outcome. Pass `?wait=true` to block and get the full per-survey report.
    """
    if wait:
        return _run_meta_sync()

    if _sync_lock.locked():
        return {"status": "skipped", "reason": "a sync is already running"}

    background_tasks.add_task(_run_meta_sync)
    return {"status": "started", "detail": "Sync running in background; poll GET /api/meta/sync/status"}


@router.get("/sync/status")
def sync_status():
    """Whether a sync is currently running, plus the last run's report."""
    return {"running": _sync_lock.locked(), "last_result": _last_sync_result}


@router.get("/surveys/{surveyid}/ir")
def refresh_ir(surveyid: int, db: Session = Depends(get_db)):
    """Refresh IR for a specific survey using its numeric Askia ID."""
    meta = db.query(SurveyMeta).filter(SurveyMeta.surveyid == surveyid).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Survey not in meta table")

    survey_server = db.query(
        func.coalesce(
            func.cast(
                text("SUBSTRING_INDEX(GROUP_CONCAT(points.server ORDER BY points.stime DESC), ',', 1)"),
                Integer,
            ),
            1,
        )
    ).filter(PointsDb.surveyid == surveyid).scalar() or 1

    finalstatus = fetch_finalstatus(surveyid, server=survey_server)
    if finalstatus is None:
        return {"ir": meta.last_ir, "source": "cached"}

    ir = calculate_ir(finalstatus)
    if ir is not None:
        meta.last_ir = ir
        meta.irtime = datetime.utcnow()
        db.commit()
        return {"ir": ir, "source": "live"}

    return {"ir": meta.last_ir, "source": "cached"}

@router.get("/debug-askia")
def debug_askia(server: int = 1):
    raw = fetch_all_surveys(server=server)
    first = raw[0] if raw else {}
    return {
        "count": len(raw),
        "first_item_keys": list(first.keys()) if isinstance(first, dict) else None,
        "first_item_sample": {k: first.get(k) for k in ["Id", "Name", "Description", "name", "id", "description"] if k in first} if isinstance(first, dict) else str(first)[:300],
    }
