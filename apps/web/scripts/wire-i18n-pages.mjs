#!/usr/bin/env node
/** Bulk-replace hardcoded UI strings with t() calls in large page files. */
import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "../src");

const files = [
  {
    file: "pages/Dashboard.tsx",
    importLine: 'import { useT } from "../lib/i18n";',
    hookLine: "  const t = useT();",
    hookAfter: "export default function Dashboard",
    replacements: [
      ["          + New\n        </Link>", "          {t(\"dash.new\")}\n        </Link>"],
      ["          Dashboard\n        </button>", "          {t(\"dash.dashboard\")}\n        </button>"],
      ["          Templates\n        </button>", "          {t(\"dash.templates\")}\n        </button>"],
      ["            Documents\n            <span", "            {t(\"dash.documents\")}\n            <span"],
      ["              Tools\n              <span", "              {t(\"dash.tools\")}\n              <span"],
      ['"+ New"', '{t("dash.new")}'],
      [">Dashboard<", ">{t(\"dash.dashboard\")}<"],
      [">Templates<", ">{t(\"dash.templates\")}<"],
      [">Documents<", ">{t(\"dash.documents\")}<"],
      [">Tools<", ">{t(\"dash.tools\")}<"],
      ['label: "Awaiting your signature"', 'label: t("dash.awaitingYou")'],
      ['label: "Waiting on others"', 'label: t("dash.waitingOthers")'],
      ['label: "Completed"', 'label: t("dash.completed")'],
      ['label: "Connector & API key"', 'label: t("dash.connector")'],
      ['label: "Webhooks"', 'label: t("dash.webhooks")'],
      ['label: "Contacts"', 'label: t("dash.contacts")'],
      ['label: "Connectors"', 'label: t("dash.connectors")'],
      ['label: "Branding"', 'label: t("dash.branding")'],
      ["                  Team\n                </button>", "                  {t(\"dash.team\")}\n                </button>"],
      ["                  Subscription\n                </button>", "                  {t(\"dash.subscription\")}\n                </button>"],
      ["                  Admin\n                </Link>", "                  {t(\"dash.admin\")}\n                </Link>"],
      ["                Support\n              </button>", "                {t(\"dash.support\")}\n              </button>"],
      ["                Log out\n              </button>", "                {t(\"nav.logout\")}\n              </button>"],
      [">Team<", ">{t(\"dash.team\")}<"],
      [">Subscription<", ">{t(\"dash.subscription\")}<"],
      [">Admin<", ">{t(\"dash.admin\")}<"],
      [">Support<", ">{t(\"dash.support\")}<"],
      [">Log out<", ">{t(\"nav.logout\")}<"],
      [
        `              Please settle your unpaid invoice to keep your Docracy account active. Thank you for your
              understanding!`,
        '{t("dash.paymentFailed")}',
      ],
      ['                Update payment method\n', '                {t("dash.updatePayment")}\n'],
      [
        `                ? "Connected — signed documents will now upload there automatically."
                : "Couldn't connect that provider. Please try again."}`,
        '                ? t("dash.connectorConnected")\n                : t("dash.connectorFailed")}',
      ],
      [">Dismiss<", ">{t(\"common.dismiss\")}<"],
      ['<h3 style={{ fontSize: 15 }}>Awaiting your signature</h3>', '<h3 style={{ fontSize: 15 }}>{t("dash.awaitingYou")}</h3>'],
      [">Sign now<", ">{t(\"dash.signNow\")}<"],
      ['<h3 style={{ fontSize: 15 }}>Templates are a paid feature</h3>', '<h3 style={{ fontSize: 15 }}>{t("dash.templatesPaid")}</h3>'],
      ['{managingBilling ? "Redirecting…" : "Manage subscription"}', '{managingBilling ? t("common.redirecting") : t("common.manageSubscription")}'],
      ['aria-label="Dashboard"', 'aria-label={t("dash.dashboard")}'],
      ['aria-label="New document"', 'aria-label={t("dash.newDocument")}'],
      ['aria-label="More"', 'aria-label={t("dash.more")}'],
      ['aria-label="Close"', 'aria-label={t("common.close")}'],
      [">More<", ">{t(\"dash.more\")}<"],
      ['<h1 className="dashboard-welcome-title">Welcome</h1>', '<h1 className="dashboard-welcome-title">{t("dash.welcome")}</h1>'],
      ['<p className="dashboard-welcome-sub">Here\'s what needs your attention today.</p>', '<p className="dashboard-welcome-sub">{t("dash.welcomeSub")}</p>'],
      ['<div className="dashboard-metric-label">Awaiting your signature</div>', '<div className="dashboard-metric-label">{t("dash.awaitingYou")}</div>'],
      ['<div className="dashboard-metric-label">Waiting on others</div>', '<div className="dashboard-metric-label">{t("dash.waitingOthers")}</div>'],
      ['<div className="dashboard-metric-label">Completed this month</div>', '<div className="dashboard-metric-label">{t("dash.completedMonth")}</div>'],
      ['<strong>You\'re all caught up.</strong> Nothing is waiting on your signature right now.', '<strong>{t("dash.caughtUp")}</strong> {t("dash.caughtUpSub")}'],
      [">Sign now<", ">{t(\"dash.signNow\")}<"],
      ['<h3 style={{ fontSize: 15 }}>Start something new</h3>', '<h3 style={{ fontSize: 15 }}>{t("dash.startNew")}</h3>'],
      ['+ New document', '{t("dash.newDocBtn")}'],
      ['<h3 style={{ fontSize: 15 }}>Quick actions</h3>', '<h3 style={{ fontSize: 15 }}>{t("dash.quickActions")}</h3>'],
      ['Documents you send often — jump straight back into one.', '{t("dash.quickActionsSub")}'],
      [">Send again<", ">{t(\"dash.sendAgain\")}<"],
      ['<h3 style={{ fontSize: 15 }}>Upgrade to paid — $10/month</h3>', '<h3 style={{ fontSize: 15 }}>{t("dash.upgradeTitle")}</h3>'],
      ['<p>Loading…</p>', '<p>{t("common.loading")}</p>'],
      ['<h1>Not available</h1>', '<h1>{t("common.notAvailable")}</h1>'],
      ['<h1>Not signed in</h1>', '<h1>{t("dash.notSignedIn")}</h1>'],
      ['<p>You need to sign in to see your dashboard.</p>', '<p>{t("dash.notSignedInSub")}</p>'],
      ['"Something went wrong"', 't("common.error")'],
      ['window.prompt("Optional reason for voiding (leave blank to skip):")', 'window.prompt(t("dash.voidPrompt"))'],
      ['{upgrading ? "Redirecting…" : "Upgrade"}', '{upgrading ? t("common.redirecting") : t("common.upgrade")}'],
      ['{upgrading ? "Redirecting…" : "Upgrade — $10/month"}', '{upgrading ? t("common.redirecting") : t("pricing.paid.ctaUpgrade")}'],
      ['? "Awaiting your signature"', '? t("dash.awaitingYou")'],
      ['? "Waiting on others"', '? t("dash.waitingOthers")'],
      ['? "Completed"', '? t("dash.completed")'],
      [': "All documents"', ': t("dash.allDocs")'],
      ['{doc.status === "completed" ? "Signed" : doc.status === "voided" ? "Voided" : "Pending"}', '{doc.status === "completed" ? t("dash.statusSigned") : doc.status === "voided" ? t("dash.statusVoided") : t("dash.statusPending")}'],
      ['{voidingDocId === doc.docId ? "Voiding…" : "Void"}', '{voidingDocId === doc.docId ? t("dash.voiding") : t("dash.void")}'],
      ['<p style={{ marginBottom: 0 }}>Nothing here yet.</p>', '<p style={{ marginBottom: 0 }}>{t("dash.nothingHere")}</p>'],
      ['{account.isPaid ? "Contacts" : "Templates"}', '{account.isPaid ? t("dash.contacts") : t("dash.templates")}'],
      ['>Dismiss<', '>{t("common.dismiss")}<'],
      ['>Update payment method<', '>{t("dash.updatePayment")}<'],
    ],
  },
  {
    file: "pages/Prepare.tsx",
    importLine: 'import { useT } from "../lib/i18n";',
    hookLine: "  const t = useT();",
    hookAfter: "export default function Prepare",
    replacements: [
      ['<h1>Prepare a document</h1>', '<h1>{t("prepare.title")}</h1>'],
      ['<p>Loading template…</p>', '<p>{t("prepare.loadingTemplate")}</p>'],
      ['Start from a template', '{t("prepare.startFromTemplate")}'],
      ['Upload the PDF you want signed, or drag and drop it below.', '{t("prepare.uploadHint")}'],
      ['{isDraggingUpload ? "Drop your PDF here" : "Drag and drop a PDF here, or"}', '{isDraggingUpload ? t("prepare.dropPdf") : t("prepare.dragOr")}'],
      ['Max file size: 15MB.', '{t("prepare.maxSize")}'],
      ['{submitting ? "Sending…" : "Send"}', '{submitting ? t("common.sending") : t("prepare.send")}'],
      ['"Untitled document"', 't("prepare.untitled")'],
      ['label="Signers & viewers"', 'label={t("prepare.signersViewers")}'],
      ['"+ Myself"', 't("prepare.myself")'],
      ['"+ Signer"', 't("prepare.addSigner")'],
      ['"+ Viewer (CC)"', 't("prepare.addViewer")'],
      ['{account ? "See paid plans" : "Sign in to upgrade"}', '{account ? t("prepare.seePaidPlans") : t("prepare.signInUpgrade")}'],
      ['{account ? "Upgrade — $10/month" : "Sign in to upgrade"}', '{account ? t("prepare.upgradeMonthly") : t("prepare.signInUpgrade")}'],
      ['"Something went wrong"', 't("common.error")'],
      ['{generating ? "Drafting…" : "Generate"}', '{generating ? t("prepare.drafting") : t("prepare.generate")}'],
      ['<SidebarHeading label="Fields" count={fields.length} />', '<SidebarHeading label={t("prepare.fields")} count={fields.length} />'],
      ['{customSubject.trim() || customMessage.trim() ? "Customized" : "Default subject & message"}', '{customSubject.trim() || customMessage.trim() ? t("prepare.customized") : t("prepare.defaultInvite")}'],
      ['{creatingDrag.overPage ? "Drop to place" : `${FIELD_TYPE_LABEL[placingFieldType]} · ${signerLabel(placingSignerOrder)}`}', '{creatingDrag.overPage ? t("prepare.dropToPlace") : `${FIELD_TYPE_LABEL[placingFieldType]} · ${signerLabel(placingSignerOrder)}`}'],
      ['{savingTemplate ? "Saving…" : "Save"}', '{savingTemplate ? t("common.saving") : t("common.save")}'],
      ['aria-label="Start over"', 'aria-label={t("prepare.startOver")}'],
    ],
  },
];

for (const { file, importLine, hookLine, hookAfter, replacements } of files) {
  const fp = path.join(root, file);
  let src = fs.readFileSync(fp, "utf8");
  if (!src.includes(importLine)) {
    src = src.replace(/^(import .+\n)(?!import)/m, `$1${importLine}\n`);
  }
  if (!src.includes("useT()")) {
    const idx = src.indexOf(hookAfter);
    if (idx >= 0) {
      const brace = src.indexOf("{", idx);
      const nl = src.indexOf("\n", brace);
      src = src.slice(0, nl + 1) + hookLine + "\n" + src.slice(nl + 1);
    }
  }
  for (const [from, to] of replacements) {
    src = src.split(from).join(to);
  }
  fs.writeFileSync(fp, src);
  console.log("Updated", file);
}
