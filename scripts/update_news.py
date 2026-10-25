#!/usr/bin/env python3
"""Daily climate-tech news update for NextGen Climate.

Reads the feeds in scripts/feeds.json, keeps only headline, source, date, link and a
topic tag (never article text), merges with the current data/news.json, and writes
the newest stories back. Uses only the Python standard library.

Run locally:  python3 scripts/update_news.py
"""
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parent.parent
FEEDS_FILE = ROOT / "scripts" / "feeds.json"
TAGS_FILE = ROOT / "scripts" / "tags.json"
OUT_FILE = ROOT / "data" / "news.json"

KEEP = 60            # stories kept on the site
MAX_AGE_DAYS = 21    # drop stories older than this
PER_FEED = 15        # newest stories read from each feed
SKIP_WORDS = ["sponsored", "green deals", "deal alert", "podcast:", "newsletter:", "webinar", "% off"]
UA = "Mozilla/5.0 (compatible; NextGenClimateNewsBot/1.0; +https://github.com/)"

ATOM = "{http://www.w3.org/2005/Atom}"


def clean(text):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return re.sub(r"\s+", " ", text).strip()


def parse_date(value):
    if not value:
        return None
    value = value.strip()
    try:
        d = parsedate_to_datetime(value)
    except (TypeError, ValueError, IndexError):
        d = None
    if d is None:
        try:
            d = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)


def canonical_link(url):
    """Drop tracking query strings so the same story from two links is one story."""
    parts = urlsplit(url.strip())
    return urlunsplit((parts.scheme, parts.netloc.lower(), parts.path.rstrip("/"), "", ""))


def title_key(title):
    return re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def parse_feed(raw, source):
    root = ET.fromstring(raw)
    items = []
    if root.tag == f"{ATOM}feed":
        for e in root.findall(f"{ATOM}entry"):
            link = ""
            for l in e.findall(f"{ATOM}link"):
                if l.get("rel", "alternate") == "alternate":
                    link = l.get("href", "")
                    break
            items.append({
                "title": clean(e.findtext(f"{ATOM}title")),
                "link": link,
                "date": parse_date(e.findtext(f"{ATOM}published") or e.findtext(f"{ATOM}updated")),
                "hint": clean(e.findtext(f"{ATOM}summary")) + " " + " ".join(c.get("term", "") for c in e.findall(f"{ATOM}category")),
            })
    else:
        for it in root.iter("item"):
            items.append({
                "title": clean(it.findtext("title")),
                "link": (it.findtext("link") or "").strip(),
                "date": parse_date(it.findtext("pubDate") or it.findtext("{http://purl.org/dc/elements/1.1/}date")),
                "hint": clean(it.findtext("description"))[:400] + " " + " ".join(clean(c.text) for c in it.findall("category")),
            })
    out = []
    for i in items:
        if not i["title"] or not i["link"].startswith("http"):
            continue
        if any(w in i["title"].lower() for w in SKIP_WORDS):
            continue
        i["source"] = source
        out.append(i)
    out.sort(key=lambda x: x["date"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return out[:PER_FEED]


def compile_rules(tags):
    rules = []
    for tag, words in tags.items():
        pats = [re.compile(r"(?<![a-z0-9])" + re.escape(w.lower()) + r"(?![a-z0-9])") for w in words]
        rules.append((tag, pats))
    return rules


def pick_tag(title, hint, rules):
    t, h = title.lower(), (hint or "").lower()
    best, best_score = "Other", 0
    for tag, pats in rules:
        score = sum(2 for p in pats if p.search(t)) + sum(1 for p in pats if p.search(h))
        if score > best_score:
            best, best_score = tag, score
    return best


def main():
    feeds = json.loads(FEEDS_FILE.read_text())["feeds"]
    rules = compile_rules(json.loads(TAGS_FILE.read_text())["tags"])
    now = datetime.now(timezone.utc)

    fresh, failed = [], []
    for f in feeds:
        try:
            got = parse_feed(fetch(f["url"]), f["name"])
            print(f"OK    {f['name']}: {len(got)} stories")
            fresh.extend(got)
        except Exception as e:  # noqa: BLE001 - one bad feed should never stop the update
            print(f"SKIP  {f['name']}: {e}")
            failed.append(f["name"])

    existing, old_updated = [], None
    if OUT_FILE.exists():
        try:
            old = json.loads(OUT_FILE.read_text())
            existing = [i for i in old.get("items", []) if not i.get("sample")]
            old_updated = old.get("updated") if existing else None
        except json.JSONDecodeError:
            existing = []

    stories, seen_links, seen_titles = [], set(), set()
    for i in fresh:
        d = i["date"] or now
        stories.append({
            "title": i["title"][:220],
            "link": i["link"],
            "source": i["source"],
            "date": d.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tag": pick_tag(i["title"], i["hint"], rules),
        })
    stories.extend(existing)

    cutoff = now - timedelta(days=MAX_AGE_DAYS)
    stories.sort(key=lambda s: s["date"], reverse=True)
    result = []
    for s in stories:
        lk, tk = canonical_link(s["link"]), title_key(s["title"])
        if lk in seen_links or tk in seen_titles:
            continue
        if parse_date(s["date"]) and parse_date(s["date"]) < cutoff:
            continue
        if parse_date(s["date"]) and parse_date(s["date"]) > now + timedelta(hours=6):
            s["date"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        seen_links.add(lk); seen_titles.add(tk)
        result.append(s)
        if len(result) >= KEEP:
            break

    if not fresh and not existing:
        print("No feeds worked and there is no saved news. Leaving data/news.json unchanged.")
        return 1 if len(failed) == len(feeds) else 0

    OUT_FILE.write_text(json.dumps({
        "updated": now.strftime("%Y-%m-%dT%H:%M:%SZ") if fresh else old_updated,
        "failed_feeds": failed,
        "items": result,
    }, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(result)} stories to {OUT_FILE.relative_to(ROOT)} ({len(failed)} feeds skipped).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
