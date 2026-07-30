import { useEffect, useId, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { alternatePath, useI18n, type Locale } from "../lib/i18n";

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

function GlobeIcon() {
  return (
    <svg className="lang-switcher-globe" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`lang-switcher-chevron${open ? " is-open" : ""}`}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5L6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** SwipeSign-style globe + EN ▾ dropdown for header / mobile panel. */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, locales, labels } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(code: Locale) {
    setLocale(code);
    setOpen(false);
    const next = alternatePath(location.pathname, code);
    if (next && next !== location.pathname) {
      navigate(`${next}${location.search}${location.hash}`);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`lang-switcher ${className}`.trim()}
      data-open={open ? "true" : undefined}
    >
      <button
        type="button"
        className="lang-switcher-trigger"
        aria-label="Language"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <GlobeIcon />
        <span className="lang-switcher-code">{labels[locale]}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <ul id={menuId} className="lang-switcher-menu" role="listbox" aria-label="Language">
          {locales.map((code) => (
            <li key={code} role="option" aria-selected={locale === code}>
              <button
                type="button"
                className={`lang-switcher-option${locale === code ? " is-active" : ""}`}
                onClick={() => pick(code)}
              >
                <span className="lang-switcher-option-code">{labels[code]}</span>
                <span className="lang-switcher-option-name">{LOCALE_NAMES[code]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
