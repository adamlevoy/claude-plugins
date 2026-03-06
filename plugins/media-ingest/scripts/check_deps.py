#!/usr/bin/env python3
"""Check and report status of all media-ingest dependencies."""

import shutil
import subprocess
import sys


def check(name, cmd=None, pip_name=None):
    """Check if a tool/package is available."""
    if cmd:
        found = shutil.which(cmd)
        if found:
            try:
                ver = subprocess.run([cmd, "--version"], capture_output=True, text=True, timeout=5)
                version = ver.stdout.strip().split("\n")[0] if ver.stdout else ver.stderr.strip().split("\n")[0]
            except Exception:
                version = "installed"
            return True, version
        return False, f"pip3 install {pip_name}" if pip_name else f"not found"

    if pip_name:
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "show", pip_name],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                for line in result.stdout.splitlines():
                    if line.startswith("Version:"):
                        return True, line.split(":")[1].strip()
                return True, "installed"
            return False, f"pip3 install {pip_name}"
        except Exception:
            return False, f"pip3 install {pip_name}"

    return False, "unknown"


deps = [
    ("yt-dlp", {"cmd": "yt-dlp"}),
    ("youtube-transcript-api", {"pip_name": "youtube-transcript-api"}),
    ("feedparser", {"pip_name": "feedparser"}),
    ("openai-whisper", {"pip_name": "openai-whisper", "cmd": "whisper"}),
]

print("media-ingest dependency check")
print("=" * 50)

missing = []
for name, kwargs in deps:
    ok, info = check(name, **kwargs)
    icon = "+" if ok else "-"
    print(f"  [{icon}] {name:30s} {info}")
    if not ok:
        missing.append((name, info))

print()
if missing:
    print("To install missing dependencies:")
    pip_deps = [info for name, info in missing if info.startswith("pip3")]
    if pip_deps:
        packages = " ".join(cmd.replace("pip3 install ", "") for cmd in pip_deps)
        print(f"  pip3 install {packages}")
else:
    print("All dependencies satisfied!")
