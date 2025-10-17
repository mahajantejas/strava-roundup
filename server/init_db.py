from database import Base, engine
from models import Athlete, Activity
from sqlalchemy import text

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")

# Idempotent migration: add profile_image_url if it doesn't exist
try:
    with engine.connect() as conn:
        # Works for Postgres; SQLite will ignore if already exists due to exception handling
        conn.execute(text("""
            DO $$ BEGIN
                BEGIN
                    ALTER TABLE athletes ADD COLUMN profile_image_url VARCHAR(512);
                EXCEPTION WHEN duplicate_column THEN
                    NULL;
                END;
            END $$;
        """))
        conn.commit()
        print("✅ Ensured column profile_image_url exists")
except Exception:
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE athletes ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(512)"))
            conn.commit()
            print("✅ Ensured column profile_image_url exists (fallback)")
    except Exception as _:
        # As a final fallback, ignore if DB doesn't support IF NOT EXISTS; developer can apply manually
        print("ℹ️ Could not auto-add profile_image_url; it may already exist or DB doesn't support this DDL.")
