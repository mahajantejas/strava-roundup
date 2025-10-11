from fastapi import APIRouter, Request
import os
import requests
from fastapi.responses import RedirectResponse

router = APIRouter()

STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"

@router.get("/auth/strava")
def strava_auth_redirect():
    client_id = os.getenv("STRAVA_CLIENT_ID")
    redirect_uri = os.getenv("STRAVA_REDIRECT_URI")
    scope = "read,activity:read_all"

    auth_url = (
        f"{STRAVA_AUTH_URL}?client_id={client_id}"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&approval_prompt=auto"
        f"&scope={scope}"
    )

    return RedirectResponse(url=auth_url)
@router.get("/auth/strava/callback")
def strava_callback(code: str):
    client_id = os.getenv("STRAVA_CLIENT_ID")
    client_secret = os.getenv("STRAVA_CLIENT_SECRET")

    # Exchange authorization code for access token
    response = requests.post(STRAVA_TOKEN_URL, data={
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code"
    })

    if response.status_code != 200:
        return {"error": "Failed to exchange token", "details": response.text}

    token_data = response.json()

    # For now, just return token info to confirm it works
    return {
        "access_token": token_data.get("access_token"),
        "athlete": token_data.get("athlete", {}),
        "expires_at": token_data.get("expires_at"),
    }