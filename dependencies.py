from fastapi import Request
from auth import authenticate

def get_current_user(request: Request):
    return authenticate(request)