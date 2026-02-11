"""Environment Agency flood warnings ingestor."""

from __future__ import annotations

import json
import logging

import requests

from schemas import UpdateCreate
from ingestion.base import BaseIngestor

logger = logging.getLogger(__name__)

# EA real-time flood monitoring API – current warnings
FLOOD_WARNINGS_URL = "https://environment.data.gov.uk/flood-monitoring/id/floods?min-severity=3&_limit=20"


class EnvAgencyIngestor(BaseIngestor):
    source_name = "EnvironmentAgency"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        try:
            resp = requests.get(FLOOD_WARNINGS_URL, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            for item_data in data.get("items", [])[:20]:
                area = item_data.get("floodArea", {})
                county = area.get("county", "Unknown area")
                river = area.get("riverOrSea", "")
                severity = item_data.get("severityLevel", "")
                label = item_data.get("description", county)

                title = f"Flood warning: {label}"
                summary_parts = []
                if river:
                    summary_parts.append(f"River/sea: {river}.")
                if severity:
                    summary_parts.append(f"Severity: {severity}.")
                summary_parts.append(f"Area: {county}.")
                summary = " ".join(summary_parts)[:500]

                link = item_data.get("@id", None)
                if link and not link.startswith("http"):
                    link = None

                items.append(UpdateCreate(
                    source_type="incident",
                    source_name=self.source_name,
                    title=title,
                    summary=summary,
                    link_url=link,
                    tags="flood,risk",
                    importance_score=0.7,
                    raw_meta=json.dumps(item_data, default=str),
                ))
        except Exception as exc:
            logger.warning("Environment Agency fetch error: %s", exc)
        return items
