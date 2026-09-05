export interface SeoComparisonRow {
  feature: string;
  docracyValue: string;
  competitorValue: string;
  secondCompetitorValue?: string;
}

export type SeoLane = "esign" | "latam" | "immigrant";

export interface SeoLandingCopy {
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  comparisonRows: SeoComparisonRow[];
  faqs?: { question: string; answer: string }[];
}

export interface SeoLandingPageContent extends SeoLandingCopy {
  slug: string;
  pageType: "vs-competitor";
  primaryCompetitor: string;
  secondaryCompetitor: string;
  lane: SeoLane;
  /** Spanish twin for LATAM cobro/factura and immigrant compares. ES is x-default on those URLs. */
  es?: SeoLandingCopy;
}

const COMPETITORS = ["PandaDoc", "DocuSign", "HelloSign", "Eversign", "SignNow"];

type VsPageMeta = Pick<
  SeoLandingPageContent,
  "seoTitle" | "seoDescription" | "heroHeadline" | "heroSubheadline"
>;

/** High-intent pairs get tighter SERP copy; everything else uses the default template. */
const VS_PAGE_OVERRIDES: Record<string, VsPageMeta> = {
  "hellosign-vs-signnow": {
    seoTitle: "HelloSign vs SignNow (2026): Pricing & Features | Docracy",
    seoDescription:
      "HelloSign (Dropbox Sign) vs SignNow compared — per-seat pricing, free tiers, and signing flow. Plus a free flat-rate alternative for NDAs and client contracts.",
    heroHeadline: "HelloSign vs SignNow",
    heroSubheadline:
      "Both charge per seat and push account signup before your first send. Here's how they compare — and a simpler flat-rate option for NDAs and client contracts.",
  },
  "docusign-vs-signnow": {
    seoTitle: "DocuSign vs SignNow (2026): Which E-Sign Tool Fits? | Docracy",
    seoDescription:
      "DocuSign vs SignNow for small teams — pricing models, onboarding friction, and when a lighter free tool is enough for NDAs and one-off agreements.",
    heroHeadline: "DocuSign vs SignNow",
    heroSubheadline:
      "Enterprise-grade DocuSign vs airSlate's SignNow — both scale on per-seat pricing. Here's how they differ, and when a free flat-rate signer is enough.",
  },
};

// Deliberately no invented per-competitor pricing figures — those go stale and we'd be
// guessing. Rows describe the well-known per-seat/enterprise-onboarding pattern both
// tools share, contrasted with Docracy's flat/free model, which we do control and can
// state precisely — honest, but leaning into the comparisons that favor Docracy.
const COMPARISON_ROWS: SeoComparisonRow[] = [
  {
    feature: "Pricing model",
    docracyValue: "Free for up to 2 signers, forever. Flat $10/mo for unlimited — never per-seat.",
    competitorValue: "Per-seat, per-month — cost climbs as your team grows",
    secondCompetitorValue: "Per-seat, per-month — cost climbs as your team grows",
  },
  {
    feature: "Account required to sign",
    docracyValue: "No — signers open the emailed link and sign, no login",
    competitorValue: "Often required for signers too, depending on plan",
    secondCompetitorValue: "Often required for signers too, depending on plan",
  },
  {
    feature: "Time to send your first document",
    docracyValue: "Under a minute: upload a PDF, place fields, send",
    competitorValue: "Account signup and workspace setup before your first send",
    secondCompetitorValue: "Account signup and workspace setup before your first send",
  },
  {
    feature: "Best fit",
    docracyValue: "Any team, any size — no minimum seats, no sales call",
    competitorValue: "Best value at team scale; solo/occasional use pays for unused enterprise tooling",
    secondCompetitorValue: "Best value at team scale; solo/occasional use pays for unused enterprise tooling",
  },
  {
    feature: "Template import",
    docracyValue: "Drop in any existing PDF as-is, no reformatting",
    competitorValue: "Templates typically tied to their own document builder",
    secondCompetitorValue: "Templates typically tied to their own document builder",
  },
  {
    feature: "WhatsApp signing",
    docracyValue: "Yes — phone-bound, PIN-protected links. Free: 1/month. Paid: 10/month, then $0.50 each. Enterprise: 50/month fair-use",
    competitorValue: "Not offered",
    secondCompetitorValue: "Not offered",
  },
];

