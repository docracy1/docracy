const common = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

/** Small, self-contained icon set for the header mega-menus — deliberately separate from
 *  Landing.tsx's FeatureIcon (not exported there, and duplicating a dozen small SVGs is cheaper
 *  than threading an import across an unrelated page). */
export function NavIcon({ name }: { name: string }) {
  switch (name) {
    case "send":
      return (
        <svg {...common}>
          <path d="M3 11l18-8-8 18-2-8-8-2z" />
        </svg>
      );
    case "uploadArrow":
      return (
        <svg {...common}>
          <path d="M12 15V4M12 4l-4.5 4.5M12 4l4.5 4.5" />
          <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
        </svg>
      );
    case "duplicate":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="13" rx="1.5" />
          <path d="M4 15V4.5A1.5 1.5 0 0 1 5.5 3H15" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
          <circle cx="17" cy="9" r="2.25" />
          <path d="M15.5 14.2c2.3.4 4 2.4 4 5.3" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5.5c0 5-3.5 8-7 9.5-3.5-1.5-7-4.5-7-9.5V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path d="M12.5 2.5L4 14h6l-1 7.5L20 10h-6l-1.5-7.5z" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="3" y="7.5" width="18" height="12" rx="1.5" />
          <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
          <path d="M3 12.5h18" />
        </svg>
      );
    case "megaphone":
      return (
        <svg {...common}>
          <path d="M3 10v4h3l6 4V6L6 10H3z" />
          <path d="M16 9.5a3 3 0 0 1 0 5" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <rect x="5" y="3.5" width="10" height="17" rx="1" />
          <path d="M15 20.5h4v-8l-4-3" />
          <path d="M8.5 7.5h.01M11.5 7.5h.01M8.5 11h.01M11.5 11h.01M8.5 14.5h.01M11.5 14.5h.01" />
        </svg>
      );
    case "hammer":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2.5-2.5z" />
        </svg>
      );
    case "store":
      return (
        <svg {...common}>
          <path d="M4 9.5l1-4h14l1 4" />
          <path d="M4 9.5a2.25 2.25 0 0 0 4.5 0 2.25 2.25 0 0 0 4.5 0 2.25 2.25 0 0 0 4.5 0 2.25 2.25 0 0 0 4.5 0" />
          <path d="M5.5 11v9h13v-9" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13z" />
          <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13z" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5.5M12 8v.01" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
          <path d="M3.5 6.5L12 13l8.5-6.5" />
        </svg>
      );
    case "lifering":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M6.1 6.1l3.3 3.3M17.9 6.1l-3.3 3.3M6.1 17.9l3.3-3.3M17.9 17.9l-3.3-3.3" />
        </svg>
      );
    case "scale":
      return (
        <svg {...common}>
          <path d="M12 3v18M7 8H3l3 6a3 3 0 0 0 4 0l-3-6zM21 8h-4l3 6a3 3 0 0 0 4 0l-3-6z" />
          <path d="M8 21h8" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      );
    case "handshake":
      return (
        <svg {...common}>
          <path d="M2.5 12l4-4 3 2 2.5-2.5 3 3-2.5 2.5 2 2 4-4" />
          <path d="M14 15.5l2 2M11.5 13l2 2" />
        </svg>
      );
    case "badge":
      return (
        <svg {...common}>
          <path d="M12 2.5l2.1 2.1 2.9-.4.9 2.8 2.8.9-.4 2.9 2.1 2.1-2.1 2.1.4 2.9-2.8.9-.9 2.8-2.9-.4L12 21.5l-2.1-2.1-2.9.4-.9-2.8-2.8-.9.4-2.9L2.5 12l2.1-2.1-.4-2.9 2.8-.9.9-2.8 2.9.4L12 2.5z" />
          <path d="M8.5 12.2l2.2 2.2 4.3-4.6" />
        </svg>
      );
    case "chainLink":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="8" height="8" rx="3.5" transform="rotate(-45 7 12)" />
          <rect x="13" y="8" width="8" height="8" rx="3.5" transform="rotate(-45 17 12)" />
        </svg>
      );
    case "whatsapp":
      // Full-color brand mark rather than a monochrome stroke icon like the others — this one's
      // meant to be recognized at a glance, not blend in.
      return <img src="/integrations/whatsapp.svg" alt="" width={22} height={22} aria-hidden="true" />;
    default:
      return null;
  }
}
