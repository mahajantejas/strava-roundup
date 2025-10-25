from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

import activity_sync
from database import Base
from models import Activity, Athlete
from strava_client import StravaClient


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


def test_normalize_activity_payload_converts_units():
    payload = {
        "id": 123,
        "name": "Morning Run",
        "type": "Run",
        "start_date": "2025-01-02T06:30:00Z",
        "start_date_local": "2025-01-02T07:30:00+01:00",
        "timezone": "(GMT+01:00) Europe/Berlin",
        "distance": 5234.5,
        "moving_time": 1500,
        "elapsed_time": 1600,
        "total_elevation_gain": 42.0,
        "map": {"summary_polyline": "encoded_polyline"},
        "photos": {"count": 0},
    }

    normalized = StravaClient.normalize_activity(payload)

    assert pytest.approx(normalized["distance_km"], 0.0001) == 5.2345
    assert normalized["moving_time_seconds"] == 1500
    assert normalized["elapsed_time_seconds"] == 1600
    assert normalized["summary_polyline"] == "encoded_polyline"
    assert normalized["primary_photo_url"] is None
    assert normalized["start_date"].tzinfo is not None
    assert normalized["start_date_local"].tzinfo is not None


def test_sync_creates_and_updates_activities(monkeypatch, db_session: Session):
    athlete = Athlete(
        strava_id=987654,
        firstname="Test",
        lastname="User",
        profile_image_url=None,
        access_token="initial-access",
        refresh_token="initial-refresh",
        expires_at=2_000_000_000,
    )
    db_session.add(athlete)
    db_session.commit()
    db_session.refresh(athlete)

    summary_payloads = [
        {
            "id": 1001,
            "name": "Morning Run",
            "type": "Run",
            "start_date": "2025-01-01T06:00:00Z",
            "start_date_local": "2025-01-01T07:00:00+01:00",
            "timezone": "(GMT+01:00) Europe/Berlin",
            "distance": 10000,
            "moving_time": 2400,
            "elapsed_time": 2450,
            "total_elevation_gain": 120,
            "map": {"summary_polyline": "polylineA"},
            "photos": {"count": 0},
        },
        {
            "id": 1002,
            "name": "Lunch Ride",
            "type": "Ride",
            "start_date": "2025-01-02T12:30:00Z",
            "start_date_local": "2025-01-02T13:30:00+01:00",
            "timezone": "(GMT+01:00) Europe/Berlin",
            "distance": 25000,
            "moving_time": 3600,
            "elapsed_time": 3800,
            "total_elevation_gain": 220,
            "map": {"summary_polyline": "polylineB"},
            "photos": {"count": 1},
        },
    ]

    detail_payloads = {
        1001: {**summary_payloads[0], "photos": {"count": 0}},
        1002: {
            **summary_payloads[1],
            "photos": {
                "count": 1,
                "primary": {"urls": {"600": "https://cdn.example.com/photo-1002-600.jpg"}},
            },
        },
        1003: None,  # placeholder for later
    }

    class FakeStravaClient:
        normalize_activity = staticmethod(StravaClient.normalize_activity)

        def __init__(self, db, athlete_obj):
            self.db = db
            self.athlete = athlete_obj

        def iter_activities(self, after=None, before=None, per_page=200):
            for activity in summary_payloads:
                start_dt = datetime.fromisoformat(activity["start_date"].replace("Z", "+00:00"))
                if after and start_dt <= after:
                    continue
                if before and start_dt >= before:
                    continue
                yield activity

        def fetch_activity_detail(self, activity_id: int):
            detail = detail_payloads.get(activity_id)
            if detail is None:
                raise KeyError(f"No detail for activity {activity_id}")
            return detail

    monkeypatch.setattr(activity_sync, "StravaClient", FakeStravaClient)

    class FixedDateTime(datetime):
        @classmethod
        def now(cls, tz=None):
            anchor = datetime(2025, 2, 15, tzinfo=timezone.utc)
            if tz is not None:
                return anchor.astimezone(tz)
            return anchor

    monkeypatch.setattr(activity_sync, "datetime", FixedDateTime)

    summary = activity_sync.sync_athlete_activities(db_session, athlete.id)

    assert summary.fetched == 2
    assert summary.created == 2
    assert summary.updated == 0
    assert summary.latest_activity == datetime(2025, 1, 2, 12, 30, tzinfo=timezone.utc)

    stored = (
        db_session.query(Activity)
        .filter(Activity.athlete_id == athlete.id)
        .order_by(Activity.start_date)
        .all()
    )
    assert len(stored) == 2
    assert pytest.approx(stored[0].distance_km, 0.0001) == 10.0
    assert stored[1].primary_photo_url == "https://cdn.example.com/photo-1002-600.jpg"

    # Update the latest activity and add a new one to ensure updates + inserts work.
    summary_payloads[1] = {
        **summary_payloads[1],
        "name": "Lunch Ride (updated)",
        "distance": 26000,
    }
    detail_payloads[1002] = {
        **detail_payloads[1002],
        "name": "Lunch Ride (updated)",
        "distance": 26000,
    }
    summary_payloads.append(
        {
            "id": 1003,
            "name": "Evening Run",
            "type": "Run",
            "start_date": "2025-01-03T18:00:00Z",
            "start_date_local": "2025-01-03T19:00:00+01:00",
            "timezone": "(GMT+01:00) Europe/Berlin",
            "distance": 8000,
            "moving_time": 2100,
            "elapsed_time": 2200,
            "total_elevation_gain": 90,
            "map": {"summary_polyline": "polylineC"},
            "photos": {"count": 0},
        }
    )
    detail_payloads[1003] = {
        **summary_payloads[-1],
        "photos": {"count": 0},
    }

    summary_next = activity_sync.sync_athlete_activities(db_session, athlete.id)

    assert summary_next.fetched == 2  # updated + new
    assert summary_next.created == 1
    assert summary_next.updated == 1
    assert summary_next.latest_activity == datetime(2025, 1, 3, 18, 0, tzinfo=timezone.utc)

    updated_activity = (
        db_session.query(Activity)
        .filter(Activity.strava_activity_id == 1002, Activity.athlete_id == athlete.id)
        .first()
    )
    assert updated_activity.name == "Lunch Ride (updated)"
    assert pytest.approx(updated_activity.distance_km, 0.0001) == 26.0

    new_activity = (
        db_session.query(Activity)
        .filter(Activity.strava_activity_id == 1003, Activity.athlete_id == athlete.id)
        .first()
    )
    assert new_activity is not None
    assert pytest.approx(new_activity.distance_km, 0.0001) == 8.0