export const SEO_FAQS: { question: string; answer: string }[] = [
  {
    question: "Do I need to create an account to sign a document with Docracy?",
    answer:
      "No. Signers just open the link from their email and sign — no account, no app download, no password.",
  },
  {
    question: "Is Docracy really free?",
    answer:
      "Yes, for documents with up to 2 signers. Need more signers, templates, or team seats? That's a flat $10/month — no per-seat pricing, ever.",
  },
  {
    question: "Can I import my existing PDF contracts?",
    answer:
      "Yes. Drop in any PDF as-is and place signature fields directly on it — no rebuilding it in a proprietary template editor first.",
  },
];

function slugifyCompetitor(name: string): string {
  return name.toLowerCase();
}

/** Canonical A-vs-B pages only (one direction per pair). Reverse URLs 301 via public/_redirects. */
export const SEO_LANDING_PAGES: SeoLandingPageContent[] = [];

/** Reverse slug → canonical slug for redirects / docs. */
export const SEO_VS_REDIRECTS: Array<{ from: string; to: string }> = [];

for (let i = 0; i < COMPETITORS.length; i++) {
  for (let j = i + 1; j < COMPETITORS.length; j++) {
    const comp1 = COMPETITORS[i];
    const comp2 = COMPETITORS[j];
    const canonicalSlug = `${slugifyCompetitor(comp1)}-vs-${slugifyCompetitor(comp2)}`;
    const reverseSlug = `${slugifyCompetitor(comp2)}-vs-${slugifyCompetitor(comp1)}`;

    const override = VS_PAGE_OVERRIDES[canonicalSlug];
    SEO_LANDING_PAGES.push({
      slug: canonicalSlug,
      pageType: "vs-competitor",
      lane: "esign",
      primaryCompetitor: comp1,
      secondaryCompetitor: comp2,
      seoTitle: override?.seoTitle ?? `${comp1} vs ${comp2}: which is right for you? | Docracy`,
      seoDescription:
        override?.seoDescription ??
        `Comparing ${comp1} and ${comp2}? See how they stack up, and how Docracy's flat pricing and no-signup signing compares to both.`,
      heroHeadline: override?.heroHeadline ?? `${comp1} vs ${comp2}`,
      heroSubheadline:
        override?.heroSubheadline ??
        `Both are solid e-signature tools built around per-seat pricing. Here's how they compare, and a simpler flat-rate option to consider.`,
      comparisonRows: COMPARISON_ROWS,
    });

    SEO_VS_REDIRECTS.push({ from: `/${reverseSlug}`, to: `/${canonicalSlug}` });
  }
}

const LATAM_FAQS_EN = [
  {
    question: "Does Docracy stamp CFDI or a DIAN invoice?",
    answer:
      "No. We are not a PAC and we do not file with SAT or DIAN. You paste your own Mercado Pago, PayPal, or Stripe checkout. The PDF and the pay page stay on Docracy.",
  },
  {
    question: "Do you take a cut of the payment?",
    answer: "No. Paid is $10/month for the product. The money goes to the checkout URL you already own.",
  },
  {
    question: "When should I use Kita or Alegra instead?",
    answer:
      "Use them when you need a stamped CFDI or full books. Use Docracy when the job is sign a contract, send the file + your pay link on WhatsApp, and keep the PDF for your accountant.",
  },
];

const LATAM_FAQS_ES = [
  {
    question: "¿Docracy timbra CFDI o factura DIAN?",
    answer:
      "No. No somos PAC ni presentamos ante el SAT o la DIAN. Pegas tu propio checkout de Mercado Pago, PayPal o Stripe. El PDF y la página de cobro quedan en Docracy.",
  },
  {
    question: "¿Se llevan un porcentaje del cobro?",
    answer: "No. El plan son $10/mes por el producto. El dinero va a la URL de checkout que ya tienes.",
  },
  {
    question: "¿Cuándo usar Kita o Alegra?",
    answer:
      "Úsalos cuando necesitas CFDI timbrado o contabilidad. Docracy es firmar el contrato, mandar el archivo + tu link de cobro por WhatsApp, y guardar el PDF para tu contador.",
  },
];

