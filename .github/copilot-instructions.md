## Quick orientation

This repo implements a small FastAPI backend (server/) and a React + Vite frontend (client/).

- Backend: `server/app.py` mounts `server/auth.py` (Strava OAuth) and exposes a small REST surface for athletes. DB models live in `server/models.py` and Pydantic schemas in `server/schemas.py`.
- Frontend: `client/` is a Vite + React app. `client/vite.config.js` defines an alias `@` -> `client/src` and a dev proxy that forwards `/auth/strava` and `/auth/strava/callback` to the backend.

## The core data & auth flow (most important)

1. Frontend calls `/auth/strava` (proxied in dev) to start OAuth.
2. `server/auth.py` redirects the user to Strava and later handles `/auth/strava/callback`, exchanges the code for tokens and persists an `Athlete` (see `server/models.py`).
3. After persistence the backend redirects the browser to `FRONTEND_CALLBACK_URL` (defaults to `http://localhost:5173/auth/callback`) with `status`, `name`, `db_id`, `strava_id` and optionally `image` query params.
4. The React route `client/src/AuthCallback.jsx` reads those params, stores `athleteName`/`athleteImage` in localStorage and navigates to `/dashboard`.

Files to reference for examples: `server/auth.py`, `server/models.py`, `server/schemas.py`, `client/src/AuthCallback.jsx`, `client/src/Dashboard.jsx`.

## How to run (developer commands)

- Create or update environment variables (used by `server/database.py` and `server/auth.py`):
  - DATABASE_URL (SQLAlchemy URI)
  - STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI
  - FRONTEND_CALLBACK_URL (optional; default `http://localhost:5173/auth/callback`)

- Initialize DB tables (idempotent migration included):
  - python server/init_db.py

- Run backend (development):
  - uvicorn server.app:app --reload --port 8000

- Run frontend (development):
  - cd client && npm install
  - npm run dev  # Vite dev server (default: http://localhost:5173)

- Build frontend for production:
  - cd client && npm run build

Notes: the Vite dev server proxies auth routes to the backend on port 8000 (see `client/vite.config.js`). Keep backend running on port 8000 during local dev.

## DB & local setup notes

- `server/database.py` uses `load_dotenv()` so a `.env` file at repo root is supported. `init_db.py` creates tables and attempts to add `profile_image_url` column if missing.
- SQLAlchemy sessions: `SessionLocal` is a `sessionmaker`; code sometimes uses `with SessionLocal() as db:` (see `server/auth.py`).

## Frontend conventions & patterns

- Path alias: import `@/` maps to `client/src/` (see `client/vite.config.js`).
- UI components live under `client/src/components/ui/` and include small `.tsx` primitives (button, card, badge). Use these when modifying UI to stay consistent.
- `client/src/lib/utils.ts` exposes `cn(...)` (clsx + tailwind-merge) for composing Tailwind classes — prefer it over manual string concatenation.
- The app stores minimal auth state in `localStorage` (keys: `athleteName`, `athleteImage`) instead of a centralized auth store; many components read directly from localStorage.

## Patterns agents should follow when editing

- Prefer small, localized changes. Backend API shape is minimal—changing response fields requires updating `server/schemas.py` and the frontend consumers (AuthCallback, Dashboard).
- When touching auth, preserve the redirect param contract (`status`, `name`, `db_id`, `strava_id`, `image`) — the frontend depends on those exact names.
- When adding client-side network calls during dev, use relative paths (e.g. `/auth/strava`) so Vite's proxy forwards to the backend.

## Where to look next (quick links)

- Backend entry: `server/app.py`
- OAuth + persistence: `server/auth.py`
- DB models: `server/models.py`
- DB init: `server/init_db.py`
- Frontend entry: `client/src/main.jsx`, routes in `client/src/App.jsx`
- Dev scripts & deps: `client/package.json`

If any section needs more detail (examples of env values, preferred test commands, or CI expectations), tell me which part to expand and I will iterate.
