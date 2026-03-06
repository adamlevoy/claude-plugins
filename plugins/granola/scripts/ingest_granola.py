#!/usr/bin/env python3
"""Ingest Granola meeting notes and transcripts from local cache to Obsidian vault.

Usage:
    python3 ingest_granola.py [OPTIONS]

Options:
    --vault DIR       Vault directory (default: $VAULT_DIR or cwd)
    --output DIR      Output folder name within vault (default: Granola-Meetings)
    --days N          Only export meetings from last N days (default: all)
    --list            List meetings without exporting
    --transcripts     Only export meetings that have transcripts
    --dry-run         Show what would be exported without writing files
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

CACHE_PATH = Path.home() / "Library" / "Application Support" / "Granola" / "cache-v4.json"
# Fallback for older Granola versions
CACHE_PATH_V3 = Path.home() / "Library" / "Application Support" / "Granola" / "cache-v3.json"


def load_cache() -> dict:
    """Load and parse the Granola cache file."""
    path = CACHE_PATH if CACHE_PATH.exists() else CACHE_PATH_V3
    if not path.exists():
        print("Error: Granola cache not found.", file=sys.stderr)
        print(f"  Checked: {CACHE_PATH}", file=sys.stderr)
        print(f"  Checked: {CACHE_PATH_V3}", file=sys.stderr)
        sys.exit(1)

    with open(path) as f:
        data = json.load(f)

    # Handle double-JSON encoding
    if isinstance(data, str):
        data = json.loads(data)

    # Navigate to state
    if "cache" in data and "state" in data["cache"]:
        return data["cache"]["state"]
    if "state" in data:
        return data["state"]
    return data


def parse_timestamp(ts_str: str) -> datetime | None:
    """Parse ISO timestamp string."""
    if not ts_str:
        return None
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def get_attendees(doc: dict) -> list[str]:
    """Extract attendee names from document."""
    people = doc.get("people")
    if not people or not isinstance(people, dict):
        return []

    names = []
    attendees = people.get("attendees", [])
    for a in attendees:
        name = a.get("name") or ""
        if not name:
            details = a.get("details", {})
            person = details.get("person", {})
            name_obj = person.get("name", {})
            name = name_obj.get("fullName", "")
        if not name:
            name = a.get("email", "").split("@")[0]
        if name:
            names.append(name)
    return names


def get_calendar_time(doc: dict) -> tuple[str, str]:
    """Extract start/end times from calendar event."""
    event = doc.get("google_calendar_event")
    if not event:
        return "", ""

    start = event.get("start", {})
    end = event.get("end", {})
    start_dt = start.get("dateTime", start.get("date", ""))
    end_dt = end.get("dateTime", end.get("date", ""))
    return start_dt, end_dt


def format_duration(start_str: str, end_str: str) -> str:
    """Calculate meeting duration from start/end times."""
    start = parse_timestamp(start_str)
    end = parse_timestamp(end_str)
    if not start or not end:
        return ""
    delta = end - start
    minutes = int(delta.total_seconds() / 60)
    if minutes < 60:
        return f"{minutes}m"
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours}h{mins}m" if mins else f"{hours}h"


def format_transcript(segments: list[dict]) -> str:
    """Format transcript segments into readable text."""
    if not segments:
        return ""

    lines = []
    current_source = None
    current_texts = []
    current_start = None

    for seg in segments:
        source = seg.get("source", "unknown")
        text = seg.get("text", "").strip()
        if not text:
            continue

        # Label: "microphone" = you, "system" = other party
        label = "You" if source == "microphone" else "Speaker"

        if source != current_source and current_texts:
            # Flush previous speaker
            ts = ""
            if current_start:
                dt = parse_timestamp(current_start)
                if dt:
                    ts = f"[{dt.strftime('%H:%M:%S')}] "
            speaker = "You" if current_source == "microphone" else "Speaker"
            combined = " ".join(current_texts)
            lines.append(f"**{ts}{speaker}:** {combined}")
            current_texts = []

        if source != current_source:
            current_source = source
            current_start = seg.get("start_timestamp")

        current_texts.append(text)

    # Flush last speaker
    if current_texts:
        ts = ""
        if current_start:
            dt = parse_timestamp(current_start)
            if dt:
                ts = f"[{dt.strftime('%H:%M:%S')}] "
        speaker = "You" if current_source == "microphone" else "Speaker"
        combined = " ".join(current_texts)
        lines.append(f"**{ts}{speaker}:** {combined}")

    return "\n\n".join(lines)


def sanitize_filename(title: str) -> str:
    """Make a string safe for use as a filename."""
    # Remove emoji and special chars, keep alphanumeric, spaces, hyphens
    clean = re.sub(r"[^\w\s\-]", "", title, flags=re.UNICODE)
    clean = re.sub(r"\s+", " ", clean).strip()
    if len(clean) > 60:
        clean = clean[:60].rsplit(" ", 1)[0]
    return clean or "Untitled"


def build_markdown(doc: dict, transcript_segments: list[dict] | None) -> str:
    """Build markdown content for a meeting."""
    title = doc.get("title") or "Untitled Meeting"
    created = doc.get("created_at", "")
    date_str = created[:10] if created else "unknown"
    start_time, end_time = get_calendar_time(doc)
    duration = format_duration(start_time, end_time)
    attendees = get_attendees(doc)
    notes_md = doc.get("notes_markdown", "") or ""
    summary = doc.get("summary") or ""

    # Build frontmatter
    fm_lines = [
        "---",
        "type: granola-meeting",
        f"date: {date_str}",
        f'title: "{title.replace(chr(34), chr(39))}"',
    ]
    if start_time:
        fm_lines.append(f"start: {start_time}")
    if end_time:
        fm_lines.append(f"end: {end_time}")
    if duration:
        fm_lines.append(f"duration: {duration}")
    if attendees:
        fm_lines.append(f"attendees: [{', '.join(attendees)}]")
    fm_lines.append(f"has_transcript: {bool(transcript_segments)}")
    fm_lines.append(f"source: granola")
    fm_lines.append(f"meeting_id: {doc.get('id', '')}")

    # Calendar link
    event = doc.get("google_calendar_event")
    if event and event.get("htmlLink"):
        fm_lines.append(f"calendar_link: {event['htmlLink']}")

    fm_lines.append("tags: []")
    fm_lines.append("---")

    # Build body
    body_parts = ["\n".join(fm_lines), "", f"# {title}", ""]

    # Meeting info
    info_parts = []
    if date_str != "unknown":
        dt = parse_timestamp(start_time or created)
        if dt:
            info_parts.append(f"**Date:** {dt.strftime('%Y-%m-%d %H:%M')}")
    if duration:
        info_parts.append(f"**Duration:** {duration}")
    if attendees:
        info_parts.append(f"**Attendees:** {', '.join(attendees)}")
    if info_parts:
        body_parts.extend(info_parts)
        body_parts.append("")

    # Summary
    if summary:
        body_parts.append("## Summary")
        body_parts.append("")
        body_parts.append(summary)
        body_parts.append("")

    # Notes
    if notes_md.strip():
        body_parts.append("## Notes")
        body_parts.append("")
        body_parts.append(notes_md.strip())
        body_parts.append("")

    # Transcript
    if transcript_segments:
        formatted = format_transcript(transcript_segments)
        if formatted:
            body_parts.append("## Transcript")
            body_parts.append("")
            body_parts.append(formatted)
            body_parts.append("")

    return "\n".join(body_parts)


def main():
    parser = argparse.ArgumentParser(description="Ingest Granola meetings to Obsidian vault")
    parser.add_argument("--vault", default=os.environ.get("VAULT_DIR", os.getcwd()),
                        help="Vault directory")
    parser.add_argument("--output", default="Granola-Meetings",
                        help="Output folder name within vault")
    parser.add_argument("--days", type=int, default=0,
                        help="Only export meetings from last N days (0=all)")
    parser.add_argument("--list", action="store_true",
                        help="List meetings without exporting")
    parser.add_argument("--transcripts", action="store_true",
                        help="Only export meetings with transcripts")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be exported")
    args = parser.parse_args()

    state = load_cache()
    docs = state.get("documents", {})
    transcripts = state.get("transcripts", {})

    # Build transcript lookup: document_id -> segments
    transcript_map = {}
    for t_id, segments in transcripts.items():
        if isinstance(segments, list) and segments:
            doc_id = segments[0].get("document_id")
            if doc_id:
                transcript_map[doc_id] = segments

    # Filter and sort meetings
    cutoff = None
    if args.days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=args.days)

    meetings = []
    for doc_id, doc in docs.items():
        if doc is None or doc.get("deleted_at"):
            continue
        created = parse_timestamp(doc.get("created_at", ""))
        if not created:
            continue
        if cutoff and created < cutoff:
            continue
        has_transcript = doc_id in transcript_map
        if args.transcripts and not has_transcript:
            continue
        meetings.append((doc_id, doc, created, has_transcript))

    meetings.sort(key=lambda m: m[2], reverse=True)

    if args.list:
        print(f"\nGranola Meetings ({len(meetings)} total)\n")
        print(f" {'#':>3}  {'Date':10}  {'Dur':>5}  {'Tr':>2}  Title")
        print(f" {'---':>3}  {'----------':10}  {'-----':>5}  {'--':>2}  -----")
        for i, (doc_id, doc, created, has_tr) in enumerate(meetings, 1):
            start_t, end_t = get_calendar_time(doc)
            dur = format_duration(start_t, end_t) or "-"
            tr = "Y" if has_tr else ""
            title = (doc.get("title") or "Untitled")[:55]
            print(f" {i:3}  {created.strftime('%Y-%m-%d')}  {dur:>5}  {tr:>2}  {title}")
        return

    # Export
    output_dir = Path(args.vault) / args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    exported = 0
    skipped = 0

    for doc_id, doc, created, has_transcript in meetings:
        title = doc.get("title") or "Untitled"
        date_str = created.strftime("%Y-%m-%d")
        safe_title = sanitize_filename(title)
        filename = f"{date_str}-{safe_title}.md"
        filepath = output_dir / filename

        transcript_segs = transcript_map.get(doc_id)
        md = build_markdown(doc, transcript_segs)

        if args.dry_run:
            tr_label = f" ({len(transcript_segs)} segments)" if transcript_segs else ""
            print(f"  Would write: {filename}{tr_label}")
            exported += 1
            continue

        # Skip if file exists and hasn't changed (simple size check)
        if filepath.exists():
            existing_size = filepath.stat().st_size
            if abs(existing_size - len(md.encode())) < 50:
                skipped += 1
                continue

        filepath.write_text(md)
        exported += 1

    action = "Would export" if args.dry_run else "Exported"
    print(f"\n{action}: {exported} meetings")
    if skipped:
        print(f"Skipped: {skipped} (unchanged)")
    if not args.dry_run:
        print(f"Output: {output_dir}")


if __name__ == "__main__":
    main()
