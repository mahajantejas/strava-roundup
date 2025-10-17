#!/usr/bin/env python3
"""
Seed the database with sample Strava activities for local development.

Usage:
    python scripts/seed_strava_samples.py --json server/sample_data/activities.sample.json
"""

import argparse
import json
from pathlib import Path
from typing import List

from sqlalchemy.orm import Session

from database import SessionLocal
from models import Activity, Athlete
from strava_client import StravaClient


def load_payloads(path: Path) -> List[dict]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError("Sample data must be a JSON array of activities")
    return data


def ensure_sample_athlete(session: Session, athlete_id: int | None) -> Athlete:
    if athlete_id is not None:
        athlete = session.query(Athlete).filter(Athlete.id == athlete_id).first()
        if not athlete:
            raise ValueError(f"Athlete with id={athlete_id} not found")
        return athlete

    athlete = (
        session.query(Athlete)
        .filter(Athlete.strava_id == 999999999)
        .one_or_none()
    )
    if athlete:
        return athlete

    athlete = Athlete(
        strava_id=999999999,
        firstname="Sample",
        lastname="Athlete",
        profile_image_url=None,
        access_token="sample-access-token",
        refresh_token="sample-refresh-token",
        expires_at=2_000_000_000,
    )
    session.add(athlete)
    session.commit()
    session.refresh(athlete)
    return athlete


def upsert_activities(session: Session, athlete: Athlete, payloads: List[dict]) -> tuple[int, int]:
    created = 0
    updated = 0
    for payload in payloads:
        normalized = StravaClient.normalize_activity(payload)
        normalized["athlete_id"] = athlete.id

        existing = (
            session.query(Activity)
            .filter(
                Activity.athlete_id == athlete.id,
                Activity.strava_activity_id == normalized["strava_activity_id"],
            )
            .one_or_none()
        )

        if existing:
            for key, value in normalized.items():
                setattr(existing, key, value)
            updated += 1
        else:
            session.add(Activity(**normalized))
            created += 1

    session.commit()
    return created, updated


def main():
    parser = argparse.ArgumentParser(description="Seed the database with sample Strava activities.")
    parser.add_argument(
        "--json",
        type=Path,
        default=Path("server/sample_data/activities.sample.json"),
        help="Path to a JSON file containing an array of Strava activity payloads.",
    )
    parser.add_argument(
        "--athlete-id",
        type=int,
        default=None,
        help="Optional athlete database ID to attach activities to. If omitted a sample athlete is used/created.",
    )
    args = parser.parse_args()

    payloads = load_payloads(args.json)
    session = SessionLocal()
    try:
        athlete = ensure_sample_athlete(session, args.athlete_id)
        created, updated = upsert_activities(session, athlete, payloads)
        print(
            f"Seeded activities for athlete #{athlete.id} "
            f"(created {created}, updated {updated}) from {args.json}"
        )
    finally:
        session.close()


if __name__ == "__main__":
    main()
