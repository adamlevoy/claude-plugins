---
name: cf-mcp
description: Scaffold and deploy custom MCP servers on Cloudflare Workers with Google OAuth. USE WHEN user asks to create a cloudflare MCP, build a cloudflare worker MCP, or deploy an MCP to cloudflare workers. Do NOT trigger for generic MCP building requests — only when Cloudflare Workers is explicitly mentioned.
---

# Cloudflare Workers MCP Scaffold

Scaffold a complete MCP server on Cloudflare Workers with Durable Objects + Google OAuth. This generates the exact architecture used by kwatch-mcp, reddit-mcp, klaviyo-mcp, and dataforseo-mcp.

```
OAuthProvider (entry point)
  ├── /authorize, /callback → GoogleHandler (Hono) → Google OAuth
  ├── /register, /token     → OAuthProvider built-in
  └── /mcp                  → McpAgent (Durable Object) → API Client → External API
```

---

## Phase 1: Project Setup

### 1.1 Gather Parameters

Ask the user for these values (provide defaults where noted):

| Placeholder | Example | Notes |
|-------------|---------|-------|
| `{{SERVICE_NAME}}` | `stripe` | Lowercase, kebab-safe. Used in package name, wrangler name, URLs |
| `{{SERVICE_NAME_UPPER}}` | `STRIPE` | Uppercase. Used for env var prefix (`STRIPE_API_KEY`) |
| `{{SERVICE_NAME_CLASS}}` | `Stripe` | PascalCase. Used for class names (`StripeMCP`, `StripeClient`) |
| `{{DESCRIPTION}}` | `MCP server for Stripe payment API` | One-line description |
| `{{DOMAIN}}` | `taboogrow.com` | Domain for custom route. Default: `taboogrow.com` |
| `{{GOOGLE_WORKSPACE_DOMAIN}}` | `taboogrow.com` | Google Workspace domain for `hd` param. Set to `NONE` if not using Workspace |
| `{{ACCOUNT_ID}}` | `27e3ec1d452356993cc7acfc1c99bcd6` | Cloudflare account ID. Default: `27e3ec1d452356993cc7acfc1c99bcd6` |

### 1.2 Create Project

```bash
mkdir -p ~/code/{{SERVICE_NAME}}-mcp/src
cd ~/code/{{SERVICE_NAME}}-mcp
```

### 1.3 Copy and Process Template Files

Copy all files from the plugin's `templates/` directory into the new project:

| Template Source | Destination | Processing |
|----------------|-------------|------------|
| `templates/src/index.ts.tmpl` | `src/index.ts` | Replace all `{{PLACEHOLDERS}}` |
| `templates/src/google-handler.ts` | `src/google-handler.ts` | Replace `{{SERVICE_NAME}}`, `{{SERVICE_NAME_CLASS}}`, `{{DESCRIPTION}}` |
| `templates/src/workers-oauth-utils.ts` | `src/workers-oauth-utils.ts` | Copy as-is (no placeholders) |
| `templates/src/utils.ts.tmpl` | `src/utils.ts` | Replace `{{GOOGLE_WORKSPACE_DOMAIN}}`. If `NONE`, remove the entire `hd` line |
| `templates/wrangler.toml.tmpl` | `wrangler.toml` | Replace all `{{PLACEHOLDERS}}` |
| `templates/package.json.tmpl` | `package.json` | Replace `{{SERVICE_NAME}}`, `{{DESCRIPTION}}` |
| `templates/tsconfig.json` | `tsconfig.json` | Copy as-is |
| `templates/CLAUDE.md.tmpl` | `CLAUDE.md` | Replace all `{{PLACEHOLDERS}}`. If `GOOGLE_WORKSPACE_DOMAIN` is `NONE`, remove the Workspace line |

**If `{{GOOGLE_WORKSPACE_DOMAIN}}` is `NONE`:** In `src/utils.ts`, delete the line:
```typescript
  url.searchParams.set('hd', '{{GOOGLE_WORKSPACE_DOMAIN}}');
```
And in `CLAUDE.md`, change the auth description to say "Authenticated via Google SSO OAuth 2.1" without the Workspace restriction.

### 1.4 Install Dependencies

```bash
bun install
```

### 1.5 Initialize Git

```bash
git init && git add -A && git commit -m "Initial scaffold from cf-mcp template"
```

---

## Phase 2: Implement Tools

### 2.1 Study the Target API

Use WebSearch and WebFetch to study the target service's API documentation. Identify:
- Base URL
- Authentication method (Bearer token, API key header, etc.)
- Key endpoints to implement
- Rate limits and pagination patterns

### 2.2 Update the Env Interface

Add any service-specific secrets to the `Env` interface in `src/index.ts`:

```typescript
interface Env {
  {{SERVICE_NAME_UPPER}}_API_KEY: string;
  // Add more service-specific secrets here
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  COOKIE_ENCRYPTION_KEY: string;
  MCP_OBJECT: DurableObjectNamespace;
  OAUTH_KV: KVNamespace;
}
```

### 2.3 Update the API Client

Modify the `{{SERVICE_NAME_CLASS}}Client` class in `src/index.ts`:
- Set the correct `API_BASE_URL`
- Adjust auth headers to match the service's requirements
- Add typed request methods for different HTTP verbs if needed

```typescript
const API_BASE_URL = 'https://api.service.com/v1';

class {{SERVICE_NAME_CLASS}}Client {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      switch (response.status) {
        case 401:
          throw new Error('Error: Authentication failed. Check your API key.');
        case 403:
          throw new Error('Error: Permission denied.');
        case 404:
          throw new Error('Error: Resource not found.');
        case 429:
          throw new Error('Error: Rate limit exceeded.');
        default:
          throw new Error(`Error: API returned ${response.status} - ${body}`);
      }
    }

    return response.json() as Promise<T>;
  }
}
```

