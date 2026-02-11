"""TalkTalk News Centre ingestor – operator news via web scraping (no RSS available)."""

from __future__ import annotations

import json
import logging

import requests
from bs4 import BeautifulSoup

from config import TELCO_TAG_KEYWORDS
from schemas import UpdateCreate
from ingestion.base import BaseIngestor

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
            resp = requests.get(NEWSROOM_URL, timeout=20, headers={
                "User-Agent": "Mozilla/5.0 (compatible; uk-telco-intel/0.1)",
            })
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            # TalkTalk newsroom lists articles as links within the newsroom page
            seen_urls: set[str] = set()
            for link in soup.find_all("a", href=True):
                href = link["href"]
                # Filter for newsroom article paths
                if "/newsroom/" not in href:
                    continue
                # Skip the newsroom index itself
                if href.rstrip("/").endswith("/newsroom"):
                    continue
                if not href.startswith("http"):
                    href = BASE_URL + href
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                title = link.get_text(strip=True)
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
