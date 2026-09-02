// Self-hosted so it satisfies script-src 'self' — only the tag GA itself injects
// (https://www.googletagmanager.com/gtag/js) needs its own CSP allowance, not this loader.
// Skips: no analytics consent, admin notrack cookie, and non-production hostnames.
(function () {
  try {
    if (localStorage.getItem("docracy_cookie_consent") !== "accepted") return;
  } catch (e) {
    return;
  }
  if (document.cookie.split("; ").some(function (c) { return c === "docracy_notrack=1"; })) return;
  if (window.location.hostname !== "docracy.io") return;

  var GA_ID = "G-9BK2VMGZGY";
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);
})();
