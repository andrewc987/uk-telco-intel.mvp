"""ISPReview RSS ingestor – trade press."""

from __future__ import annotations

import json
import logging

from config import TELCO_TAG_KEYWORDS
from schemas import UpdateCreate
from ingestion.base import BaseIngestor, curl_fetch, parse_rss

logger = logging.getLogger(__name__)

FEED_URL = "https://www.ispreview.co.uk/index.php/feed"


def _extract_tags(text: str) -> str:
    lower = text.lower()
    found = [kw for kw in TELCO_TAG_KEYWORDS if kw.lower() in lower]
    return ",".join(found) if found else "broadband"


class ISPReviewIngestor(BaseIngestor):
    source_name = "ISPReview"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        try:
            data = curl_fetch(FEED_URL)
            for entry in parse_rss(data, max_items=25):
                title = entry["title"]
                tags = _extract_tags(title + " " + entry["summary"])
                items.append(UpdateCreate(
                    source_type="trade_press",
                    source_name=self.source_name,
                    title=title,
                    summary=entry["summary"],
                    link_url=entry["link"] or None,
                    tags=tags,
                    importance_score=0.5,
                    raw_meta=json.dumps({"published": entry["published"]}),
                ))
        except Exception as exc:
            logger.warning("ISPReview fetch error: %s", exc)
        return items