function pushLatamVs(
  a: string,
  b: string,
  en: Omit<SeoLandingCopy, "faqs" | "comparisonRows"> & { rows: SeoComparisonRow[] },
  es: Omit<SeoLandingCopy, "faqs" | "comparisonRows"> & { rows: SeoComparisonRow[] }
) {
  const slug = `${slugifyCompetitor(a)}-vs-${slugifyCompetitor(b)}`;
  SEO_LANDING_PAGES.push({
    slug,
    pageType: "vs-competitor",
    lane: "latam",
    primaryCompetitor: a,
    secondaryCompetitor: b,
    seoTitle: en.seoTitle,
    seoDescription: en.seoDescription,
    heroHeadline: en.heroHeadline,
    heroSubheadline: en.heroSubheadline,
    comparisonRows: en.rows,
    faqs: LATAM_FAQS_EN,
    es: {
      seoTitle: es.seoTitle,
      seoDescription: es.seoDescription,
      heroHeadline: es.heroHeadline,
      heroSubheadline: es.heroSubheadline,
      comparisonRows: es.rows,
      faqs: LATAM_FAQS_ES,
    },
  });
  SEO_VS_REDIRECTS.push({ from: `/${slugifyCompetitor(b)}-vs-${slugifyCompetitor(a)}`, to: `/${slug}` });
  SEO_VS_REDIRECTS.push({ from: `/es/${slugifyCompetitor(b)}-vs-${slugifyCompetitor(a)}`, to: `/es/${slug}` });
}

pushLatamVs(
  "Kita",
  "Alegra",
  {
    seoTitle: "Kita vs Alegra (2026): WhatsApp cobro & CFDI | Docracy",
    seoDescription:
      "Kita vs Alegra for Mexican WhatsApp invoicing. Both stamp CFDI. Docracy is file + your Mercado Pago link — no PAC, 0% of the payment.",
    heroHeadline: "Kita vs Alegra",
    heroSubheadline:
      "Both are Mexican billing stacks: WhatsApp in, CFDI out. Docracy is the other job — sign the contract, send the PDF and your checkout, keep the file.",
    rows: [
      {
        feature: "What they actually do",
        docracyValue: "E-sign + file/pay page on WhatsApp. You paste Mercado Pago or PayPal.",
        competitorValue: "WhatsApp bot that charges on Mercado Pago and stamps CFDI 4.0",
        secondCompetitorValue: "Accounting + PAC e-invoicing, with a WhatsApp CFDI bot",
      },
      {
        feature: "CFDI / SAT",
        docracyValue: "No — not a PAC. Honest limit.",
        competitorValue: "Yes — CFDI 4.0 via an authorized PAC",
        secondCompetitorValue: "Yes — Alegra is a PAC; full books + timbres",
      },
      {
        feature: "Who holds the money",
        docracyValue: "Never Docracy. Your checkout URL.",
        competitorValue: "Mercado Pago — Kita does not hold funds",
        secondCompetitorValue: "Alegra billing / connected processors",
      },
      {
        feature: "Price we can state",
        docracyValue: "Sign free ≤2 people. Paid $10/mo, 0% of the invoice.",
        competitorValue: "Published ~$500 MXN/mo + Mercado Pago fees (their site)",
        secondCompetitorValue: "Subscription + timbres — see Alegra pricing",
      },
      {
        feature: "Best fit",
        docracyValue: "US↔LATAM contractors: NDA, agreement, cobro, constancia, tax-year vault",
        competitorValue: "MX shop that needs autofactura after a Point or link charge",
        secondCompetitorValue: "MX/CO business that wants books + stamped invoices",
      },
    ],
  },
  {
    seoTitle: "Kita vs Alegra (2026): cobro por WhatsApp y CFDI | Docracy",
    seoDescription:
      "Kita vs Alegra para facturar por WhatsApp en México. Ambos timbran CFDI. Docracy es archivo + tu Mercado Pago — sin PAC, 0% del cobro.",
    heroHeadline: "Kita vs Alegra",
    heroSubheadline:
      "Los dos son stacks de facturación: WhatsApp entra, CFDI sale. Docracy es el otro trabajo — firmar el contrato, mandar el PDF y tu checkout, guardar el archivo.",
    rows: [
      {
        feature: "Qué hacen de verdad",
        docracyValue: "Firma + página de archivo/pago por WhatsApp. Pegas Mercado Pago o PayPal.",
        competitorValue: "Bot de WhatsApp que cobra en Mercado Pago y timbra CFDI 4.0",
        secondCompetitorValue: "Contabilidad + factura electrónica PAC, con bot CFDI por WhatsApp",
      },
      {
        feature: "CFDI / SAT",
        docracyValue: "No — no somos PAC. Límite honesto.",
        competitorValue: "Sí — CFDI 4.0 con PAC autorizado",
        secondCompetitorValue: "Sí — Alegra es PAC; libros + timbres",
      },
      {
        feature: "Quién tiene el dinero",
        docracyValue: "Nunca Docracy. Tu URL de checkout.",
        competitorValue: "Mercado Pago — Kita no retiene fondos",
        secondCompetitorValue: "Facturación Alegra / procesadores conectados",
      },
      {
        feature: "Precio que sí podemos afirmar",
        docracyValue: "Firmar gratis ≤2. Plan $10/mes, 0% de la factura.",
        competitorValue: "Publican ~$500 MXN/mes + comisión de Mercado Pago",
        secondCompetitorValue: "Suscripción + timbres — ver precios de Alegra",
      },
      {
        feature: "Para quién",
        docracyValue: "Contratistas US↔LATAM: NDA, acuerdo, cobro, constancia, archivo fiscal",
        competitorValue: "Negocio MX que necesita autofactura después de un cobro Point o link",
        secondCompetitorValue: "Empresa MX/CO que quiere libros + facturas timbradas",
      },
    ],
  }
);

