---
name: media-ingest
description: "Ingest YouTube videos, podcast episodes, and Granola meeting transcripts as markdown notes. USE WHEN user asks to: ingest/save/transcribe a YouTube video, ingest/save/transcribe a podcast episode, pull a transcript, convert media to markdown, sync Granola meetings, or export meeting notes. Triggers on YouTube URLs, Apple Podcasts URLs, RSS feed URLs, Granola mentions, or mentions of ingesting/transcribing media content."
---

# Media Ingest

Convert YouTube videos and podcast episodes into markdown notes with YAML frontmatter and full transcripts. Output directory is configurable via the `--folder` and vault path arguments.

**Default vault path:** `/Users/adam/Documents/Obsidian Vault`

## Workflow

1. Determine content type from the URL or user request
2. Run the appropriate ingest script
3. Confirm to user with file path and summary

## YouTube Videos

Run `scripts/ingest_youtube.py`:

```bash
python3 ~/.claude/skills/media-ingest/scripts/ingest_youtube.py "<youtube_url>" "/Users/adam/Documents/Obsidian Vault" --folder YouTube
```

- Fetches metadata via `yt-dlp` (title, channel, date, duration, chapters, tags)
- Fetches clean transcript via `youtube-transcript-api`, falls back to `yt-dlp` subtitles
- Output: `<vault>/YouTube/<video-title>.md`

## Podcast Episodes

Run `scripts/ingest_podcast.py`:

```bash
# Latest episode from Apple Podcasts URL
python3 ~/.claude/skills/media-ingest/scripts/ingest_podcast.py "https://podcasts.apple.com/us/podcast/<name>/id<id>" "/Users/adam/Documents/Obsidian Vault"

# List episodes first
python3 ~/.claude/skills/media-ingest/scripts/ingest_podcast.py "<url>" "/Users/adam/Documents/Obsidian Vault" --list

# Specific episode by number (1=latest)
python3 ~/.claude/skills/media-ingest/scripts/ingest_podcast.py "<url>" "/Users/adam/Documents/Obsidian Vault" --episode 3

# Search by title
python3 ~/.claude/skills/media-ingest/scripts/ingest_podcast.py "<url>" "/Users/adam/Documents/Obsidian Vault" --search "keyword"

# Skip transcription (metadata only, fast)
python3 ~/.claude/skills/media-ingest/scripts/ingest_podcast.py "<url>" "/Users/adam/Documents/Obsidian Vault" --skip-transcribe
```

- Resolves Apple Podcasts URLs to RSS feeds automatically via iTunes Lookup API
- Downloads audio, transcribes locally with Whisper (`small` model by default)
- Output: `<vault>/Podcasts/<Show Name>/<Episode Title>.md`
- Use `--model tiny` for faster transcription, `--model medium` for higher accuracy
- Transcription takes ~15 min per hour of audio on M1 Pro with `small` model

## Granola Meetings

Reads the local Granola cache (`~/Library/Application Support/Granola/cache-v4.json`) directly — no API needed.

```bash
# Export all meetings
python3 ~/.claude/skills/media-ingest/scripts/ingest_granola.py --vault "/Users/adam/Documents/Obsidian Vault"

# List meetings (last 30 days)
python3 ~/.claude/skills/media-ingest/scripts/ingest_granola.py --list --days 30

# Only meetings with transcripts
python3 ~/.claude/skills/media-ingest/scripts/ingest_granola.py --vault "/Users/adam/Documents/Obsidian Vault" --transcripts
```

- Output: `<vault>/Granola-Meetings/<date>-<title>.md`
- Includes attendees, duration, calendar link, notes, and full transcript with speaker separation
- Only 6 of 187 meetings have transcripts cached locally (Granola caches recent transcripts)
- QMD collection: `meetings`

## Dependency Check

```bash
python3 ~/.claude/skills/media-ingest/scripts/check_deps.py
```

Required: `yt-dlp`, `youtube-transcript-api`, `feedparser`
Required for podcasts: `openai-whisper`

```bash
pip3 install youtube-transcript-api feedparser openai-whisper
```

## Markdown Output Format

Both scripts produce notes with YAML frontmatter containing: `title`, `date`, `ingested`, `duration`, `type` (youtube|podcast), `url`, and source-specific fields (`channel` for YouTube, `show`/`author` for podcasts). The body contains a description/summary section and the full transcript.
