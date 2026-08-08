/** Animated hero illustration: upload → place fields → send → signed.
 *  CSS-driven (no video asset) so it stays in sync with the brand and respects reduced-motion. */
import { useT } from "../lib/i18n";

export default function ProductFlowDemo() {
  const t = useT();
  return (
    <div className="product-flow-demo" aria-hidden="true">
      <div className="product-flow-stage product-flow-stage-1">
        <svg viewBox="0 0 380 285" width="100%" height="100%">
          <rect x="0.5" y="0.5" width="379" height="284" rx="16" fill="var(--canvas)" stroke="var(--hairline)" />
          <rect x="110" y="88" width="160" height="110" rx="10" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6 5" />
          <path d="M190 118v40M170 138h40" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
          <text x="190" y="220" textAnchor="middle" fontSize="13" fill="var(--mute)" fontFamily="inherit" fontWeight="600">
            {t("flow.dropPdf")}
          </text>
          <image href="/integrations/whatsapp.svg" x="336" y="16" width="28" height="28" />
        </svg>
        <span className="product-flow-label">{t("flow.step1")}</span>
      </div>

      <div className="product-flow-stage product-flow-stage-2">
        <svg viewBox="0 0 380 285" width="100%" height="100%">
          <rect x="0.5" y="0.5" width="379" height="284" rx="16" fill="var(--canvas)" stroke="var(--hairline)" />
          <rect x="32" y="30" width="150" height="14" rx="4" fill="var(--body-strong)" opacity="0.65" />
          <rect x="32" y="60" width="316" height="8" rx="4" fill="var(--hairline)" />
          <rect x="32" y="78" width="316" height="8" rx="4" fill="var(--hairline)" />
          <rect x="32" y="96" width="230" height="8" rx="4" fill="var(--hairline)" />
          <rect x="32" y="124" width="316" height="8" rx="4" fill="var(--hairline)" />
          <rect x="32" y="142" width="316" height="8" rx="4" fill="var(--hairline)" />
          <rect
            className="product-flow-field"
            x="32"
            y="200"
            width="130"
            height="36"
            rx="6"
            fill="var(--primary-soft)"
            stroke="var(--primary)"
            strokeDasharray="5 4"
            strokeWidth="2"
          />
          <text x="97" y="222" textAnchor="middle" fontSize="11" fill="var(--primary)" fontFamily="inherit" fontWeight="700">
            {t("flow.signature")}
          </text>
          <rect
            className="product-flow-field product-flow-field-delay"
            x="178"
            y="200"
            width="90"
            height="36"
            rx="6"
            fill="var(--primary-soft)"
            stroke="var(--primary)"
            strokeDasharray="5 4"
            strokeWidth="2"
          />
          <text x="223" y="222" textAnchor="middle" fontSize="11" fill="var(--primary)" fontFamily="inherit" fontWeight="700">
            {t("flow.date")}
          </text>
          <image href="/integrations/whatsapp.svg" x="336" y="16" width="28" height="28" />
        </svg>
        <span className="product-flow-label">{t("flow.step2")}</span>
      </div>

      <div className="product-flow-stage product-flow-stage-3">
        <svg viewBox="0 0 380 285" width="100%" height="100%">
          <rect x="0.5" y="0.5" width="379" height="284" rx="16" fill="var(--canvas)" stroke="var(--hairline)" />
          <rect x="32" y="30" width="150" height="14" rx="4" fill="var(--body-strong)" opacity="0.65" />
          <rect x="32" y="60" width="280" height="8" rx="4" fill="var(--hairline)" />
          <rect x="32" y="78" width="240" height="8" rx="4" fill="var(--hairline)" />
          <g className="product-flow-send">
            <rect x="90" y="130" width="200" height="56" rx="12" fill="var(--primary)" />
            <text x="190" y="164" textAnchor="middle" fontSize="15" fill="#fff" fontFamily="inherit" fontWeight="700">
              {t("flow.send")}
            </text>
          </g>
          <text x="190" y="220" textAnchor="middle" fontSize="12" fill="var(--mute)" fontFamily="inherit">
            {t("flow.linkEmailed")}
          </text>
          <image href="/integrations/whatsapp.svg" x="336" y="16" width="28" height="28" />
        </svg>
        <span className="product-flow-label">{t("flow.step3")}</span>
      </div>

      <div className="product-flow-stage product-flow-stage-4">
        <svg viewBox="0 0 380 285" width="100%" height="100%">
          <rect x="0.5" y="0.5" width="379" height="284" rx="16" fill="var(--canvas)" stroke="var(--hairline)" />
          <rect x="32" y="30" width="150" height="14" rx="4" fill="var(--body-strong)" opacity="0.65" />
          <rect x="32" y="60" width="316" height="8" rx="4" fill="var(--hairline)" />
          <rect x="32" y="78" width="316" height="8" rx="4" fill="var(--hairline)" />
          <rect x="32" y="96" width="230" height="8" rx="4" fill="var(--hairline)" />
          <path
            className="product-flow-ink"
            d="M38 226c18-26 36 9 55-8 19-17 28-22 50-13s38 22 58 4 42-26 65-4"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="332" cy="218" r="18" fill="#e3f3e9" />
          <path d="M324 218l5.5 5.5 11-11" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <image href="/integrations/whatsapp.svg" x="336" y="16" width="28" height="28" />
        </svg>
        <span className="product-flow-label">{t("flow.step4")}</span>
      </div>
    </div>
  );
}
