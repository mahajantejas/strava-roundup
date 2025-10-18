from __future__ import annotations

from calendar import monthrange
from collections import Counter, defaultdict
from datetime import date as date_cls
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from activity_sync import AthleteNotFoundError
from models import Activity, Athlete
from schemas import (
    ActivitySplitEntry,
    CalendarDayEntry,
    MonthlyInsights,
    MonthlyRoundup,
    MostActiveDay,
    MostActiveTimeOfDay,
)


def _parse_month(month: Optional[str]) -> date_cls:
    if month is None:
        now = datetime.now(timezone.utc)
        return date_cls(now.year, now.month, 1)

    try:
        year_str, month_str = month.split("-", 1)
        year = int(year_str)
        month_number = int(month_str)
        if not 1 <= month_number <= 12:
            raise ValueError
        return date_cls(year, month_number, 1)
    except (ValueError, AttributeError):
        raise ValueError("month must be formatted as YYYY-MM")


def _next_month_start(month_start: datetime) -> datetime:
    if month_start.month == 12:
        return datetime(month_start.year + 1, 1, 1, tzinfo=timezone.utc)
    return datetime(month_start.year, month_start.month + 1, 1, tzinfo=timezone.utc)


def build_monthly_roundup(
    db: Session,
    athlete_id: int,
    month: Optional[str] = None,
) -> MonthlyRoundup:
    month_date = _parse_month(month)
    month_start = datetime(month_date.year, month_date.month, 1, tzinfo=timezone.utc)
    month_end = _next_month_start(month_start)

    athlete_exists = db.query(Athlete.id).filter(Athlete.id == athlete_id).one_or_none()
    if not athlete_exists:
        raise AthleteNotFoundError(f"Athlete {athlete_id} was not found")

    activities = (
        db.query(Activity)
        .filter(Activity.athlete_id == athlete_id)
        .filter(Activity.start_date >= month_start)
        .filter(Activity.start_date < month_end)
        .all()
    )

    total_distance = 0.0
    total_moving_time = 0
    total_elevation = 0.0
    total_activities = len(activities)

    day_buckets = defaultdict(
        lambda: {
            "total_activities": 0,
            "total_distance_km": 0.0,
            "total_moving_time_seconds": 0,
        }
    )
    hour_buckets = defaultdict(
        lambda: {"total_activities": 0, "total_moving_time_seconds": 0}
    )
    activity_split_counter: Counter[str] = Counter()

    for activity in activities:
        distance = float(activity.distance_km or 0.0)
        moving_time = int(activity.moving_time_seconds or 0)
        elevation = float(activity.total_elevation_gain or 0.0)

        total_distance += distance
        total_moving_time += moving_time
        total_elevation += elevation
        activity_split_counter[activity.activity_type or "Other"] += 1

        start_dt = activity.start_date or activity.start_date_local
        if start_dt is None:
            continue
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        else:
            start_dt = start_dt.astimezone(timezone.utc)

        day_key = start_dt.date()
        if day_key.month != month_date.month or day_key.year != month_date.year:
            continue

        day_bucket = day_buckets[day_key]
        day_bucket["total_activities"] += 1
        day_bucket["total_distance_km"] += distance
        day_bucket["total_moving_time_seconds"] += moving_time

        hour_source = activity.start_date_local or activity.start_date
        if hour_source is None:
            hour_source = start_dt
        if hour_source.tzinfo is None:
            hour_source = hour_source.replace(tzinfo=timezone.utc)
        hour_bucket = hour_buckets[hour_source.hour]
        hour_bucket["total_activities"] += 1
        hour_bucket["total_moving_time_seconds"] += moving_time

    days_in_month = monthrange(month_date.year, month_date.month)[1]
    calendar_days = []
    for day in range(1, days_in_month + 1):
        date_obj = date_cls(month_date.year, month_date.month, day)
        bucket = day_buckets.get(date_obj, None)
        is_active = bucket["total_activities"] > 0 if bucket else False
        calendar_days.append(
            CalendarDayEntry(
                day=day,
                date=date_obj,
                is_active=is_active,
                total_activities=bucket["total_activities"] if bucket else 0,
                total_distance_km=round(bucket["total_distance_km"], 3) if bucket else 0.0,
                total_moving_time_seconds=(
                    bucket["total_moving_time_seconds"] if bucket else 0
                ),
            )
        )

    active_days = [entry for entry in calendar_days if entry.is_active]

    if active_days:
        most_active_day_entry = max(
            active_days,
            key=lambda entry: (
                entry.total_moving_time_seconds,
                entry.total_distance_km,
                entry.total_activities,
            ),
        )
        most_active_day = MostActiveDay(
            date=most_active_day_entry.date,
            total_activities=most_active_day_entry.total_activities,
            total_distance_km=most_active_day_entry.total_distance_km,
            total_moving_time_seconds=most_active_day_entry.total_moving_time_seconds,
        )
    else:
        most_active_day = None

    if hour_buckets:
        most_active_hour, hour_stats = max(
            hour_buckets.items(),
            key=lambda item: (item[1]["total_activities"], item[1]["total_moving_time_seconds"]),
        )
        most_active_time = MostActiveTimeOfDay(
            hour=most_active_hour,
            total_activities=hour_stats["total_activities"],
            total_moving_time_seconds=hour_stats["total_moving_time_seconds"],
        )
    else:
        most_active_time = None

    average_activity_time_seconds: Optional[int]
    if active_days:
        average_activity_time_seconds = int(total_moving_time / len(active_days))
    else:
        average_activity_time_seconds = None

    week_starts = sorted(
        {
            entry.date - timedelta(days=entry.date.weekday())
            for entry in active_days
        },
        reverse=True,
    )
    weekly_streak = 0
    if week_starts:
        weekly_streak = 1
        previous_week = week_starts[0]
        for week_start in week_starts[1:]:
            if (previous_week - week_start).days == 7:
                weekly_streak += 1
                previous_week = week_start
            else:
                break

    split_entries = []
    for activity_type, count in activity_split_counter.most_common():
        percentage = (count / total_activities * 100) if total_activities else 0.0
        split_entries.append(
            ActivitySplitEntry(
                type=activity_type,
                count=count,
                percentage=round(percentage, 1),
            )
        )

    insights = MonthlyInsights(
        most_active_day=most_active_day,
        most_active_time_of_day=most_active_time,
        average_activity_time_seconds=average_activity_time_seconds,
        weekly_streak_weeks=weekly_streak,
    )

    return MonthlyRoundup(
        athlete_id=athlete_id,
        month=f"{month_date.year:04d}-{month_date.month:02d}",
        month_name=month_start.strftime("%B"),
        month_label=month_start.strftime("%B %Y"),
        period_start=month_start,
        period_end=month_end,
        total_active_days=len(active_days),
        total_activities=total_activities,
        total_distance_km=round(total_distance, 3),
        total_moving_time_seconds=total_moving_time,
        total_elevation_gain_m=round(total_elevation, 3),
        activity_split=split_entries,
        calendar_days=calendar_days,
        insights=insights,
    )
