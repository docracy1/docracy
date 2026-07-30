#!/usr/bin/env node
import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "../src");

const patches = [
  ["pages/Login.tsx", [
    ['placeholder="you@email.com"', 'placeholder={t("login.placeholder")}'],
    ['{submitting ? "Sending…" : ctaLabel}', '{submitting ? t("common.sending") : ctaLabel}'],
    ['{showPasswordLogin ? "Hide password sign-in" : "Sign in with a password instead"}', '{showPasswordLogin ? t("login.passwordHide") : t("login.passwordToggle")}'],
    ['placeholder="Password"', 'placeholder={t("login.password")}'],
    ['aria-label="Password"', 'aria-label={t("login.password")}'],
    ['{passwordSubmitting ? "Signing in…" : "Sign in"}', '{passwordSubmitting ? t("common.signingIn") : t("login.title")}'],
    ['err instanceof Error ? err.message : "Something went wrong"', 'err instanceof Error ? err.message : t("common.error")'],
  ]],
  ["pages/Status.tsx", [
    ['import { useNoIndex }', 'import { useT } from "../lib/i18n";\nimport { useNoIndex }'],
    ["export default function Status() {", "export default function Status() {\n  const t = useT();"],
    ['<h1>Not available</h1>', '<h1>{t("common.notAvailable")}</h1>'],
    ['<p>Loading…</p>', '<p>{t("common.loading")}</p>'],
    ['? "Fully signed"', '? t("status.fullySigned")'],
    ['? "Document declined"', '? t("sign.declinedDoc")'],
    [': "Document cancelled"', ': t("sign.cancelled")'],
    [': "Signing in progress"', ': t("status.inProgress")'],
    ['Reason: {status.voidReason}', '{t("sign.reason", { reason: status.voidReason })}'],
    ['Signed by: {s.name}', '{t("sign.signedBy", { name: s.name }).replace(" ✓", "")} ✓'],
    ['Declined: {s.name}', '{t("sign.declinedBy", { name: s.name })}'],
    ['Pending: {s.name}', '{t("sign.pending", { name: s.name })}'],
    ['Viewer: {cc.name', '{t("status.viewer", { info: cc.name'],
    ['{voiding ? "Cancelling…" : "Cancel document"}', '{voiding ? t("status.cancelling") : t("status.cancelDoc")}'],
    ['window.prompt("Optional reason for cancelling (leave blank to skip):")', 'window.prompt(t("status.cancelPrompt"))'],
    ['"Something went wrong"', 't("common.error")'],
    ['Download signed PDF', '{t("status.download")}'],
    ['Create a free account', '{t("status.createAccount")}'],
    ['See paid plans', '{t("status.seePaidPlans")}'],
    ["Keep every signed PDF in one place", '{t("status.keepPdfs")}'],
    ["Don't lose this status link", '{t("status.dontLoseLink")}'],
  ]],
  ["pages/PrepareSent.tsx", [
    ['import { track }', 'import { useT } from "../lib/i18n";\nimport { track }'],
    ["export default function PrepareSent() {", "export default function PrepareSent() {\n  const t = useT();"],
    ['<h1>Sent</h1>', '<h1>{t("sent.titleFallback")}</h1>'],
    ['<h1>On its way</h1>', '<h1>{t("sent.title")}</h1>'],
    ['Back home', '{t("common.backHome")}'],
    ['{copied === "status" ? "Copied" : "Copy status link"}', '{copied === "status" ? t("common.copied") : t("sent.copyStatus")}'],
    ['{copied === "share" ? "Copied" : "Share Docracy with a colleague"}', '{copied === "share" ? t("common.copied") : t("sent.shareColleague")}'],
    ['Create a free account', '{t("status.createAccount")}'],
    ['See paid plans', '{t("status.seePaidPlans")}'],
    ['Send another', '{t("sent.sendAnother")}'],
    ['Go to dashboard', '{t("common.goDashboard")}'],
  ]],
  ["components/FirstDocumentPrompt.tsx", [
    ['import { track }', 'import { useT } from "../lib/i18n";\nimport { track }'],
    ["export default function FirstDocumentPrompt", "export default function FirstDocumentPrompt"],
    ["}: { mobileOnly?: boolean; source?: string }) {", "}: { mobileOnly?: boolean; source?: string }) {\n  const t = useT();"],
    ['Send your first document', '{t("firstDoc.prompt")}'],
    ['Upload document', '{t("firstDoc.upload")}'],
    ['aria-label="Close"', 'aria-label={t("common.close")}'],
    ['Upload your PDF', '{t("firstDoc.modalTitle")}'],
    ['No account needed to send or sign.', '{t("firstDoc.modalSub")}'],
    ['aria-label="Upload PDF"', 'aria-label={t("firstDoc.uploadPdf")}'],
    ['Max file size: 15MB.', '{t("prepare.maxSize")}'],
  ]],
  ["components/IntegrationsBand.tsx", [
    ['import { Link }', 'import { Link } from "react-router-dom";\nimport { useT } from "../lib/i18n";'],
    ["export default function IntegrationsBand", "export default function IntegrationsBand"],
    ["compact = false }: IntegrationsBandProps) {", "compact = false }: IntegrationsBandProps) {\n  const t = useT();"],
    ['Connect Docracy with the tools you already use', '{t("integrations.title")}'],
    ['Learn more →', '{t("integrations.learnMore")}'],
  ]],
  ["components/PricingCalculator.tsx", [
    ['import { COMPETITORS', 'import { useT } from "../lib/i18n";\nimport { COMPETITORS'],
    ["export default function PricingCalculator() {", "export default function PricingCalculator() {\n  const t = useT();"],
    ['How Docracy compares on price', '{t("calc.title")}'],
    ['Team size', '{t("calc.teamSize")}'],
    ['{teamSize === 1 ? "person" : "people"}', '{teamSize === 1 ? t("common.person") : t("common.people")}'],
    ['Unlimited team members, one workspace', '{t("calc.unlimitedMembers")}'],
    ['pricing →', '{t("calc.pricingLink")}'],
  ]],
  ["pages/AuthVerify.tsx", [
    ['import { consumeMagicLinkToken }', 'import { useT } from "../lib/i18n";\nimport { consumeMagicLinkToken }'],
    ["export default function AuthVerify() {", "export default function AuthVerify() {\n  const t = useT();"],
    ['setError("Missing sign-in token.")', 'setError(t("auth.missingToken"))'],
    ['<h1>Sign-in failed</h1>', '<h1>{t("auth.failed")}</h1>'],
    ['<p>Signing you in…</p>', '<p>{t("auth.signingIn")}</p>'],
  ]],
  ["pages/TeamAccept.tsx", [
    ['import { acceptTeamInvite }', 'import { useT } from "../lib/i18n";\nimport { acceptTeamInvite }'],
    ["export default function TeamAccept() {", "export default function TeamAccept() {\n  const t = useT();"],
    ['setError("Missing invite token.")', 'setError(t("team.missingToken"))'],
    ['<h1>Couldn\'t accept invite</h1>', '<h1>{t("team.failed")}</h1>'],
    ['<p>Joining the workspace…</p>', '<p>{t("team.joining")}</p>'],
  ]],
  ["pages/Imprint.tsx", [
    ['import { usePageMeta }', 'import { useT } from "../lib/i18n";\nimport { usePageMeta }'],
    ["export default function Imprint() {", "export default function Imprint() {\n  const t = useT();"],
    ['<h1>Imprint</h1>', '<h1>{t("imprint.title")}</h1>'],
    ['<h3>Operator</h3>', '<h3>{t("imprint.operator")}</h3>'],
    ['<h3>Contact</h3>', '<h3>{t("imprint.contact")}</h3>'],
  ]],
  ["pages/Privacy.tsx", [
    ['export default function Privacy()', 'import { useT } from "../lib/i18n";\n\nexport default function Privacy()'],
    ["export default function Privacy() {", "export default function Privacy() {\n  const t = useT();"],
    ['<h1>Privacy</h1>', '<h1>{t("privacy.title")}</h1>'],
    ['<h3>What we collect</h3>', '<h3>{t("privacy.collect")}</h3>'],
    ['<h3>Audit trail</h3>', '<h3>{t("privacy.audit")}</h3>'],
    ['<h3>Retention</h3>', '<h3>{t("privacy.retention")}</h3>'],
    ['<h3>Traffic analytics</h3>', '<h3>{t("privacy.analytics")}</h3>'],
    ['<h3>Third parties</h3>', '<h3>{t("privacy.thirdParties")}</h3>'],
    ['<h3>Contact</h3>', '<h3>{t("privacy.contact")}</h3>'],
  ]],
  ["pages/Terms.tsx", [
    ['export default function Terms()', 'import { useT } from "../lib/i18n";\n\nexport default function Terms()'],
    ["export default function Terms() {", "export default function Terms() {\n  const t = useT();"],
    ['<h1>Terms</h1>', '<h1>{t("terms.title")}</h1>'],
    ['<h3>What Docracy is</h3>', '<h3>{t("terms.what")}</h3>'],
    ['<h3>No identity verification</h3>', '<h3>{t("terms.noVerify")}</h3>'],
    ['<h3>No guarantees</h3>', '<h3>{t("terms.noGuarantees")}</h3>'],
    ['<h3>Acceptable use</h3>', '<h3>{t("terms.acceptableUse")}</h3>'],
  ]],
  ["pages/About.tsx", [
    ['import { usePageMeta }', 'import { useT } from "../lib/i18n";\nimport { usePageMeta }'],
    ["export default function About() {", "export default function About() {\n  const t = useT();"],
    ['<h1>About Docracy</h1>', '<h1>{t("about.title")}</h1>'],
    ['<h3>Why this exists</h3>', '<h3>{t("about.why")}</h3>'],
    ['<h3>What it isn\'t</h3>', '<h3>{t("about.whatNot")}</h3>'],
    ['<h3>Who\'s behind it</h3>', '<h3>{t("about.who")}</h3>'],
    ['<h3>Get in touch</h3>', '<h3>{t("about.contact")}</h3>'],
  ]],
  ["components/SignerAttachmentsList.tsx", [
    ['export function SignerAttachmentsList', 'import { useT } from "../lib/i18n";\n\nexport function SignerAttachmentsList'],
    ["buildDownloadUrl,", "buildDownloadUrl,"],
    ["}) {", "}) {\n  const t = useT();"],
    ['Signer uploads', '{t("attachments.title")}'],
  ]],
  ["components/PdfViewer.tsx", [
    ['import { loadPdf }', 'import { useT } from "../lib/i18n";\nimport { loadPdf }'],
    ["export default function PdfViewer", "export default function PdfViewer"],
    ["onPageClick }: PdfViewerProps) {", "onPageClick }: PdfViewerProps) {\n  const t = useT();"],
    ['aria-label="Zoom out"', 'aria-label={t("pdf.zoomOut")}'],
    ['aria-label="Zoom in"', 'aria-label={t("pdf.zoomIn")}'],
  ]],
  ["pages/FeaturePage.tsx", [
    ['import { track }', 'import { useT } from "../lib/i18n";\nimport { track }'],
    ["export default function FeaturePage({ slug }", "export default function FeaturePage({ slug }"],
    ["if (!page) return null;", "const t = useT();\n  if (!page) return null;"],
    ['The problem', '{t("feature.problem")}'],
    ['The Docracy way', '{t("feature.solution")}'],
    ['Features', '{t("feature.features")}'],
  ]],
  ["pages/Blog.tsx", [
    ['import { usePageMeta }', 'import { useT } from "../lib/i18n";\nimport { usePageMeta }'],
    ["export default function Blog() {", "export default function Blog() {\n  const t = useT();"],
  ]],
];

for (const [rel, reps] of patches) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) { console.warn("skip", rel); continue; }
  let src = fs.readFileSync(fp, "utf8");
  for (const [from, to] of reps) {
    if (src.includes(from)) src = src.split(from).join(to);
  }
  fs.writeFileSync(fp, src);
  console.log("patched", rel);
}
