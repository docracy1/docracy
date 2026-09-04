const DRAFT_KEY = "docracy_cobro_draft";

export type CobroDraft = {
  title: string;
  recipientName: string;
  recipientEmail: string;
  recipientWhatsapp: string;
  amount: string;
  currency: string;
  url: string;
};

const empty: CobroDraft = {
  title: "",
  recipientName: "",
  recipientEmail: "",
  recipientWhatsapp: "",
  amount: "",
  currency: "USD",
  url: "",
};

export function readCobroDraft(): CobroDraft {
  if (typeof window === "undefined") return { ...empty };
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Partial<CobroDraft>;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      recipientName: typeof parsed.recipientName === "string" ? parsed.recipientName : "",
      recipientEmail: typeof parsed.recipientEmail === "string" ? parsed.recipientEmail : "",
      recipientWhatsapp: typeof parsed.recipientWhatsapp === "string" ? parsed.recipientWhatsapp : "",
      amount: typeof parsed.amount === "string" ? parsed.amount : "",
      currency: typeof parsed.currency === "string" && parsed.currency ? parsed.currency : "USD",
      url: typeof parsed.url === "string" ? parsed.url : "",
    };
  } catch {
    return { ...empty };
  }
}

export function writeCobroDraft(draft: CobroDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearCobroDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}
