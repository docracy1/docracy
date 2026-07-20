# Docracy Zapier Integration

Lets a Zap trigger on Docracy document events (created, signer signed, completed) and send a
saved template out for signature as an action — without either side needing to run a server.

## What this gives you

- **Triggers**: Document Created, Signer Signed, Document Completed — each a Zapier REST Hook,
  so events arrive instantly (no polling delay). Internally these are just Docracy webhooks that
  Zapier subscribes to and manages on your behalf.
- **Action**: Send Document From Template — pick a saved template, fill in signer name(s)/
  email(s), and Docracy creates and sends the document. Docracy's own free/paid document-creation
  logic runs underneath — signers must still match the template's saved signer count.
- **Auth**: a single API key (from the Docracy Dashboard's "MCP connector" card) — the *same* key
  used for the Claude/ChatGPT/Grok/Perplexity connector, not a separate credential to manage.

## Code layout

- `authentication.js` — the API key field + the auth-test call.
- `triggers/templateList.js` — hidden; powers the Action's "Template" dropdown.
- `triggers/documentCreated.js`, `triggers/signerSigned.js`, `triggers/documentCompleted.js` —
  each a REST Hook trigger (subscribe/unsubscribe wired to `apps/worker/src/routes/zapier.ts`).
- `creates/sendDocumentFromTemplate.js` — the one action, with a fixed 4 optional signer slots
  (only filled-in ones are sent — see the code comment for why a template's real, variable
  signer count can't be a dynamic Zapier field list).
- `index.js` — wires everything together and injects the API key into every outgoing request.
- `test/app.test.js` — unit tests against a stubbed `z.request`, no live server needed
  (`npx vitest run` from this folder).

## Local development

```
cd apps/zapier
npm install
npx vitest run
```

To point the app at a local `wrangler dev` worker instead of production while developing:

```
DOCRACY_ZAPIER_TEST_BASE_URL=http://localhost:8787 node -e "..."
```

(`constants.js` reads this env var; Zapier's own runtime never sets it, so a real deploy always
uses the production worker.)

## Publishing to Zapier (manual — needs your own Zapier account)

This part can't be done by an AI agent — it requires *your* Zapier developer account and, for
public listing, Zapier's own manual review. Steps:

1. Create a free account at https://developer.zapier.com if you don't have one.
2. Install the Zapier CLI globally: `npm install -g zapier-platform-cli`.
3. From this folder: `zapier login`.
4. Register the app (first time only): `zapier register "Docracy"`. This writes a `.zapierapprc`
   file here (gitignored — it's tied to your account, not something to commit).
5. Push this code as a new private version: `zapier push`. Zapier will lint it against the
   platform schema and report any issues.
6. Test it end-to-end in the Zapier editor using your own Docracy API key — build a real Zap and
   confirm the trigger/action both work before going further.
7. When ready for other people to find and use it: `zapier promote <version>` marks a version
   live for accounts you've explicitly invited, or submit the app for Zapier's public app
   directory review (Developer Platform → your app → "Submit for review") — that review is
   Zapier's own process and can take some time; it isn't something either of us can speed up.
