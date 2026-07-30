import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { useT } from "../lib/i18n";

export default function NotFound() {
  const t = useT();
  usePageMeta(`${t("notFound.title")} — Docracy`, t("notFound.body"));

  return (
    <div className="container" style={{ textAlign: "center", padding: "80px 24px" }}>
      <h1 style={{ fontSize: 28 }}>{t("notFound.title")}</h1>
      <p style={{ color: "var(--mute)", marginBottom: 24 }}>{t("notFound.body")}</p>
      <Link to="/" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
        {t("notFound.home")}
      </Link>
    </div>
  );
}
