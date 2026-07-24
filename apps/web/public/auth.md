# Docracy — Agent Authentication

Docracy does not use OAuth or OpenID Connect. There is no dynamic client registration endpoint, no
authorization/token endpoints, and no `/.well-known/oauth-authorization-server` — publishing one
would claim infrastructure that doesn't actually exist here.

## How authentication actually works

- **Human users**: passwordless magic-link email sign-in. Requesting one at
  https://docracy.io/login emails a one-time link; clicking it creates a session cookie. First
  sign-in also creates the account — there's no separate registration step.
- **Agents, the REST API, MCP, and Zapier**: a single static Bearer API key (format `dk_...`),
  generated from the Dashboard ("MCP connector & API key" card) by a signed-in **paid** account.
  There is no self-service or programmatic registration endpoint for agents — a human has to sign
  in and generate the key first; an agent can't obtain one unassisted.

## Using the key

```
Authorization: Bearer <your-api-key>
```

or a `?token=` query parameter — both work identically for:
- The REST API (endpoints listed at https://docracy.io/docs#api)
- The MCP connector (https://docracy.io/mcp)
- Zapier

## What this key can and can't do

- One key per account (workspace), full access to that account's documents, templates, and
  webhooks — no scopes or per-permission claims.
- No expiry — valid until regenerated.
- No separate revocation endpoint: regenerating the key from the Dashboard immediately invalidates
  the previous one. That's the only "revoke."

## No key needed for the free tier

The free tier (2-signer signing chains, and the MCP connector's `check_status` tool) requires no
authentication at all — anyone, human or agent, can use it anonymously.
