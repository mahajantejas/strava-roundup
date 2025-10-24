import base64
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

import requests
from fastapi import Depends, FastAPI, HTTPException, Query, Response
from sqlalchemy.orm import Session

from activity_sync import AthleteNotFoundError, sync_athlete_activities
from auth import router as auth_router
from database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from models import Athlete
from monthly_roundup import build_monthly_roundup
from schemas import AthleteCreate, AthleteResponse, MonthlyRoundup, SyncSummary
from strava_client import StravaAuthenticationError, StravaClientError


app = FastAPI()
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React (Vite) dev server
        "http://127.0.0.1:5173",  # sometimes Vite runs on this
    ],
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # allow all headers
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Strava Monthly Roundup Backend is running, pun intended!"}

@app.post("/athletes", response_model=AthleteResponse)
def create_athlete(athlete: AthleteCreate, db: Session = Depends(get_db)):
    db_athlete = Athlete(**athlete.dict())
    db.add(db_athlete)
    db.commit()
    db.refresh(db_athlete)
    return db_athlete

@app.get("/athletes")
def get_athletes(db: Session = Depends(get_db)):
    return db.query(Athlete).all()

@app.delete("/athletes/{athlete_id}", status_code=204)
def delete_athlete(athlete_id: int, db: Session = Depends(get_db)):
    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).one_or_none()
    if athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    db.delete(athlete)
    db.commit()

    return Response(status_code=204)

@app.post("/athletes/{athlete_id}/sync", response_model=SyncSummary)
def sync_athlete(
    athlete_id: int,
    since: Optional[str] = Query(
        None,
        description="Optional ISO 8601 timestamp; only activities after this time will be fetched.",
    ),
    db: Session = Depends(get_db),
):
    parsed_since: Optional[datetime] = None
    if since is not None:
        try:
            parsed_since = datetime.fromisoformat(
                since.replace("Z", "+00:00") if since.endswith("Z") else since
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid 'since' datetime format")

    try:
        summary = sync_athlete_activities(db, athlete_id=athlete_id, since=parsed_since)
    except AthleteNotFoundError:
        raise HTTPException(status_code=404, detail="Athlete not found")
    except StravaAuthenticationError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except StravaClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return summary


@app.get("/athletes/{athlete_id}/roundup", response_model=MonthlyRoundup)
def get_monthly_roundup(
    athlete_id: int,
    month: Optional[str] = Query(
        None,
        description="Optional month in YYYY-MM format. Defaults to the current month (UTC).",
    ),
    db: Session = Depends(get_db),
):
    try:
        return build_monthly_roundup(db, athlete_id, month)
    except AthleteNotFoundError:
        raise HTTPException(status_code=404, detail="Athlete not found")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/proxy/image")
def proxy_image(url: str):
    """
    Fetch an external image and return it as a data URL so the frontend can embed it
    without tripping the browser's canvas security restrictions.
    """
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(status_code=400, detail="Invalid image URL")

    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Could not download image") from exc

    content_type = response.headers.get("Content-Type", "image/jpeg")
    encoded = base64.b64encode(response.content).decode("ascii")
    data_url = f"data:{content_type};base64,{encoded}"
    return {"dataUrl": data_url}
