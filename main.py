from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routes.pms import router as pms_router
from routes.surveys import router as surveys_router
from routes.dashboard import router as dashboard_router
from routes.analytics import router as analytics_router
from dependencies import get_current_user
from routes.reconcile import router as reconcile_router
from fastapi.responses import JSONResponse
from routes.meta import router as meta_router
import logging

load_dotenv()
logger = logging.getLogger(__name__)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app = FastAPI(title="CPI DASHBOARD")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

protected = {"dependencies": [Depends(get_current_user)]}

app.include_router(pms_router, **protected)
app.include_router(surveys_router, **protected)
app.include_router(dashboard_router, **protected)
app.include_router(analytics_router, **protected)
app.include_router(reconcile_router, **protected)
app.include_router(meta_router, **protected)

@app.get("/")
def get_root():
    return {"message": "CPI Dashboard API is running."}

@app.get("/dashboard")
def get_dashboard(user: dict = Depends(get_current_user)):
    return {"message": f"Welcome user {user['user_id']}"}

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in allowed_origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers,
    )