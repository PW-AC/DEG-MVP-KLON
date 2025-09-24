# Local Development

## Backend (no database)

The backend was refactored to remove MongoDB temporarily. All data is stored in-memory for local development. This means data resets on server restart.

- Start backend: `uvicorn backend.server:app --reload --port 8000`
- Health checks: `GET /health` and `GET /api/health`

## Frontend

- Start frontend: `cd frontend && yarn start`
- API base: The app uses `REACT_APP_BACKEND_URL` if set; otherwise it uses window origin. In dev, a proxy at `http://localhost:8000` forwards `"/api"` calls.

## Environment

See `.env.example` files under `frontend/` and `backend/`.

# Here are your Instructions
