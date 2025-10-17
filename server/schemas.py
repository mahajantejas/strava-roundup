from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AthleteBase(BaseModel):
    firstname: str
    lastname: str
    strava_id: int
    profile_image_url: Optional[str] = None
    access_token: str
    refresh_token: str
    expires_at: int

class AthleteCreate(AthleteBase):
    pass

class AthleteResponse(AthleteBase):
    id: int

    class Config:
        from_attributes = True


class ActivityBase(BaseModel):
    strava_activity_id: int
    name: Optional[str] = None
    activity_type: Optional[str] = None
    start_date: datetime
    start_date_local: Optional[datetime] = None
    timezone: Optional[str] = None
    distance_km: Optional[float] = None
    moving_time_seconds: Optional[int] = None
    elapsed_time_seconds: Optional[int] = None
    total_elevation_gain: Optional[float] = None
    summary_polyline: Optional[str] = None
    primary_photo_url: Optional[str] = None


class ActivityResponse(ActivityBase):
    id: int
    athlete_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SyncSummary(BaseModel):
    fetched: int
    created: int
    updated: int
    latest_activity: Optional[datetime] = None
    synced_at: datetime
