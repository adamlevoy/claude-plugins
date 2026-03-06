# CreateScript Workflow

Generate a new Raycast script command based on user requirements.

## Input

- **purpose**: What the script should do
- **language** (optional): Bash (default), Python, Node, Ruby, Swift, AppleScript
- **mode** (optional): silent, compact, fullOutput, inline
- **arguments** (optional): Input parameters needed

## Process

### Step 1: Gather Requirements

If not specified, ask the user:
1. What should the script do?
2. Does it need any input arguments?
3. Should it show output (fullOutput) or run silently?

### Step 2: Select Template

**Bash (default)**
```bash
#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title {{TITLE}}
# @raycast.mode {{MODE}}

# Optional parameters:
# @raycast.packageName {{PACKAGE}}
# @raycast.icon {{ICON}}
# @raycast.description {{DESCRIPTION}}
# @raycast.author Adam

{{LOGIC}}
```

**Python**
```python
#!/usr/bin/env python3

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title {{TITLE}}
# @raycast.mode {{MODE}}

# Optional parameters:
# @raycast.packageName {{PACKAGE}}
# @raycast.icon {{ICON}}
# @raycast.description {{DESCRIPTION}}
# @raycast.author Adam

{{LOGIC}}
```

**TypeScript/Node**
```typescript
#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title {{TITLE}}
// @raycast.mode {{MODE}}

// Optional parameters:
// @raycast.packageName {{PACKAGE}}
// @raycast.icon {{ICON}}
// @raycast.description {{DESCRIPTION}}
// @raycast.author Adam

{{LOGIC}}
```

**AppleScript**
```applescript
#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title {{TITLE}}
# @raycast.mode {{MODE}}

# Optional parameters:
# @raycast.packageName {{PACKAGE}}
# @raycast.icon {{ICON}}
# @raycast.description {{DESCRIPTION}}
# @raycast.author Adam

{{LOGIC}}
```

### Step 3: Configure Metadata

1. **Title**: Short, action-oriented name (e.g., "Toggle Dark Mode", "Open Project")
2. **Mode**:
   - `silent` - Quick actions, no visible output needed
   - `compact` - Show brief status while running
   - `fullOutput` - Display detailed results (supports ANSI colors)
   - `inline` - Live status in Raycast search (add `refreshTime`, supports ANSI colors)
3. **Icon**: Use relevant emoji (or 64px PNG/JPEG for custom icons)
4. **Package**: Group related scripts (e.g., "Development", "System", "Productivity")
5. **Arguments**: Add if user input is needed (maximum 3)

**Important Constraints:**
- `refreshTime` minimum is 10 seconds
- Maximum 10 inline commands can display simultaneously
- Long-running tasks should use `fullOutput` mode, not compact/silent/inline

### Step 4: Write Script Logic

Implement the script's core functionality. Keep it focused and simple.

**Include proper error handling:**
- Exit with non-zero status on failure
- Provide meaningful error message as the last output line
- Validate required dependencies exist

### Step 5: Create File

1. Generate filename: lowercase, hyphenated (e.g., `toggle-dark-mode.sh`)
2. Write to `~/code/scripts/raycast/`
3. Make executable: `chmod +x`
4. For scripts requiring user configuration (API keys, paths), use `.template.` in filename

### Step 6: Verify

1. Confirm file exists and is executable
2. Display the created script
3. Remind user to refresh Raycast Script Commands (Cmd+Shift+R in Raycast)

## Output

- Created script path
- Script contents
- Instructions to use in Raycast

## Common Patterns

### Toggle System Setting
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Toggle Dark Mode
# @raycast.mode silent
# @raycast.icon 🌙

osascript -e 'tell app "System Events" to tell appearance preferences to set dark mode to not dark mode'
echo "Dark mode toggled"
```

### Open Application/URL
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Open GitHub
# @raycast.mode silent
# @raycast.icon 🐙

open "https://github.com"
```

### Clipboard Operations
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title UUID to Clipboard
# @raycast.mode silent
# @raycast.icon 🔑

uuidgen | tr -d '\n' | pbcopy
echo "UUID copied to clipboard"
```

### Run Terminal Command with Output
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Git Status
# @raycast.mode fullOutput
# @raycast.icon 📝

git status
```

### With User Input
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Search Google
# @raycast.mode silent
# @raycast.icon 🔍
# @raycast.argument1 { "type": "text", "placeholder": "Search query", "percentEncoded": true }

open "https://www.google.com/search?q=$1"
```

### With Error Handling
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Deploy Project
# @raycast.mode compact
# @raycast.icon 🚀
# @raycast.needsConfirmation true

cd ~/projects/myapp || {
    echo "Project directory not found"
    exit 1
}

if ! git diff --quiet; then
    echo "Uncommitted changes detected"
    exit 1
fi

npm run deploy 2>&1 || {
    echo "Deploy failed"
    exit 1
}

echo "Deployed successfully"
```

### With Colored Output
```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Service Status
# @raycast.mode fullOutput
# @raycast.icon 🔍

check_service() {
    if pgrep -x "$1" > /dev/null; then
        echo -e "\033[32m✓ $1 is running\033[0m"
    else
        echo -e "\033[31m✗ $1 is not running\033[0m"
    fi
}

check_service "nginx"
check_service "postgres"
check_service "redis"
```
