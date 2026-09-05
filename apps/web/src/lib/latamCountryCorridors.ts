export type LatamCountryCorridor = {
  slug: string;
  enPath: string;
  esPath: string;
  /** Already shipped as a hand-written FeaturePage — do not generate a second copy. */
  handmade?: boolean;
  countryEn: string;
  countryEs: string;
  cityEn: string;
  cityEs: string;
  apostilleLabelEn: string;
  apostilleLabelEs: string;
  officialHref: string;
  officialNoteEn: string;
  officialNoteEs: string;
  cobroCurrency: string;
  taxNoteEn: string;
  taxNoteEs: string;
  problemEn: string;
  problemEs: string;
};

/**
 * Spanish LATAM → US doors. Official apostille / legalization URLs only when we verified
 * the government host. Brazil is not in this catalog: Portuguese + CNJ e-Apostila is a
 * third locale, not another Spanish “to US” page. Puerto Rico is already US.
 */
export const LATAM_COUNTRY_CORRIDORS: LatamCountryCorridor[] = [
  {
    slug: "mexico-to-us",
    enPath: "/mexico-to-us",
    esPath: "/es/mexico-a-eeuu",
    handmade: true,
    countryEn: "Mexico",
    countryEs: "México",
    cityEn: "Mexico City",
    cityEs: "Ciudad de México",
    apostilleLabelEn: "SRE apostille",
    apostilleLabelEs: "Apostilla SRE",
    officialHref: "https://www.gob.mx/sre/acciones-y-programas/apostilla-y-legalizacion-de-documentos",
    officialNoteEn: "SRE stamps it. We don't.",
    officialNoteEs: "SRE la timbra. Nosotros no.",
    cobroCurrency: "MXN",
    taxNoteEn: "Not a SAT CSF.",
    taxNoteEs: "No es la CSF del SAT.",
    problemEn: "Gestorías and Boundless own the search.",
    problemEs: "Las gestorías y Boundless se quedan con la búsqueda.",
  },
  {
    slug: "colombia-to-us",
    enPath: "/colombia-to-us",
    esPath: "/es/colombia-a-eeuu",
    handmade: true,
    countryEn: "Colombia",
    countryEs: "Colombia",
    cityEn: "Bogotá",
    cityEs: "Bogotá",
    apostilleLabelEn: "Cancillería apostille",
    apostilleLabelEs: "Apostilla Cancillería",
    officialHref: "https://www.cancilleria.gov.co/tramites_servicios/apostilla_legalizacion",
    officialNoteEn: "Cancillería files it. We don't.",
    officialNoteEs: "Cancillería la presenta. Nosotros no.",
    cobroCurrency: "COP",
    taxNoteEn: "Not a DIAN invoice.",
    taxNoteEs: "No es factura DIAN.",
    problemEn: "Siigo and gestorías own the search.",
    problemEs: "Siigo y las gestorías se quedan con la búsqueda.",
  },
  {
    slug: "peru-to-us",
    enPath: "/peru-to-us",
    esPath: "/es/peru-a-eeuu",
    countryEn: "Peru",
    countryEs: "Perú",
    cityEn: "Lima",
    cityEs: "Lima",
    apostilleLabelEn: "MRE apostille (gob.pe)",
    apostilleLabelEs: "Apostilla MRE (gob.pe)",
    officialHref: "https://www.gob.pe/37302-apostilla-y-legalizacion-apostillar-y-legalizar-documentos-digitales",
    officialNoteEn: "Digital on gob.pe / Págalo.pe. Handwritten docs are in person.",
    officialNoteEs: "Digital en gob.pe / Págalo.pe. Firma manuscrita es presencial.",
    cobroCurrency: "PEN",
    taxNoteEn: "Not a SUNAT voucher.",
    taxNoteEs: "No es comprobante SUNAT.",
    problemEn: "Random ‘apostilla Perú’ blogs, not the MRE page.",
    problemEs: "Blogs de ‘apostilla Perú’, no la página del MRE.",
  },
  {
    slug: "argentina-to-us",
    enPath: "/argentina-to-us",
    esPath: "/es/argentina-a-eeuu",
    countryEn: "Argentina",
    countryEs: "Argentina",
    cityEn: "Buenos Aires",
    cityEs: "Buenos Aires",
    apostilleLabelEn: "Cancillería TAD / Colegio de Escribanos",
    apostilleLabelEs: "TAD Cancillería / Colegio de Escribanos",
    officialHref: "https://www.cancilleria.gob.ar/es/servicios/apostilla-legalizacion-con-validez-internacional-tad",
    officialNoteEn: "TAD or a provincial Colegio de Escribanos. We don't file TAD.",
    officialNoteEs: "TAD o el Colegio de Escribanos de tu provincia. No cargamos TAD.",
    cobroCurrency: "ARS",
    taxNoteEn: "Not AFIP.",
    taxNoteEs: "No es AFIP.",
    problemEn: "Gestorías sell ‘apostilla + visa’ as one product.",
    problemEs: "Las gestorías venden ‘apostilla + visa’ como un solo producto.",
  },
  {
    slug: "chile-to-us",
    enPath: "/chile-to-us",
    esPath: "/es/chile-a-eeuu",
    countryEn: "Chile",
    countryEs: "Chile",
    cityEn: "Santiago",
    cityEs: "Santiago",
    apostilleLabelEn: "MINREL consulado apostille",
    apostilleLabelEs: "Apostilla consulado MINREL",
    officialHref: "https://www.consulado.gob.cl/servicios-en-linea/solicitar-apostilla-chilena",
    officialNoteEn: "From abroad: consulado.gob.cl. Inside Chile it is decentralized (Registro Civil / MINEDUC / MINREL).",
    officialNoteEs: "Desde el extranjero: consulado.gob.cl. En Chile está descentralizada (Registro Civil / MINEDUC / MINREL).",
    cobroCurrency: "CLP",
    taxNoteEn: "Not an SII boleta.",
    taxNoteEs: "No es boleta SII.",
    problemEn: "People pay a gestoría to apostille a Chilean acta the state already stamps.",
    problemEs: "La gente paga una gestoría para apostillar un acta que el Estado ya timbra.",
  },
  {
    slug: "panama-to-us",
    enPath: "/panama-to-us",
    esPath: "/es/panama-a-eeuu",
    countryEn: "Panama",
    countryEs: "Panamá",
    cityEn: "Panama City",
    cityEs: "Ciudad de Panamá",
    apostilleLabelEn: "MIRE e-Apostille (PanamaConecta)",
    apostilleLabelEs: "e-Apostilla MIRE (PanamaConecta)",
    officialHref: "https://panamaconecta.gob.pa/servicios",
    officialNoteEn: "MIRE told HCCH e-Apostilles are requested on PanamaConecta. We don't submit that form.",
    officialNoteEs: "MIRE avisó a HCCH que la e-Apostilla se pide en PanamaConecta. No enviamos ese formulario.",
    cobroCurrency: "USD/PAB",
    taxNoteEn: "Not a DGI stamp.",
    taxNoteEs: "No es timbre de la DGI.",
    problemEn: "Canal-zone search is visas and ‘trámites’, not a signed US I-9.",
    problemEs: "La búsqueda en el istmo es visas y ‘trámites’, no un I-9 firmado.",
  },
  {
    slug: "venezuela-to-us",
    enPath: "/venezuela-to-us",
    esPath: "/es/venezuela-a-eeuu",
    countryEn: "Venezuela",
    countryEs: "Venezuela",
    cityEn: "Caracas",
    cityEs: "Caracas",
    apostilleLabelEn: "SAREN / MPPRE digital apostille",
    apostilleLabelEs: "Apostilla digital SAREN / MPPRE",
    officialHref: "https://tramites.saren.gob.ve",
    officialNoteEn: "MPPRE (11 Jun 2026): 153 SAREN document types are digital on tramites.saren.gob.ve. Other docs stay in-person. We don't file SLAE.",
    officialNoteEs: "MPPRE (11 jun 2026): 153 tipos SAREN son digitales en tramites.saren.gob.ve. El resto sigue presencial. No cargamos SLAE.",
    cobroCurrency: "USD/VES",
    taxNoteEn: "Not a SENIAT form.",
    taxNoteEs: "No es un formulario SENIAT.",
    problemEn: "TPS / parole news drowns the I-9 and the real SAREN portal.",
    problemEs: "Las noticias de TPS / parole tapan el I-9 y el portal real de SAREN.",
  },
  {
    slug: "ecuador-to-us",
    enPath: "/ecuador-to-us",
    esPath: "/es/ecuador-a-eeuu",
    countryEn: "Ecuador",
    countryEs: "Ecuador",
    cityEn: "Quito",
    cityEs: "Quito",
    apostilleLabelEn: "Cancillería electronic apostille",
    apostilleLabelEs: "Apostilla electrónica Cancillería",
    officialHref: "https://serviciosdigitales.cancilleria.gob.ec",
    officialNoteEn: "MREMH digital portal. In-person appointments: citas.cancilleria.gob.ec. We don't file it.",
    officialNoteEs: "Portal digital MREMH. Citas presenciales: citas.cancilleria.gob.ec. No la presentamos.",
    cobroCurrency: "USD",
    taxNoteEn: "Not an SRI RUC certificate.",
    taxNoteEs: "No es el RUC del SRI.",
    problemEn: "Dollarized invoices still don't replace a US I-9.",
    problemEs: "Facturar en dólares no reemplaza un I-9.",
  },
  {
    slug: "guatemala-to-us",
    enPath: "/guatemala-to-us",
    esPath: "/es/guatemala-a-eeuu",
    countryEn: "Guatemala",
    countryEs: "Guatemala",
    cityEn: "Guatemala City",
    cityEs: "Ciudad de Guatemala",
    apostilleLabelEn: "MINEX e-apostille (tramites.gob.gt)",
    apostilleLabelEs: "e-Apostilla MINEX (tramites.gob.gt)",
    officialHref: "https://www.tramites.gob.gt/servicio/1733/",
    officialNoteEn: "Official gob.gt catalog: create a user on apostilla.minex.gob.gt. We don't file MINEX.",
    officialNoteEs: "Catálogo oficial gob.gt: crea usuario en apostilla.minex.gob.gt. No cargamos MINEX.",
    cobroCurrency: "GTQ",
    taxNoteEn: "Not a SAT Guatemala form.",
    taxNoteEs: "No es un formulario de la SAT de Guatemala.",
    problemEn: "Northern Triangle search is smugglers and Boundless, not a signed I-9.",
    problemEs: "La búsqueda del Triángulo Norte es coyotes y Boundless, no un I-9 firmado.",
  },
  {
    slug: "honduras-to-us",
    enPath: "/honduras-to-us",
    esPath: "/es/honduras-a-eeuu",
    countryEn: "Honduras",
    countryEs: "Honduras",
    cityEn: "Tegucigalpa",
    cityEs: "Tegucigalpa",
    apostilleLabelEn: "SRECI digital apostille",
    apostilleLabelEs: "Apostilla digital SRECI",
    officialHref: "https://tramitedigital.sreci.gob.hn/SOL/web/ciudadano/#/inicio",
    officialNoteEn: "SRECI Auténticas y Apostillas on tramitedigital.sreci.gob.hn. We don't submit that form.",
    officialNoteEs: "Auténticas y Apostillas SRECI en tramitedigital.sreci.gob.hn. No enviamos ese formulario.",
    cobroCurrency: "HNL",
    taxNoteEn: "Not a SAR form.",
    taxNoteEs: "No es un formulario del SAR.",
    problemEn: "TPS headlines, then a Houston landlord who wants a W-2.",
    problemEs: "Titulares de TPS y un landlord en Houston que pide W-2.",
  },
  {
    slug: "el-salvador-to-us",
    enPath: "/el-salvador-to-us",
    esPath: "/es/el-salvador-a-eeuu",
    countryEn: "El Salvador",
    countryEs: "El Salvador",
    cityEn: "San Salvador",
    cityEs: "San Salvador",
    apostilleLabelEn: "RREE electronic apostille",
    apostilleLabelEs: "Apostilla electrónica RREE",
    officialHref: "https://apostilla.rree.gob.sv/",
    officialNoteEn: "Presidencia / RREE portal apostilla.rree.gob.sv. We don't file it.",
    officialNoteEs: "Portal de Presidencia / RREE: apostilla.rree.gob.sv. No la presentamos.",
    cobroCurrency: "USD",
    taxNoteEn: "Not a Ministerio de Hacienda form.",
    taxNoteEs: "No es un formulario de Hacienda.",
    problemEn: "TPS / dollarization talk, no signed I-9.",
    problemEs: "Hablan de TPS y del dólar, no de un I-9 firmado.",
  },
  {
    slug: "dominican-republic-to-us",
    enPath: "/dominican-republic-to-us",
    esPath: "/es/republica-dominicana-a-eeuu",
    countryEn: "Dominican Republic",
    countryEs: "República Dominicana",
    cityEn: "Santo Domingo",
    cityEs: "Santo Domingo",
    apostilleLabelEn: "MIREX apostille / legalization",
    apostilleLabelEs: "Apostilla / legalización MIREX",
    officialHref: "https://servicios360.mirex.gob.do/apostillas-legalizaciones/",
    officialNoteEn: "Online on servicios.mirex.gob.do (MIREX servicios360). We don't file it.",
    officialNoteEs: "En línea en servicios.mirex.gob.do (servicios360 MIREX). No la presentamos.",
    cobroCurrency: "DOP",
    taxNoteEn: "Not a DGII form.",
    taxNoteEs: "No es un formulario de la DGII.",
    problemEn: "NYC / Boston lease portals want a W-2. You have remesas.",
    problemEs: "Los portales de NYC / Boston piden W-2. Tú tienes remesas.",
  },
  {
    slug: "bolivia-to-us",
    enPath: "/bolivia-to-us",
    esPath: "/es/bolivia-a-eeuu",
    countryEn: "Bolivia",
    countryEs: "Bolivia",
    cityEn: "La Paz",
    cityEs: "La Paz",
    apostilleLabelEn: "Cancillería e-apostille",
    apostilleLabelEs: "Apostilla electrónica Cancillería",
    officialHref: "https://apostilla.rree.gob.bo/",
    officialNoteEn: "Digital on apostilla.rree.gob.bo (also listed on gob.bo). We don't file it.",
    officialNoteEs: "Digital en apostilla.rree.gob.bo (también en gob.bo). No la presentamos.",
    cobroCurrency: "BOB",
    taxNoteEn: "Not a SIN / Impuestos Nacionales form.",
    taxNoteEs: "No es un formulario del SIN.",
    problemEn: "Two official languages at home, one I-9 on day one in the US.",
    problemEs: "Dos idiomas oficiales en casa, un I-9 el primer día en EE. UU.",
  },
  {
    slug: "costa-rica-to-us",
    enPath: "/costa-rica-to-us",
    esPath: "/es/costa-rica-a-eeuu",
    countryEn: "Costa Rica",
    countryEs: "Costa Rica",
    cityEn: "San José",
    cityEs: "San José",
    apostilleLabelEn: "RREE Autenticaciones (rree.go.cr)",
    apostilleLabelEs: "Autenticaciones RREE (rree.go.cr)",
    officialHref: "https://www.rree.go.cr/?cat=autenticaciones&sec=servicios",
    officialNoteEn: "Cancillería Departamento de Autenticaciones. Cita on rree.go.cr; Correos de Costa Rica is an official drop-off. We don't apostille.",
    officialNoteEs: "Departamento de Autenticaciones. Cita en rree.go.cr; Correos de Costa Rica es ventanilla oficial. No apostillamos.",
    cobroCurrency: "CRC",
    taxNoteEn: "Not a Hacienda D-101.",
    taxNoteEs: "No es un D-101 de Hacienda.",
    problemEn: "Remote tech offers still need a US I-9 the first week.",
    problemEs: "La oferta remota de tech igual pide I-9 la primera semana.",
  },
  {
    slug: "nicaragua-to-us",
    enPath: "/nicaragua-to-us",
    esPath: "/es/nicaragua-a-eeuu",
    countryEn: "Nicaragua",
    countryEs: "Nicaragua",
    cityEn: "Managua",
    cityEs: "Managua",
    apostilleLabelEn: "Cancillería citas (apostille)",
    apostilleLabelEs: "Citas Cancillería (apostilla)",
    officialHref: "https://citas.cancilleria.gob.ni/",
    officialNoteEn: "Official appointment host: citas.cancilleria.gob.ni. The portal is often flaky. We don't book it or apostille.",
    officialNoteEs: "Citas oficiales: citas.cancilleria.gob.ni. El portal a veces falla. No agendamos ni apostillamos.",
    cobroCurrency: "NIO",
    taxNoteEn: "Not a DGI Nicaragua form.",
    taxNoteEs: "No es un formulario de la DGI de Nicaragua.",
    problemEn: "TPS / parole headlines, then an employer who wants Section 1 signed.",
    problemEs: "Titulares de TPS / parole y un empleador que quiere la Sección 1 firmada.",
  },
  {
    slug: "uruguay-to-us",
    enPath: "/uruguay-to-us",
    esPath: "/es/uruguay-a-eeuu",
    countryEn: "Uruguay",
    countryEs: "Uruguay",
    cityEn: "Montevideo",
    cityEs: "Montevideo",
    apostilleLabelEn: "MRREE apostille (gub.uy)",
    apostilleLabelEs: "Apostilla MRREE (gub.uy)",
    officialHref: "https://www.gub.uy/tramites/apostilla-yo-legalizacion-documentos-publicos-uruguayos-extranjeros-produzcan-efectos-exterior-republica",
    officialNoteEn: "Official gub.uy trámite: agenda + MRREE (Cuareim 1384). We don't file it.",
    officialNoteEs: "Trámite oficial gub.uy: agenda + MRREE (Cuareim 1384). No lo presentamos.",
    cobroCurrency: "UYU",
    taxNoteEn: "Not a DGI Uruguay form.",
    taxNoteEs: "No es un formulario de la DGI de Uruguay.",
    problemEn: "A small corridor still needs the same I-9 and constancia.",
    problemEs: "Un corredor chico igual necesita el mismo I-9 y la constancia.",
  },
  {
    slug: "paraguay-to-us",
    enPath: "/paraguay-to-us",
    esPath: "/es/paraguay-a-eeuu",
    countryEn: "Paraguay",
    countryEs: "Paraguay",
    cityEn: "Asunción",
    cityEs: "Asunción",
    apostilleLabelEn: "MRE Legalizaciones / Apostilla",
    apostilleLabelEs: "Legalizaciones / Apostilla MRE",
    officialHref: "https://www.mre.gov.py/legalizaciones-apostilla/",
    officialNoteEn: "MRE Dirección de Legalizaciones (Alberdi y Haedo). We don't file it.",
    officialNoteEs: "Dirección de Legalizaciones del MRE (Alberdi y Haedo). No la presentamos.",
    cobroCurrency: "PYG",
    taxNoteEn: "Not a SET form.",
    taxNoteEs: "No es un formulario de la SET.",
    problemEn: "Thin search. The I-9 and the official apostille authority still exist.",
    problemEs: "Poca búsqueda. El I-9 y la autoridad de apostilla igual existen.",
  },
  {
    slug: "cuba-to-us",
    enPath: "/cuba-to-us",
    esPath: "/es/cuba-a-eeuu",
    countryEn: "Cuba",
    countryEs: "Cuba",
    cityEn: "Havana",
    cityEs: "La Habana",
    apostilleLabelEn: "MINJUS consular legalization (not Apostille)",
    apostilleLabelEs: "Legalización MINJUS (no es Apostilla)",
    officialHref: "https://www.minjus.gob.cu/es",
    officialNoteEn: "Cuba is not a party to the Apostille Convention (HCCH). Feb 2025: legalization moved from MINREX to MINJUS — bufetes / consultorías. We don't legalize.",
    officialNoteEs: "Cuba no es parte del Convenio de Apostilla (HCCH). Feb 2025: la legalización pasó de MINREX a MINJUS — bufetes / consultorías. No legalizamos.",
    cobroCurrency: "USD",
    taxNoteEn: "Not an ONAT form.",
    taxNoteEs: "No es un formulario de la ONAT.",
    problemEn: "Parole / family-based news. Day-one I-9 is still a USCIS PDF.",
    problemEs: "Noticias de parole / familia. El I-9 del primer día sigue siendo el PDF de USCIS.",
  },
];

