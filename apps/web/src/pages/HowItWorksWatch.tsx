import { Link } from "react-router-dom";
import { HOW_IT_WORKS_VIDEO } from "../lib/howItWorksVideo";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";

const STEP_KEYS: Array<{ titleKey: string; bodyKey: string }> = [
  { titleKey: "how.s1.title", bodyKey: "how.s1.body" },
  { titleKey: "how.s2.title", bodyKey: "how.s2.body" },
  { titleKey: "how.s3.title", bodyKey: "how.s3.body" },
  { titleKey: "how.s4.title", bodyKey: "how.s4.body" },
];

/** Dedicated watch page for the product demo — video is primary above-the-fold content for Google video indexing. */
export default function HowItWorksWatch() {
  const t = useT();
  const { locale } = useI18n();
  const canonicalPath = locale === "es" ? "/es/como-funciona" : "/how-it-works";
  const videoTitle = t("seo.video.name");
  const videoDescription = t("seo.video.description");

  usePageMeta(videoTitle, videoDescription, {
    canonicalPath,
    alternates: { en: "/how-it-works", es: "/es/como-funciona" },
  });

  const embedUrl =
    locale === "es" ? "https://docracy.io/es/como-funciona" : HOW_IT_WORKS_VIDEO.embedUrl;

  const videoJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: videoTitle,
    description: videoDescription,
    thumbnailUrl: [HOW_IT_WORKS_VIDEO.posterUrl],
    uploadDate: HOW_IT_WORKS_VIDEO.uploadDate,
    duration: HOW_IT_WORKS_VIDEO.durationIso,
    contentUrl: HOW_IT_WORKS_VIDEO.contentUrl,
    embedUrl,
    encodingFormat: "video/webm",
    inLanguage: locale === "es" ? "es" : "en",
    publisher: {
      "@type": "Organization",
      name: "Docracy",
      url: "https://docracy.io",
      logo: {
        "@type": "ImageObject",
        url: "https://docracy.io/docracy-seal-icon.png",
      },
    },
  };

  const prepareTo = localizePath("/prepare", locale);

  return (
    <div className="watch-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }} />
      <div className="container watch-page-inner">
        <h1>{videoTitle}</h1>
        <div className="watch-page-player">
          <video
            className="watch-page-video"
            src={HOW_IT_WORKS_VIDEO.path}
            poster={HOW_IT_WORKS_VIDEO.posterPath}
            controls
            playsInline
            preload="metadata"
            title={videoTitle}
            aria-label={videoDescription}
          >
            <track
              kind="captions"
              src={locale === "es" ? "/videos/how-it-works.es.vtt" : "/videos/how-it-works.en.vtt"}
              srcLang={locale === "es" ? "es" : "en"}
              label={locale === "es" ? "Español" : "English"}
              default
            />
          </video>
        </div>
        <p className="watch-page-description">{videoDescription}</p>
        <ol className="watch-page-steps">
          {STEP_KEYS.map((step) => (
            <li key={step.titleKey}>
              <strong>{t(step.titleKey)}</strong> — {t(step.bodyKey)}
            </li>
          ))}
        </ol>
        <p className="watch-page-cta">
          <Link
            to={prepareTo}
            className="btn-primary btn-lg"
            style={{ display: "inline-block", textDecoration: "none" }}
            onClick={() => track("landingpage_cta_clicked", { source: "watch_page_try_free" })}
          >
            {t("hero.startFree")}
          </Link>
        </p>
      </div>
    </div>
  );
}
