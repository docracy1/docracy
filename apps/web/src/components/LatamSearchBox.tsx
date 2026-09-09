import { useMemo, useRef, useState, type FormEvent } from "react";
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
  showCircle = false,
  circleIsCta = false,
}: {
  source: string;
  initialQuery?: string;
  compact?: boolean;
  showResults?: boolean;
  /** Renders the circle + chips-above/chips-below header. Independent of circleIsCta: on its
   *  own, the circle sits as a decorative/focus-the-input header above the real form (dedicated
   *  /latam-search page — it still needs the actual input and live results below it). */
  showCircle?: boolean;
  /** Hero usage only: the circle itself becomes the whole entry point (click it, or a chip, and
   *  go straight to the full search page) — no separate label/input/submit box underneath it at
   *  all, since the hero has nowhere useful to show live results anyway. Implies showCircle. */
  circleIsCta?: boolean;
}) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQuery);
  const hits = useMemo(() => searchLatamIndex(q, compact ? 6 : 8), [q, compact]);
  const inputRef = useRef<HTMLInputElement>(null);

  const goToSearch = (query: string) => {
    navigate(`${localizePath(LATAM_SEARCH_EN, locale)}${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    track("landingpage_cta_clicked", { source: `${source}:submit` });
    goToSearch(q.trim());
  };

  const half = Math.ceil(LATAM_SEARCH_CHIPS.length / 2);
  const chipsAbove = LATAM_SEARCH_CHIPS.slice(0, half);
  const chipsBelow = LATAM_SEARCH_CHIPS.slice(half);

  const renderChip = (chip: (typeof LATAM_SEARCH_CHIPS)[number]) => (
    <button
      key={chip.q}
      type="button"
      className="latam-search-chip"
      onClick={() => {
        track("landingpage_cta_clicked", { source: `${source}:chip` });
        if (circleIsCta) {
          goToSearch(chip.q);
        } else {
          setQ(chip.q);
        }
      }}
    >
      {t(chip.labelKey)}
    </button>
  );

  return (
    <div className={`latam-search${compact ? " is-compact" : ""}`}>
      {showCircle && (
        <div className="latam-search-circle-wrap">
          <p className="latam-search-chips latam-search-chips-above" aria-label={t("latamSearch.chipsLabel")}>
            {chipsAbove.map(renderChip)}
          </p>
          <button
            type="button"
            className="latam-search-circle"
            aria-label={t("latamSearch.submit")}
            onClick={() => {
              track("landingpage_cta_clicked", { source: `${source}:circle` });
              if (circleIsCta) {
                goToSearch("");
              } else {
                inputRef.current?.focus();
              }
            }}
          >
            <span className="latam-search-circle-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <span className="latam-search-circle-title">{t("latamSearch.label")}</span>
            <span className="latam-search-circle-sub">{t("latamSearch.circleSub")}</span>
          </button>
          <p className="latam-search-chips">
            {chipsBelow.map(renderChip)}
          </p>
        </div>
      )}
      {!circleIsCta && (
        <form className="latam-search-form" onSubmit={onSubmit} role="search">
          {!showCircle && (
            <label className="latam-search-label" htmlFor={`latam-search-${source}`}>
              {t("latamSearch.label")}
            </label>
          )}
          <div className="latam-search-row">
            <input
              ref={inputRef}
              id={`latam-search-${source}`}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("latamSearch.placeholder")}
              autoComplete="off"
              aria-label={showCircle ? t("latamSearch.label") : undefined}
            />
            <button type="submit" className="btn-primary" aria-label={t("latamSearch.submit")} title={t("latamSearch.submit")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
          </div>
          {!showCircle && (
            <p className="latam-search-chips" aria-label={t("latamSearch.chipsLabel")}>
              {LATAM_SEARCH_CHIPS.map(renderChip)}
            </p>
          )}
        </form>
      )}
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
