"""GOV.UK Content API ingestor – policy & regulation documents."""

from __future__ import annotations

import json
import logging

import requests

from config import GOVUK_ORGS, GOVUK_KEYWORDS
from schemas import UpdateCreate
from ingestion.base import BaseIngestor

logger = logging.getLogger(__name__)

SEARCH_URL = "https://www.gov.uk/api/search.json"


class GovUKIngestor(BaseIngestor):
    source_name = "GOV.UK"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        for org in GOVUK_ORGS:
            for kw in GOVUK_KEYWORDS:
                try:
                    params = {
                        "filter_organisations": org,
                        "q": kw,
                        "order": "-public_timestamp",
                        "count": 5,
                    }
                    resp = requests.get(SEARCH_URL, params=params, timeout=15)
                    resp.raise_for_status()
                    data = resp.json()
                    for r in data.get("results", []):
                        title = r.get("title", "").strip()
                        if not title:
                            continue
                        link = "https://www.gov.uk" + r.get("link", "")
                        desc = r.get("description", "") or ""
                        orgs = ",".join(
                            o.get("title", "")
                            for o in r.get("organisations", [])
                        )
                        tags_list = [t for t in [org, kw] if t]
                        items.append(UpdateCreate(
                            source_type="policy",
                            source_name=self.source_name,
                            title=title,
                            summary=desc[:500],
                            link_url=link,
                            tags=",".join(tags_list),
                            importance_score=0.6,
                            raw_meta=json.dumps(r, default=str),
                        ))
                except Exception as exc:
                    logger.warning("GOV.UK fetch error org=%s kw=%s: %s", org, kw, exc)
        return items
