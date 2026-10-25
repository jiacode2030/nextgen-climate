#!/usr/bin/env python3
"""Weekly newsletter draft: the top 5 climate + tech stories of the past 7 days.

Writes newsletter/YYYY-MM-DD.md, ready to paste into Substack. "Top" means the newest
stories with at most one per source and a spread of topics. Each story gets a
placeholder line for your own one-sentence take.
"""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NEWS = ROOT / "data" / "news.json"
FEATURED = ROOT / "data" / "featured.json"
OUT_DIR = ROOT / "newsletter"


def parse(d):
    try:
        return datetime.fromisoformat(d.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return None


def pick(items, n=5):
    chosen, sources, tags = [], set(), {}
    for s in items:  # already newest first
        if s["source"] in sources or tags.get(s["tag"], 0) >= 2:
            continue
        chosen.append(s); sources.add(s["source"]); tags[s["tag"]] = tags.get(s["tag"], 0) + 1
        if len(chosen) == n:
            return chosen
    for s in items:  # not enough variety: fill up with whatever is newest
        if s not in chosen:
            chosen.append(s)
        if len(chosen) == n:
            break
    return chosen


def main():
    now = datetime.now(timezone.utc)
    data = json.loads(NEWS.read_text()) if NEWS.exists() else {"items": []}
    week = [s for s in data.get("items", []) if not s.get("sample") and (parse(s.get("date")) or now) >= now - timedelta(days=7)]
    top = pick(week)

    lines = [
        f"# This Week in Climate + Tech · {now.strftime('%B %-d, %Y')}",
        "",
        "_Your one-paragraph intro: what stood out this week and why young builders should care._",
        "",
        "## Top 5 stories",
        "",
    ]
    if not top:
        lines += ["No new stories were collected this week. Check the Actions log for feed errors.", ""]
    for i, s in enumerate(top, 1):
        lines += [
            f"**{i}. [{s['title']}]({s['link']})**  ",
            f"{s['source']} · {s['tag']}  ",
            "_Your take: one sentence on what this means or what a student could build from it._",
            "",
        ]

    feat = {}
    if FEATURED.exists():
        feat = (json.loads(FEATURED.read_text()) or {}).get("item") or {}
    if feat and not feat.get("example"):
        lines += [
            "## Featured Innovator",
            "",
            f"**{feat['first_name']}** from {feat['school']} ({feat['country']}) built **{feat['title']}**.",
            "",
            feat.get("description", ""),
            "",
        ]
    lines += [
        "## Share your solution",
        "",
        "Built, designed, or imagined a climate solution? Submit it to the NextGen Climate Solutions Wall and earn a certificate.",
        "",
    ]

    OUT_DIR.mkdir(exist_ok=True)
    out = OUT_DIR / f"{now.strftime('%Y-%m-%d')}.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out.relative_to(ROOT)} with {len(top)} stories.")


if __name__ == "__main__":
    main()
