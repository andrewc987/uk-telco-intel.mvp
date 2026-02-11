"""Application configuration and constants."""

import os

# --- Database ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///telco_intel.db")

# --- Ingestion keywords ---
GOVUK_ORGS = [
    "ofcom",
    "department-for-science-innovation-and-technology",
    "competition-and-markets-authority",
]
GOVUK_KEYWORDS = [
    "telecoms",
    "telecommunications",
    "broadband",
    "mobile",
    "spectrum",
    "5G",
    "digital infrastructure",
    "fibre",
]

# Operator / topic tags to extract from titles & descriptions
TELCO_TAG_KEYWORDS = [
    "BT", "Openreach", "Virgin Media", "VMO2", "Sky", "Vodafone",
    "Three", "EE", "O2", "TalkTalk", "Hyperoptic", "CityFibre",
    "Community Fibre", "Gigaclear", "altnet", "FTTP", "FTTC",
    "FTTB", "5G", "4G", "LTE", "spectrum", "Ofcom",
]

# --- Reddit (stubbed – supply keys via env) ---
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "uk-telco-intel/0.1")
REDDIT_SUBREDDITS = ["virginmedia", "threeuk", "UKBroadband"]

# --- Ingestion look-back window (hours) ---
GOVUK_LOOKBACK_HOURS = 48
