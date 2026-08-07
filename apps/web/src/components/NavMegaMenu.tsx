import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

export interface NavMegaMenuItem {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export interface NavMegaMenuProps {
  label: string;
  items: NavMegaMenuItem[];
  /** Optional side panel (mirrors the "Compare" column on competitor mega-menus). */
  panel?: {
    title: string;
    items: Array<{ to: string; icon: ReactNode; title: string; description: string }>;
    footerLabel: string;
    footerTo: string;
  };
  columns?: 2 | 3;
}

function isExternalHref(to: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(to);
}

/** Router Link for in-app paths; plain <a> for mailto / http(s) so they aren't treated as SPA routes. */
function MegaLink({
  to,
  className,
  onClick,
  children,
}: {
  to: string;
  className: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (isExternalHref(to)) {
    return (
      <a
        href={to}
        className={className}
        onClick={() => {
          onClick?.();
          // mailto often no-ops with no mail client — also open the in-app sales chat.
          if (to.startsWith("mailto:")) {
            window.dispatchEvent(new CustomEvent("docracy:open-chat", { detail: { intent: "sales" } }));
          }
        }}
        rel={to.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/** Hover-to-open mega-menu (click still toggles on touch). Outside-click / Escape still close. */
export default function NavMegaMenu({ label, items, panel, columns = 3 }: NavMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => clearCloseTimer(), []);

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

  // The panel is centered on the trigger by default (left: 50%; translateX(-50%)), which clips
  // off-screen for triggers near either edge — "Features" sits right after the logo, so a wide
  // panel centered on it runs off the left of the viewport. Measure after layout and nudge it
  // back on-screen via a CSS var rather than hardcoding a fixed offset per trigger.
  useLayoutEffect(() => {
    if (!open) return;
    const clamp = () => {
      const el = panelRef.current;
      if (!el) return;
      el.style.setProperty("--megamenu-shift", "0px");
      const rect = el.getBoundingClientRect();
      const margin = 12;
      let shift = 0;
      if (rect.left < margin) {
        shift = margin - rect.left;
      } else if (rect.right > window.innerWidth - margin) {
        shift = window.innerWidth - margin - rect.right;
      }
      el.style.setProperty("--megamenu-shift", `${shift}px`);
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="nav-megamenu"
      data-open={open ? "true" : undefined}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="nav-megamenu-trigger header-nav-link"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onFocus={openMenu}
      >
        {label}
        <svg
          className={`nav-megamenu-chevron${open ? " is-open" : ""}`}
          width="10"
          height="10"
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
      </button>
      {open && (
        <div ref={panelRef} id={menuId} className="nav-megamenu-panel" data-columns={columns} role="menu">
          <div className="nav-megamenu-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {items.map((item) => (
              <MegaLink key={item.to} to={item.to} className="nav-megamenu-item" onClick={() => setOpen(false)}>
                <span className="nav-megamenu-icon">{item.icon}</span>
                <span>
                  <span className="nav-megamenu-item-title">{item.title}</span>
                  <span className="nav-megamenu-item-desc">{item.description}</span>
                </span>
              </MegaLink>
            ))}
          </div>
          {panel && (
            <div className="nav-megamenu-side">
              <h4>{panel.title}</h4>
              {panel.items.map((p) => (
                <MegaLink key={p.to} to={p.to} className="nav-megamenu-side-item" onClick={() => setOpen(false)}>
                  <span className="nav-megamenu-icon nav-megamenu-icon-sm">{p.icon}</span>
                  <span>
                    <span className="nav-megamenu-item-title">{p.title}</span>
                    <span className="nav-megamenu-item-desc">{p.description}</span>
                  </span>
                </MegaLink>
              ))}
              <MegaLink to={panel.footerTo} className="nav-megamenu-side-footer" onClick={() => setOpen(false)}>
                {panel.footerLabel} →
              </MegaLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
