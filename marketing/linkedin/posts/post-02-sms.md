# LinkedIn 02 — SMS signing links

**Attach video:** `videos/post-02-sms.webm`

---

We added SMS signing invites to Docracy.

We did NOT add a Twilio bill.

The problem: email gets buried. Signers miss the link. You chase them for days.

The fix: text the signing link to their phone.

How: US carriers still expose email-to-SMS gateways (@vtext.com, @txt.att.net, etc.). We send through Resend — the same pipe we use for email.

When preparing a doc:
→ Enable "Also text signing links"
→ Add mobile number + carrier (AT&T, T-Mobile, Verizon, Sprint, US Cellular)
→ Signer gets a text alongside the email

Fair caveat: gateways aren't 100% reliable. But for many workflows, it's a nudge that actually gets opened.

Try free: https://docracy.io/try

#BuildInPublic #Startup #eSignature #ProductDesign
