from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from database import Base
from models import Activity, Athlete
from monthly_roundup import build_monthly_roundup


@pytest.fixture
def db_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def make_activity(
    athlete_id: int,
    strava_id: int,
    start_dt: datetime,
    *,
    local_offset_hours: int = 0,
    activity_type: str = "Run",
    distance_km: float = 10.0,
    moving_seconds: int = 3600,
    elevation_gain: float = 120.0,
) -> Activity:
    local_tz = timezone(timedelta(hours=local_offset_hours))
    return Activity(
        athlete_id=athlete_id,
        strava_activity_id=strava_id,
        name=f"Activity #{strava_id}",
        activity_type=activity_type,
        start_date=start_dt,
        start_date_local=start_dt.astimezone(local_tz),
        timezone=str(local_tz),
        distance_km=distance_km,
        moving_time_seconds=moving_seconds,
        elapsed_time_seconds=moving_seconds + 120,
        total_elevation_gain=elevation_gain,
        summary_polyline=None,
        primary_photo_url=None,
        raw_payload={},
    )


def test_build_monthly_roundup_computes_totals_and_insights(db_session: Session):
    athlete = Athlete(
        strava_id=12345,
        firstname="Alex",
        lastname="Athlete",
        access_token="token",
        refresh_token="refresh",
        expires_at=999999,
    )
    db_session.add(athlete)
    db_session.commit()
    db_session.refresh(athlete)

    activities = [
        make_activity(
            athlete.id,
            1001,
            datetime(2025, 1, 6, 6, 30, tzinfo=timezone.utc),
            activity_type="Run",
            distance_km=12.5,
            moving_seconds=3900,
        ),
        make_activity(
            athlete.id,
            1002,
            datetime(2025, 1, 13, 7, 15, tzinfo=timezone.utc),
            activity_type="Ride",
            distance_km=35.2,
            moving_seconds=5400,
            elevation_gain=450.0,
        ),
        make_activity(
            athlete.id,
            1003,
            datetime(2025, 1, 20, 5, 50, tzinfo=timezone.utc),
            activity_type="Run",
            distance_km=8.0,
            moving_seconds=3000,
        ),
        make_activity(
            athlete.id,
            1004,
            datetime(2025, 1, 20, 17, 45, tzinfo=timezone.utc),
            activity_type="Run",
            distance_km=6.8,
            moving_seconds=2700,
        ),
    ]
    db_session.add_all(activities)
    db_session.commit()

    roundup = build_monthly_roundup(db_session, athlete.id, "2025-01")

    assert roundup.month_label == "January 2025"
    assert roundup.total_activities == 4
    assert roundup.total_active_days == 3
    assert pytest.approx(roundup.total_distance_km, 0.001) == 62.5
    assert roundup.total_moving_time_seconds == 15000
    assert pytest.approx(roundup.total_elevation_gain_m, 0.001) == 810.0

    split = {entry.type: entry for entry in roundup.activity_split}
    assert split["Run"].count == 3
    assert split["Ride"].count == 1

    day_20 = next(day for day in roundup.calendar_days if day.day == 20)
    assert day_20.is_active
    assert day_20.total_activities == 2
    assert pytest.approx(day_20.total_distance_km, 0.001) == 14.8

    insights = roundup.insights
    assert insights.weekly_streak_weeks == 3
    assert insights.most_active_day.date.day == 20
    assert insights.most_active_day.total_activities == 2
    assert insights.most_active_time_of_day.hour == 7
    assert insights.average_activity_time_seconds == 5000


def test_build_monthly_roundup_validates_month_format(db_session: Session):
    athlete = Athlete(
        strava_id=555,
        firstname="Taylor",
        lastname="Test",
        access_token="token",
        refresh_token="refresh",
        expires_at=999999,
    )
    db_session.add(athlete)
    db_session.commit()
    db_session.refresh(athlete)

    with pytest.raises(ValueError):
        build_monthly_roundup(db_session, athlete.id, "2025/01")


def test_build_monthly_roundup_uses_local_dates_for_insights(db_session: Session):
    athlete = Athlete(
        strava_id=999,
        firstname="Casey",
        lastname="Clock",
        access_token="token",
        refresh_token="refresh",
        expires_at=999999,
    )
    db_session.add(athlete)
    db_session.commit()
    db_session.refresh(athlete)

    late_evening_utc = datetime(2025, 1, 11, 5, 30, tzinfo=timezone.utc)
    activity = make_activity(
        athlete.id,
        2001,
        late_evening_utc,
        local_offset_hours=-8,
        distance_km=12.0,
        moving_seconds=4200,
    )
    db_session.add(activity)
    db_session.commit()

    roundup = build_monthly_roundup(db_session, athlete.id, "2025-01")

    day_10 = next(day for day in roundup.calendar_days if day.day == 10)
    day_11 = next(day for day in roundup.calendar_days if day.day == 11)

    assert day_10.is_active is True
    assert day_10.total_activities == 1
    assert day_11.is_active is False

    insights = roundup.insights
    assert insights.most_active_day is not None
    assert insights.most_active_day.date.day == 10

    assert insights.most_active_time_of_day is not None
    assert insights.most_active_time_of_day.hour == 21
