#!/usr/bin/env python3
"""Ingest a YouTube video into the Obsidian vault as a markdown note.

Uses yt-dlp for metadata and youtube-transcript-api for clean transcript text.
Falls back to yt-dlp subtitles if youtube-transcript-api fails.

Usage:
    python3 ingest_youtube.py <youtube_url> <vault_path> [--folder <subfolder>]

Output: Creates a markdown file in <vault_path>/<subfolder>/ with frontmatter + transcript.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def get_metadata(url: str) -> dict:
    """Fetch video metadata via yt-dlp --dump-json."""
    result = subprocess.run(
        ["yt-dlp", "--dump-json", "--skip-download", url],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        print(f"Error fetching metadata: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout)


def get_transcript_api(video_id: str, languages=("en",)) -> str | None:
    """Fetch transcript via youtube-transcript-api (clean text)."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        ytt = YouTubeTranscriptApi()
        transcript = ytt.fetch(video_id, languages=list(languages))
        return "\n".join(s.text for s in transcript)
    except Exception as e:
        print(f"youtube-transcript-api failed: {e}", file=sys.stderr)
        return None


def get_transcript_ytdlp(url: str) -> str | None:
    """Fallback: fetch auto-subs via yt-dlp and extract text."""
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        result = subprocess.run(
            ["yt-dlp", "--write-auto-sub", "--sub-lang", "en",
             "--sub-format", "vtt", "--skip-download",
             "-o", os.path.join(tmpdir, "%(id)s.%(ext)s"), url],
            capture_output=True, text=True, timeout=120
        )
        vtt_files = list(Path(tmpdir).glob("*.vtt"))
        if not vtt_files:
            return None
        raw = vtt_files[0].read_text(encoding="utf-8")
        # Strip VTT headers and timestamps, deduplicate scrolling lines
        lines = []
        seen = set()
        for line in raw.splitlines():
            line = line.strip()
            if not line or line.startswith("WEBVTT") or line.startswith("Kind:") \
               or line.startswith("Language:") or "-->" in line or re.match(r"^\d+$", line):
                continue
            # Remove VTT tags
            clean = re.sub(r"<[^>]+>", "", line)
            if clean and clean not in seen:
                seen.add(clean)
                lines.append(clean)
        return "\n".join(lines) if lines else None


def extract_video_id(url: str) -> str | None:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r"(?:v=|/v/|youtu\.be/)([a-zA-Z0-9_-]{11})",
        r"(?:embed/)([a-zA-Z0-9_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


def format_duration(seconds: int) -> str:
    """Format seconds into human-readable duration."""
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}h {m}m"
    return f"{m}m {s}s"


def sanitize_filename(name: str) -> str:
    """Make a string safe for use as a filename."""
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name[:200]


def build_markdown(meta: dict, transcript: str) -> str:
    """Build the Obsidian markdown note content."""
    title = meta.get("title", "Untitled")
    channel = meta.get("channel", meta.get("uploader", "Unknown"))
    upload_date = meta.get("upload_date", "")
    if upload_date:
        upload_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:8]}"
    duration = format_duration(meta.get("duration", 0))
    description = meta.get("description", "")
    url = meta.get("webpage_url", meta.get("original_url", ""))
    tags = meta.get("tags", []) or []
    categories = meta.get("categories", []) or []
    chapters = meta.get("chapters", []) or []

    # Build frontmatter
    tag_list = ", ".join(f'"{t}"' for t in tags[:10]) if tags else ""
    cat_list = ", ".join(f'"{c}"' for c in categories) if categories else ""

    lines = [
        "---",
        f"title: \"{title}\"",
        f"channel: \"{channel}\"",
        f"date: {upload_date}",
        f"ingested: {datetime.now().strftime('%Y-%m-%d')}",
        f"duration: \"{duration}\"",
        "type: youtube",
    ]
    if tag_list:
        lines.append(f"tags: [{tag_list}]")
    if cat_list:
        lines.append(f"categories: [{cat_list}]")
    lines.append(f"url: \"{url}\"")
    lines.append("---")
    lines.append("")
    lines.append(f"# {title}")
    lines.append("")
    lines.append(f"**Channel:** {channel}  ")
    lines.append(f"**Date:** {upload_date}  ")
    lines.append(f"**Duration:** {duration}  ")
    lines.append(f"**URL:** {url}")
    lines.append("")

    if description:
        lines.append("## Description")
        lines.append("")
        lines.append(description[:2000])
        lines.append("")

    if chapters:
        lines.append("## Chapters")
        lines.append("")
        for ch in chapters:
            start = format_duration(int(ch.get("start_time", 0)))
            lines.append(f"- **{start}** — {ch.get('title', '')}")
        lines.append("")

    lines.append("## Transcript")
    lines.append("")
    lines.append(transcript if transcript else "*No transcript available.*")
    lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Ingest YouTube video into Obsidian vault")
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument("vault", help="Path to Obsidian vault")
    parser.add_argument("--folder", default="YouTube", help="Subfolder within vault (default: YouTube)")
    args = parser.parse_args()

    vault = Path(args.vault).expanduser()
    if not vault.exists():
        print(f"Vault not found: {vault}", file=sys.stderr)
        sys.exit(1)

    video_id = extract_video_id(args.url)
    if not video_id:
        print(f"Could not extract video ID from: {args.url}", file=sys.stderr)
        sys.exit(1)

    print(f"Fetching metadata for {video_id}...")
    meta = get_metadata(args.url)

    print("Fetching transcript...")
    transcript = get_transcript_api(video_id)
    if not transcript:
        print("Falling back to yt-dlp subtitles...")
        transcript = get_transcript_ytdlp(args.url)

    if not transcript:
        print("Warning: No transcript found. Creating note without transcript.", file=sys.stderr)
        transcript = ""

    md = build_markdown(meta, transcript)

    dest_dir = vault / args.folder
    dest_dir.mkdir(parents=True, exist_ok=True)

    title = sanitize_filename(meta.get("title", video_id))
    filepath = dest_dir / f"{title}.md"

    # Avoid overwriting
    if filepath.exists():
        filepath = dest_dir / f"{title} ({video_id}).md"

    filepath.write_text(md, encoding="utf-8")
    print(f"Created: {filepath}")


if __name__ == "__main__":
    main()
