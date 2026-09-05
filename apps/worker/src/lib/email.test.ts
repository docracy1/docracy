import { describe, it, expect, vi, afterEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  sendSigningInvite,
  sendReminder,
  sendPreparerStatusLink,
  sendCompletionEmails,
  sendFeedback,
  sendMagicLink,
  sendPinEmail,
  sendArchiveNag,
  sendCobroNotice,
  sendOnboardingStep1,
} from "./email";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

async function makePdfWithPages(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([400, 500]);
  return doc.save();
}

function makeDoc(signerName: string): DocState {
  return {
    docId: "doc-1",
    accountId: null,
    title: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 999_999_999).toISOString(),
    preparerSigns: false,
    status: "pending",
    completedAt: null,
    signers: [
      {
        order: 1,
        name: signerName,
        email: "victim@example.com",
        status: "pending",
        signedAt: null,
        linkSentAt: null,
        remindersSent: [],
      },
    ],
    fields: [],
  };
}

// No RESEND_API_KEY is set in the mock env, so `send()` logs the HTML to console instead of
// calling out to Resend — that's what these tests inspect.
function captureDevEmailLog(): { logged: () => string; restore: () => void } {
  const spy = vi.spyOn(console, "log").mockImplementation(() => {});
  return {
    logged: () => spy.mock.calls.map((call) => call.join(" ")).join("\n"),
    restore: () => spy.mockRestore(),
  };
}

describe("email HTML escaping", () => {
  afterEach(() => vi.restoreAllMocks());

  it("escapes an HTML payload in a signer's name in the signing invite", async () => {
    const { env } = makeMockEnv();
    const malicious = '<img src=x onerror=alert(1)>';
    const capture = captureDevEmailLog();

    await sendSigningInvite(env, makeDoc(malicious), 1, "tok");

    expect(capture.logged()).not.toContain(malicious);
    expect(capture.logged()).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("escapes an HTML payload in a signer's name in reminder emails", async () => {
    const { env } = makeMockEnv();
    const malicious = "<script>alert(1)</script>";
    const capture = captureDevEmailLog();

    await sendReminder(env, makeDoc(malicious), 1, "tok", false);

    expect(capture.logged()).not.toContain(malicious);
    expect(capture.logged()).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("leaves an ordinary name untouched", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendSigningInvite(env, makeDoc("Anna Müller"), 1, "tok");

    expect(capture.logged()).toContain("Dear Anna Müller,");
  });
});

describe("sendPinEmail", () => {
  afterEach(() => vi.restoreAllMocks());

  it("includes the PIN and the signer's name, escaped", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendPinEmail(env, makeDoc("<b>Anna</b>"), 1, "4242");

    expect(capture.logged()).toContain("4242");
    expect(capture.logged()).not.toContain("<b>Anna</b>");
    expect(capture.logged()).toContain("&lt;b&gt;Anna&lt;/b&gt;");
  });

  it("no-ops for an order with no matching signer", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendPinEmail(env, makeDoc("Anna"), 99, "4242");

    expect(capture.logged()).toBe("");
  });
});

describe("sendSigningInvite — custom subject/message", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the default subject/message when none is set on the doc", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendSigningInvite(env, makeDoc("Anna"), 1, "tok");

    expect(capture.logged()).toContain('subject="Ready to sign — you have a document waiting"');
    expect(capture.logged()).toContain("You've been invited to sign a document through Docracy.");
  });

  it("uses the preparer's custom subject and message when set, and escapes the message", async () => {
    const { env } = makeMockEnv();
    const doc = { ...makeDoc("Anna"), customSubject: "Please sign the lease", customMessage: "Sign by <Friday>!" };
    const capture = captureDevEmailLog();

    await sendSigningInvite(env, doc, 1, "tok");

    expect(capture.logged()).toContain('subject="Please sign the lease"');
    expect(capture.logged()).toContain("Sign by &lt;Friday&gt;!");
    expect(capture.logged()).not.toContain("You've been invited to sign");
  });
});

describe("emailShell branding — the 3 templates that used to bypass it", () => {
  afterEach(() => vi.restoreAllMocks());

  it("wraps sendPreparerStatusLink in the Docracy-branded emailShell", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendPreparerStatusLink(env, "preparer@example.com", "tok");

    expect(capture.logged()).toContain("docracy-wordmark.png");
  });

  it("wraps sendReminder in the Docracy-branded emailShell", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendReminder(env, makeDoc("Anna"), 1, "tok", false);

    expect(capture.logged()).toContain("docracy-wordmark.png");
  });

  it("wraps sendCompletionEmails' final-signed email in the Docracy-branded emailShell", async () => {
    // sendCompletionEmails has its own dev-mode console.log (just a byte count, not the HTML), so
    // unlike the other two above this one only actually builds the branded HTML on the real send
    // path — RESEND_API_KEY has to be set and fetch mocked to see it.
    const { env } = makeMockEnv({ RESEND_API_KEY: "test-key" });
    const bodies: string[] = [];
    vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
      bodies.push(JSON.parse(init!.body as string).html);
      return new Response("{}", { status: 200 });
    });
    const finalPdf = await makePdfWithPages(1);

    await sendCompletionEmails(env, makeDoc("Anna"), finalPdf, "deadbeef");

    expect(bodies[0]).toContain("docracy-wordmark.png");
  });
});