pushLatamVs(
  "Kita",
  "Siigo",
  {
    seoTitle: "Kita vs Siigo (2026): WhatsApp invoice MX vs CO | Docracy",
    seoDescription:
      "Kita (Mexico CFDI + Mercado Pago) vs Siigo (Colombia DIAN + WhatsApp invoice). Docracy is sign + your pay link — not a tax-authority stamp.",
    heroHeadline: "Kita vs Siigo",
    heroSubheadline:
      "Kita is Mexico CFDI on WhatsApp. Siigo is Colombia e-invoicing at DIAN scale. Docracy does not file with either authority.",
    rows: [
      {
        feature: "Country rail",
        docracyValue: "Any checkout URL (Mercado Pago, PayPal, Stripe). Currencies labeled.",
        competitorValue: "Mexico — SAT / CFDI 4.0 + Mercado Pago",
        secondCompetitorValue: "Colombia first — DIAN electronic invoice + WhatsApp chatbot",
      },
      {
        feature: "Tax stamp",
        docracyValue: "None. We keep the PDF you attach.",
        competitorValue: "CFDI timbre",
        secondCompetitorValue: "DIAN authorization",
      },
      {
        feature: "E-sign + archive",
        docracyValue: "SES e-sign, cobro without a second signature, tax-year vault + CPA CSV",
        competitorValue: "Billing assistant, not a signing chain",
        secondCompetitorValue: "Accounting suite; signing is not the product",
      },
      {
        feature: "Cut of your invoice",
        docracyValue: "$10/mo, 0% of what they pay you",
        competitorValue: "Kita subscription; Mercado Pago still takes processor fees",
        secondCompetitorValue: "Siigo subscription — see their plans",
      },
    ],
  },
  {
    seoTitle: "Kita vs Siigo (2026): factura WhatsApp MX vs CO | Docracy",
    seoDescription:
      "Kita (CFDI México + Mercado Pago) vs Siigo (DIAN Colombia + factura por WhatsApp). Docracy es firma + tu link de cobro — no un timbre fiscal.",
    heroHeadline: "Kita vs Siigo",
    heroSubheadline:
      "Kita es CFDI de México por WhatsApp. Siigo es facturación DIAN a escala. Docracy no presenta ante ninguna autoridad.",
    rows: [
      {
        feature: "Riel del país",
        docracyValue: "Cualquier checkout (Mercado Pago, PayPal, Stripe). Monedas etiquetadas.",
        competitorValue: "México — SAT / CFDI 4.0 + Mercado Pago",
        secondCompetitorValue: "Colombia primero — factura electrónica DIAN + chatbot WhatsApp",
      },
      {
        feature: "Timbre fiscal",
        docracyValue: "Ninguno. Conservamos el PDF que adjuntas.",
        competitorValue: "Timbre CFDI",
        secondCompetitorValue: "Autorización DIAN",
      },
      {
        feature: "Firma + archivo",
        docracyValue: "Firma SES, cobro sin segunda firma, archivo fiscal + CSV para el contador",
        competitorValue: "Asistente de cobro, no una cadena de firmas",
        secondCompetitorValue: "Suite contable; firmar no es el producto",
      },
      {
        feature: "Recorte de tu factura",
        docracyValue: "$10/mes, 0% de lo que te pagan",
        competitorValue: "Suscripción Kita; Mercado Pago cobra su comisión",
        secondCompetitorValue: "Suscripción Siigo — ver sus planes",
      },
    ],
  }
);

