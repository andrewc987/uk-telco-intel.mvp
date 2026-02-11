"""Base ingestor interface and shared persistence helpers."""

from __future__ import annotations

import hashlib
import json
import logging
import subprocess
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from html.parser import HTMLParser

from database import SessionLocal
from models import Update
from schemas import UpdateCreate

logger = logging.getLogger(__name__)

# Atom namespace
_ATOM_NS = "{http://www.w3.org/2005/Atom}"


def curl_fetch(url: str, *, timeout: int = 20, user_agent: str = "Mozilla/5.0 (compatible; uk-telco-intel/0.1)") -> bytes:
    """Fetch a URL via curl subprocess (bypasses Python SSL quirks)."""
    result = subprocess.run(
        ["curl", "-sL", "--max-time", str(timeout), "-A", user_agent, url],
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"curl failed ({result.returncode}): {result.stderr.decode()[:200]}")
    return result.stdout


def parse_rss(xml_bytes: bytes, *, max_items: int = 25) -> list[dict]:
    """Parse RSS or Atom XML into a list of dicts with title/link/summary/published."""
    root = ET.fromstring(xml_bytes)
    entries: list[dict] = []

    # Try RSS <item> elements first
    items = root.findall(".//item")
    if items:
        for item in items[:max_items]:
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            summary = (item.findtext("description") or "").strip()
            published = (item.findtext("pubDate") or "").strip()
            if title:
                entries.append({
                    "title": title,
                    "link": link,
                    "summary": summary[:500] if summary else "",
                    "published": published,
                })
        return entries

    # Fall back to Atom <entry> elements
    for tag in [f"{_ATOM_NS}entry", "entry"]:
        items = root.findall(f".//{tag}")
        if items:
            break
    for item in items[:max_items]:
        title = (item.findtext(f"{_ATOM_NS}title") or item.findtext("title") or "").strip()
        # Atom links are in <link href="..."/>
        # Note: Element.__bool__ is False for childless elements, so use
        # explicit `is None` checks instead of `or`.
        link_el = item.find(f"{_ATOM_NS}link[@href]")
        if link_el is None:
            link_el = item.find("link[@href]")
        link = link_el.get("href", "") if link_el is not None else ""
        summary = (
            item.findtext(f"{_ATOM_NS}summary")
            or item.findtext(f"{_ATOM_NS}content")
            or item.findtext("summary")
            or item.findtext("content")
            or ""
        ).strip()
        published = (
            item.findtext(f"{_ATOM_NS}updated")
            or item.findtext(f"{_ATOM_NS}published")
            or item.findtext("updated")
            or item.findtext("published")
            or ""
        ).strip()
        if title:
            entries.append({
                "title": title,
                "link": link,
                "summary": summary[:500] if summary else "",
                "published": published,
            })
    return entries


class _LinkExtractor(HTMLParser):
    """Minimal HTML parser that extracts <a href="...">text</a> pairs."""

    def __init__(self):
        super().__init__()
        self.links: list[tuple[str, str]] = []  # (href, text)
        self._current_href: str | None = None
        self._current_text: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            attr_dict = dict(attrs)
            href = attr_dict.get("href")
            if href:
                self._current_href = href
                self._current_text = []

    def handle_data(self, data):
        if self._current_href is not None:
            self._current_text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._current_href is not None:
            text = " ".join(self._current_text).strip()
            self.links.append((self._current_href, text))
            self._current_href = None
            self._current_text = []


def extract_links(html_bytes: bytes) -> list[tuple[str, str]]:
    """Extract (href, text) pairs from HTML using stdlib parser."""
    parser = _LinkExtractor()
    parser.feed(html_bytes.decode("utf-8", errors="replace"))
    return parser.links


class BaseIngestor(ABC):
    """Every concrete ingestor must set source_name and implement fetch()."""

    source_name: str = "Unknown"

    @abstractmethod
    def fetch(self) -> list[UpdateCreate]:
        """Return a list of candidate updates (not yet persisted)."""
        ...


def _dedup_key(item: UpdateCreate) -> str:
    """Produce a stable hash for duplicate detection."""
    raw = (item.link_url or "") + "|" + item.title
    return hashlib.sha256(raw.encode()).hexdigest()


def persist_updates(items: list[UpdateCreate]) -> int:
    """Insert new updates, skip duplicates.  Returns count of new rows."""
    if not items:
        return 0

    db = SessionLocal()
    created = 0
    try:
        # Build a set of hashes already in the DB for the same source
        source_names = {i.source_name for i in items}
        existing_rows = (
            db.query(Update.link_url, Update.title)
            .filter(Update.source_name.in_(source_names))
            .all()
        )
        existing_keys = set()
        for url, title in existing_rows:
            raw = (url or "") + "|" + title
            existing_keys.add(hashlib.sha256(raw.encode()).hexdigest())

        for item in items:
            key = _dedup_key(item)
            if key in existing_keys:
                continue
            row = Update(
                created_at=datetime.now(timezone.utc),
                source_type=item.source_type,
                source_name=item.source_name,
                title=item.title,
                summary=item.summary,
                link_url=item.link_url,
                tags=item.tags,
                importance_score=item.importance_score,
                raw_meta=item.raw_meta,
            )
            db.add(row)
            existing_keys.add(key)
            created += 1

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return created
