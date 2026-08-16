import { useEffect, useRef } from "react";
import { useT } from "../lib/i18n";
import { HOW_IT_WORKS_VIDEO } from "../lib/howItWorksVideo";

/** Full-screen video lightbox for the landing “Watch how it works” CTA. */
export default function HowItWorksModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    videoRef.current?.play().catch(() => {});
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="how-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="how-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="how-modal-title" className="sr-only">
          {t("seo.video.name")}
        </h2>
        <button type="button" className="how-modal-close" onClick={onClose} aria-label={t("common.close")}>
          ×
        </button>
        <video
          ref={videoRef}
          className="how-modal-video"
          src={HOW_IT_WORKS_VIDEO.path}
          poster={HOW_IT_WORKS_VIDEO.posterPath}
          controls
          autoPlay
          playsInline
          preload="metadata"
          title={t("seo.video.name")}
          aria-label={t("seo.video.description")}
        >
          <track kind="captions" src="/videos/how-it-works.en.vtt" srcLang="en" label="English" default />
          <track kind="captions" src="/videos/how-it-works.es.vtt" srcLang="es" label="Español" />
        </video>
      </div>
    </div>
  );
}
