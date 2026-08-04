// Self-hosted so it satisfies script-src 'self' — only the tag Clarity itself injects
// (https://www.clarity.ms/tag/...) needs its own CSP allowance, not this loader.
// Skips: no analytics consent, admin notrack cookie, and non-production hostnames.
(function () {
  try {
    if (localStorage.getItem("docracy_cookie_consent") !== "accepted") return;
  } catch (e) {
    return;
  }
  if (document.cookie.split("; ").some(function (c) { return c === "docracy_notrack=1"; })) return;
  if (window.location.hostname !== "docracy.io") return;

  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "xtl6i3xl1q");
})();
