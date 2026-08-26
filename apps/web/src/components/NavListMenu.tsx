import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

export type NavListLeaf = {
  kind: "link";
  label: string;
  to: string;
};

export type NavListGroup = {
  kind: "group";
  id: string;
  label: string;
  children: Array<{ label: string; to: string }>;
};

export type NavListEntry = NavListLeaf | NavListGroup;

function isExternalHref(to: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(to);
}

function ListLink({
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

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M4.5 2.5L8 6l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * LimeWire-style compact nav list: primary rows with chevrons; groups expand in place so
 * secondary links sit under the important top-level points.
 */
export default function NavListMenu({ label, entries }: { label: string; entries: NavListEntry[] }) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setExpandedId(null);
    }, 120);
  };

  const closeMenu = () => {
    setOpen(false);
    setExpandedId(null);
  };

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeMenu();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const clamp = () => {
      const el = panelRef.current;
      if (!el) return;
      el.style.setProperty("--megamenu-shift", "0px");
      const rect = el.getBoundingClientRect();
      const margin = 12;
      let shift = 0;
      if (rect.left < margin) shift = margin - rect.left;
      else if (rect.right > window.innerWidth - margin) shift = window.innerWidth - margin - rect.right;
      el.style.setProperty("--megamenu-shift", `${shift}px`);
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [open, expandedId]);

  return (
    <div
      ref={rootRef}
      className="nav-megamenu nav-listmenu"
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
        onClick={() => (open ? closeMenu() : openMenu())}
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
        <div ref={panelRef} id={menuId} className="nav-listmenu-panel" role="menu">
          <ul className="nav-listmenu-list">
            {entries.map((entry) => {
              if (entry.kind === "link") {
                return (
                  <li key={entry.to} className="nav-listmenu-row">
                    <ListLink to={entry.to} className="nav-listmenu-link" onClick={closeMenu}>
                      <span>{entry.label}</span>
                      <ChevronRight className="nav-listmenu-chevron" />
                    </ListLink>
                  </li>
                );
              }
              const expanded = expandedId === entry.id;
              return (
                <li key={entry.id} className={`nav-listmenu-row${expanded ? " is-expanded" : ""}`}>
                  <button
                    type="button"
                    className="nav-listmenu-link nav-listmenu-group-btn"
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                  >
                    <span>{entry.label}</span>
                    <ChevronRight className={`nav-listmenu-chevron${expanded ? " is-open" : ""}`} />
                  </button>
                  {expanded && (
                    <ul className="nav-listmenu-sublist">
                      {entry.children.map((child) => (
                        <li key={child.to}>
                          <ListLink to={child.to} className="nav-listmenu-sublink" onClick={closeMenu}>
                            <span>{child.label}</span>
                            <ChevronRight className="nav-listmenu-chevron" />
                          </ListLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