describe("sendCompletionEmails", () => {
  afterEach(() => vi.restoreAllMocks());

  it("merges the certificate into one combined attachment when a certificate is provided", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();
    const finalPdf = await makePdfWithPages(2);
    const certificatePdf = await makePdfWithPages(1);

    await sendCompletionEmails(env, makeDoc("Anna"), finalPdf, "deadbeef", certificatePdf);

    const match = capture.logged().match(/combined PDF attached, (\d+) bytes/);
    expect(match).toBeTruthy();
    // A merged 3-page PDF is a different (larger) document than the 2-page final PDF alone.
    expect(Number(match![1])).not.toBe(finalPdf.byteLength);
  });

  it("attaches the final PDF unmerged when no certificate is provided", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();
    const finalPdf = await makePdfWithPages(2);

    await sendCompletionEmails(env, makeDoc("Anna"), finalPdf, "deadbeef");

    expect(capture.logged()).toContain(`combined PDF attached, ${finalPdf.byteLength} bytes`);
  });

  it("also emails an anonymous preparer the final PDF with an upgrade CTA", async () => {
    const { env } = makeMockEnv({ RESEND_API_KEY: "test-key" });
    const recipients: string[] = [];
    const subjects: string[] = [];
    const bodies: string[] = [];
    vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
      const parsed = JSON.parse(init!.body as string) as { to: string; subject: string; html: string };
      recipients.push(parsed.to);
      subjects.push(parsed.subject);
      bodies.push(parsed.html);
      return new Response("{}", { status: 200 });
    });
    const finalPdf = await makePdfWithPages(1);
    const doc = { ...makeDoc("Anna"), preparerEmail: "preparer@example.com" };

    await sendCompletionEmails(env, doc, finalPdf, "deadbeef");

    expect(recipients).toContain("preparer@example.com");
    expect(subjects).toContain("Everyone has signed — your document is ready");
    const preparerHtml = bodies[recipients.indexOf("preparer@example.com")];
    expect(preparerHtml).toContain("/pricing");
    expect(preparerHtml).toContain("Keep signed files");
    expect(preparerHtml).not.toContain("keep history without paying");
    expect(preparerHtml).not.toContain("See paid plans");
  });

  it("includes the sender payment CTA on the signed completion email", async () => {
    const { env } = makeMockEnv({ RESEND_API_KEY: "test-key" });
    const bodies: string[] = [];
    vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
      bodies.push(JSON.parse(init!.body as string).html);
      return new Response("{}", { status: 200 });
    });
    const finalPdf = await makePdfWithPages(1);
    const doc = {
      ...makeDoc("Anna"),
      paymentRequest: { amount: "150", currency: "MXN", url: "https://paypal.me/acme" },
    };

    await sendCompletionEmails(env, doc, finalPdf, "deadbeef");

    expect(bodies[0]).toContain("Pay 150 MXN");
    expect(bodies[0]).toContain("https://paypal.me/acme");
    expect(bodies[0]).toContain("Docracy does not take this money");
    expect(bodies[0]).toContain("/signed/");
    expect(bodies[0]).toContain("Signed copy and pay");
  });

  it("does not double-email a preparer who was also a signer", async () => {
    const { env } = makeMockEnv({ RESEND_API_KEY: "test-key" });
    const recipients: string[] = [];
    vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
      recipients.push(JSON.parse(init!.body as string).to);
      return new Response("{}", { status: 200 });
    });
    const finalPdf = await makePdfWithPages(1);
    const doc = { ...makeDoc("Anna"), preparerEmail: "victim@example.com" };

    await sendCompletionEmails(env, doc, finalPdf, "deadbeef");

    expect(recipients.filter((r) => r === "victim@example.com")).toHaveLength(1);
  });
});

