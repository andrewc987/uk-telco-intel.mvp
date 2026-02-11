"""Application configuration and constants."""

import os

# --- Database ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///telco_intel.db")

# Operator / topic tags to extract from titles & descriptions
TELCO_TAG_KEYWORDS = [
    "BT", "Openreach", "Virgin Media", "VMO2", "Sky", "Vodafone",
    "Three", "EE", "O2", "TalkTalk", "Hyperoptic", "CityFibre",
    "Community Fibre", "Gigaclear", "altnet", "FTTP", "FTTC",
    "FTTB", "5G", "4G", "LTE", "spectrum", "Ofcom", "DSIT",
]
