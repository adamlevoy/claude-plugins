#!/usr/bin/env python3
"""Backfill Granola meeting transcripts by fetching from Granola API.

Reads existing meeting markdown files from the vault, fetches transcripts
for any meetings that don't have them, and updates the files in place.

Usage:
    python3 backfill_granola_transcripts.py [--vault DIR] [--dry-run] [--force]
"""

import argparse
import gzip
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

GRANOLA_AUTH_PATH = Path.home() / "Library" / "Application Support" / "Granola" / "supabase.json"
GRANOLA_API_BASE = "https://api.granola.ai/v1"


def get_access_token() -> str:
    """Read Granola access token from local auth file."""
    with open(GRANOLA_AUTH_PATH) as f:
        d = json.load(f)
    tokens = d.get("workos_tokens", {})
    if isinstance(tokens, str):
        tokens = json.loads(tokens)
    return tokens.get("access_token", "")


def api_post(endpoint: str, payload: dict, token: str) -> any:
    """Make a POST request to Granola API using curl subprocess."""
    import subprocess
    url = f"{GRANOLA_API_BASE}/{endpoint}"
    body = json.dumps(payload)
    result = subprocess.run(
        ["curl", "-s", "--compressed", "-X", "POST", url,
         "-H", f"Authorization: Bearer {token}",
         "-H", "Content-Type: application/json",
         "-d", body],
        capture_output=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"curl failed: {result.stderr.decode()}")
    return json.loads(result.stdout.decode("utf-8"))


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse YAML frontmatter from markdown. Returns (fm_dict, body)."""
    if not content.startswith("---"):
        return {}, content
    end = content.find("\n---", 3)
    if end == -1:
        return {}, content
    fm_text = content[4:end]
    body = content[end + 4:]
    fm = {}
    for line in fm_text.splitlines():
        if ": " in line:
            k, v = line.split(": ", 1)
            fm[k.strip()] = v.strip()
        elif line.endswith(":"):
            fm[line[:-1].strip()] = ""
    return fm, body


def format_transcript(segments: list[dict]) -> str:
    """Format transcript segments into readable text."""
    if not segments:
        return ""

    lines = []
    current_source = None
    current_texts = []
    current_start = None

    def parse_ts(ts_str):
        if not ts_str:
            return None
        try:
            return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None

    for seg in segments:
        source = seg.get("source", "unknown")
        text = seg.get("text", "").strip()
        if not text:
            continue

        if source != current_source and current_texts:
            ts = ""
            if current_start:
                dt = parse_ts(current_start)
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

    if current_texts:
        ts = ""
        if current_start:
            dt = parse_ts(current_start)
            if dt:
                ts = f"[{dt.strftime('%H:%M:%S')}] "
        speaker = "You" if current_source == "microphone" else "Speaker"
        combined = " ".join(current_texts)
        lines.append(f"**{ts}{speaker}:** {combined}")

    return "\n\n".join(lines)


def update_file_with_transcript(filepath: Path, segments: list[dict], dry_run: bool) -> bool:
    """Update a markdown file to add/replace the transcript section."""
    content = filepath.read_text()
    formatted = format_transcript(segments)
    if not formatted:
        return False

    # Update has_transcript in frontmatter
    content = re.sub(r'^has_transcript: False$', 'has_transcript: true', content, flags=re.MULTILINE)

    # Remove existing transcript section if present
    content = re.sub(r'\n## Transcript\n.*$', '', content, flags=re.DOTALL)

    # Add transcript at end
    content = content.rstrip() + f"\n\n## Transcript\n\n{formatted}\n"

    if dry_run:
        return True

    filepath.write_text(content)
    return True


def main():
    parser = argparse.ArgumentParser(description="Backfill Granola meeting transcripts")
    parser.add_argument("--vault", default=os.environ.get("VAULT_DIR", str(Path.home() / "Documents" / "Obsidian Vault")))
    parser.add_argument("--output", default="Granola-Meetings")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true", help="Re-fetch even if has_transcript is true")
    parser.add_argument("--delay", type=float, default=0.3, help="Delay between API calls (seconds)")
    args = parser.parse_args()

    meetings_dir = Path(args.vault) / args.output
    if not meetings_dir.exists():
        print(f"Error: {meetings_dir} does not exist", file=sys.stderr)
        sys.exit(1)

    token = get_access_token()
    if not token:
        print("Error: Could not read Granola access token", file=sys.stderr)
        sys.exit(1)

    # Collect all meeting files and their IDs
    files = sorted(meetings_dir.glob("*.md"))
    print(f"Found {len(files)} meeting files in {meetings_dir}")

    # Separate into needs-transcript vs already-has-transcript
    needs_transcript = []
    already_has = []
    no_id = []

    for filepath in files:
        content = filepath.read_text()
        fm, _ = parse_frontmatter(content)
        meeting_id = fm.get("meeting_id", "").strip()
        has_transcript = fm.get("has_transcript", "False").strip().lower() in ("true", "1", "yes")

        if not meeting_id:
            no_id.append(filepath)
            continue
        if has_transcript and not args.force:
            already_has.append(filepath)
            continue
        needs_transcript.append((filepath, meeting_id))

    print(f"  Already have transcripts: {len(already_has)}")
    print(f"  Need transcripts: {len(needs_transcript)}")
    print(f"  No meeting_id: {len(no_id)}")

    if not needs_transcript:
        print("Nothing to do!")
        return

    # Fetch transcripts
    fetched = 0
    empty = 0
    errors = 0

    for i, (filepath, meeting_id) in enumerate(needs_transcript, 1):
        filename = filepath.name
        print(f"[{i}/{len(needs_transcript)}] {filename[:55]}", end="", flush=True)

        try:
            segments = api_post("get-document-transcript", {"document_id": meeting_id}, token)

            if not isinstance(segments, list) or not segments:
                print(f" → no transcript")
                empty += 1
                continue

            print(f" → {len(segments)} segments", end="")

            if args.dry_run:
                print(f" (dry-run)")
                fetched += 1
                continue

            updated = update_file_with_transcript(filepath, segments, dry_run=False)
            if updated:
                print(f" ✓")
                fetched += 1
            else:
                print(f" (empty after format)")
                empty += 1

        except Exception as e:
            print(f" ERROR: {e}")
            errors += 1

        if i < len(needs_transcript):
            time.sleep(args.delay)

    print(f"\nResults:")
    print(f"  Updated: {fetched}")
    print(f"  No transcript: {empty}")
    print(f"  Errors: {errors}")

    if not args.dry_run and fetched > 0:
        print(f"\nRun 'qmd update' to re-index the meetings collection.")


if __name__ == "__main__":
    main()