describe("sendArchiveNag", () => {
  afterEach(() => vi.restoreAllMocks());

  it("names the document, counterparties, delete date, and keep-file upgrade", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();
    const expiresAt = "2026-09-12T00:00:00.000Z";
    const doc = {
      ...makeDoc("Anna"),
      title: "Acme contractor agreement",
      preparerEmail: "preparer@example.com",
      expiresAt,
    };

    await sendArchiveNag(env, doc);

    const logged = capture.logged();
    expect(logged).toContain("preparer@example.com");
    expect(logged).toContain("Acme contractor agreement is deleted on");
    expect(logged).toContain("Acme contractor agreement");
    expect(logged).toContain("signed with Anna");
    expect(logged).toContain("Keep this file — $10/mo");
    expect(logged).not.toContain("keep history");
  });

  it("Spanish archive nag sells the immigrant packet and /es/precios", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();
    const doc = {
      ...makeDoc("Anna"),
      locale: "es" as const,
      accountId: "acct-1",
      title: "I-9",
      preparerEmail: "preparer@example.com",
      expiresAt: "2026-09-12T00:00:00.000Z",
    };

    await sendArchiveNag(env, doc);

    const logged = capture.logged();
    expect(logged).toContain("I-9, oferta, constancia y cobro");
    expect(logged).toContain("/es/precios?checkout=1");
    expect(logged).toContain("Guardar el expediente — $10/mes");
  });

  it("skips when there is no preparer email", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendArchiveNag(env, makeDoc("Anna"));

    expect(capture.logged()).toBe("");
  });
});

describe("locale — Spanish translations", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends sendSigningInvite in Spanish when doc.locale is es", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendSigningInvite(env, { ...makeDoc("Anna"), locale: "es" }, 1, "tok");

    const logged = capture.logged();
    expect(logged).toContain('subject="Listo para firmar');
    expect(logged).toContain("Hola Anna,");
    expect(logged).not.toContain("Dear Anna,");
  });

  it("falls back to English when doc.locale is absent", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendSigningInvite(env, makeDoc("Anna"), 1, "tok");

    const logged = capture.logged();
    expect(logged).toContain("Dear Anna,");
    expect(logged).not.toContain("Hola Anna,");
  });

  it("sends sendReminder in Spanish when doc.locale is es", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendReminder(env, { ...makeDoc("Anna"), locale: "es" }, 1, "tok", false);

    const logged = capture.logged();
    expect(logged).toContain("Todavía tienes un documento por firmar");
  });

  it("sends sendPreparerStatusLink in Spanish when passed locale es", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendPreparerStatusLink(env, "preparer@example.com", "tok", "es");

    const logged = capture.logged();
    expect(logged).toContain("El enlace de estado de tu documento");
  });

  it("sends sendMagicLink in Spanish when passed locale es", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendMagicLink(env, "anna@example.com", "https://docracy.io/auth/verify?token=tok", "es");

    const logged = capture.logged();
    expect(logged).toContain('subject="Tu enlace de acceso a Docracy"');
    expect(logged).toContain("Inicia sesión en Docracy");
    expect(logged).toContain("Firmas electrónicas gratis, sin registro");
    expect(logged).not.toContain("Free, no-signup e-signatures");
  });

  it("sends Spanish onboarding with the immigrant kit CTA and ES chrome", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendOnboardingStep1(env, "anna@example.com", "es");

    const logged = capture.logged();
    expect(logged).toContain('subject="Tu primer documento toma 30 segundos"');
    expect(logged).toContain("Plan inmigrante");
    expect(logged).toContain("/es/kit-llegar-eeuu");
    expect(logged).toContain("Firmas electrónicas gratis, sin registro");
  });
});

describe("sendFeedback", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends to FEEDBACK_EMAIL with the submitter set as reply-to", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendFeedback(env, "anna@example.com", "Found a bug in the signing flow.");

    const logged = capture.logged();
    expect(logged).toContain(`to=${env.FEEDBACK_EMAIL}`);
    expect(logged).toContain("reply-to=anna@example.com");
    expect(logged).toContain("Found a bug in the signing flow.");
  });

  it("escapes HTML in the submitted message and preserves line breaks", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();

    await sendFeedback(env, "anna@example.com", "line one\n<script>alert(1)</script>");

    const logged = capture.logged();
    expect(logged).not.toContain("<script>alert(1)</script>");
    expect(logged).toContain("line one<br>&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("sendCobroNotice", () => {
  afterEach(() => vi.restoreAllMocks());

  it("escapes the recipient name and does not say everyone signed", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();
    const doc: DocState = {
      ...makeDoc("<img src=x>"),
      kind: "cobro",
      title: "Invoice <b>12</b>",
      cobroRecipient: { name: "<img src=x>", email: "ana@x.com" },
      paymentRequest: { amount: "150", currency: "MXN", url: "https://paypal.me/acme" },
      signers: [],
      status: "completed",
      completedAt: new Date().toISOString(),
    };
    await sendCobroNotice(env, "ana@x.com", doc, "https://docracy.io/signed/tok", false);
    const logged = capture.logged();
    expect(logged).not.toContain("<img src=x>");
    expect(logged).toContain("&lt;img src=x&gt;");
    expect(logged).not.toContain("Everyone has signed");
    expect(logged).toContain("No signature needed");
    expect(logged).toContain("Pay 150 MXN");
  });
});
