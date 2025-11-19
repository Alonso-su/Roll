#!/usr/bin/env python3
"""
Simple RSS aggregator: reads `assets/roll.json`, for each friend with `feed_url` (or common feed endpoints),
fetches feed, extracts up to 3 newest entries and writes them into the `feeds` field.

Dependencies: feedparser, requests

Run locally:
  python scripts/aggregate_rss.py
"""
import json
import time
from datetime import datetime
from urllib.parse import urljoin

import feedparser
import requests

ASSETS_PATH = "assets/roll.json"
TIMEOUT = 10

COMMON_FEEDS = ["/index.xml", "/atom.xml", "/feed.xml", "/rss.xml"]


def try_fetch(url):
    try:
        r = requests.get(url, timeout=TIMEOUT, headers={"User-Agent": "rss-aggregator/1.0 (+https://example.com)"})
        if r.status_code == 200 and r.text.strip():
            return r.text
    except Exception:
        return None
    return None


def discover_feed(base_url):
    # If explicit feed_url is provided, caller will use it; this function tries common paths
    for suffix in COMMON_FEEDS:
        candidate = urljoin(base_url, suffix)
        txt = try_fetch(candidate)
        if txt:
            parsed = feedparser.parse(txt)
            if parsed.bozo == 0 and parsed.entries:
                return candidate
    return None


def entry_to_dict(e):
    title = e.get("title", "(no title)")
    link = e.get("link") or e.get("id") or ""
    published = ""
    if e.get("published_parsed"):
        published = datetime(*e.published_parsed[:6]).isoformat()
    else:
        published = e.get("published", "")
    summary = e.get("summary", "")
    return {"title": title, "link": link, "published": published, "summary": summary}


def process():
    with open(ASSETS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    changed = False

    for group in data.get("friends", []):
        for link in group.get("link_list", []):
            feed_url = link.get("feed_url")
            if not feed_url:
                # try discovering common feed endpoints
                discovered = discover_feed(link.get("link", ""))
                if discovered:
                    feed_url = discovered
            if not feed_url:
                # no feed for this link
                link.pop("feeds", None)
                continue

            try:
                parsed = feedparser.parse(feed_url)
                if parsed.bozo and not parsed.entries:
                    # try fetching raw then parsing
                    txt = try_fetch(feed_url)
                    if txt:
                        parsed = feedparser.parse(txt)
            except Exception:
                parsed = None

            feeds_out = []
            if parsed and parsed.entries:
                for e in parsed.entries[:3]:
                    feeds_out.append(entry_to_dict(e))

            # Normalize and compare
            old = link.get("feeds", [])
            if feeds_out:
                link["feeds"] = feeds_out
                link["feed_url"] = feed_url
                if old != feeds_out:
                    changed = True
            else:
                # remove if empty
                if "feeds" in link:
                    link.pop("feeds", None)
                    changed = True

            # be polite
            time.sleep(0.2)

    if changed:
        with open(ASSETS_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("assets/roll.json updated")
    else:
        print("no changes")


if __name__ == "__main__":
    process()
