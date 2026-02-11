"""Reddit stub ingestor – forum chatter from UK telco subreddits.

Requires REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET env vars to be set.
Without them, this ingestor returns an empty list.
"""

from __future__ import annotations

import json
import logging

import requests

from config import (
    REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET,
    REDDIT_USER_AGENT,
    REDDIT_SUBREDDITS,
)
from schemas import UpdateCreate
from ingestion.base import BaseIngestor

logger = logging.getLogger(__name__)


class RedditStubIngestor(BaseIngestor):
    source_name = "Reddit"

    def fetch(self) -> list[UpdateCreate]:
        if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
            logger.info("Reddit credentials not configured – skipping ingestion.")
            return []

        items: list[UpdateCreate] = []
        try:
            # Obtain OAuth token
            auth = requests.auth.HTTPBasicAuth(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET)
            token_resp = requests.post(
                "https://www.reddit.com/api/v1/access_token",
                auth=auth,
                data={"grant_type": "client_credentials"},
                headers={"User-Agent": REDDIT_USER_AGENT},
                timeout=10,
            )
            token_resp.raise_for_status()
            token = token_resp.json()["access_token"]
            headers = {
                "Authorization": f"Bearer {token}",
                "User-Agent": REDDIT_USER_AGENT,
            }

            for sub in REDDIT_SUBREDDITS:
                try:
                    resp = requests.get(
                        f"https://oauth.reddit.com/r/{sub}/new.json?limit=10",
                        headers=headers,
                        timeout=10,
                    )
                    resp.raise_for_status()
                    posts = resp.json().get("data", {}).get("children", [])
                    for post in posts:
                        d = post.get("data", {})
                        title = d.get("title", "").strip()
                        if not title:
                            continue
                        items.append(UpdateCreate(
                            source_type="forum",
                            source_name=self.source_name,
                            title=title,
                            summary=d.get("selftext", "")[:500],
                            link_url=f"https://reddit.com{d.get('permalink', '')}",
                            tags=f"reddit,r/{sub}",
                            importance_score=0.3,
                            raw_meta=json.dumps({
                                "subreddit": sub,
                                "score": d.get("score", 0),
                                "num_comments": d.get("num_comments", 0),
                            }),
                        ))
                except Exception as exc:
                    logger.warning("Reddit fetch error sub=%s: %s", sub, exc)
        except Exception as exc:
            logger.warning("Reddit auth error: %s", exc)

        return items
