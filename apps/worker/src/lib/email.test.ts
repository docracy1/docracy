import { describe, it, expect, vi, afterEach } from "vitest";
import { sendSigningInvite, sendReminder, sendCompletionEmails, sendFeedback } from "./email";
import { makeMockEnv } from "../test/mockEnv";
import type { DocState } from "@docracy/shared";

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

    expect(capture.logged()).toContain("Hi Anna Müller,");
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

describe("sendCompletionEmails", () => {
  afterEach(() => vi.restoreAllMocks());

  it("mentions the certificate attachment when one is provided", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();
    const finalPdf = new Uint8Array([1, 2, 3]);
    const certificatePdf = new Uint8Array([4, 5, 6]);

    await sendCompletionEmails(env, makeDoc("Anna"), finalPdf, certificatePdf);

    expect(capture.logged()).toContain("certificate attached, 3 bytes");
  });

  it("omits certificate mention when none is provided", async () => {
    const { env } = makeMockEnv();
    const capture = captureDevEmailLog();
    const finalPdf = new Uint8Array([1, 2, 3]);

    await sendCompletionEmails(env, makeDoc("Anna"), finalPdf);

    expect(capture.logged()).not.toContain("certificate attached");
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
