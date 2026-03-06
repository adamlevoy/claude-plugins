# Contributing

## Adding a new plugin

1. Create the plugin directory:

```bash
mkdir -p plugins/<name>/.claude-plugin
mkdir -p plugins/<name>/skills/<name>
```

2. Create the manifest at `plugins/<name>/.claude-plugin/plugin.json`:

```json
{
  "name": "<name>",
  "description": "What this plugin does",
  "version": "1.0.0",
  "author": { "name": "Your Name" },
  "license": "MIT",
  "keywords": ["tag1", "tag2"]
}
```

3. Create `plugins/<name>/skills/<name>/SKILL.md`:

```markdown
---
description: One-line description. USE WHEN <trigger conditions>.
---

# Skill instructions here
```

4. Register the plugin in `.claude-plugin/marketplace.json` under `plugins`.

5. Test locally:

```bash
claude --plugin-dir ./plugins/<name>
```

6. Validate:

```shell
/plugin validate ./plugins/<name>
```

## Plugin naming

- Use lowercase kebab-case: `my-plugin`
- Match the directory name to the `name` field in `plugin.json`
- Skills are namespaced: `/my-plugin:skill-name`

## Sensitive data

Never commit:
- API keys, tokens, or credentials
- Private configuration files (add to `.gitignore`)
- Personal account data or private webhook URLs

## Versioning

Use semantic versioning in `plugin.json`. Bump the version when making changes so Claude Code detects updates.
