#!/usr/bin/env python3
"""Turns the published "Public" tab of the NextGen Climate Google Sheet into site data.

Writes data/submissions.json, data/stats.json and data/featured.json.

Where the sheet comes from:
  * the SHEET_CSV_URL environment variable (set as a GitHub Actions secret), or
  * a local file for testing:  python3 scripts/update_submissions.py --csv sample.csv

Safety rules built in:
  * Stops with an error if the published sheet has an email or age column, because that
    means the private responses tab was published by mistake.
  * Keeps only first names, strips emails, phone numbers and links out of text.
  * Only rows marked Approved are used (when that column is present).
"""
import argparse
import csv
import hashlib
import io
import json
import os
import random
import re
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
MAX_WORDS = 90

FIELDS = {  # site field -> words to look for in the sheet's header
    "timestamp": ["timestamp", "submitted"],
    "first_name": ["first name", "firstname"],
    "school": ["school"],
    "country": ["country"],
    "category": ["category", "topic"],
    "title": ["project title", "title"],
    "description": ["description", "describe"],
    "photo": ["photo", "image", "picture"],
    "approved": ["approved"],
    "featured": ["featured"],
}
PRIVATE_HEADER_WORDS = ["email", "e-mail", "age", "phone", "last name", "surname"]

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(?:\+?\d[\s().-]?){7,}\d")
URL_RE = re.compile(r"(?:https?://|www\.)\S+", re.I)


def now_utc():
    return datetime.now(timezone.utc)


def iso(d):
    return d.strftime("%Y-%m-%dT%H:%M:%SZ")


def truthy(v):
    return str(v).strip().lower() in {"true", "yes", "y", "1", "x", "✓", "checked"}


def map_headers(headers):
    lower = [h.strip().lower() for h in headers]
    for h in lower:
        if any(re.search(r"(?<![a-z])" + re.escape(w) + r"(?![a-z])", h) for w in PRIVATE_HEADER_WORDS):
            raise SystemExit(
                f"STOP: the published sheet has a private column ('{h}').\n"
                "Publish only the 'Public' tab (File > Share > Publish to web > choose the Public tab > CSV).\n"
                "Then unpublish the responses tab so emails are not public."
            )
    found = {}
    for field, words in FIELDS.items():
        for i, h in enumerate(lower):
            if i in found.values():
                continue
            if any(w in h for w in words):
                found[field] = i
                break
    missing = [f for f in ("first_name", "school", "country", "title") if f not in found]
    if missing:
        raise SystemExit(f"STOP: could not find these columns in the sheet: {', '.join(missing)}. Headers seen: {headers}")
    return found


def scrub(text):
    text = EMAIL_RE.sub("", text or "")
    text = URL_RE.sub("", text)
    text = PHONE_RE.sub("", text)
    text = re.sub(r"\s+", " ", text)
    return re.sub(r"\s+([,.;:!?])", r"\1", text).strip(" ,;")


def first_name(raw):
    token = (raw or "").strip().split()[0] if (raw or "").strip() else ""
    token = re.sub(r"[^A-Za-zÀ-ÖØ-öø-ÿ'\-]", "", token)[:30]
    return token[:1].upper() + token[1:] if token else ""


def limit_words(text, n=MAX_WORDS):
    words = text.split()
    return text if len(words) <= n else " ".join(words[:n]) + "…"


def photo_url(raw):
    raw = (raw or "").strip()
    if not raw.lower().startswith("https://"):
        return ""
    m = re.search(r"drive\.google\.com/(?:file/d/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})", raw)
    if m:  # Google Drive share link -> image URL that works in <img>
        return f"https://drive.google.com/thumbnail?id={m.group(1)}&sz=w1000"
    return raw[:500]


def load_countries():
    path = DATA / "countries.txt"
    if not path.exists():
        return {}
    return {c.strip().lower(): c.strip() for c in path.read_text(encoding="utf-8").splitlines() if c.strip()}


