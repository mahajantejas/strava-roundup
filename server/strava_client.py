import logging
import os
import time
from datetime import datetime
from typing import Dict, Iterator, Optional

import requests
from sqlalchemy.orm import Session

from models import Athlete

STRAVA_API_BASE = "https://www.strava.com/api/v3"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"


class StravaClientError(Exception):
    """Raised when Strava API returns an error."""


class StravaAuthenticationError(StravaClientError):
    """Raised when we cannot authenticate or refresh the athlete token."""


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    if value.endswith("Z"):
        value = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise StravaClientError(f"Invalid datetime format from Strava: {value}") from exc


def _extract_primary_photo(activity: Dict) -> Optional[str]:
    photos = activity.get("photos") or {}
    primary = photos.get("primary") if isinstance(photos, dict) else None
    if isinstance(primary, dict):
        urls = primary.get("urls") or {}
        if isinstance(urls, dict):
            return urls.get("600") or urls.get("1000") or urls.get("default")
    return None


def _normalize_activity_payload(activity: Dict) -> Dict:
    return {
        "strava_activity_id": activity["id"],
        "name": activity.get("name"),
        "activity_type": activity.get("type"),
        "start_date": _parse_datetime(activity["start_date"]),
        "start_date_local": _parse_datetime(activity.get("start_date_local")),
        "timezone": activity.get("timezone"),
        "distance_km": (activity.get("distance") or 0) / 1000 if activity.get("distance") else None,
        "moving_time_seconds": activity.get("moving_time"),
        "elapsed_time_seconds": activity.get("elapsed_time"),
        "total_elevation_gain": activity.get("total_elevation_gain"),
        "summary_polyline": (activity.get("map") or {}).get("summary_polyline"),
        "primary_photo_url": _extract_primary_photo(activity),
        "raw_payload": activity,
    }


class StravaClient:
    """
    Lightweight wrapper around Strava's API for authenticated athletes.
    Handles token refresh and pagination.
    """

    def __init__(self, db: Session, athlete: Athlete):
        if not athlete:
            raise ValueError("Athlete record is required to initialize StravaClient")
        if not athlete.access_token or not athlete.refresh_token:
            raise StravaAuthenticationError("Athlete does not have the required Strava tokens")
        self.db = db
        self.athlete = athlete
        self.client_id = os.getenv("STRAVA_CLIENT_ID")
        self.client_secret = os.getenv("STRAVA_CLIENT_SECRET")
        if not self.client_id or not self.client_secret:
            raise StravaAuthenticationError("Missing Strava client credentials")
        self.logger = logging.getLogger(__name__)

    def ensure_access_token(self) -> None:
        if not self.athlete.expires_at:
            return
        # Use a 2 minute buffer to avoid using tokens right at expiry
        if self.athlete.expires_at > int(time.time()) + 120:
            return
        self.logger.info("Refreshing Strava token for athlete_id=%s", self.athlete.id)
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": self.athlete.refresh_token,
        }
        response = requests.post(STRAVA_TOKEN_URL, data=payload, timeout=30)
        if response.status_code != 200:
            raise StravaAuthenticationError(
                f"Failed to refresh Strava token: {response.status_code} {response.text}"
            )
        token_data = response.json()
        self.athlete.access_token = token_data.get("access_token")
        self.athlete.refresh_token = token_data.get("refresh_token") or self.athlete.refresh_token
        self.athlete.expires_at = token_data.get("expires_at")
        self.db.add(self.athlete)
        self.db.commit()
        self.db.refresh(self.athlete)

    def _request(self, method: str, path: str, params: Optional[Dict] = None) -> Dict:
        self.ensure_access_token()
        headers = {"Authorization": f"Bearer {self.athlete.access_token}"}
        url = f"{STRAVA_API_BASE}{path}"
        response = requests.request(method, url, params=params, headers=headers, timeout=30)
        if response.status_code == 401:
            # Attempt a single refresh and retry once
            self.logger.info("Strava request returned 401, attempting token refresh.")
            self.athlete.expires_at = 0
            self.ensure_access_token()
            headers["Authorization"] = f"Bearer {self.athlete.access_token}"
            response = requests.request(method, url, params=params, headers=headers, timeout=30)

        if response.status_code >= 400:
            raise StravaClientError(
                f"Strava API error ({response.status_code}): {response.text}"
            )
        return response.json()

    def iter_activities(
        self,
        *,
        after: Optional[datetime] = None,
        before: Optional[datetime] = None,
        per_page: int = 200,
    ) -> Iterator[Dict]:
        """
        Yield activities for the athlete, handling Strava pagination.
        `after`/`before` accept datetimes and are converted to Unix timestamps.
        """
        page = 1
        params = {"per_page": per_page}
        if after:
            params["after"] = int(after.timestamp())
        if before:
            params["before"] = int(before.timestamp())

        while True:
            params["page"] = page
            self.logger.debug(
                "Fetching Strava activities athlete_id=%s page=%s params=%s",
                self.athlete.id,
                page,
                params,
            )
            data = self._request("GET", "/athlete/activities", params=params)
            if not isinstance(data, list):
                raise StravaClientError("Unexpected response type for Strava activities")
            if not data:
                break
            for activity in data:
                yield activity
            if len(data) < per_page:
                break
            page += 1

    def fetch_activity_detail(self, activity_id: int) -> Dict:
        """
        Fetch a single activity with full details (needed for photos or splits).
        """
        return self._request("GET", f"/activities/{activity_id}")

    @staticmethod
    def normalize_activity(activity: Dict) -> Dict:
        """
        Convert a Strava activity payload into our storage schema.
        """
        return _normalize_activity_payload(activity)
