# Docracy Pipedream components

Thin wrappers around the same REST API built for Zapier (`apps/worker/src/routes/zapier.ts`,
documented alongside `apps/zapier/`). Same Bearer-token auth (the API key from the Docracy
Dashboard's "MCP connector & API key" card), same endpoints.

## Layout

- `docracy.app.mjs` — app definition: auth (`this.$auth.api_key`), base URL, shared request
  methods, and the `templateId` prop (dynamic dropdown via `GET /api/zapier/templates`).
- `actions/send-document-from-template/` — `POST /api/zapier/documents`.
- `actions/bulk-send-from-template/` — `POST /api/zapier/documents/bulk`.
- `actions/get-document-status/` — `GET /api/status/:token` (public, token-based — no API key
  needed for this one; the status token returned by the two send actions above *is* the
  credential).
- `sources/document-created/`, `sources/signer-signed/`, `sources/document-completed/` — instant,
  webhook-based triggers using the same REST Hook subscribe/unsubscribe pattern as the Zapier app
  (`POST /api/zapier/hooks/:event`, `DELETE /api/zapier/hooks/:id`).

## Publishing status

Pipedream's public app registry (the pages at `pipedream.com/apps/<slug>`, `/actions/<slug>/...`,
etc.) is **not self-serve** — a new app must first be requested and approved by the Pipedream team
(a "new app/integration request" issue on `github.com/PipedreamHQ/pipedream`) before they create a
`components/docracy/` directory upstream that a PR can add actions/sources to. See
`pipedream.com/docs/apps/contributing`.

Until that's approved, these files:

- Can be tested and used privately today via the `pd` CLI (`pd publish` for actions, `pd deploy`
  for sources) against your own Pipedream account — not publicly listed.
- Are meant to be adapted into a PR against `PipedreamHQ/pipedream`'s `components/docracy/`
  directory once the app request above is approved (folder/build conventions there may differ
  slightly — check `CONTRIBUTING.md` in that repo at that time).

Separately, publishing individual **workflow templates** (Pipedream's `/workflows` /
`/@<user>/...` shareable pages) that call Docracy's API via a plain HTTP step needs no approval at
all — see the drafted examples the team is tracking for that.
