# Example Pipedream workflows (publish for backlinks)

These need no app approval — each is a plain HTTP Request step calling Docracy's existing REST
API (`apps/worker/src/routes/zapier.ts`), wired to whatever trigger app makes sense. Build each in
the Pipedream workflow builder, test it once, then use **Deploy → Share → Publish as a workflow
template** — that's the step that actually creates the public, indexable page (I can't do this
part; it needs your logged-in pipedream.com account).

Common setup for every workflow below:

- Store the Docracy API key (from the Dashboard's "MCP connector & API key" card) as a Pipedream
  **environment variable**, e.g. `DOCRACY_API_KEY` — never paste it directly into a step.
- Look up a template's ID once via `GET https://api.docracy.io/api/zapier/templates` (same Bearer
  auth) — returns `[{id, name}]`.
- Every "Send/Generate" HTTP step below is: `POST https://api.docracy.io/api/zapier/documents`,
  header `Authorization: Bearer {{DOCRACY_API_KEY}}`, JSON body `{templateId, signers, ttlDays?}`.

---

## 1. "Send NDA via Docracy when Stripe payment succeeds"

- **Trigger:** Stripe app → *New Payment* (or *Charge Succeeded*) event source.
- **Step 2 (HTTP Request):**
  - Method/URL: `POST https://api.docracy.io/api/zapier/documents`
  - Headers: `Authorization: Bearer {{DOCRACY_API_KEY}}`, `Content-Type: application/json`
  - Body:
    ```json
    {
      "templateId": "<your NDA template ID>",
      "signers": [
        {
          "name": "{{steps.trigger.event.data.object.billing_details.name}}",
          "email": "{{steps.trigger.event.data.object.billing_details.email}}"
        }
      ]
    }
    ```
- **Use case copy for the published page:** "Automatically send a mutual NDA for signature the
  moment a new customer's payment clears — no manual follow-up email."

## 2. "Auto-sign vendor agreement via Docracy"

- **Trigger:** Google Sheets (or Airtable) app → *New Row* event source, on a "New Vendor
  Onboarding" sheet with `Name` / `Email` / `Company` columns.
- **Step 2 (HTTP Request):**
  - Method/URL: `POST https://api.docracy.io/api/zapier/documents`
  - Headers: same as above
  - Body:
    ```json
    {
      "templateId": "<your vendor agreement template ID>",
      "signers": [
        { "name": "{{steps.trigger.event.Name}}", "email": "{{steps.trigger.event.Email}}" }
      ],
      "ttlDays": 14
    }
    ```
- **Use case copy:** "The moment a new vendor row lands in your onboarding sheet, Docracy sends
  them the standard vendor agreement — signed and done before your next standup."

## 3. "Generate contract via Docracy API"

- **Trigger:** Pipedream `$.interface.http` (a plain webhook URL) — point a Typeform/Tally
  "New Response" webhook or any custom form at it.
- **Step 2 (HTTP Request):**
  - Method/URL: `POST https://api.docracy.io/api/zapier/documents`
  - Headers: same as above
  - Body:
    ```json
    {
      "templateId": "<your contract template ID>",
      "signers": [
        { "name": "{{steps.trigger.event.body.name}}", "email": "{{steps.trigger.event.body.email}}" }
      ]
    }
    ```
- **Step 3 (optional, HTTP Request):** poll status any time with
  `GET https://api.docracy.io/api/status/{{steps.step_2.$return_value.statusToken}}` (no auth
  header needed — the token is the credential).
- **Use case copy:** "Turn any form submission into a signed contract automatically — wire up
  Docracy's API to your intake form once, and every new lead gets a ready-to-sign agreement."
