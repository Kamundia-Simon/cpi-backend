from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from auth import authenticate


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

def get_current_user(request: Request):
    return authenticate(request)


@app.get("/")
def get_root():
    return {"message": "CPI Dashboard API is running."}

@app.get("/dashboard")
def get_dashboard(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    return{"message": f"Welcome user {user_id}"}