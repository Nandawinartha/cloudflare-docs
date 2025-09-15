PaaS on Cloudflare Workers for Platforms + Cloudflare for SaaS

Overview

- This folder contains a minimal PaaS scaffold built on:
  - Workers for Platforms: multi-tenant dispatch to user workers via a Dispatch Namespace
  - Cloudflare for SaaS (SSL for SaaS): custom hostnames + automated certs per tenant

Architecture

- dispatcher: Edge entrypoint, routes requests by Host header to a user worker via Dispatch Namespace. Stores hostname→tenant mapping in KV.
- control-api: Management API for tenants. CRUD for hostname→tenant in KV, and optional Cloudflare for SaaS onboarding (create custom hostname) via REST API.
- user-template: Example tenant/user Worker code with D1 and R2 bindings. In production, user code should be created as a "User Worker" in the Dispatch Namespace.
- dashboard: Minimal UI to create tenant mappings and Custom Hostnames (uses control API).
- scripts: Helper scripts for creating custom hostnames (SSL for SaaS) and verifying tokens.

Prerequisites

- Node.js 18+
- Wrangler v3 or v4
- Cloudflare account ID and zone ID for the SaaS zone
- API token with required permissions stored as env var CF_API_TOKEN (do not hardcode). Do not paste tokens into code or config.

Deploy Steps (quick start)

1) Create resources

```bash
cd paas

# 1. Dispatcher KV and Dispatch Namespace
cd dispatcher
wrangler kv namespace create TENANT_MAP
# In wrangler.toml, set your dispatch namespace name
# wrangler deploy

# 2. Control API KV binding must match dispatcher KV (reuse same namespace name or adjust)
cd ../control-api
# wrangler deploy

# 3. User Worker template (optional demo)
cd ../user-template
# wrangler deploy --name user-hello

# 4. Dashboard
cd ../dashboard
# wrangler deploy
```

2) Configure bindings

- Edit `dispatcher/wrangler.toml`:
  - account_id
  - dispatch_namespaces (binding USER_WORKERS, set `namespace` to your Dispatch Namespace)
  - kv_namespaces (TENANT_MAP id)

- Edit `control-api/wrangler.toml`:
  - account_id
  - kv_namespaces (TENANT_MAP id must match dispatcher)

3) Create a tenant mapping

```bash
curl -X POST https://<your-control-api-domain>/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "alice.example.com",
    "userId": "alice",
    "metadata": {"plan": "pro"}
  }'
```

4) (Optional) Create Custom Hostname for SSL for SaaS

```bash
export CF_API_TOKEN=***
export CF_ACCOUNT_ID=***
export CF_ZONE_ID=***   # SaaS zone hosting your apex, e.g., example.com

node scripts/saas-onboard.mjs alice.example.com
```

5) Test routing

- Point DNS (CNAME) of `alice.example.com` to your SaaS zone hostname.
- Request `https://alice.example.com/` and verify it reaches the user worker via dispatcher.

Security Notes

- Never commit tokens. Use environment variables or secret storage (`wrangler secret put`).
- The control API is unauthenticated in this demo. Protect it behind Zero Trust or add authentication.
- For production, store richer tenant config (assets, data bindings, plans) and implement per-tenant limits.

How this maps to Workers for Platforms

- Dispatch Namespace `USER_WORKERS` is used by `dispatcher` to invoke user workers by `userId`.
- KV `TENANT_MAP` stores `host -> { userId, metadata }` for routing.
- You can provision user workers via Wrangler or API and reference their names as `userId`.

How this maps to Cloudflare for SaaS

- Use `scripts/saas-onboard.mjs` to create Custom Hostnames on your SaaS zone.
- Point customer CNAMEs to your SaaS zone; certificates will be provisioned automatically upon validation.
- Manage lifecycle (pause/delete) via Cloudflare API v4 for Custom Hostnames.

References

- Workers for Platforms: user workers, dynamic dispatch, hostname routing
- SSL for SaaS (Custom Hostnames)

D1 and R2

- Create D1 DB and bind to user worker as `DB`. Example:
  - `wrangler d1 create paas_user_db`
  - Add `[[d1_databases]]` in user-template wrangler.toml with the generated database_id/name.
- Create R2 bucket and bind to user worker as `BUCKET`.
  - `wrangler r2 bucket create paas-user-bucket`
  - Add `[[r2_buckets]]` in user-template wrangler.toml.


