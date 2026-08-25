import hashlib
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def rate_limit_key(request: Request) -> str:
    """External callers are bucketed by API key; everyone else by IP."""
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return "key:" + hashlib.sha256(api_key.encode()).hexdigest()[:16]
    return get_remote_address(request)


# No default_limits here deliberately — the Clerk-authenticated routes are
# keyed by IP (no X-API-Key), and PMs on the same office network would share
# one bucket. Only routes that explicitly need it are decorated with
# @limiter.limit(...), e.g. routes/external.py.
limiter = Limiter(key_func=rate_limit_key)