def parse_timestamp(v):
    v = (v or "").strip()
    for fmt in ("%m/%d/%Y %H:%M:%S", "%d/%m/%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(v, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return None


def read_rows(args):
    if args.csv:
        return Path(args.csv).read_text(encoding="utf-8-sig")
    url = os.environ.get("SHEET_CSV_URL", "").strip()
    if not url:
        print("SHEET_CSV_URL is not set yet. Keeping the current example data.")
        return None
    req = urllib.request.Request(url, headers={"User-Agent": "NextGenClimateBot/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read().decode("utf-8-sig")
    if body.lstrip().startswith("<"):
        raise SystemExit("STOP: the sheet link returned a web page, not CSV. Use the 'Publish to web' CSV link.")
    return body


def build(rows_text):
    reader = list(csv.reader(io.StringIO(rows_text)))
    if not reader:
        return []
    col = map_headers(reader[0])
    countries = load_countries()
    items, seen = [], set()
    for row in reader[1:]:
        get = lambda f: (row[col[f]].strip() if f in col and col[f] < len(row) else "")  # noqa: E731
        if "approved" in col and not truthy(get("approved")):
            continue
        name, school, title = first_name(get("first_name")), scrub(get("school"))[:80], scrub(get("title"))[:90]
        if not (name and school and title):
            continue
        country_raw = get("country")
        country = countries.get(country_raw.lower(), country_raw.strip().title())[:60]
        ts = parse_timestamp(get("timestamp"))
        uid = hashlib.sha1("|".join([get("timestamp"), name, school, title]).lower().encode()).hexdigest()[:8]
        if uid in seen:
            continue
        seen.add(uid)
        items.append({
            "id": uid,
            "first_name": name,
            "school": school,
            "country": country,
            "category": scrub(get("category"))[:40] or "Other",
            "title": title,
            "description": limit_words(scrub(get("description"))[:700]),
            "photo": photo_url(get("photo")),
            "date": iso(ts) if ts else None,
            "_featured": truthy(get("featured")),
        })
    items.sort(key=lambda s: s["date"] or "", reverse=True)
    return items


def stats(items, updated):
    return {
        "updated": updated,
        "innovators": len({(s["first_name"] + "|" + s["school"]).lower() for s in items}),
        "schools": len({s["school"].lower() for s in items}),
        "countries": len({s["country"] for s in items if s["country"]}),
        "submissions": len(items),
        "example": False,
    }


def this_monday(today=None):
    today = today or date.today()
    return today - timedelta(days=today.weekday())


def choose_featured(items):
    """Manual pick (Featured box ticked) wins. Otherwise rotate to a new random entry each Monday."""
    feat_path, hist_path = DATA / "featured.json", DATA / "featured_history.json"
    current = json.loads(feat_path.read_text()) if feat_path.exists() else {}
    history = json.loads(hist_path.read_text()) if hist_path.exists() else []
    history = [h for h in history if isinstance(h, str)]
    week = this_monday().isoformat()
    public = lambda s: {k: v for k, v in s.items() if not k.startswith("_")}  # noqa: E731

    if not items:
        return {"week_of": week, "mode": "none", "item": None}, history

    manual = [s for s in items if s["_featured"]]
    if manual:
        pick = manual[0]  # newest ticked row
        if pick["id"] not in history:
            history.append(pick["id"])
        return {"week_of": week, "mode": "manual", "item": public(pick)}, history

    cur_item = current.get("item") or {}
    still_there = any(s["id"] == cur_item.get("id") for s in items)
    if current.get("week_of") == week and still_there and not cur_item.get("example"):
        refreshed = next(s for s in items if s["id"] == cur_item.get("id"))
        return {"week_of": week, "mode": current.get("mode", "auto"), "item": public(refreshed)}, history

    pool = [s for s in items if s["id"] not in history] or items
    rng = random.Random(week)  # same pick if the job runs twice in one week
    pick = rng.choice(pool)
    history.append(pick["id"])
    return {"week_of": week, "mode": "auto", "item": public(pick)}, history


def write(path, obj):
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_examples(updated):
    """No approved entries yet: show the labelled example students so the site never looks empty.
    They are replaced automatically by the first approved entry."""
    ex = json.loads((DATA / "examples.json").read_text(encoding="utf-8"))
    items = ex["items"]
    write(DATA / "submissions.json", {"updated": updated, "items": items})
    write(DATA / "stats.json", dict(stats(items, updated), example=True))
    write(DATA / "featured.json", {"week_of": this_monday().isoformat(), "mode": "example", "item": ex["featured_item"]})
    print("No approved submissions yet. Showing the example entries until the first one is approved.")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", help="read a local CSV file instead of SHEET_CSV_URL")
    args = ap.parse_args()

    text = read_rows(args)
    if text is None:
        return 0
    items = build(text)
    updated = iso(now_utc())
    if not items:
        return write_examples(updated)
    featured, history = choose_featured(items)

    write(DATA / "submissions.json", {"updated": updated, "items": [{k: v for k, v in s.items() if not k.startswith("_")} for s in items]})
    write(DATA / "stats.json", stats(items, updated))
    write(DATA / "featured.json", featured)
    write(DATA / "featured_history.json", history[-500:])
    who = featured["item"]["first_name"] if featured["item"] else "nobody yet"
    print(f"Wrote {len(items)} approved submissions. Featured this week ({featured['mode']}): {who}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
