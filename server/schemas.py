from datetime import date, datetime
from typing import List, Optional
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


class ActivitySplitEntry(BaseModel):
    type: str
    count: int
    percentage: float


class CalendarDayEntry(BaseModel):
    day: int
    date: date
    is_active: bool
    total_activities: int
    total_distance_km: float
    total_moving_time_seconds: int


class MostActiveDay(BaseModel):
    date: date
    total_activities: int
    total_distance_km: float
    total_moving_time_seconds: int


class MostActiveTimeOfDay(BaseModel):
    hour: int
    total_activities: int
    total_moving_time_seconds: int


class MonthlyInsights(BaseModel):
    most_active_day: Optional[MostActiveDay]
    most_active_time_of_day: Optional[MostActiveTimeOfDay]
    average_activity_time_seconds: Optional[int]
    weekly_streak_weeks: int


class MonthlyRoundup(BaseModel):
    athlete_id: int
    month: str
    month_name: str
    month_label: str
    period_start: datetime
    period_end: datetime
    total_active_days: int
    total_activities: int
    total_distance_km: float
    total_moving_time_seconds: int
    total_elevation_gain_m: float
    activity_split: List[ActivitySplitEntry]
    calendar_days: List[CalendarDayEntry]
    insights: MonthlyInsights
