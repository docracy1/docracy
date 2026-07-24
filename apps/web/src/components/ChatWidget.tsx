import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { submitFeedback } from "../lib/api";

type Message = { from: "bot" | "user"; text: string; href?: string; hrefLabel?: string };

const JOKES = [
  "Why did the contract break up with the pen? It needed some space (for a new field).",
  "What do you call a signature that shows up late? A tardy-graph.",
  "Why don't documents ever get lost? They always know their place — right up until they're signed, then they disappear.",
];

export default function ChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "Hey there \u{1F44B} I can help you find the right thing:" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lets other parts of the app (e.g. the Dashboard's profile-menu "Support" item) open this
  // widget without needing shared state — simpler than lifting `open` into a context for one caller.
  useEffect(() => {
    const onOpenRequest = () => setOpen(true);
    window.addEventListener("docracy:open-chat", onOpenRequest);
    return () => window.removeEventListener("docracy:open-chat", onOpenRequest);
  }, []);

  // Sign/status pages are deep links a document's actual signer follows from an email — floating
  // marketing chrome has no place interrupting that task, same reasoning as their noindex tag.
  if (location.pathname.startsWith("/sign/") || location.pathname.startsWith("/status/")) return null;

  const say = (from: Message["from"], text: string, extra?: Partial<Message>) =>
    setMessages((m) => [...m, { from, text, ...extra }]);

  const onQuickReply = (label: string) => {
    say("user", label);
    if (label === "I want to talk to sales") {
      say("bot", "Reach the team directly and we'll get back to you fast:", {
        href: "mailto:sales@docracy.io",
        hrefLabel: "sales@docracy.io",
      });
    } else if (label === "Tell me a joke") {
      say("bot", JOKES[Math.floor(Math.random() * JOKES.length)]);
    } else {
      say("bot", "Sure — leave your email and what's up, and we'll get back to you.");
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
      say("bot", res.aiAnswer ?? "Thanks — got it. We'll reply by email.");
      setShowForm(false);
      setEmail("");
      setFormMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
              <span>Docracy Assistant</span>
            </div>
            <button aria-label="Close" onClick={() => setOpen(false)}>
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
                  placeholder="you@email.com"
                  aria-label="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: "100%", marginBottom: 8 }}
                />
                <textarea
                  className="form-textarea"
                  placeholder="What's on your mind"
                  aria-label="Your message"
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  required
                  rows={3}
                  style={{ width: "100%", marginBottom: 8, resize: "vertical" }}
                />
                {error && <p style={{ color: "var(--danger)", fontSize: 12, marginBottom: 8 }}>{error}</p>}
                <button className="btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
                  {submitting ? "Sending…" : "Send"}
                </button>
              </form>
            ) : (
              <div className="chat-widget-replies">
                <button onClick={() => onQuickReply("I want to talk to sales")}>I want to talk to sales</button>
                <button onClick={() => onQuickReply("I need customer support")}>I need customer support</button>
                <button onClick={() => onQuickReply("Tell me a joke")}>Tell me a joke</button>
                <button onClick={() => onQuickReply("I need something else")}>I need something else</button>
              </div>
            )}
          </div>
        </div>
      )}
      <button className="chat-widget-launcher" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close chat" : "Open chat"}>
        {open ? "×" : "\u{1F4AC}"}
      </button>
    </div>
  );
}
