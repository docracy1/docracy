import { useState } from "react";
import { useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { createTransakSession, submitRemitWaitlist } from "../lib/api";

const COUNTRIES = ["mx", "co", "ar", "br", "sv", "ec", "pa", "cl", "ve", "other"] as const;

export default function SendMoney() {
  useSeoMeta("sendMoney");
  const t = useT();

  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setError(null);
    setStatus("submitting");
    try {
      await submitRemitWaitlist(email.trim(), country);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sendMoney.errorGeneric"));
      setStatus("idle");
    }
  };

  // This is the one piece of "send money" that's real today — converting your own money to/from
  // crypto via Transak's self-serve widget. It is NOT the same as the waitlist below: it never
  // pays a named recipient's bank account directly, only puts crypto in your own wallet.
  const openConvertWidget = async () => {
    if (converting) return;
    setConvertError(null);
    setConverting(true);
    try {
      const { widgetUrl } = await createTransakSession();
      const { Transak } = await import("@transak/ui-js-sdk");
      const widget = new Transak({ widgetUrl });
      widget.init();
      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => setConverting(false));
      Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, () => {
        widget.close();
        setConverting(false);
      });
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : t("sendMoney.errorGeneric"));
      setConverting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>{t("sendMoney.title")}</h1>
      <p style={{ color: "var(--mute)", fontSize: 16, lineHeight: 1.6 }}>{t("sendMoney.subtitle")}</p>
      <p style={{ lineHeight: 1.6 }}>{t("sendMoney.body")}</p>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>{t("sendMoney.convertTitle")}</h3>
        <p style={{ color: "var(--mute)", fontSize: 14 }}>{t("sendMoney.convertBody")}</p>
        {convertError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{convertError}</p>}
        <button className="btn-primary" onClick={openConvertWidget} disabled={converting}>
          {converting ? t("sendMoney.converting") : t("sendMoney.convertCta")}
        </button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t("sendMoney.formTitle")}</h3>

        {status === "done" ? (
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>{t("sendMoney.successTitle")}</p>
            <p style={{ color: "var(--mute)" }}>{t("sendMoney.successBody")}</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{t("sendMoney.emailLabel")}</label>
            <input
              type="email"
              required
              className="form-input"
              style={{ width: "100%", marginBottom: 16 }}
              placeholder={t("sendMoney.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{t("sendMoney.countryLabel")}</label>
            <select
              required
              className="form-input"
              style={{ width: "100%", marginBottom: 16 }}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="" disabled>
                {t("sendMoney.countryPlaceholder")}
              </option>
              {COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {t(`sendMoney.country.${code}`)}
                </option>
              ))}
            </select>

            {error && <p style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</p>}

            <button type="submit" className="btn-primary" disabled={status === "submitting"}>
              {status === "submitting" ? t("sendMoney.submitting") : t("sendMoney.submit")}
            </button>
          </form>
        )}
      </div>

      <p style={{ color: "var(--mute)", fontSize: 13, marginTop: 20 }}>{t("sendMoney.disclaimer")}</p>
    </div>
  );
}
