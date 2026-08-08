/** Shared between Pricing.tsx and Docs.tsx — label/value fields are i18n keys resolved at render. */
export type PlanValue = boolean | string;

export const PLAN_ROWS: Array<{
  labelKey: string;
  free: PlanValue;
  paid: PlanValue;
  enterprise?: PlanValue;
}> = [
  { labelKey: "plan.signersPerDoc", free: "plan.val.upTo2", paid: "plan.val.unlimited" },
  { labelKey: "plan.sequentialOrParallel", free: true, paid: true },
  { labelKey: "plan.pinLinks", free: false, paid: true },
  { labelKey: "plan.fieldTypes", free: true, paid: true },
  { labelKey: "plan.anchorTags", free: false, paid: true },
  { labelKey: "plan.smsLinks", free: true, paid: true },
  { labelKey: "plan.whatsappLinks", free: "plan.val.whatsappFree", paid: "plan.val.whatsappPaid" },
  { labelKey: "plan.signerAttachments", free: false, paid: true },
  { labelKey: "plan.ccRecipients", free: "plan.val.upTo2", paid: "plan.val.unlimited" },
  { labelKey: "plan.declineCancel", free: true, paid: true },
  { labelKey: "plan.auditCert", free: true, paid: true },
  { labelKey: "plan.dashboard", free: true, paid: true },
  { labelKey: "plan.templates", free: false, paid: true },
  { labelKey: "plan.bulkSend", free: false, paid: true },
  { labelKey: "plan.customExpiry", free: "plan.val.days9", paid: "plan.val.days90" },
  { labelKey: "plan.embedded", free: false, paid: true },
  { labelKey: "plan.contactsReassign", free: false, paid: true },
  { labelKey: "plan.webhooks", free: false, paid: true },
  { labelKey: "plan.mcp", free: false, paid: true },
  { labelKey: "plan.teamAccounts", free: false, paid: true },
  { labelKey: "plan.whiteLabel", free: false, paid: true },
  { labelKey: "plan.aiDetect", free: false, paid: true },
  { labelKey: "plan.aiExplain", free: false, paid: true },
  { labelKey: "plan.aiRisk", free: false, paid: true },
  { labelKey: "plan.aiGenerate", free: false, paid: true },
  { labelKey: "plan.support", free: false, paid: true, enterprise: "plan.val.premium" },
  { labelKey: "plan.dropbox", free: false, paid: true },
  { labelKey: "plan.onedrive", free: false, paid: true },
  { labelKey: "plan.box", free: false, paid: true },
  { labelKey: "plan.googleDrive", free: false, paid: true },
  { labelKey: "plan.invoiceBilling", free: false, paid: false, enterprise: true },
  { labelKey: "plan.volumeDiscounts", free: false, paid: false, enterprise: true },
];

export function PlanCell({
  value,
  t,
}: {
  value: PlanValue;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  if (typeof value === "string") return <span className="plan-cell-text">{t(value)}</span>;
  return value ? (
    <span className="plan-check" aria-label={t("plan.included")}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <circle cx="9" cy="9" r="9" fill="currentColor" />
        <path
          d="M5.2 9.2l2.4 2.4 5.2-5.2"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : (
    <span className="plan-dash" aria-label={t("plan.notIncluded")}>
      —
    </span>
  );
}
