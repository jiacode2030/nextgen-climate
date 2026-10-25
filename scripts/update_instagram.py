#!/usr/bin/env python3
"""Pulls the newest NextGen Climate Instagram posts for the homepage.

Uses the official Instagram API (free) with the IG_ACCESS_TOKEN secret. Instagram image
links expire after a while, so each image is saved into assets/instagram/ and the site
uses those copies. Writes data/instagram.json.

  python3 scripts/update_instagram.py            # update posts
  python3 scripts/update_instagram.py --refresh  # renew the 60-day token (saved for the workflow)
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "instagram.json"
IMG_DIR = ROOT / "assets" / "instagram"
API = "https://graph.instagram.com"
KEEP = 6
FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "NextGenClimateBot/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "NextGenClimateBot/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        dest.write_bytes(r.read())


def refresh(token):
    q = urllib.parse.urlencode({"grant_type": "ig_refresh_token", "access_token": token})
    data = get_json(f"{API}/refresh_access_token?{q}")
    new = data.get("access_token")
    if not new:
        raise SystemExit(f"Refresh failed: {data}")
    days = int(data.get("expires_in", 0)) // 86400
    # Written to a temp file (never printed); the workflow saves it back into the repo secret.
    Path(os.environ.get("NEW_TOKEN_FILE", "/tmp/ig_token")).write_text(new)
    print(f"Token refreshed. Valid for about {days} days.")


def short_caption(text, n=140):
    text = " ".join((text or "").split())
    return text if len(text) <= n else text[: n - 1].rsplit(" ", 1)[0] + "…"


def update(token):
    q = urllib.parse.urlencode({"fields": FIELDS, "limit": 12, "access_token": token})
    try:
        data = get_json(f"{API}/me/media?{q}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "ignore")
        print(f"Instagram said no ({e.code}). The token may have expired. Keeping the current posts.\n{body[:300]}")
        return 0
    posts = []
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    for m in data.get("data", []):
        img = m.get("thumbnail_url") if m.get("media_type") == "VIDEO" else m.get("media_url")
        if not img:
            continue
        dest = IMG_DIR / f"{m['id']}.jpg"
        if not dest.exists():
            try:
                download(img, dest)
            except Exception as e:  # noqa: BLE001
                print(f"Skipped image {m['id']}: {e}")
                continue
        posts.append({
            "id": m["id"],
            "image": f"assets/instagram/{dest.name}",
            "caption": short_caption(m.get("caption")),
            "link": m.get("permalink", ""),
            "date": m.get("timestamp", ""),
            "video": m.get("media_type") == "VIDEO",
        })
        if len(posts) == KEEP:
            break
    keep = {Path(p["image"]).name for p in posts}
    for f in IMG_DIR.glob("*.jpg"):
        if f.name not in keep:
            f.unlink()
    OUT.write_text(json.dumps({
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "posts": posts,
    }, indent=2, ensure_ascii=False) + "\n")
    print(f"Saved {len(posts)} Instagram posts.")
    return 0


def main():
    token = os.environ.get("IG_ACCESS_TOKEN", "").strip()
    if not token:
        print("IG_ACCESS_TOKEN is not set. Skipping Instagram (the site shows a Follow link instead).")
        return 0
    if "--refresh" in sys.argv:
        refresh(token)
        return 0
    return update(token)


if __name__ == "__main__":
    sys.exit(main())
