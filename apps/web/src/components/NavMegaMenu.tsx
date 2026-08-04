import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

export interface NavMegaMenuItem {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface NavMegaMenuProps {
  label: string;
  items: NavMegaMenuItem[];
  /** Optional side panel (mirrors the "Compare" column on competitor mega-menus). */
  panel?: {
    title: string;
    items: Array<{ to: string; icon: React.ReactNode; title: string; description: string }>;
    footerLabel: string;
    footerTo: string;
  };
  columns?: 2 | 3;
}

/** Hover-to-open mega-menu (click still toggles on touch). Outside-click / Escape still close. */
export default function NavMegaMenu({ label, items, panel, columns = 3 }: NavMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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
        <div id={menuId} className="nav-megamenu-panel" data-columns={columns} role="menu">
          <div className="nav-megamenu-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {items.map((item) => (
              <Link key={item.to} to={item.to} className="nav-megamenu-item" onClick={() => setOpen(false)}>
                <span className="nav-megamenu-icon">{item.icon}</span>
                <span>
                  <span className="nav-megamenu-item-title">{item.title}</span>
                  <span className="nav-megamenu-item-desc">{item.description}</span>
                </span>
              </Link>
            ))}
          </div>
          {panel && (
            <div className="nav-megamenu-side">
              <h4>{panel.title}</h4>
              {panel.items.map((p) => (
                <Link key={p.to} to={p.to} className="nav-megamenu-side-item" onClick={() => setOpen(false)}>
                  <span className="nav-megamenu-icon nav-megamenu-icon-sm">{p.icon}</span>
                  <span>
                    <span className="nav-megamenu-item-title">{p.title}</span>
                    <span className="nav-megamenu-item-desc">{p.description}</span>
                  </span>
                </Link>
              ))}
              <Link to={panel.footerTo} className="nav-megamenu-side-footer" onClick={() => setOpen(false)}>
                {panel.footerLabel} →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
