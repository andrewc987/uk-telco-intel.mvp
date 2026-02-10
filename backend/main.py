"""UK Telco Intelligence Platform – API skeleton."""

from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="UK Telco Intel", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dummy updates – will be replaced by real ingestion later
DUMMY_UPDATES = [
    {
        "id": 1,
        "source": "Ofcom",
        "headline": "Ofcom publishes latest Connected Nations report",
        "timestamp": "2025-06-01T09:00:00Z",
    },
    {
        "id": 2,
        "source": "BT Group",
        "headline": "BT announces FTTP rollout milestone – 15m premises passed",
        "timestamp": "2025-05-28T14:30:00Z",
    },
    {
        "id": 3,
        "source": "Vodafone UK",
        "headline": "Vodafone UK completes 5G SA core upgrade",
        "timestamp": "2025-05-25T11:00:00Z",
    },
    {
        "id": 4,
        "source": "Three UK",
        "headline": "Three UK merger update: CMA phase-2 review ongoing",
        "timestamp": "2025-05-20T16:45:00Z",
    },
    {
        "id": 5,
        "source": "Virgin Media O2",
        "headline": "VMO2 expands fixed-wireless broadband trial",
        "timestamp": "2025-05-18T08:15:00Z",
    },
]


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/updates")
def get_updates():
    return {"updates": DUMMY_UPDATES}
