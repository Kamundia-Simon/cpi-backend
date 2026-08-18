import os
from fastapi import Request, HTTPException, Header
from auth import authenticate
from dotenv import load_dotenv

load_dotenv()

def get_current_user(request: Request):
    return authenticate(request)

def _allowed_costing_emails() -> set[str]:
    raw = os.getenv("COSTING_ALLOWED_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}

def get_costing_user(request: Request):
    user = authenticate(request)
    email = (user.get("email") or "").lower()
    if not email or email not in _allowed_costing_emails():
        raise HTTPException(status_code=403, detail="Forbidden")
    return user

def verify_api_key(x_api_key: str = Header(None)):
    expect = os.getenv("PROGRESS_API_KEY")