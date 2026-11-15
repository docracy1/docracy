import { test } from "node:test";
import assert from "node:assert/strict";
import { isOffFocus } from "./offFocus.mjs";

test("signing pages, templates and direct competitors stay indexed", () => {
  for (const p of ["/", "/pricing", "/free-templates", "/free-templates/pet-care-directive", "/es/plantillas-gratis/roommate-agreement",
    "/whatsapp-signing", "/docusign-alternative", "/es/alternativa-a-docusign", "/nda-signing", "/request-w9", "/verify",
    "/industry/freelancers", "/blog/what-is-an-nda", "/blog/why-nobody-reads-your-terms-of-service", "/packets/us-contractor"]) {
    assert.equal(isOffFocus(p), false, p);
  }
});

test("immigration, Latin American money and tools, third-party pairs and unrelated landings leave the index", () => {
  for (const p of ["/mexico-to-us", "/es/cuba-a-eeuu", "/itin", "/convert-to-crypto", "/kita-alternative", "/es/alternativa-a-siigo",
    "/pandadoc-vs-docusign", "/es/kita-vs-alegra", "/import-from-docusign", "/for/hungrypanda", "/blockchain-timestamp",
    "/blog/what-is-a-patent", "/packets/latam-to-us", "/1099-season/"]) {
    assert.equal(isOffFocus(p), true, p);
  }
});
