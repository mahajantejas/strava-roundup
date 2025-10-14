from pydantic import BaseModel
from typing import Optional

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
