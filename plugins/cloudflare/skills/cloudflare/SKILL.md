---
name: Cloudflare
description: Cloudflare API for domain and DNS management. USE WHEN user asks about cloudflare OR domains OR DNS records OR zones OR nameservers OR domain search OR SSL certificates OR cloudflare settings OR proxy settings OR CDN OR cloudflare accounts.
---

# Cloudflare

Domain, DNS, and account management via Cloudflare REST API v4. Search domains, manage DNS records, and configure zone settings.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Direct API** | All operations | Uses `cloudflare_client.py` directly |

## API Capabilities

### Zone / Domain Operations (MOST IMPORTANT)

| Action | Method | Notes |
|--------|--------|-------|
| **Search domains** | `search_zones(query)` | **Fuzzy search** — partial name match (e.g., "exam" finds "example.com") |
| List all zones | `list_zones(**filters)` | Filter by name, status, account_id |
| Get zone details | `get_zone(zone_id)` | Full zone config by ID |
| Get zone by name | `get_zone_by_name(domain)` | Exact domain name lookup |
| Zone summary | `get_zone_summary(zone_id)` | Zone details + DNS record counts by type |
| Add domain | `create_zone(name, account_id, type)` | type: "full" or "partial" |
| Remove domain | `delete_zone(zone_id)` | Permanently removes zone |
| Update zone | `edit_zone(zone_id, **settings)` | Modify paused, plan, etc. |

### DNS Record Operations

| Action | Method | Notes |
|--------|--------|-------|
| List records | `list_dns_records(zone_id, **filters)` | Filter by type, name, content |
| Get record | `get_dns_record(zone_id, record_id)` | Single record details |
| Create record | `create_dns_record(zone_id, type, name, content, **opts)` | A, AAAA, CNAME, MX, TXT, etc. |
| Update record | `update_dns_record(zone_id, record_id, **fields)` | PATCH — only send changed fields |
| Delete record | `delete_dns_record(zone_id, record_id)` | Permanently removes |
| Find by name | `find_dns_record(zone_id, name)` | Substring search on record name |
| Export zone file | `export_dns_records(zone_id)` | BIND format export |

### DNS Record Types

| Type | Example Content | Notes |
|------|----------------|-------|
| A | `1.2.3.4` | IPv4 address, supports proxied |
| AAAA | `2001:db8::1` | IPv6 address, supports proxied |
| CNAME | `other.example.com` | Alias, supports proxied |
| MX | `mail.example.com` | Mail server, requires priority |
| TXT | `v=spf1 include:...` | Text record (SPF, DKIM, etc.) |
| NS | `ns1.example.com` | Nameserver delegation |
| SRV | `target.example.com` | Service record |

### Account Operations

| Action | Method | Notes |
|--------|--------|-------|
| List accounts | `list_accounts()` | All accessible accounts |
| Get account | `get_account(account_id)` | Account details |
| Verify token | `verify_token()` | Check token validity and permissions |

---

## Examples

**Example 1: Search for a domain**
```
User: "Find my example domains on Cloudflare"
-> search_zones("example")
-> Returns all zones containing "example" in the name
```

**Example 2: List all domains**
```
User: "Show me all my Cloudflare domains"
-> list_zones()
-> Returns all zones with status, plan, and ID
```

**Example 3: View DNS records**
```
User: "Show DNS records for example.com"
-> get_zone_by_name("example.com") to get zone_id
-> list_dns_records(zone_id)
-> Returns all DNS records
```

**Example 4: Create a DNS record**
```
User: "Add an A record for www.example.com pointing to 1.2.3.4"
-> get_zone_by_name("example.com") to get zone_id
-> create_dns_record(zone_id, type="A", name="www", content="1.2.3.4", proxied=True)
-> Returns created record
```

**Example 5: Zone summary**
```
User: "Give me a summary of example.com on Cloudflare"
-> get_zone_by_name("example.com") to get zone_id
-> get_zone_summary(zone_id)
-> Returns zone details with DNS record counts by type
```

**Example 6: Export DNS zone file**
```
User: "Export the DNS zone file for example.com"
-> get_zone_by_name("example.com") to get zone_id
-> export_dns_records(zone_id)
-> Returns BIND format zone file
```

**Example 7: Find specific DNS records**
```
User: "Find all DNS records with 'mail' in the name for example.com"
-> get_zone_by_name("example.com") to get zone_id
-> find_dns_record(zone_id, "mail")
-> Returns matching DNS records
```

---

## Authentication

**Credentials:** `~/.cloudflare-credentials` (chmod 600)
```
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here  # optional, for multi-account
```

**Auth method:** Bearer token via `Authorization: Bearer <token>` header.

**Get your API token:** https://dash.cloudflare.com/profile/api-tokens
- Use "Edit zone DNS" template for DNS management
- Use "Read all resources" template for read-only access

**API Base URL:** `https://api.cloudflare.com/client/v4`

---

## Files

```
~/.claude/skills/Cloudflare/
├── SKILL.md              # This file
├── cloudflare_client.py  # API wrapper
└── Tools/                # CLI tools (reserved)
```

---

## Usage

```python
from cloudflare_client import CloudflareClient

client = CloudflareClient()

# Search domains (most important)
print(client.search_zones("example"))
print(client.search_zones("mysite.com"))

# Zone operations
print(client.list_zones())
print(client.get_zone_by_name("example.com"))
print(client.get_zone_summary(zone_id))

# DNS operations
print(client.list_dns_records(zone_id))
client.create_dns_record(zone_id, type="A", name="www", content="1.2.3.4", proxied=True)
client.update_dns_record(zone_id, record_id, content="5.6.7.8")
client.delete_dns_record(zone_id, record_id)
print(client.export_dns_records(zone_id))

# Account operations
print(client.list_accounts())
print(client.verify_token())
```

### CLI Usage

```bash
# Domain search (MOST IMPORTANT)
python cloudflare_client.py search "example"
python cloudflare_client.py search "mysite.com"

# Zone commands
python cloudflare_client.py zones
python cloudflare_client.py zone example.com
python cloudflare_client.py zone-summary example.com

# DNS commands
python cloudflare_client.py dns example.com
python cloudflare_client.py dns example.com --type A
python cloudflare_client.py dns-find example.com mail
python cloudflare_client.py dns-create example.com --type A --name www --content 1.2.3.4 --proxied
python cloudflare_client.py dns-update example.com RECORD_ID --content 5.6.7.8
python cloudflare_client.py dns-delete example.com RECORD_ID
python cloudflare_client.py dns-export example.com

# Account commands
python cloudflare_client.py accounts
python cloudflare_client.py verify
```
