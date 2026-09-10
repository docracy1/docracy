import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";

/** Plays `text` aloud via the browser's own SpeechSynthesis API — no generated/hosted audio files,
 *  which would recreate the "heavy files crash old Android browsers" problem this feature exists
 *  to avoid. Picks an `es-*` voice when `lang` is "es" and one is installed; otherwise falls back
 *  to the browser default. Hides itself entirely when the API isn't available (older WebViews,
 *  some in-app browsers) rather than showing a control that would silently do nothing. */
export default function ListenButton({ text, lang = "en" }: { text: string; lang?: "en" | "es" }) {
  const t = useT();
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported || !text.trim()) return null;

  const onToggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.lang.toLowerCase().startsWith(lang));
    if (preferred) utterance.voice = preferred;
    utterance.lang = lang === "es" ? "es-419" : "en-US";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={onToggle}
      style={{ fontSize: 12.5, padding: "4px 12px", marginLeft: 10 }}
    >
      {speaking ? `⏸ ${t("tpl.detail.listenStop")}` : `🔊 ${t("tpl.detail.listen")}`}
    </button>
  );
}
