# strava-roundup

Generate Strava-inspired roundup stats across your activities.

## Backend setup

1. Copy `.env.example` to `.env` and fill in your real Strava credentials plus the Postgres connection string.
2. Install the server dependencies (for example: `pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv requests` inside your virtualenv).
3. Create or update the tables: `python server/init_db.py`.
4. Start the API: `uvicorn app:app --reload --port 8000 --app-dir server`.

## Syncing Strava activities

- After authenticating an athlete, trigger a manual sync with `POST /athletes/{athlete_id}/sync`. Optionally pass a `since` ISO timestamp to backfill a specific window.
- Example curl:

  ```bash
  curl -X POST "http://localhost:8000/athletes/1/sync"
  ```

- The response includes counts for `fetched`, `created`, `updated`, and the timestamp of the latest activity pulled.

## Local fixtures and testing

- Seed sample data without hitting Strava: `python scripts/seed_strava_samples.py`.
- Run the new sync/unit tests: `pytest server/tests`.

## Frontend

The React/Vite client lives in `client/`. Follow the README inside that folder to run the development server.
