import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { localizePath, useI18n } from "../lib/i18n";
import { loginWithCheckout } from "../lib/latamCheckout";
import {
  LATAM_SEARCH_CHIPS,
  LATAM_SEARCH_EN,
  countrySearchOfficialLabel,
  countrySearchTitle,
  searchLatamIndex,
  type LatamSearchEntry,
} from "../lib/latamSearch";
import { track } from "../lib/track";

function entryTitle(entry: LatamSearchEntry, t: (k: string) => string, locale: "en" | "es"): string {
  if (entry.kind === "country") {
    const slug = entry.id.replace(/^country-/, "");
    return countrySearchTitle(slug, locale) ?? t(entry.titleKey);
  }
  return t(entry.titleKey);
}

function officialLabel(entry: LatamSearchEntry, t: (k: string) => string, locale: "en" | "es"): string | null {
  if (entry.kind === "country") {
    const slug = entry.id.replace(/^country-/, "");
    return countrySearchOfficialLabel(slug, locale);
  }
  return entry.officialKey ? t(entry.officialKey) : null;
}

export default function LatamSearchBox({
  source,
  initialQuery = "",
  compact = false,
  showResults = true,
}: {
  source: string;
  initialQuery?: string;
  compact?: boolean;
  showResults?: boolean;
}) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQuery);
  const hits = useMemo(() => searchLatamIndex(q, compact ? 6 : 8), [q, compact]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = q.trim();
    track("landingpage_cta_clicked", { source: `${source}:submit` });
    navigate(`${localizePath(LATAM_SEARCH_EN, locale)}${next ? `?q=${encodeURIComponent(next)}` : ""}`);
  };

  return (
    <div className={`latam-search${compact ? " is-compact" : ""}`}>
      <form className="latam-search-form" onSubmit={onSubmit} role="search">
        <label className="latam-search-label" htmlFor={`latam-search-${source}`}>
          {t("latamSearch.label")}
        </label>
        <div className="latam-search-row">
          <input
            id={`latam-search-${source}`}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("latamSearch.placeholder")}
            autoComplete="off"
          />
          <button type="submit" className="btn-primary">
            {t("latamSearch.submit")}
          </button>
        </div>
      </form>
      <p className="latam-search-chips" aria-label={t("latamSearch.chipsLabel")}>
        {LATAM_SEARCH_CHIPS.map((chip) => (
          <button
            key={chip.q}
            type="button"
            className="latam-search-chip"
            onClick={() => {
              setQ(chip.q);
              track("landingpage_cta_clicked", { source: `${source}:chip` });
            }}
          >
            {t(chip.labelKey)}
          </button>
        ))}
      </p>
      {showResults && (!compact || q.trim()) ? (
        <ul className="latam-search-hits">
          {hits.length === 0 && q.trim() ? (
            <li className="latam-search-empty">{t("latamSearch.empty")}</li>
          ) : (
            hits.map((hit) => (
              <li key={hit.id} className={`latam-search-hit kind-${hit.kind}`}>
                <Link
                  to={localizePath(hit.docracyTo, locale)}
                  onClick={() => track("landingpage_cta_clicked", { source: `${source}:${hit.id}` })}
                >
                  <strong>{entryTitle(hit, t, locale)}</strong>
                  <span>{t(hit.blurbKey)}</span>
                </Link>
                <p className="latam-search-hit-meta">
                  {hit.weDontKey ? (
                    <>
                      <em>{t("whoFiles.weDontLabel")}</em> {t(hit.weDontKey)}{" "}
                    </>
                  ) : null}
                  {hit.officialHref ? (
                    <a href={hit.officialHref} target="_blank" rel="noopener noreferrer">
                      {officialLabel(hit, t, locale) ?? t("latamSearch.official")}
                    </a>
                  ) : null}
                  {hit.paid ? (
                    <>
                      {" · "}
                      <Link
                        to={loginWithCheckout(localizePath(hit.docracyTo, locale), "latam-search")}
                        onClick={() => track("landingpage_cta_clicked", { source: `${source}:paid:${hit.id}` })}
                      >
                        {t("latamSearch.paidCta")}
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
