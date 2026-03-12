# adamlevoy-plugins

Personal Claude Code plugin marketplace by Adam Levoy.

Add this marketplace to Claude Code:

```shell
/plugin marketplace add adamlevoy/claude-plugins
```

Then browse and install:

```shell
/plugin
```

Or install a specific plugin directly:

```shell
/plugin install kwatch@adamlevoy-plugins
```

---

## Plugins

| Plugin | Description |
|--------|-------------|
| [granola](plugins/granola/) | Sync Granola meeting notes and transcripts to Obsidian |
| [firecrawl](plugins/firecrawl/) | Web scraping, crawling, and knowledge base building via Firecrawl API |
| [seo](plugins/seo/) | SEO and GEO optimization using DataForSEO API |
| [cloudflare](plugins/cloudflare/) | Cloudflare domain, DNS, and CDN management |
| [reddit](plugins/reddit/) | Reddit API integration via PRAW |
| [recall](plugins/recall/) | Load context from Obsidian vault memory |
| [raycast](plugins/raycast/) | Generate Raycast script commands for macOS automation |
| [trader](plugins/trader/) | Swing trading analysis for equities and crypto |
| [sync-claude-sessions](plugins/sync-claude-sessions/) | Sync Claude Code sessions to Obsidian markdown |
| [media-ingest](plugins/media-ingest/) | Ingest YouTube, podcast, and Granola content as Obsidian notes |
| [image-gen](plugins/image-gen/) | Generate and edit images via Google Nano Banana 2 (Gemini) and Imagen 4 |
| [cf-mcp](plugins/cf-mcp/) | Scaffold and deploy MCP servers on Cloudflare Workers with Google OAuth |

---

## Installation scopes

When prompted, choose a scope:

- **User** — available across all your projects
- **Project** — shared with collaborators via `.claude/settings.json`
- **Local** — just for you in the current project

---

## Structure

Each plugin follows the official Claude Code plugin format:

```
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json        # Required metadata
├── skills/<name>/
│   └── SKILL.md           # Skill definition with frontmatter
├── commands/              # Slash commands (optional)
├── agents/                # Agent definitions (optional)
├── hooks/                 # Event hooks (optional)
├── .mcp.json              # MCP server config (optional)
└── README.md
```

