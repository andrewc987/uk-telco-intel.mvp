"""Vodafone Three News Centre ingestor – operator news via WordPress RSS."""

from __future__ import annotations

import json
import logging

from config import TELCO_TAG_KEYWORDS
from schemas import UpdateCreate
from ingestion.base import BaseIngestor, curl_fetch, parse_rss

logger = logging.getLogger(__name__)

FEED_URL = "https://www.vodafone.co.uk/newscentre/feed/"


def _extract_tags(text: str) -> str:
    lower = text.lower()
    found = [kw for kw in TELCO_TAG_KEYWORDS if kw.lower() in lower]
    if not any(kw in found for kw in ("Vodafone", "Three")):
        found.insert(0, "Vodafone")
    return ",".join(found)


class VodafoneThreeIngestor(BaseIngestor):
    source_name = "Vodafone Three"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        try:
            data = curl_fetch(FEED_URL)
            for entry in parse_rss(data, max_items=25):
                title = entry["title"]
                tags = _extract_tags(title + " " + entry["summary"])
                items.append(UpdateCreate(
                    source_type="operator",
                    source_name=self.source_name,
                    title=title,
                    summary=entry["summary"],
                    link_url=entry["link"] or None,
                    tags=tags,
                    importance_score=0.7,
                    raw_meta=json.dumps({"published": entry["published"]}),
                ))
        except Exception as exc:
            logger.warning("Vodafone Three fetch error: %s", exc)
        return items
