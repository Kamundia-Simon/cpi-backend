from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import PointsDb, SurveyMeta
from services.quotas import fetch_all_surveys, fetch_finalstatus, calculate_ir, parse_client


router = APIRouter(prefix="/api/meta", tags=["Meta"])


@router.post("/sync")
def sync_survey_meta(db: Session = Depends(get_db)):
    id_to_name: dict[int, str] = {
        row.surveyid: row.project
        for row in db.query(PointsDb.surveyid, PointsDb.project)
            .filter(PointsDb.surveyid.isnot(None))
            .distinct()
            .all()
    }

    existing_meta: dict[int, SurveyMeta] = {
        m.surveyid: m for m in db.query(SurveyMeta).all()
    }

    askia_by_name: dict[str, dict] = {}
    askia_error = None
    askia_count = 0
    try:
        surveys_list = fetch_all_surveys()
        askia_count = len(surveys_list)
        for s in surveys_list:
            name = s.get("Name", "").strip()
            if name:
                askia_by_name[name] = s
    except Exception as e:
        askia_error = str(e)

    debug_per_survey = []
    for numeric_id, project_name in id_to_name.items():
        askia_info = askia_by_name.get(project_name, {})
        matched_askia = bool(askia_info)
        askia_api_id = askia_info.get("Id")
        desc = askia_info.get("Description", "")
        meta = existing_meta.get(numeric_id)

        fs = None
        ir_value = None
        fs_error = None
        try:
            fs = fetch_finalstatus(numeric_id)
            if fs:
                ir_value = calculate_ir(fs)
        except Exception as e:
            fs_error = str(e)

        if meta:
            if not meta.description and desc:
                meta.description = desc
                meta.client = parse_client(desc)
            if ir_value is not None:
                meta.last_ir = ir_value
                meta.irtime = datetime.utcnow()
        
        else:
            new_meta = SurveyMeta(
                surveyid=numeric_id,
                description=desc or None,
                client=parse_client(desc) if desc else None,
                last_ir=ir_value,
                irtime=datetime.utcnow() if ir_value is not None else None,
            )
            db.add(new_meta)

        debug_per_survey.append({
            "project": project_name,
            "points_surveyid": numeric_id,
            "matched_askia_name": matched_askia,
            "askia_api_id": askia_api_id,
            "ids_match": numeric_id == askia_api_id if askia_api_id else None,
            "description": desc or None,
            "finalstatus_found": fs is not None,
            "ir": ir_value,
            "fs_error": fs_error,
        })

    db.commit()
    return {
        "total": len(id_to_name),
        "askia_fetched": askia_count,
        "askia_error": askia_error,
        "askia_sample_names": list(askia_by_name.keys())[:15],
        "surveys": debug_per_survey,
    }

@router.get("/surveys/{surveyid}/ir")
def refresh_ir(surveyid: int, db: Session = Depends(get_db)):
    """Refresh IR for a specific survey using its numeric Askia ID."""
    meta = db.query(SurveyMeta).filter(SurveyMeta.surveyid == surveyid).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Survey not in meta table")

    finalstatus = fetch_finalstatus(surveyid)
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
def debug_askia():
    raw = fetch_all_surveys()
    first = raw[0] if raw else {}
    return {
        "count": len(raw),
        "first_item_keys": list(first.keys()) if isinstance(first, dict) else None,
        "first_item_sample": {k: first.get(k) for k in ["Id", "Name", "Description", "name", "id", "description"] if k in first} if isinstance(first, dict) else str(first)[:300],
    }