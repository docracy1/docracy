import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";

/** Real integrations only — logos from Simple Icons (CC0) in /public/integrations/, plus
 *  OneDrive/OpenAI/Grok SVGs aligned with each vendor's brand colors.
 *  Payment marks are checkout URLs the sender pastes (PayPal.me, Stripe Payment Link, etc.) —
 *  not OAuth. Docracy never takes the money. */
export const INTEGRATION_LOGOS = [
  { name: "Dropbox", file: "dropbox.svg", group: "storage" as const },
  { name: "OneDrive", file: "onedrive.svg", group: "storage" as const },
  { name: "Box", file: "box.svg", group: "storage" as const },
  { name: "Google Drive", file: "googledrive.svg", group: "storage" as const },
  { name: "WhatsApp", file: "whatsapp.svg", group: "messaging" as const },
  { name: "PayPal", file: "paypal.svg", group: "payments" as const },
  { name: "Stripe", file: "stripe.svg", group: "payments" as const },
  { name: "Mercado Pago", file: "mercadopago.svg", group: "payments" as const },
  { name: "Square", file: "square.svg", group: "payments" as const },
  { name: "Venmo", file: "venmo.svg", group: "payments" as const },
  { name: "Zapier", file: "zapier.svg", group: "automation" as const },
  { name: "Claude", file: "claude.svg", group: "ai" as const },
  { name: "ChatGPT", file: "openai.svg", group: "ai" as const },
  { name: "Grok", file: "grok.svg", group: "ai" as const },
  { name: "Perplexity", file: "perplexity.svg", group: "ai" as const },
  { name: "Cursor", file: "cursor.svg", group: "ai" as const },
] as const;

type IntegrationsBandProps = {
  /** Where the primary CTA links — defaults to docs integrations overview. */
  learnMoreTo?: string;
  compact?: boolean;
};

export const PAYMENT_LOGOS = INTEGRATION_LOGOS.filter((i) => i.group === "payments");

/** Compact checkout-logo row for cobro / prepare — paste-your-link, not a connector. */
export function PaymentCheckoutLogos() {
  return (
    <div className="payment-checkout-logos" aria-hidden="true">
      {PAYMENT_LOGOS.map((item) => (
        <img
          key={item.file}
          src={`/integrations/${item.file}`}
          alt=""
          width={22}
          height={22}
          title={item.name}
          className="payment-checkout-logo"
        />
      ))}
    </div>
  );
}

export default function IntegrationsBand({ learnMoreTo = "/docs", compact = false }: IntegrationsBandProps) {
  const t = useT();
  return (
    <section className={`integrations-band${compact ? " integrations-band-compact" : ""}`} aria-labelledby="integrations-heading">
      <div className="integrations-inner">
        <h2 id="integrations-heading" style={{ fontSize: compact ? 22 : 26, marginBottom: 8, textAlign: "center" }}>
          {t("integrations.title")}
        </h2>
        <p style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 28px", color: "var(--mute)", fontSize: compact ? 14 : 15.5 }}>
          {t("integrations.sub")}
        </p>

        <div className="integrations-grid" role="list">
          {INTEGRATION_LOGOS.map((item) => (
            <div key={item.name} className="integrations-tile" role="listitem">
              <img src={`/integrations/${item.file}`} alt="" width={32} height={32} className="integrations-tile-logo" />
              <span className="integrations-tile-name">{item.name}</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--mute)", margin: "20px auto 0", maxWidth: 520 }}>
          {t("integrations.detail")}
        </p>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to={learnMoreTo} className="btn-primary btn-lg" style={{ textDecoration: "none", display: "inline-block" }}>
            {t("integrations.learnMore")}
          </Link>
        </div>
      </div>
    </section>
  );
}
