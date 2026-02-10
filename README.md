# UK Telco Intelligence Platform – MVP

A lightweight dashboard that aggregates UK telecom industry updates from free / low-cost data sources.

## Project structure

```
backend/        Python + FastAPI API server
frontend/       Single-page HTML/JS dashboard
```

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

- **Health check** – `GET /api/health`
- **Updates feed** – `GET /api/updates`

### 2. Frontend

Open `frontend/index.html` in a browser (or serve it with any static file server).

If you open the file directly (`file://`), the JS will call `http://localhost:8000` automatically. CORS is enabled on the backend so this works out of the box.

Alternatively, serve with Python:

```bash
cd frontend
python -m http.server 3000
```

Then visit `http://localhost:3000`.
