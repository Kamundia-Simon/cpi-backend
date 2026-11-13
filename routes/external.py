from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, text, Integer
from database import get_db
from models import PointsDb
from dependencies import verify_api_key
from rate_limit import limiter

router = APIRouter(prefix="/api/external", tags=["External"], dependencies=[Depends(verify_api_key)])

@router.get("/surveys/{surveyName}/progress")
@limiter.limit("30/minute")
def get_survey_progress(request: Request, surveyName: str, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.count().label("completes"),
            func.coalesce(
                func.cast(
                    text("SUBSTRING_INDEX(GROUP_CONCAT(points.target ORDER BY points.stime DESC), ',', 1)"),
                    Integer,
                ),
                2000,
            ).label("target"),
        )
        .filter(PointsDb.project == surveyName)
        .first()
    )

    if not result or result.completes == 0:
        raise HTTPException(status_code=404, detail="Survey not found")

    completes = result.completes
    target = result.target or 2000
    progress_pct = round((completes / target) * 100, 1) if target else None

    return {
        "survey": surveyName,
        "completes": completes,
        "target": target,
        "progress_pct": progress_pct,
    }