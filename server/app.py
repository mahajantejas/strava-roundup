from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Athlete
from schemas import AthleteCreate, AthleteResponse
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router


app = FastAPI()
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React (Vite) dev server
        "http://127.0.0.1:5173",  # sometimes Vite runs on this
    ],
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # allow all headers
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Strava Monthly Roundup Backend is running, pun intended!"}

@app.post("/athletes", response_model=AthleteResponse)
def create_athlete(athlete: AthleteCreate, db: Session = Depends(get_db)):
    db_athlete = Athlete(**athlete.dict())
    db.add(db_athlete)
    db.commit()
    db.refresh(db_athlete)
    return db_athlete

@app.get("/athletes")
def get_athletes(db: Session = Depends(get_db)):
    return db.query(Athlete).all()
