from pydantic import BaseModel

class AthleteBase(BaseModel):
    firstname: str
    lastname: str
    strava_id: int
    access_token: str
    refresh_token: str
    expires_at: int

class AthleteCreate(AthleteBase):
    pass

class AthleteResponse(AthleteBase):
    id: int

    class Config:
        orm_mode = True