pushLatamVs(
  "Alegra",
  "Siigo",
  {
    seoTitle: "Alegra vs Siigo (2026): LATAM accounting & e-invoice | Docracy",
    seoDescription:
      "Alegra vs Siigo for books and electronic invoices in LATAM. Docracy is not that suite — it is e-sign, WhatsApp cobro with your checkout, and a shareable archive.",
    heroHeadline: "Alegra vs Siigo",
    heroSubheadline:
      "Two accounting platforms with WhatsApp e-invoice add-ons. Pick them for SAT/DIAN compliance. Pick Docracy to get the contract signed and the file paid.",
    rows: [
      {
        feature: "Core product",
        docracyValue: "Sequential e-sign + cobro (file + your pay link) + constancia / tax-year locker",
        competitorValue: "Cloud accounting + CFDI (PAC) across LATAM",
        secondCompetitorValue: "Cloud accounting + DIAN e-invoicing, large Colombia base",
      },
      {
        feature: "WhatsApp",
        docracyValue: "Send the pay/sign page on the live invite template. Your checkout.",
        competitorValue: "Bot to issue CFDI from chat",
        secondCompetitorValue: "Chatbot to issue a DIAN invoice from chat",
      },
      {
        feature: "What we will not claim",
        docracyValue: "Not a replacement for your accountant or a PAC",
        competitorValue: "Not a lightweight signer — it is the books",
        secondCompetitorValue: "Not a lightweight signer — it is the books",
      },
    ],
  },
  {
    seoTitle: "Alegra vs Siigo (2026): contabilidad y factura LATAM | Docracy",
    seoDescription:
      "Alegra vs Siigo para libros y factura electrónica en LATAM. Docracy no es esa suite — es firma, cobro por WhatsApp con tu checkout y un archivo para compartir.",
    heroHeadline: "Alegra vs Siigo",
    heroSubheadline:
      "Dos plataformas contables con factura por WhatsApp. Elígelas para SAT/DIAN. Elige Docracy para firmar el contrato y cobrar el archivo.",
    rows: [
      {
        feature: "Producto de fondo",
        docracyValue: "Firma secuencial + cobro (archivo + tu link) + constancia / casillero fiscal",
        competitorValue: "Contabilidad en la nube + CFDI (PAC) en LATAM",
        secondCompetitorValue: "Contabilidad + factura DIAN, base grande en Colombia",
      },
      {
        feature: "WhatsApp",
        docracyValue: "Manda la página de firma/cobro. Tu checkout.",
        competitorValue: "Bot para emitir CFDI desde el chat",
        secondCompetitorValue: "Chatbot para emitir factura DIAN desde el chat",
      },
      {
        feature: "Lo que no afirmamos",
        docracyValue: "No sustituimos al contador ni a un PAC",
        competitorValue: "No es un firmante ligero — son los libros",
        secondCompetitorValue: "No es un firmante ligero — son los libros",
      },
    ],
  }
);

const IMMIGRANT_FAQS_EN = [
  {
    question: "Does Docracy replace Boundless or CitizenPath?",
    answer:
      "No. They file or prepare USCIS/State petitions. We sign the supporting packet (official I-9, offer, POA, reference, lease), keep it on Paid, and tell you where each file goes. Use them to file. Use us for the $10 extras around the filing.",
  },
  {
    question: "Do you file DS-160 or I-129?",
    answer:
      "No. DS-160 is CEAC. I-129 and family petitions stay with Boundless, CitizenPath, a gestoría, or an attorney. We do not invent those forms.",
  },
  {
    question: "Why is Docracy $10/month instead of hundreds?",
    answer:
      "Different job. They charge for preparing or filing a case. Paid is the vault + signed extras + constancia + cobro. Check their sites for case fees — we will not invent a number.",
  },
];

