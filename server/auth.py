from unittest import result
from fastapi import APIRouter, Request
import os
import requests
from urllib.parse import quote
from fastapi.responses import RedirectResponse
from models import Athlete
from database import SessionLocal

router = APIRouter()

STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"

@router.get("/auth/strava")
def strava_auth_redirect():
    client_id = os.getenv("STRAVA_CLIENT_ID")
    redirect_uri = os.getenv("STRAVA_REDIRECT_URI")
    scope = "read,activity:read_all,profile:read_all"

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
    print(f"DEBUG: Received code: {code}")
    client_id = os.getenv("STRAVA_CLIENT_ID")
    client_secret = os.getenv("STRAVA_CLIENT_SECRET")

    # Exchange authorization code for access token
    response = requests.post(STRAVA_TOKEN_URL, data={
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code"
    })

    print(f"DEBUG: Strava response status: {response.status_code}")
    if response.status_code != 200:
        print(f"DEBUG: Strava error response: {response.text}")
        return {"error": "Failed to exchange token", "details": response.text}

    token_data = response.json()
    print(f"DEBUG: Token data keys: {list(token_data.keys())}")
    athlete_info = token_data.get("athlete", {}) or {}
    print(f"DEBUG: Athlete info: {athlete_info}")
    profile_image = athlete_info.get("profile")

    # Persist athlete info and tokens to DB
    persisted = None
    try: 
        strava_id = athlete_info.get("id")
        print(f"DEBUG: Strava ID: {strava_id}")
        if strava_id is not None: 
            with SessionLocal() as db:
                existing = db.query(Athlete).filter(Athlete.strava_id == strava_id).first()
                if existing:
                    #update tokens / basic profile fields 
                    existing.firstname = athlete_info.get("firstname", existing.firstname)
                    existing.lastname = athlete_info.get("lastname", existing.lastname)
                    if profile_image:
                        existing.profile_image_url = profile_image
                    existing.access_token = token_data.get("access_token", existing.access_token)
                    existing.refresh_token = token_data.get("refresh_token", existing.refresh_token)
                    existing.expires_at = token_data.get("expires_at", existing.expires_at)
                    db.add(existing)
                    db.commit()
                    db.refresh(existing)
                    persisted = existing
                else:
                    new_athlete = Athlete(
                        strava_id=strava_id,
                        firstname=athlete_info.get("firstname"),
                        lastname=athlete_info.get("lastname"),
                        profile_image_url=profile_image,
                        access_token=token_data.get("access_token"),
                        refresh_token=token_data.get("refresh_token"),
                        expires_at=token_data.get("expires_at")
                    )
                    db.add(new_athlete)
                    db.commit()
                    db.refresh(new_athlete)
                    persisted = new_athlete
        else:
            persisted = None
    except Exception as e: 
        # avoid crashing on DB errors: consider logging these
        print(f"DEBUG: Database error: {e}")
        persisted = None
    #After persisting, redirecct the browser to the frontend call back page (absolute url)
    frontend_cb = os.getenv("FRONTEND_CALLBACK_URL", "http://localhost:5173/auth/callback")
    print(f"DEBUG: Persisted athlete: {persisted}")
    if persisted: 
        name = quote(f"{persisted.firstname} {persisted.lastname}").strip()
        # include image to show right away on the frontend
        image_q = quote(persisted.profile_image_url) if getattr(persisted, "profile_image_url", None) else ""
        image_param = f"&image={image_q}" if image_q else ""
        redirect_url = f"{frontend_cb}?status=success&name={name}&db_id={persisted.id}&strava_id={persisted.strava_id}{image_param}"
        print(f"DEBUG: Success redirect URL: {redirect_url}")
    else:
        redirect_url = f"{frontend_cb}?status=error"
        print(f"DEBUG: Error redirect URL: {redirect_url}")
    
    return RedirectResponse(url=redirect_url)
        