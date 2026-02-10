from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from auth import authenticate
from routes.pms import router as pms_router
from routes.surveys import router as surveys_router
from routes.dashboard import router as dashboard_router


load_dotenv()
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

app= FastAPI(title="CPI DASHBOARD")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pms_router)
app.include_router(surveys_router)
app.include_router(dashboard_router)

def get_current_user(request: Request):
    return authenticate(request)


@app.get("/")
def get_root():
    return {"message": "CPI Dashboard API is running."}

@app.get("/dashboard")
def get_dashboard(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    return{"message": f"Welcome user {user_id}"}