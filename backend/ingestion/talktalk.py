"""TalkTalk News Centre ingestor – operator news via web scraping."""

from __future__ import annotations

import json
import logging

from config import TELCO_TAG_KEYWORDS
from schemas import UpdateCreate
from ingestion.base import BaseIngestor, curl_fetch, extract_links

logger = logging.getLogger(__name__)

NEWSROOM_URL = "https://www.talktalkgroup.com/newsroom"
BASE_URL = "https://www.talktalkgroup.com"


def _extract_tags(text: str) -> str:
    lower = text.lower()
    found = [kw for kw in TELCO_TAG_KEYWORDS if kw.lower() in lower]
    if "TalkTalk" not in found:
        found.insert(0, "TalkTalk")
    return ",".join(found)


class TalkTalkIngestor(BaseIngestor):
    source_name = "TalkTalk"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        try:
            html = curl_fetch(NEWSROOM_URL)
            links = extract_links(html)

            seen_urls: set[str] = set()
            for href, text in links:
                if "/newsroom/" not in href:
                    continue
                if href.rstrip("/").endswith("/newsroom"):
                    continue
                if not href.startswith("http"):
                    href = BASE_URL + href
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                title = text.strip()
                if not title or len(title) < 10:
                    continue

                tags = _extract_tags(title)
                items.append(UpdateCreate(
                    source_type="operator",
                    source_name=self.source_name,
                    title=title,
                    summary="",
                    link_url=href,
                    tags=tags,
                    importance_score=0.6,
                    raw_meta=json.dumps({"page": NEWSROOM_URL}),
                ))

                if len(items) >= 25:
                    break

        except Exception as exc:
            logger.warning("TalkTalk newsroom fetch error: %s", exc)
        return items
