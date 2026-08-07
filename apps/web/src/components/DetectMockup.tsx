import { useT } from "../lib/i18n";

/** Static field-detection mock for the AI spotlight — the hero uses the animated
 *  ProductFlowDemo instead; this is the smaller, static AI-specific illustration. */
export default function DetectMockup() {
  const t = useT();
  return (
    <svg viewBox="0 0 380 285" width="100%" height="100%">
      <rect x="0.5" y="0.5" width="379" height="284" rx="16" fill="var(--canvas)" stroke="var(--hairline)" />
      <rect x="32" y="30" width="150" height="14" rx="4" fill="var(--body-strong)" opacity="0.65" />
      <rect x="32" y="60" width="316" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="78" width="316" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="96" width="230" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="124" width="316" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="142" width="316" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="160" width="170" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="200" width="130" height="36" rx="6" fill="var(--primary-soft)" stroke="var(--primary)" strokeDasharray="5 4" strokeWidth="2" />
      <text x="97" y="222" textAnchor="middle" fontSize="11" fill="var(--primary)" fontFamily="inherit" fontWeight="700">
        {t("flow.signature")}
      </text>
      <rect x="178" y="200" width="90" height="36" rx="6" fill="var(--primary-soft)" stroke="var(--primary)" strokeDasharray="5 4" strokeWidth="2" />
      <text x="223" y="222" textAnchor="middle" fontSize="11" fill="var(--primary)" fontFamily="inherit" fontWeight="700">
        {t("flow.date")}
      </text>
      <circle cx="335" cy="40" r="18" fill="var(--primary-soft-strong)" />
      <path
        d="M335 30l2.6 7.8L345 40l-7.4 2.2L335 50l-2.6-7.8L325 40l7.4-2.2L335 30Z"
        fill="var(--primary)"
      />
    </svg>
  );
}
