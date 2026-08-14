Title: [APP] Docracy

**Name of app / service**
Docracy — free, no-signup sequential e-signature (https://docracy.io)

**Link to developer documentation**
https://docracy.io/docs (general docs) and https://docracy.io/mcp (API/auth overview). Auth is a
simple Bearer API key issued from the user's Dashboard — no OAuth.

**Is lack of support preventing you from moving forward, or do you have a workaround?**
No blocker — we already have a working Zapier integration on the same REST API and a set of
Pipedream components ready to go (app definition + 3 actions + 3 webhook-based sources), just
waiting on an app slug/directory to submit them against.

**Are there specific actions or triggers you'd like to see for this app? Please let us know here
or use the Action and Trigger issue templates to open requests for each!**
Actions: Send Document From Template, Bulk Send From Template, Get Document Status.
Triggers (instant, webhook-based): Document Created, Signer Signed, Document Completed.
