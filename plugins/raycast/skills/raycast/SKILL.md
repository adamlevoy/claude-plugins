---
name: Raycast
description: Generate Raycast script commands. USE WHEN raycast, raycast script, script command, productivity script, mac automation. Creates shell scripts with Raycast metadata.
---

# Raycast Script Commands

Generate lightweight shell/TypeScript scripts that extend Raycast's functionality. Unlike full extensions (React/TypeScript apps), Script Commands are simple scripts defined by metadata comments - no build step required.

## Workflow Routing

| Trigger | Workflow | Description |
|---------|----------|-------------|
| create script, new script, generate script | CreateScript | Generate a new Raycast script command |

## Default Script Location

Scripts are created in: `~/code/scripts/raycast/`

## Metadata Reference

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `@raycast.schemaVersion` | Always `1` |
| `@raycast.title` | Display name in Raycast |
| `@raycast.mode` | `silent`, `compact`, `fullOutput`, or `inline` |

### Optional Parameters

| Parameter | Description |
|-----------|-------------|
| `@raycast.packageName` | Group scripts together |
| `@raycast.icon` | Emoji, file path, or HTTPS URL (64px PNG/JPEG recommended for custom icons) |
| `@raycast.iconDark` | Dark mode variant |
| `@raycast.description` | Shown in Raycast |
| `@raycast.author` | Script author (default: Adam) |
| `@raycast.authorURL` | Author's URL |
| `@raycast.currentDirectoryPath` | Execution directory |
| `@raycast.needsConfirmation` | `true` for confirmation dialog |
| `@raycast.refreshTime` | For inline mode (e.g., `10s`, `1m`, `1h`) - minimum 10 seconds |
| `@raycast.argument1-3` | JSON object for input arguments (maximum 3 arguments) |

### Mode Types

- **silent** - Runs in background, shows HUD toast with last line
- **compact** - Shows toast with last line while running
- **fullOutput** - Shows full output in separate view (supports ANSI colors)
- **inline** - Displays in Raycast root search (requires refreshTime, supports ANSI colors)

**Note:** Long-running tasks are not suitable for compact, silent, or inline modes. Use fullOutput for commands that take time to complete.

### Argument Format

```bash
# @raycast.argument1 { "type": "text", "placeholder": "Search query" }
# @raycast.argument2 { "type": "dropdown", "placeholder": "Select option", "data": [{"title": "Option 1", "value": "opt1"}] }
```

Argument types: `text`, `password`, `dropdown`
Options: `optional`, `percentEncoded`

**Note:** The `secure` option is deprecated - use `type: "password"` instead.

## Constraints & Limitations

- **refreshTime minimum:** 10 seconds
- **Maximum inline commands:** 10 displayed simultaneously
- **Maximum arguments:** 3 per script
- **Execution environment:** Scripts run in a non-login shell

## ANSI Color Support

The `fullOutput` and `inline` modes support ANSI escape codes for colored output.

### Foreground Colors
| Code | Color |
|------|-------|
| `\033[30m` | Black |
| `\033[31m` | Red |
| `\033[32m` | Green |
| `\033[33m` | Yellow |
| `\033[34m` | Blue |
| `\033[35m` | Magenta |
| `\033[36m` | Cyan |
| `\033[37m` | White |
| `\033[0m` | Reset |

### Background Colors
| Code | Color |
|------|-------|
| `\033[40m` | Black |
| `\033[41m` | Red |
| `\033[42m` | Green |
| `\033[43m` | Yellow |
| `\033[44m` | Blue |
| `\033[45m` | Magenta |
| `\033[46m` | Cyan |
| `\033[47m` | White |

## Error Handling

- A **non-zero exit code** triggers a failure toast in Raycast
- In `inline` and `compact` modes, the **last output line** is used as the error message
- Always provide meaningful error messages before exiting with non-zero status

### Error Handling Pattern
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Example with Error Handling
# @raycast.mode compact

if ! command -v required_tool &> /dev/null; then
    echo "Error: required_tool is not installed"
    exit 1
fi

result=$(required_tool --action 2>&1) || {
    echo "Failed: $result"
    exit 1
}

echo "Success: $result"
```

## Template File Convention

Files with `.template.` in the name (e.g., `api-lookup.template.sh`) indicate scripts that require user configuration before use (API keys, custom paths, etc.). Users should copy and rename the file, filling in their values.

## Supported Languages

- Bash (default)
- Python
- TypeScript/Node
- Ruby
- Swift
- AppleScript

## Examples

### Quick Command (silent mode)
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Toggle WiFi
# @raycast.mode silent
# @raycast.icon 📶

networksetup -setairportpower en0 $(networksetup -getairportpower en0 | grep -q On && echo off || echo on)
echo "WiFi toggled"
```

### Interactive Script (with arguments)
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Open URL
# @raycast.mode silent
# @raycast.icon 🌐
# @raycast.argument1 { "type": "text", "placeholder": "URL" }

open "$1"
```

### Status Display (inline mode)
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Battery Status
# @raycast.mode inline
# @raycast.refreshTime 5m
# @raycast.icon 🔋

pmset -g batt | grep -Eo "\d+%" | head -1
```

### Colored Output (fullOutput mode)
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title System Status
# @raycast.mode fullOutput
# @raycast.icon 💻

echo -e "\033[32m✓ CPU:\033[0m $(sysctl -n machdep.cpu.brand_string)"
echo -e "\033[32m✓ Memory:\033[0m $(system_profiler SPHardwareDataType | awk '/Memory:/ {print $2, $3}')"
echo -e "\033[34mℹ Uptime:\033[0m $(uptime | awk -F'( |,|:)+' '{print $6,$7}')"
```
