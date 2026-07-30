import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { submitFeedback } from "../lib/api";
import { useT } from "../lib/i18n";

type Message = { from: "bot" | "user"; text: string; href?: string; hrefLabel?: string };

const JOKES = [
  "Why did the contract break up with the pen? It needed some space (for a new field).",
  "What do you call a signature that shows up late? A tardy-graph.",
  "Why don't documents ever get lost? They always know their place — right up until they're signed, then they disappear.",
];

export default function ChatWidget() {
  const t = useT();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages([{ from: "bot", text: t("chat.greeting") }]);
  }, [t]);

  useEffect(() => {
    const onOpenRequest = () => setOpen(true);
    window.addEventListener("docracy:open-chat", onOpenRequest);
    return () => window.removeEventListener("docracy:open-chat", onOpenRequest);
  }, []);

  if (location.pathname.startsWith("/sign/") || location.pathname.startsWith("/status/")) return null;

  const say = (from: Message["from"], text: string, extra?: Partial<Message>) =>
    setMessages((m) => [...m, { from, text, ...extra }]);

  const onQuickReply = (kind: "sales" | "support" | "joke" | "other") => {
    const labels = {
      sales: t("chat.sales"),
      support: t("chat.support"),
      joke: t("chat.joke"),
      other: t("chat.other"),
    };
    say("user", labels[kind]);
    if (kind === "sales") {
      say("bot", t("chat.salesReply"), {
        href: "mailto:sales@docracy.io",
        hrefLabel: "sales@docracy.io",
      });
    } else if (kind === "joke") {
      say("bot", JOKES[Math.floor(Math.random() * JOKES.length)]);
    } else {
      say("bot", t("chat.formReply"));
      setShowForm(true);
    }
  };

  const onSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitFeedback(email, formMessage);
      say("user", formMessage);
      say("bot", res.aiAnswer ?? t("chat.thanks"));
      setShowForm(false);
      setEmail("");
      setFormMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-widget-panel">
          <div className="chat-widget-header">
            <div className="chat-widget-header-title">
              <img src="/docracy-seal-icon.png" alt="" className="chat-widget-avatar" />
              <span>{t("chat.title")}</span>
            </div>
            <button aria-label={t("common.close")} onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div className="chat-widget-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble chat-bubble-${m.from}`}>
                {m.text}
                {m.href && (
                  <a href={m.href} className="chat-bubble-link">
                    {m.hrefLabel}
                  </a>
                )}
              </div>
            ))}

            {showForm ? (
              <form onSubmit={onSubmitForm} className="chat-widget-form">
                <input
                  className="form-input"
                  type="email"
                  placeholder={t("chat.emailPlaceholder")}
                  aria-label={t("chat.yourEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: "100%", marginBottom: 8 }}
                />
                <textarea
                  className="form-textarea"
                  placeholder={t("chat.messagePlaceholder")}
                  aria-label={t("chat.yourMessage")}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  required
                  rows={3}
                  style={{ width: "100%", marginBottom: 8, resize: "vertical" }}
                />
                {error && <p style={{ color: "var(--danger)", fontSize: 12, marginBottom: 8 }}>{error}</p>}
                <button className="btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
                  {submitting ? t("common.sending") : t("prepare.send")}
                </button>
              </form>
            ) : (
              <div className="chat-widget-replies">
                <button onClick={() => onQuickReply("sales")}>{t("chat.sales")}</button>
                <button onClick={() => onQuickReply("support")}>{t("chat.support")}</button>
                <button onClick={() => onQuickReply("joke")}>{t("chat.joke")}</button>
                <button onClick={() => onQuickReply("other")}>{t("chat.other")}</button>
              </div>
            )}
          </div>
        </div>
      )}
      <button className="chat-widget-launcher" onClick={() => setOpen((o) => !o)} aria-label={open ? t("chat.close") : t("chat.open")}>
        {open ? "×" : "\u{1F4AC}"}
      </button>
    </div>
  );
}
