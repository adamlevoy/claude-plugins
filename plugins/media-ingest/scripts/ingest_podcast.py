#!/usr/bin/env python3
"""Ingest a podcast episode into the Obsidian vault as a markdown note.

Accepts either:
  - An Apple Podcasts URL (resolves to RSS automatically)
  - A direct RSS feed URL

Downloads the audio, transcribes with Whisper, and writes a markdown note.

Usage:
    python3 ingest_podcast.py <url> <vault_path> [options]

    # Ingest latest episode from Apple Podcasts URL
    python3 ingest_podcast.py "https://podcasts.apple.com/..." "/path/to/vault"

    # Ingest specific episode by number (1 = latest)
    python3 ingest_podcast.py <url> <vault_path> --episode 3

    # Ingest by title search
    python3 ingest_podcast.py <url> <vault_path> --search "technical seo"

    # List available episodes
    python3 ingest_podcast.py <url> <vault_path> --list

    # Use a specific Whisper model
    python3 ingest_podcast.py <url> <vault_path> --model medium
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from datetime import datetime
from pathlib import Path

try:
    import feedparser
except ImportError:
    print("Error: feedparser not installed. Run: pip3 install feedparser", file=sys.stderr)
    sys.exit(1)


def resolve_apple_podcasts_url(apple_url: str) -> str | None:
    """Resolve an Apple Podcasts URL to its RSS feed URL.

    Uses the iTunes Lookup API to find the feed URL from the podcast ID.
    """
    match = re.search(r"/id(\d+)", apple_url)
    if not match:
        return None
    podcast_id = match.group(1)
    lookup_url = f"https://itunes.apple.com/lookup?id={podcast_id}&entity=podcast"
    try:
        # Use curl to avoid Python SSL certificate issues on macOS
        result = subprocess.run(
            ["curl", "-s", "-L", lookup_url],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr)
        data = json.loads(result.stdout)
        results = data.get("results", [])
        if results:
            return results[0].get("feedUrl")
    except Exception as e:
        print(f"Error resolving Apple Podcasts URL: {e}", file=sys.stderr)
    return None


def parse_feed(feed_url: str) -> tuple[dict, list[dict]]:
    """Parse an RSS feed and return (show_info, episodes)."""
    # Fetch with curl to avoid Python SSL issues on macOS, then parse the string
    result = subprocess.run(
        ["curl", "-s", "-L", feed_url],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0 or not result.stdout.strip():
        print(f"Failed to fetch RSS feed: {result.stderr}", file=sys.stderr)
        feed = feedparser.parse(feed_url)  # fallback to feedparser's own fetch
    else:
        feed = feedparser.parse(result.stdout)
    show = {
        "title": feed.feed.get("title", "Unknown Podcast"),
        "author": feed.feed.get("author", feed.feed.get("itunes_author", "")),
        "description": feed.feed.get("summary", feed.feed.get("subtitle", "")),
        "link": feed.feed.get("link", ""),
        "image": feed.feed.get("image", {}).get("href", ""),
    }
    episodes = []
    for entry in feed.entries:
        audio_url = None
        for link in entry.get("links", []):
            if link.get("type", "").startswith("audio/") or link.get("href", "").endswith((".mp3", ".m4a")):
                audio_url = link["href"]
                break
        if not audio_url:
            for enc in entry.get("enclosures", []):
                if enc.get("type", "").startswith("audio/"):
                    audio_url = enc.get("href")
                    break
        episodes.append({
            "title": entry.get("title", "Untitled"),
            "published": entry.get("published", ""),
            "summary": entry.get("summary", ""),
            "duration": entry.get("itunes_duration", ""),
            "audio_url": audio_url,
            "link": entry.get("link", ""),
        })
    return show, episodes


def download_audio(audio_url: str, dest_dir: str) -> str:
    """Download audio file to dest_dir. Returns the filepath."""
    ext = ".mp3"
    if ".m4a" in audio_url:
        ext = ".m4a"
    dest = os.path.join(dest_dir, f"episode{ext}")
    print(f"Downloading audio...")
    # Use yt-dlp for robust downloading (handles redirects, retries)
    result = subprocess.run(
        ["yt-dlp", "-o", dest, "--no-playlist", audio_url],
        capture_output=True, text=True, timeout=600
    )
    if result.returncode != 0:
        # Fallback to curl
        result = subprocess.run(
            ["curl", "-L", "-o", dest, audio_url],
            capture_output=True, text=True, timeout=600
        )
        if result.returncode != 0:
            print(f"Download failed: {result.stderr}", file=sys.stderr)
            sys.exit(1)
    return dest


def transcribe(audio_path: str, model: str = "small") -> str:
    """Transcribe audio using Whisper. Returns transcript text."""
    print(f"Transcribing with Whisper ({model} model)... This may take a while.")
    try:
        import whisper
        m = whisper.load_model(model)
        result = m.transcribe(audio_path)
        return result["text"]
    except ImportError:
        # Try whisper CLI
        result = subprocess.run(
            ["whisper", audio_path, "--model", model, "--output_format", "txt", "--output_dir", "/tmp"],
            capture_output=True, text=True, timeout=3600
        )
        if result.returncode == 0:
            txt_path = Path("/tmp") / (Path(audio_path).stem + ".txt")
            if txt_path.exists():
                return txt_path.read_text(encoding="utf-8")
        print("Error: whisper not available. Run: pip3 install openai-whisper", file=sys.stderr)
        sys.exit(1)


def sanitize_filename(name: str) -> str:
    """Make a string safe for use as a filename."""
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name[:200]


def build_markdown(show: dict, episode: dict, transcript: str) -> str:
    """Build the Obsidian markdown note content."""
    title = episode["title"]
    pub_date = episode.get("published", "")
    # Try to parse date into ISO format
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(pub_date)
        pub_date_iso = dt.strftime("%Y-%m-%d")
    except Exception:
        pub_date_iso = pub_date

    lines = [
        "---",
        f"title: \"{title}\"",
        f"show: \"{show['title']}\"",
        f"author: \"{show.get('author', '')}\"",
        f"date: {pub_date_iso}",
        f"ingested: {datetime.now().strftime('%Y-%m-%d')}",
        f"duration: \"{episode.get('duration', '')}\"",
        "type: podcast",
    ]
    if episode.get("link"):
        lines.append(f"url: \"{episode['link']}\"")
    lines.append("---")
    lines.append("")
    lines.append(f"# {title}")
    lines.append("")
    lines.append(f"**Show:** {show['title']}  ")
    if show.get("author"):
        lines.append(f"**Host:** {show['author']}  ")
    lines.append(f"**Date:** {pub_date_iso}  ")
    if episode.get("duration"):
        lines.append(f"**Duration:** {episode['duration']}  ")
    if episode.get("link"):
        lines.append(f"**URL:** {episode['link']}")
    lines.append("")

    if episode.get("summary"):
        lines.append("## Episode Summary")
        lines.append("")
        # Strip HTML from summary
        summary = re.sub(r"<[^>]+>", "", episode["summary"])
        lines.append(summary[:3000])
        lines.append("")

    lines.append("## Transcript")
    lines.append("")
    lines.append(transcript if transcript else "*Transcription failed or not available.*")
    lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Ingest podcast episode into Obsidian vault")
    parser.add_argument("url", help="Apple Podcasts URL or RSS feed URL")
    parser.add_argument("vault", help="Path to Obsidian vault")
    parser.add_argument("--folder", default="Podcasts", help="Subfolder within vault (default: Podcasts)")
    parser.add_argument("--episode", type=int, default=1, help="Episode number to ingest (1=latest, default: 1)")
    parser.add_argument("--search", help="Search episode titles (ingests first match)")
    parser.add_argument("--list", action="store_true", help="List available episodes and exit")
    parser.add_argument("--model", default="small", help="Whisper model: tiny|base|small|medium|large (default: small)")
    parser.add_argument("--skip-transcribe", action="store_true", help="Create note without transcription")
    args = parser.parse_args()

    vault = Path(args.vault).expanduser()
    if not vault.exists():
        print(f"Vault not found: {vault}", file=sys.stderr)
        sys.exit(1)

    # Resolve URL to RSS feed
    feed_url = args.url
    if "podcasts.apple.com" in args.url:
        print("Resolving Apple Podcasts URL to RSS feed...")
        feed_url = resolve_apple_podcasts_url(args.url)
        if not feed_url:
            print("Could not resolve RSS feed URL.", file=sys.stderr)
            sys.exit(1)
        print(f"RSS feed: {feed_url}")

    print("Parsing feed...")
    show, episodes = parse_feed(feed_url)
    print(f"Found {len(episodes)} episodes from \"{show['title']}\"")

    if not episodes:
        print("No episodes found.", file=sys.stderr)
        sys.exit(1)

    # List mode
    if args.list:
        for i, ep in enumerate(episodes[:25], 1):
            pub = ep.get("published", "")[:16]
            dur = ep.get("duration", "")
            print(f"  {i:3d}. [{pub}] {ep['title']} ({dur})")
        if len(episodes) > 25:
            print(f"  ... and {len(episodes) - 25} more")
        return

    # Select episode
    if args.search:
        query = args.search.lower()
        matching = [(i, ep) for i, ep in enumerate(episodes) if query in ep["title"].lower()]
        if not matching:
            print(f"No episodes matching \"{args.search}\"", file=sys.stderr)
            sys.exit(1)
        idx, episode = matching[0]
        print(f"Matched: \"{episode['title']}\"")
    else:
        idx = args.episode - 1
        if idx < 0 or idx >= len(episodes):
            print(f"Episode {args.episode} out of range (1-{len(episodes)})", file=sys.stderr)
            sys.exit(1)
        episode = episodes[idx]

    print(f"Selected: \"{episode['title']}\"")

    if not episode.get("audio_url"):
        print("No audio URL found for this episode.", file=sys.stderr)
        sys.exit(1)

    # Transcribe
    transcript = ""
    if not args.skip_transcribe:
        with tempfile.TemporaryDirectory() as tmpdir:
            audio_path = download_audio(episode["audio_url"], tmpdir)
            transcript = transcribe(audio_path, model=args.model)
    else:
        transcript = "*Transcription skipped.*"

    # Build and write markdown
    md = build_markdown(show, episode, transcript)

    dest_dir = vault / args.folder / sanitize_filename(show["title"])
    dest_dir.mkdir(parents=True, exist_ok=True)

    filename = sanitize_filename(episode["title"])
    filepath = dest_dir / f"{filename}.md"

    filepath.write_text(md, encoding="utf-8")
    print(f"Created: {filepath}")


if __name__ == "__main__":
    main()