export const GENERATED_COUNTRY_CORRIDORS = LATAM_COUNTRY_CORRIDORS.filter((c) => !c.handmade);

export function countryFeaturePage(c: LatamCountryCorridor, locale: "en" | "es") {
  const es = locale === "es";
  const country = es ? c.countryEs : c.countryEn;
  const city = es ? c.cityEs : c.cityEn;
  const apostille = es ? c.apostilleLabelEs : c.apostilleLabelEn;
  const officialNote = es ? c.officialNoteEs : c.officialNoteEn;
  const taxNote = es ? c.taxNoteEs : c.taxNoteEn;
  const problem = es ? c.problemEs : c.problemEn;
  return {
    slug: c.slug,
    xDefault: "es" as const,
    seoTitle: es
      ? `De ${country} a EE. UU. — plan LATAM $10: I-9, ${apostille}, constancia | Docracy`
      : `${country} to the US — $10 LATAM plan: I-9, ${apostille}, Constancia | Docracy`,
    seoDescription: es
      ? `De ${country} a EE. UU.: el paquete LATAM va en la suscripción de USD $10/mes (I-9 oficial, extras de visa, vault, constancia, cobro). Link oficial de ${apostille}. No apostillamos ni tramitamos USCIS.`
      : `From ${country} to the US: the LATAM package is included in the $10/month USD subscription — official I-9, visa extras, vault, constancia, cobro. Official ${apostille} link. We don't apostille or file USCIS.`,
    heroHeadline: es
      ? `${country} → Estados Unidos. La suscripción de $10/mes firma el expediente.`
      : `${country} → United States. The $10/month subscription signs the packet.`,
    heroSubheadline: es
      ? `Una sola suscripción de USD $10/mes: I-9, oferta, poder, constancia, cobro y cada PDF guardado (hasta el 15 de abril o 13 meses). ${officialNote} El cobro que etiquetas en ${c.cobroCurrency} no nos llega.`
      : `One $10/month USD subscription: I-9, offer, POA, constancia, cobro, and every PDF saved (until next April 15 or 13 months). ${officialNote} Cobro you label ${c.cobroCurrency} never hits us.`,
    problem: es
      ? `${problem} Tú necesitas el paquete LATAM — I-9 firmado, constancia para rentar, cobro si sigues facturando — y a quién apostilla un acta de ${city}. No un intermediario.`
      : `${problem} You need the LATAM package — signed I-9, constancia for a lease, cobro if you still invoice — and who apostilles a ${city} record. Not a reseller.`,
    solution: es
      ? `Activa la suscripción de USD $10/mes. El paquete LATAM ya está incluido: firma I-9 y extras aquí; nosotros guardamos los PDF. La apostilla es ${c.officialHref}. El cobro en ${c.cobroCurrency} usa tu checkout.`
      : `Start the $10/month USD subscription. The LATAM package is already included: sign I-9 and extras here; we keep the PDFs. Apostille is ${c.officialHref}. Cobro in ${c.cobroCurrency} uses your checkout.`,
    features: [
      {
        title: es ? "Paquete LATAM en la suscripción de $10/mes" : "LATAM package in the $10/month subscription",
        body: es
          ? "I-9 oficial, oferta, poder, referencia, consentimiento de viaje. Vault hasta el 15 de abril o 13 meses. Firmar sigue gratis."
          : "Official I-9, offer, POA, reference, child travel. Vault until next April 15 or 13 months. Signing stays free.",
      },
      { title: apostille, body: officialNote },
      {
        title: es ? "Constancia para el arrendador" : "Constancia for a US landlord",
        body: `${taxNote} ${es ? "No es un W-2. URL del vault de pago." : "Not a W-2. Paid vault URL."}`,
      },
      {
        title: es ? `Cobro en ${c.cobroCurrency}` : `Cobro in ${c.cobroCurrency}`,
        body: es
          ? "Tu Mercado Pago / PayPal / Stripe. Docracy no se lleva el dinero. La suscripción sigue en USD $10/mes."
          : "Your Mercado Pago / PayPal / Stripe. Docracy never takes the money. The subscription stays USD $10/month.",
      },
    ],
    useCases: es
      ? [
          `Primer trabajo en EE. UU. al llegar de ${country} — I-9 el mismo día`,
          `Poder para alguien en ${city} — fírmalo aquí, apostilla en origen`,
          `Constancia para un depa sin W-2 + cobro si sigues facturando en ${country}`,
        ]
      : [
          `First US job after arriving from ${country} — I-9 on day one`,
          `POA for someone in ${city} — sign here, apostille at origin`,
          `Constancia for a lease without a W-2 + cobro if you still invoice in ${country}`,
        ],
    faqs: [
      {
        question: es ? `¿Apostillan documentos de ${country}?` : `Do you apostille ${country} documents?`,
        answer: es ? `No. ${officialNote} ${c.officialHref}` : `No. ${officialNote} ${c.officialHref}`,
      },
      {
        question: es
          ? "¿El paquete LATAM es un plan aparte?"
          : "Is the LATAM package a separate plan?",
        answer: es
          ? "No. Va incluido en la suscripción de USD $10/mes: I-9, extras de visa, vault, constancia y cobro. Stripe cobra en USD. Empieza en /es/kit-llegar-eeuu."
          : "No. It is included in the $10/month USD subscription: I-9, visa extras, vault, constancia, and cobro. Stripe bills USD. Start at /packets/latam-to-us.",
      },
      {
        question: es ? "¿URL en español?" : "Spanish URL?",
        answer: `https://docracy.io${c.esPath} — ${es ? "paquete" : "package"}: /es/kit-llegar-eeuu.`,
      },
    ],
    ctaLabel: es ? "Activar la suscripción LATAM — $10/mes" : "Start the LATAM subscription — $10/month",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: es ? "Paquete LATAM ($10)" : "LATAM package ($10)", to: "/packets/latam-to-us" },
      { label: apostille, to: c.officialHref },
      { label: es ? "Después de llegar" : "After arrival", to: "/after-arrival" },
      { label: es ? "Quién sube dónde" : "Who files where", to: "/who-files-where" },
      { label: es ? "Constancia / renta" : "Lease / constancia", to: "/immigrant-housing" },
      { label: es ? "Cobro" : "Cobro", to: "/cobro" },
      { label: es ? "Firmar I-9" : "Sign I-9", to: "/i-9" },
      { label: es ? "Acta" : "Acta", to: "/acta" },
      { label: es ? "Cita consular" : "Consular appointment", to: "/consular-appointment" },
    ],
  };
}

export function generatedCountryPages(locale: "en" | "es") {
  return GENERATED_COUNTRY_CORRIDORS.map((c) => countryFeaturePage(c, locale));
}
