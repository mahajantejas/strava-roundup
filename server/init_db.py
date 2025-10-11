from database import Base, engine
from models import Athlete

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")