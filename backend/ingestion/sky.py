"""Sky ingestor – operator news via Google News RSS (Sky site is JS-rendered)."""

from __future__ import annotations

import json
import logging

from config import TELCO_TAG_KEYWORDS
from schemas import UpdateCreate
from ingestion.base import BaseIngestor, curl_fetch, parse_rss

logger = logging.getLogger(__name__)

# Sky's press site is fully JS-rendered (Next.js), so we use Google News
# with a targeted query to get Sky UK corporate/telecoms news.
FEED_URL = (
    "https://news.google.com/rss/search?"
    "q=%22Sky%22+UK+telecoms+OR+broadband+OR+%22Sky+Glass%22+OR+%22Sky+Broadband%22"
    "&hl=en-GB&gl=GB&ceid=GB:en"
)


def _extract_tags(text: str) -> str:
    lower = text.lower()
    found = [kw for kw in TELCO_TAG_KEYWORDS if kw.lower() in lower]
    if "Sky" not in found:
        found.insert(0, "Sky")
    return ",".join(found)


class SkyIngestor(BaseIngestor):
    source_name = "Sky"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        try:
            data = curl_fetch(FEED_URL)
            for entry in parse_rss(data, max_items=20):
                title = entry["title"]
                tags = _extract_tags(title + " " + entry["summary"])
                items.append(UpdateCreate(
                    source_type="operator",
                    source_name=self.source_name,
                    title=title,
                    summary=entry["summary"],
                    link_url=entry["link"] or None,
                    tags=tags,
                    importance_score=0.6,
                    raw_meta=json.dumps({"published": entry["published"]}),
                ))
        except Exception as exc:
            logger.warning("Sky fetch error: %s", exc)
        return items
