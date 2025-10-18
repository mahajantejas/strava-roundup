from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from models import Activity, Athlete
from schemas import SyncSummary
from strava_client import StravaClient, StravaClientError, StravaAuthenticationError


class AthleteNotFoundError(Exception):
    """Raised when attempting to sync an athlete that does not exist."""


def sync_athlete_activities(
    db: Session,
    athlete_id: int,
    since: Optional[datetime] = None,
) -> SyncSummary:
    baseline = datetime(2025, 1, 1, tzinfo=timezone.utc)

    athlete = db.query(Athlete).filter(Athlete.id == athlete_id).first()
    if not athlete:
        raise AthleteNotFoundError(f"Athlete {athlete_id} was not found")

    since_cutoff = since
    if since_cutoff is None:
        latest_existing = (
            db.query(Activity)
            .filter(Activity.athlete_id == athlete_id)
            .order_by(Activity.start_date.desc())
            .first()
        )
        if latest_existing:
            # Strava's `after` parameter is exclusive, subtract a minute to avoid missing updates.
            since_cutoff = latest_existing.start_date - timedelta(minutes=1)

    # Ensure we never pull data before the start of 2025.
    if since_cutoff is not None and since_cutoff.tzinfo is None:
        since_cutoff = since_cutoff.replace(tzinfo=timezone.utc)
    if since_cutoff is None or since_cutoff < baseline:
        since_cutoff = baseline

    client = StravaClient(db, athlete)

    created = 0
    updated = 0
    fetched = 0
    latest_activity_date: Optional[datetime] = None

    def upsert_activity(normalized_payload):
        nonlocal created, updated, latest_activity_date
        activity = (
            db.query(Activity)
            .filter(
                Activity.athlete_id == athlete_id,
                Activity.strava_activity_id == normalized_payload["strava_activity_id"],
            )
            .one_or_none()
        )

        normalized_payload["athlete_id"] = athlete_id

        # Attempt to enrich with a photo if summary lacked one but photos exist.
        if (
            not normalized_payload.get("primary_photo_url")
            and normalized_payload["raw_payload"].get("photos")
            and (normalized_payload["raw_payload"]["photos"].get("count") or 0) > 0
        ):
            detail = client.fetch_activity_detail(normalized_payload["strava_activity_id"])
            normalized_payload["primary_photo_url"] = StravaClient.normalize_activity(detail).get(
                "primary_photo_url"
            )
            normalized_payload["raw_payload"]["photos"] = detail.get("photos")

        latest_activity_date = max(
            filter(None, [latest_activity_date, normalized_payload.get("start_date")]),
            default=None,
        )

        if activity:
            for key, value in normalized_payload.items():
                setattr(activity, key, value)
            updated += 1
        else:
            activity = Activity(**normalized_payload)
            db.add(activity)
            created += 1

    try:
        for raw_activity in client.iter_activities(after=since_cutoff):
            fetched += 1
            normalized = StravaClient.normalize_activity(raw_activity)
            upsert_activity(normalized)
        db.commit()
    except (StravaAuthenticationError, StravaClientError):
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    return SyncSummary(
        fetched=fetched,
        created=created,
        updated=updated,
        latest_activity=latest_activity_date,
        synced_at=datetime.now(timezone.utc),
    )