### 2.4 Register Tools

Replace the example tool in `init()` with real tools. Follow this pattern:

**Tool naming:** `{service}_{action}_{resource}` — e.g., `stripe_list_charges`, `stripe_get_customer`

**Tool registration pattern:**

```typescript
this.server.registerTool('{{SERVICE_NAME}}_list_items', {
  title: 'List Items',
  description: 'List all items with optional filtering. Returns item name, status, and metadata.',
  inputSchema: {
    status: z.enum(['active', 'archived', 'all']).default('active').describe('Filter by status'),
    limit: z.number().min(1).max(100).default(20).describe('Max results to return'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
}, async ({ status, limit }) => {
  try {
    console.log(JSON.stringify({
      tool: '{{SERVICE_NAME}}_list_items',
      status,
      limit,
      timestamp: new Date().toISOString(),
    }));
    const data = await client.request<unknown>(`/items?status=${status}&limit=${limit}`);
    return {
      content: [{ type: 'text' as const, text: truncateResponse(data) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: error instanceof Error ? error.message : String(error) }],
    };
  }
});
```

**Write tools (mutations):**

```typescript
this.server.registerTool('{{SERVICE_NAME}}_create_item', {
  title: 'Create Item',
  description: 'Create a new item with the given name and configuration.',
  inputSchema: {
    name: z.string().min(1).describe('Item name'),
    config: z.object({ key: z.string() }).optional().describe('Optional configuration'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
}, async ({ name, config }) => {
  try {
    console.log(JSON.stringify({
      tool: '{{SERVICE_NAME}}_create_item',
      name,
      timestamp: new Date().toISOString(),
    }));
    const data = await client.request<unknown>('/items', {
      method: 'POST',
      body: JSON.stringify({ name, config }),
    });
    return {
      content: [{ type: 'text' as const, text: truncateResponse(data) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: error instanceof Error ? error.message : String(error) }],
    };
  }
});
```

### 2.5 Tool Design Guidelines

- **Descriptions**: Write for an LLM audience. State what the tool does, what it returns, and when to use it.
- **Input schemas**: Use Zod with `.describe()` on every field. Add `.default()` where sensible.
- **Annotations**: Set `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` accurately.
- **Error handling**: Always wrap in try/catch, return `isError: true` with the error message.
- **Logging**: Every tool call logs `{ tool, ...keyParams, timestamp }` via `console.log(JSON.stringify(...))`.
- **Truncation**: Always wrap response data in `truncateResponse()` — the 25k character limit prevents oversized responses.

---

## Phase 3: Configure & Deploy

### 3.1 Create KV Namespace

```bash
cd ~/code/{{SERVICE_NAME}}-mcp
wrangler kv namespace create "OAUTH_KV"
```

Copy the output ID and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "OAUTH_KV"
id = "PASTE_THE_ID_HERE"
```

### 3.2 Set Secrets

```bash
wrangler secret put {{SERVICE_NAME_UPPER}}_API_KEY
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put COOKIE_ENCRYPTION_KEY
# Generate cookie key: openssl rand -hex 32
```

### 3.3 Google Cloud Console

1. Go to `console.cloud.google.com`
2. Select the project (or create one)
3. APIs & Services > OAuth consent screen → User Type: **Internal** (if Workspace) or **External**
4. APIs & Services > Credentials → Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URI: `https://{{SERVICE_NAME}}-mcp.{{DOMAIN}}/callback`

### 3.4 Deploy

```bash
bun run deploy
```

### 3.5 Verify

```bash
bun run logs
```

Visit `https://{{SERVICE_NAME}}-mcp.{{DOMAIN}}/` in a browser — should see the approval dialog page.

---

## Phase 4: Connect & Test

### 4.1 Add Connector

In Claude Desktop or Claude Code Settings > Connectors > Add custom connector:
- URL: `https://{{SERVICE_NAME}}-mcp.{{DOMAIN}}/mcp`
- Click Connect → approve → sign in with Google

### 4.2 Test Tools

Test each registered tool to verify:
- Authentication works
- Correct data is returned
- Error cases are handled
- Truncation works for large responses

### 4.3 Update CLAUDE.md

Update the generated `CLAUDE.md` with:
- Actual tool names and descriptions
- Any additional secrets that were added
- Repository URL once pushed to GitHub

### 4.4 Push to GitHub

```bash
gh repo create taboogrow/{{SERVICE_NAME}}-mcp --private --source=. --push
```

---

## Deployment Checklist

- [ ] `bun install` completes without errors
- [ ] KV namespace created and ID in `wrangler.toml`
- [ ] All secrets set via `wrangler secret put`
- [ ] Google OAuth redirect URI configured: `https://{{SERVICE_NAME}}-mcp.{{DOMAIN}}/callback`
- [ ] `bun run deploy` succeeds
- [ ] Custom domain resolves (DNS auto-provisioned by Cloudflare)
- [ ] OAuth flow completes in browser
- [ ] Tools return expected data via Claude
- [ ] `CLAUDE.md` updated with actual tools and config
- [ ] Code pushed to GitHub

---

## Standard Dependencies

All CF MCP servers use the same dependency set, pinned to compatible versions:

```json
{
  "dependencies": {
    "@cloudflare/workers-oauth-provider": "^0.2.0",
    "@modelcontextprotocol/sdk": "^1.27.0",
    "agents": "^0.5.0",
    "hono": "^4.11.10",
    "zod": "^4.3.5"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241230.0",
    "typescript": "^5.7.2",
    "wrangler": "^4.59.3"
  }
}
```
