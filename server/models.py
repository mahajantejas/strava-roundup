from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Athlete(Base):
    __tablename__ = "athletes"
    id = Column(Integer, primary_key=True, index=True)
    strava_id = Column(BigInteger, unique=True, index=True)
    firstname = Column(String)
    lastname = Column(String)
    profile_image_url = Column(String)
    access_token = Column(String)
    refresh_token = Column(String)
    expires_at = Column(Integer)
    activities = relationship(
        "Activity",
        back_populates="athlete",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(
        Integer,
        ForeignKey("athletes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    strava_activity_id = Column(BigInteger, nullable=False)
    name = Column(String(255))
    activity_type = Column(String(64), index=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    start_date_local = Column(DateTime(timezone=True))
    timezone = Column(String(64))
    distance_km = Column(Float)  # stored in kilometers
    moving_time_seconds = Column(Integer)
    elapsed_time_seconds = Column(Integer)
    total_elevation_gain = Column(Float)
    summary_polyline = Column(Text)
    primary_photo_url = Column(String(512))
    raw_payload = Column(JSON)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    athlete = relationship("Athlete", back_populates="activities")


Index(
    "ix_activities_athlete_strava",
    Activity.athlete_id,
    Activity.strava_activity_id,
    unique=True,
)
Index("ix_activities_start_date", Activity.start_date)