const IMMIGRANT_FAQS_ES = [
  {
    question: "¿Docracy sustituye a Boundless o CitizenPath?",
    answer:
      "No. Ellos presentan o preparan peticiones ante USCIS/State. Nosotros firmamos el paquete de apoyo (I-9 oficial, oferta, poder, referencia, arrendamiento), lo guardamos en el plan y te decimos a dónde va cada archivo. Úsalos para presentar. Usa esto para los extras de $10 alrededor del trámite.",
  },
  {
    question: "¿Presentan el DS-160 o el I-129?",
    answer:
      "No. El DS-160 es CEAC. El I-129 y las peticiones familiares se quedan con Boundless, CitizenPath, una gestoría o un abogado. No inventamos esos formularios.",
  },
  {
    question: "¿Por qué Docracy son $10/mes y no cientos?",
    answer:
      "Otro trabajo. Ellos cobran por preparar o presentar un caso. El plan es el vault + extras firmados + constancia + cobro. Mira sus sitios para las cuotas — no inventamos un número.",
  },
];

function pushImmigrantVs(
  a: string,
  b: string,
  en: Omit<SeoLandingCopy, "faqs" | "comparisonRows"> & { rows: SeoComparisonRow[] },
  es: Omit<SeoLandingCopy, "faqs" | "comparisonRows"> & { rows: SeoComparisonRow[] }
) {
  const slug = `${slugifyCompetitor(a)}-vs-${slugifyCompetitor(b)}`;
  SEO_LANDING_PAGES.push({
    slug,
    pageType: "vs-competitor",
    lane: "immigrant",
    primaryCompetitor: a,
    secondaryCompetitor: b,
    seoTitle: en.seoTitle,
    seoDescription: en.seoDescription,
    heroHeadline: en.heroHeadline,
    heroSubheadline: en.heroSubheadline,
    comparisonRows: en.rows,
    faqs: IMMIGRANT_FAQS_EN,
    es: {
      seoTitle: es.seoTitle,
      seoDescription: es.seoDescription,
      heroHeadline: es.heroHeadline,
      heroSubheadline: es.heroSubheadline,
      comparisonRows: es.rows,
      faqs: IMMIGRANT_FAQS_ES,
    },
  });
  SEO_VS_REDIRECTS.push({ from: `/${slugifyCompetitor(b)}-vs-${slugifyCompetitor(a)}`, to: `/${slug}` });
  SEO_VS_REDIRECTS.push({ from: `/es/${slugifyCompetitor(b)}-vs-${slugifyCompetitor(a)}`, to: `/es/${slug}` });
}

