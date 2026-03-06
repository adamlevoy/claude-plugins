#!/usr/bin/env python3
"""
Cloudflare API Client Wrapper

Provides high-level functions for Cloudflare domain, DNS, and account management
via the Cloudflare REST API v4.

Usage:
    from cloudflare_client import CloudflareClient

    client = CloudflareClient()
    print(client.search_zones("example"))
    print(client.list_dns_records(zone_id))
"""

import json
import sys
from pathlib import Path
from typing import Optional

# Paths
CREDENTIALS_PATH = Path.home() / ".cloudflare-credentials"
BASE_URL = "https://api.cloudflare.com/client/v4"


class CloudflareError(Exception):
    """Base exception for Cloudflare API errors."""
    pass


class CloudflareAuthError(CloudflareError):
    """Raised for authentication failures (401/403)."""
    pass


class CloudflareRateLimitError(CloudflareError):
    """Raised when rate limit is exceeded (429)."""
    pass


class CloudflareNotFoundError(CloudflareError):
    """Raised when a resource is not found (404)."""
    pass


class CloudflareClient:
    """High-level wrapper for Cloudflare API v4 operations."""

    def __init__(self):
        self._session = None
        self._credentials = self._load_credentials()

    def _load_credentials(self) -> dict:
        """Load API credentials from secure file."""
        if not CREDENTIALS_PATH.exists():
            raise FileNotFoundError(
                f"Credentials not found at {CREDENTIALS_PATH}. "
                "Create file with CLOUDFLARE_API_TOKEN=your_token"
            )

        creds = {}
        for line in CREDENTIALS_PATH.read_text().splitlines():
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                creds[key.strip()] = val.strip()

        if "CLOUDFLARE_API_TOKEN" not in creds:
            raise ValueError("CLOUDFLARE_API_TOKEN not found in credentials file")

        return creds

    @property
    def session(self):
        """Lazy-load requests session with auth headers."""
        if self._session is None:
            import requests
            self._session = requests.Session()
            self._session.headers.update({
                "Authorization": f"Bearer {self._credentials['CLOUDFLARE_API_TOKEN']}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            })
        return self._session

    def _handle_response(self, response) -> dict:
        """Handle API response and raise appropriate errors."""
        if response.status_code == 401:
            raise CloudflareAuthError("Invalid API token. Check ~/.cloudflare-credentials")
        elif response.status_code == 403:
            raise CloudflareAuthError("Access forbidden. Check API token permissions.")
        elif response.status_code == 429:
            raise CloudflareRateLimitError("Rate limit exceeded. Try again later.")
        elif response.status_code == 404:
            raise CloudflareNotFoundError(f"Resource not found: {response.url}")
        elif response.status_code >= 400:
            # Try to extract Cloudflare error messages
            try:
                data = response.json()
                errors = data.get("errors", [])
                if errors:
                    msg = "; ".join(e.get("message", str(e)) for e in errors)
                    raise CloudflareError(f"API error {response.status_code}: {msg}")
            except (ValueError, CloudflareError):
                if isinstance(sys.exc_info()[1], CloudflareError):
                    raise
            raise CloudflareError(f"API error {response.status_code}: {response.text}")

        if response.status_code == 204:
            return {"success": True, "result": None}

        return response.json()

    def _paginate(self, url: str, params: Optional[dict] = None) -> list:
        """
        Auto-paginate through all results.

        Cloudflare uses page-based pagination with result_info containing
        page, per_page, total_pages, and total_count.
        """
        all_results = []
        params = dict(params) if params else {}
        params.setdefault("per_page", 50)
        params["page"] = 1

        while True:
            response = self.session.get(url, params=params)
            data = self._handle_response(response)
            all_results.extend(data.get("result", []))
            info = data.get("result_info", {})
            if params["page"] >= info.get("total_pages", 1):
                break
            params["page"] += 1

        return all_results

    # =========================================================================
    # Zone / Domain Operations
    # =========================================================================

    def list_zones(self, **filters) -> list:
        """
        List all zones with optional filters.

        Args:
            name: Zone name (exact match)
            status: Zone status (active, pending, initializing, moved, deleted)
            account_id: Filter by account ID
            order: Sort field (name, status, account.id)
            direction: Sort direction (asc, desc)
            per_page: Results per page (default 50, max 50)

        Returns list of zone objects.
        """
        url = f"{BASE_URL}/zones"
        params = {}

        # Map Python-style args to API params
        param_map = {
            "name": "name",
            "status": "status",
            "account_id": "account.id",
            "order": "order",
            "direction": "direction",
            "per_page": "per_page",
        }

        for key, api_key in param_map.items():
            if key in filters and filters[key] is not None:
                params[api_key] = filters[key]

        # If filtering by exact name, no need to paginate (returns 0 or 1)
        if "name" in params:
            response = self.session.get(url, params=params)
            data = self._handle_response(response)
            return data.get("result", [])

        return self._paginate(url, params)

    def search_zones(self, query: str) -> list:
        """
        Search domains by partial name match.

        Tries exact match via API first, then falls back to client-side
        substring search across all zones.

        Args:
            query: Full or partial domain name (e.g., "example", "mysite.com")

        Returns list of matching zone objects.
        """
        # Try exact match first via API parameter
        exact = self.list_zones(name=query)
        if exact:
            return exact

        # Fall back to client-side substring search
        all_zones = self.list_zones()
        query_lower = query.lower()
        return [z for z in all_zones if query_lower in z["name"].lower()]

    def get_zone(self, zone_id: str) -> dict:
        """
        Get zone details by ID.

        Args:
            zone_id: Zone identifier

        Returns zone object with full details.
        """
        url = f"{BASE_URL}/zones/{zone_id}"
        response = self.session.get(url)
        data = self._handle_response(response)
        return data.get("result", {})

    def get_zone_by_name(self, domain: str) -> dict:
        """
        Get zone by exact domain name.

        Args:
            domain: Exact domain name (e.g., "example.com")

        Returns zone object or raises CloudflareNotFoundError.
        """
        zones = self.list_zones(name=domain)
        if not zones:
            raise CloudflareNotFoundError(f"Zone not found: {domain}")
        return zones[0]

    def create_zone(self, name: str, account_id: Optional[str] = None, type: str = "full") -> dict:
        """
        Add a domain to Cloudflare.

        Args:
            name: Domain name (e.g., "example.com")
            account_id: Account ID (uses credential default if not provided)
            type: Zone type - "full" (DNS managed) or "partial" (CNAME setup)

        Returns created zone object.
        """
        url = f"{BASE_URL}/zones"
        payload = {"name": name, "type": type}

        acct_id = account_id or self._credentials.get("CLOUDFLARE_ACCOUNT_ID")
        if acct_id:
            payload["account"] = {"id": acct_id}

        response = self.session.post(url, json=payload)
        data = self._handle_response(response)
        return data.get("result", {})

    def delete_zone(self, zone_id: str) -> dict:
        """
        Remove a domain from Cloudflare.

        Args:
            zone_id: Zone identifier

        Returns deletion confirmation.
        """
        url = f"{BASE_URL}/zones/{zone_id}"
        response = self.session.delete(url)
        data = self._handle_response(response)
        return data.get("result", {"id": zone_id})

    def edit_zone(self, zone_id: str, **settings) -> dict:
        """
        Update zone settings.

        Args:
            zone_id: Zone identifier
            paused: Pause Cloudflare for this zone
            plan: Change plan (plan object with id)
            vanity_name_servers: Custom nameservers
            type: Zone type

        Returns updated zone object.
        """
        url = f"{BASE_URL}/zones/{zone_id}"
        response = self.session.patch(url, json=settings)
        data = self._handle_response(response)
        return data.get("result", {})

    # =========================================================================
    # DNS Record Operations
    # =========================================================================

    def list_dns_records(self, zone_id: str, **filters) -> list:
        """
        List DNS records for a zone.

        Args:
            zone_id: Zone identifier
            type: Record type (A, AAAA, CNAME, MX, TXT, NS, etc.)
            name: Record name (exact match)
            content: Record content (exact match)
            order: Sort field (type, name, content, ttl, proxied)
            direction: Sort direction (asc, desc)

        Returns list of DNS record objects.
        """
        url = f"{BASE_URL}/zones/{zone_id}/dns_records"
        params = {}

        for key in ("type", "name", "content", "order", "direction"):
            if key in filters and filters[key] is not None:
                params[key] = filters[key]

        return self._paginate(url, params)

    def get_dns_record(self, zone_id: str, record_id: str) -> dict:
        """
        Get a specific DNS record.

        Args:
            zone_id: Zone identifier
            record_id: DNS record identifier

        Returns DNS record object.
        """
        url = f"{BASE_URL}/zones/{zone_id}/dns_records/{record_id}"
        response = self.session.get(url)
        data = self._handle_response(response)
        return data.get("result", {})

    def create_dns_record(
        self,
        zone_id: str,
        type: str,
        name: str,
        content: str,
        ttl: int = 1,
        proxied: Optional[bool] = None,
        priority: Optional[int] = None,
        **opts
    ) -> dict:
        """
        Create a DNS record.

        Args:
            zone_id: Zone identifier
            type: Record type (A, AAAA, CNAME, MX, TXT, NS, SRV, etc.)
            name: Record name (e.g., "www", "@", "mail.example.com")
            content: Record content (IP, hostname, text, etc.)
            ttl: Time to live in seconds (1 = automatic)
            proxied: Whether to proxy through Cloudflare (A/AAAA/CNAME only)
            priority: MX/SRV priority value

        Returns created DNS record object.
        """
        url = f"{BASE_URL}/zones/{zone_id}/dns_records"
        payload = {
            "type": type.upper(),
            "name": name,
            "content": content,
            "ttl": ttl,
        }

        if proxied is not None:
            payload["proxied"] = proxied
        if priority is not None:
            payload["priority"] = priority

        # Pass through extra options (e.g., SRV data fields)
        payload.update(opts)

        response = self.session.post(url, json=payload)
        data = self._handle_response(response)
        return data.get("result", {})

    def update_dns_record(self, zone_id: str, record_id: str, **fields) -> dict:
        """
        Update a DNS record.

        Args:
            zone_id: Zone identifier
            record_id: DNS record identifier
            type: Record type
            name: Record name
            content: Record content
            ttl: Time to live
            proxied: Proxy through Cloudflare

        Returns updated DNS record object.
        """
        url = f"{BASE_URL}/zones/{zone_id}/dns_records/{record_id}"
        response = self.session.patch(url, json=fields)
        data = self._handle_response(response)
        return data.get("result", {})

    def delete_dns_record(self, zone_id: str, record_id: str) -> dict:
        """
        Delete a DNS record.

        Args:
            zone_id: Zone identifier
            record_id: DNS record identifier

        Returns deletion confirmation.
        """
        url = f"{BASE_URL}/zones/{zone_id}/dns_records/{record_id}"
        response = self.session.delete(url)
        data = self._handle_response(response)
        return data.get("result", {"id": record_id})

    def export_dns_records(self, zone_id: str) -> str:
        """
        Export DNS records in BIND zone file format.

        Args:
            zone_id: Zone identifier

        Returns BIND-format zone file as string.
        """
        url = f"{BASE_URL}/zones/{zone_id}/dns_records/export"
        response = self.session.get(url)

        if response.status_code == 401:
            raise CloudflareAuthError("Invalid API token. Check ~/.cloudflare-credentials")
        elif response.status_code == 403:
            raise CloudflareAuthError("Access forbidden. Check API token permissions.")
        elif response.status_code >= 400:
            raise CloudflareError(f"API error {response.status_code}: {response.text}")

        return response.text

    # =========================================================================
    # Account Operations
    # =========================================================================

    def list_accounts(self) -> list:
        """
        List all accounts the API token has access to.

        Returns list of account objects.
        """
        url = f"{BASE_URL}/accounts"
        return self._paginate(url)

    def get_account(self, account_id: str) -> dict:
        """
        Get account details.

        Args:
            account_id: Account identifier

        Returns account object.
        """
        url = f"{BASE_URL}/accounts/{account_id}"
        response = self.session.get(url)
        data = self._handle_response(response)
        return data.get("result", {})

    # =========================================================================
    # Convenience / Summary Methods
    # =========================================================================

    def verify_token(self) -> dict:
        """
        Verify the API token is valid and return token details.

        Returns token verification result with status and permissions.
        """
        url = f"{BASE_URL}/user/tokens/verify"
        response = self.session.get(url)
        data = self._handle_response(response)
        return data.get("result", {})

    def get_zone_summary(self, zone_id: str) -> dict:
        """
        Get zone details with DNS record counts by type.

        Args:
            zone_id: Zone identifier

        Returns zone details plus dns_record_counts dict.
        """
        zone = self.get_zone(zone_id)
        records = self.list_dns_records(zone_id)

        counts = {}
        for r in records:
            rtype = r.get("type", "UNKNOWN")
            counts[rtype] = counts.get(rtype, 0) + 1

        zone["dns_record_counts"] = counts
        zone["dns_record_total"] = len(records)
        return zone

    def check_availability(self, domain: str) -> dict:
        """
        Check if a domain name is available to register via RDAP.

        Args:
            domain: Domain name to check (e.g., "example.com")

        Returns dict with: domain, available (bool), registered (bool),
        registrar, expiration, and raw RDAP status codes.
        """
        import requests

        domain = domain.lower().strip()
        if "." not in domain:
            raise ValueError(f"Invalid domain: {domain} (must include TLD, e.g., 'example.com')")

        result = {
            "domain": domain,
            "available": False,
            "registered": False,
            "registrar": None,
            "expiration": None,
            "creation": None,
            "status": [],
        }

        try:
            resp = requests.get(
                f"https://rdap.org/domain/{domain}",
                headers={"Accept": "application/rdap+json"},
                timeout=10,
                allow_redirects=True,
            )
        except requests.exceptions.RequestException as e:
            raise CloudflareError(f"RDAP lookup failed for {domain}: {e}")

        if resp.status_code == 404:
            result["available"] = True
            return result

        if resp.status_code >= 400:
            raise CloudflareError(f"RDAP lookup error {resp.status_code} for {domain}: {resp.text[:200]}")

        try:
            data = resp.json()
        except ValueError:
            raise CloudflareError(f"Invalid RDAP response for {domain}")

        result["registered"] = True

        # Extract status codes
        result["status"] = data.get("status", [])

        # Extract registrar from entities
        for entity in data.get("entities", []):
            roles = entity.get("roles", [])
            if "registrar" in roles:
                vcard = entity.get("vcardArray", [None, []])
                if len(vcard) > 1:
                    for field in vcard[1]:
                        if field[0] == "fn":
                            result["registrar"] = field[3]
                            break
                # Fallback to handle/name
                if not result["registrar"]:
                    result["registrar"] = entity.get("handle") or entity.get("name")

        # Extract dates from events
        for event in data.get("events", []):
            action = event.get("eventAction", "")
            date = event.get("eventDate", "")
            if action == "expiration":
                result["expiration"] = date
            elif action == "registration":
                result["creation"] = date

        return result

    def check_availability_bulk(self, domains: list) -> list:
        """
        Check availability of multiple domains.

        Args:
            domains: List of domain names to check

        Returns list of availability results.
        """
        results = []
        for domain in domains:
            try:
                results.append(self.check_availability(domain))
            except Exception as e:
                results.append({
                    "domain": domain,
                    "available": None,
                    "error": str(e),
                })
        return results

    def find_dns_record(self, zone_id: str, name: str) -> list:
        """
        Search DNS records by name substring.

        Args:
            zone_id: Zone identifier
            name: Partial record name to search for

        Returns list of matching DNS records.
        """
        records = self.list_dns_records(zone_id)
        name_lower = name.lower()
        return [r for r in records if name_lower in r.get("name", "").lower()]


# =============================================================================
# CLI Interface
# =============================================================================

def _resolve_zone_id(client: CloudflareClient, zone_ref: str) -> str:
    """Resolve a zone reference (ID or domain name) to a zone ID."""
    # If it looks like a domain name (contains a dot), look it up
    if "." in zone_ref and len(zone_ref) != 32:
        zone = client.get_zone_by_name(zone_ref)
        return zone["id"]
    return zone_ref


def main():
    """Simple CLI for testing."""
    import argparse

    parser = argparse.ArgumentParser(description="Cloudflare API Client")
    parser.add_argument("command", choices=[
        "search", "zones", "zone", "zone-summary", "zone-create", "zone-delete",
        "dns", "dns-find", "dns-create", "dns-update", "dns-delete", "dns-export",
        "accounts", "account",
        "check",
        "verify"
    ], help="Command to execute")
    parser.add_argument("args", nargs="*", help="Command arguments")
    parser.add_argument("--type", "-t", help="DNS record type (A, AAAA, CNAME, MX, TXT, etc.)")
    parser.add_argument("--name", "-n", help="DNS record name")
    parser.add_argument("--content", "-c", help="DNS record content")
    parser.add_argument("--ttl", type=int, default=1, help="TTL (1=auto)")
    parser.add_argument("--proxied", action="store_true", default=None, help="Proxy through Cloudflare")
    parser.add_argument("--no-proxied", action="store_true", help="Do not proxy through Cloudflare")
    parser.add_argument("--priority", type=int, help="MX/SRV priority")
    parser.add_argument("--status", help="Zone status filter")

    args = parser.parse_args()

    # Handle --no-proxied flag
    proxied = None
    if args.proxied:
        proxied = True
    elif args.no_proxied:
        proxied = False

    client = CloudflareClient()

    try:
        # =================================================================
        # Domain / Zone Search (MOST IMPORTANT)
        # =================================================================

        if args.command == "search":
            if not args.args:
                print("Usage: cloudflare_client.py search QUERY", file=sys.stderr)
                sys.exit(1)
            query = " ".join(args.args)
            result = client.search_zones(query)
            _print_zones(result)
            return

        elif args.command == "zones":
            filters = {}
            if args.status:
                filters["status"] = args.status
            result = client.list_zones(**filters)
            _print_zones(result)
            return

        elif args.command == "zone":
            if not args.args:
                print("Usage: cloudflare_client.py zone DOMAIN_OR_ID", file=sys.stderr)
                sys.exit(1)
            zone_ref = args.args[0]
            if "." in zone_ref and len(zone_ref) != 32:
                result = client.get_zone_by_name(zone_ref)
            else:
                result = client.get_zone(zone_ref)

        elif args.command == "zone-summary":
            if not args.args:
                print("Usage: cloudflare_client.py zone-summary DOMAIN_OR_ID", file=sys.stderr)
                sys.exit(1)
            zone_id = _resolve_zone_id(client, args.args[0])
            result = client.get_zone_summary(zone_id)

        elif args.command == "zone-create":
            if not args.args:
                print("Usage: cloudflare_client.py zone-create DOMAIN", file=sys.stderr)
                sys.exit(1)
            result = client.create_zone(args.args[0])

        elif args.command == "zone-delete":
            if not args.args:
                print("Usage: cloudflare_client.py zone-delete ZONE_ID", file=sys.stderr)
                sys.exit(1)
            result = client.delete_zone(args.args[0])

        # =================================================================
        # DNS Record Commands
        # =================================================================

        elif args.command == "dns":
            if not args.args:
                print("Usage: cloudflare_client.py dns ZONE_ID_OR_DOMAIN [--type TYPE]", file=sys.stderr)
                sys.exit(1)
            zone_id = _resolve_zone_id(client, args.args[0])
            filters = {}
            if args.type:
                filters["type"] = args.type.upper()
            result = client.list_dns_records(zone_id, **filters)
            _print_dns_records(result)
            return

        elif args.command == "dns-find":
            if len(args.args) < 2:
                print("Usage: cloudflare_client.py dns-find ZONE_ID_OR_DOMAIN NAME", file=sys.stderr)
                sys.exit(1)
            zone_id = _resolve_zone_id(client, args.args[0])
            result = client.find_dns_record(zone_id, args.args[1])
            _print_dns_records(result)
            return

        elif args.command == "dns-create":
            if not args.args:
                print("Usage: cloudflare_client.py dns-create ZONE_ID_OR_DOMAIN --type A --name www --content 1.2.3.4 [--proxied]", file=sys.stderr)
                sys.exit(1)
            if not args.type or not args.name or not args.content:
                print("Error: --type, --name, and --content are required for dns-create", file=sys.stderr)
                sys.exit(1)
            zone_id = _resolve_zone_id(client, args.args[0])
            result = client.create_dns_record(
                zone_id,
                type=args.type,
                name=args.name,
                content=args.content,
                ttl=args.ttl,
                proxied=proxied,
                priority=args.priority,
            )

        elif args.command == "dns-update":
            if len(args.args) < 2:
                print("Usage: cloudflare_client.py dns-update ZONE_ID_OR_DOMAIN RECORD_ID [--content ...] [--proxied]", file=sys.stderr)
                sys.exit(1)
            zone_id = _resolve_zone_id(client, args.args[0])
            fields = {}
            if args.type:
                fields["type"] = args.type.upper()
            if args.name:
                fields["name"] = args.name
            if args.content:
                fields["content"] = args.content
            if args.ttl != 1:
                fields["ttl"] = args.ttl
            if proxied is not None:
                fields["proxied"] = proxied
            result = client.update_dns_record(zone_id, args.args[1], **fields)

        elif args.command == "dns-delete":
            if len(args.args) < 2:
                print("Usage: cloudflare_client.py dns-delete ZONE_ID_OR_DOMAIN RECORD_ID", file=sys.stderr)
                sys.exit(1)
            zone_id = _resolve_zone_id(client, args.args[0])
            result = client.delete_dns_record(zone_id, args.args[1])

        elif args.command == "dns-export":
            if not args.args:
                print("Usage: cloudflare_client.py dns-export ZONE_ID_OR_DOMAIN", file=sys.stderr)
                sys.exit(1)
            zone_id = _resolve_zone_id(client, args.args[0])
            result = client.export_dns_records(zone_id)
            print(result)
            return

        # =================================================================
        # Domain Availability Check
        # =================================================================

        elif args.command == "check":
            if not args.args:
                print("Usage: cloudflare_client.py check DOMAIN [DOMAIN2 ...]", file=sys.stderr)
                sys.exit(1)
            if len(args.args) == 1:
                result = client.check_availability(args.args[0])
                _print_availability([result])
            else:
                result = client.check_availability_bulk(args.args)
                _print_availability(result)
            return

        # =================================================================
        # Account Commands
        # =================================================================

        elif args.command == "accounts":
            result = client.list_accounts()

        elif args.command == "account":
            if not args.args:
                print("Usage: cloudflare_client.py account ACCOUNT_ID", file=sys.stderr)
                sys.exit(1)
            result = client.get_account(args.args[0])

        # =================================================================
        # Token Verification
        # =================================================================

        elif args.command == "verify":
            result = client.verify_token()

        print(json.dumps(result, indent=2, default=str))

    except CloudflareAuthError as e:
        print(f"Authentication Error: {e}", file=sys.stderr)
        sys.exit(1)
    except CloudflareRateLimitError as e:
        print(f"Rate Limit Error: {e}", file=sys.stderr)
        sys.exit(1)
    except CloudflareNotFoundError as e:
        print(f"Not Found: {e}", file=sys.stderr)
        sys.exit(1)
    except CloudflareError as e:
        print(f"API Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def _print_availability(results: list):
    """Pretty-print domain availability results."""
    for r in results:
        domain = r.get("domain", "?")
        if r.get("error"):
            print(f"  {domain:<30} ERROR  {r['error']}")
        elif r.get("available"):
            print(f"  {domain:<30} AVAILABLE")
        else:
            registrar = r.get("registrar") or "unknown registrar"
            expiration = ""
            if r.get("expiration"):
                expiration = f"  expires {r['expiration'][:10]}"
            print(f"  {domain:<30} TAKEN   ({registrar}){expiration}")
    print()


def _print_zones(zones: list):
    """Pretty-print zone list as table."""
    if not zones:
        print("No zones found.")
        return

    # Table format for readability
    print(f"{'Domain':<40} {'Status':<12} {'Plan':<15} {'ID'}")
    print("-" * 100)
    for z in zones:
        plan = z.get("plan", {}).get("name", "")
        print(f"{z.get('name', ''):<40} {z.get('status', ''):<12} {plan:<15} {z.get('id', '')}")
    print(f"\nTotal: {len(zones)} zone(s)")


def _print_dns_records(records: list):
    """Pretty-print DNS record list as table."""
    if not records:
        print("No DNS records found.")
        return

    print(f"{'Type':<8} {'Name':<40} {'Content':<45} {'Proxied':<8} {'TTL':<8} {'ID'}")
    print("-" * 160)
    for r in records:
        proxied = "yes" if r.get("proxied") else "no"
        ttl = "auto" if r.get("ttl") == 1 else str(r.get("ttl", ""))
        content = r.get("content", "")
        if len(content) > 43:
            content = content[:40] + "..."
        print(f"{r.get('type', ''):<8} {r.get('name', ''):<40} {content:<45} {proxied:<8} {ttl:<8} {r.get('id', '')}")
    print(f"\nTotal: {len(records)} record(s)")


if __name__ == "__main__":
    main()
