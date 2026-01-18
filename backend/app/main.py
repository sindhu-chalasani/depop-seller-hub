from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import os
import json
import urllib.request
from functools import lru_cache

from jose import jwt
from jose.exceptions import JWTError

from app.api.health import router as health_router
from app.api.sellers import router as sellers_router
from app.api.upload import router as upload_router

#Cognito config
COGNITO_REGION = os.getenv("COGNITO_REGION")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID")

if not COGNITO_REGION or not COGNITO_USER_POOL_ID or not COGNITO_APP_CLIENT_ID:
    print(
        "WARNING: Missing Cognito env vars "
        "(COGNITO_REGION / COGNITO_USER_POOL_ID / COGNITO_APP_CLIENT_ID)"
    )


@lru_cache(maxsize=1)
def get_jwks() -> Dict[str, Any]:
    jwks_url = (
        f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/"
        f"{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    )
    with urllib.request.urlopen(jwks_url) as response:
        return json.loads(response.read().decode("utf-8"))


def get_token_from_header(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    return parts[1]


def verify_cognito_jwt(token: str) -> Dict[str, Any]:
    jwks = get_jwks()
    keys = jwks.get("keys", [])

    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid JWT header")

    kid = header.get("kid")
    key = next((k for k in keys if k.get("kid") == kid), None)
    if key is None:
        raise HTTPException(status_code=401, detail="Public key not found for token")

    issuer = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"

    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=issuer,
            audience=COGNITO_APP_CLIENT_ID,
            options={"verify_aud": True},
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="JWT verification failed")

    if not claims.get("sub"):
        raise HTTPException(status_code=401, detail="JWT missing sub")

    return claims


def get_current_user(
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    token = get_token_from_header(authorization)
    claims = verify_cognito_jwt(token)

    return {
        "seller_id": claims.get("sub"),
        "email": claims.get("email"),
    }


#FastAPI app
app = FastAPI(title="Depop Seller Hub API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(health_router)
app.include_router(sellers_router)
app.include_router(upload_router)


#/me endpoint
@app.get("/me")
def me(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "seller_id": user["seller_id"],
        "email": user["email"],
    }