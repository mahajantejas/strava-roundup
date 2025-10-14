from sqlalchemy import Column, Integer, String, BigInteger
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