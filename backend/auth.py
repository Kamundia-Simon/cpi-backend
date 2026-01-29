from fastapi import HTTPException
from clerk_backend_api import Clerk, AuthenticateRequestOptions
from dotenv import load_dotenv
load_dotenv()
import os


sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

def authenticate(request):
    try:
        request_state = sdk.authenticate_request(
            request,
            AuthenticateRequestOptions(
                authorized_parties=["http://localhost:5173"],
                jwt_key=os.getenv("JWT_KEY")
            )
        )
        
        if not request_state.is_signed_in:
            reason_msg = request_state.message if request_state.message else "Invalid token"
            raise HTTPException(
                status_code=401,
                detail=reason_msg
                )
        
        user_id = request_state.payload.get("sub")
        
        return {"user_id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
         )