pushImmigrantVs(
  "Boundless",
  "CitizenPath",
  {
    seoTitle: "Boundless vs CitizenPath (2026): Filing vs DIY Forms | Docracy",
    seoDescription:
      "Boundless vs CitizenPath for US immigration paperwork. They file or prepare petitions. Docracy is the $10/mo supporting packet — I-9, offer, constancia. We don't file.",
    heroHeadline: "Boundless vs CitizenPath",
    heroSubheadline:
      "Boundless is full-service filing. CitizenPath is DIY USCIS forms. Docracy is neither — we sign the $10 packet around the filing and tell you where each file goes.",
    rows: [
      {
        feature: "What they actually do",
        docracyValue: "Sign official I-9 + visa supporting docs. Vault, constancia, cobro. Where-to-send map.",
        competitorValue: "Full-service: prepare and file USCIS petitions (attorneys in the loop)",
        secondCompetitorValue: "DIY USCIS form software — you file the petition they prepared",
      },
      {
        feature: "Who files with USCIS / State",
        docracyValue: "Never us. Official links to CEAC and uscis.gov. Your lawyer, employer, or you.",
        competitorValue: "They file (or their attorneys do) — see their site",
        secondCompetitorValue: "You file the PDF they helped you complete",
      },
      {
        feature: "Price we can state",
        docracyValue: "Paid $10/month for the supporting packet. Signing a template once is still free.",
        competitorValue: "FAQ 11 Jun 2026: marriage GC $699 / $1,349; K-1 $1,379 / $2,549; B-1/B-2 $195+$185. USCIS extra.",
        secondCompetitorValue: "They publish from $79–$99; I-130 $149; I-485 packet $279; N-400 $199. USCIS extra.",
      },
      {
        feature: "I-9 and supporting letters",
        docracyValue: "Yes — official I-9, offer, employment, POA, reference, child travel, lease",
        competitorValue: "Petition-focused; not a replacement for employer I-9 retention",
        secondCompetitorValue: "Form software; they may ask you to attach extras we can sign",
      },
      {
        feature: "After you arrive",
        docracyValue: "Constancia for a US landlord + WhatsApp cobro if you still invoice MX/CO",
        competitorValue: "Immigration case status — not income proof or cobro",
        secondCompetitorValue: "Same — forms, not a vault for landlords or invoices",
      },
      {
        feature: "Best fit",
        docracyValue: "You already have a filer, or you only need the extras signed and kept",
        competitorValue: "You need someone to prepare and file the petition",
        secondCompetitorValue: "You want cheaper DIY USCIS forms and will file yourself",
      },
    ],
  },
  {
    seoTitle: "Boundless vs CitizenPath (2026): trámite vs formularios DIY | Docracy",
    seoDescription:
      "Boundless vs CitizenPath para papeles de inmigración. Ellos presentan o preparan. Docracy es el paquete de apoyo de $10/mes — I-9, oferta, constancia. No tramitamos.",
    heroHeadline: "Boundless vs CitizenPath",
    heroSubheadline:
      "Boundless es trámite completo. CitizenPath es formularios USCIS DIY. Docracy no es ninguno — firmamos el paquete de $10 alrededor del trámite y te decimos a dónde va cada archivo.",
    rows: [
      {
        feature: "Qué hacen de verdad",
        docracyValue: "Firmar I-9 oficial + documentos de apoyo. Vault, constancia, cobro. Mapa de envío.",
        competitorValue: "Servicio completo: preparan y presentan peticiones USCIS (abogados en el circuito)",
        secondCompetitorValue: "Software DIY de formularios USCIS — tú presentas el PDF que te armaron",
      },
      {
        feature: "Quién presenta ante USCIS / State",
        docracyValue: "Nunca nosotros. Links oficiales a CEAC y uscis.gov. Tu abogado, empleador o tú.",
        competitorValue: "Ellos presentan (o sus abogados) — ver su sitio",
        secondCompetitorValue: "Tú presentas el PDF que te ayudaron a completar",
      },
      {
        feature: "Precio que sí podemos afirmar",
        docracyValue: "Plan $10/mes por el paquete de apoyo. Firmar una plantilla una vez sigue gratis.",
        competitorValue: "FAQ 11 jun 2026: green card matrimonio $699 / $1,349; K-1 $1,379 / $2,549; B-1/B-2 $195+$185. USCIS aparte.",
        secondCompetitorValue: "Publican desde $79–$99; I-130 $149; paquete I-485 $279; N-400 $199. USCIS aparte.",
      },
      {
        feature: "I-9 y cartas de apoyo",
        docracyValue: "Sí — I-9 oficial, oferta, empleo, poder, referencia, viaje de menor, arrendamiento",
        competitorValue: "Enfocados en la petición; no sustituyen que el empleador conserve el I-9",
        secondCompetitorValue: "Software de formularios; pueden pedirte extras que nosotros firmamos",
      },
      {
        feature: "Cuando llegas",
        docracyValue: "Constancia para el arrendador en EE. UU. + cobro por WhatsApp si sigues facturando MX/CO",
        competitorValue: "Estatus del caso de inmigración — no prueba de ingresos ni cobro",
        secondCompetitorValue: "Igual — formularios, no un vault para arrendadores o facturas",
      },
      {
        feature: "Para quién",
        docracyValue: "Ya tienes quien presente, o solo necesitas firmar y guardar los extras",
        competitorValue: "Necesitas que alguien prepare y presente la petición",
        secondCompetitorValue: "Quieres formularios USCIS DIY más baratos y presentarás tú",
      },
    ],
  }
);

export function getSeoLandingPage(slug: string): SeoLandingPageContent | undefined {
  return SEO_LANDING_PAGES.find((p) => p.slug === slug);
}

export function resolveSeoLandingCopy(
  page: SeoLandingPageContent,
  locale: "en" | "es"
): SeoLandingCopy {
  if (locale === "es" && page.es) return page.es;
  return page;
}
