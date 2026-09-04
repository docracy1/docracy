import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header";
import Footer from "../src/components/Footer";
import { LocaleProvider, type Locale } from "../src/lib/i18n";
import Landing from "../src/pages/Landing";
import HowItWorksWatch from "../src/pages/HowItWorksWatch";
import FreeTemplates from "../src/pages/FreeTemplates";
import FreeTemplateDetail from "../src/pages/FreeTemplateDetail";
import Mcp from "../src/pages/Mcp";
import Ai from "../src/pages/Ai";
import EsignUeta from "../src/pages/EsignUeta";
import ElectronicSignatureGuide from "../src/pages/ElectronicSignatureGuide";
import CreateDigitalSignature from "../src/pages/CreateDigitalSignature";
import AiContractAnalysis from "../src/pages/AiContractAnalysis";
import EsignatureSoftware from "../src/pages/EsignatureSoftware";
import SignPdfOnline from "../src/pages/SignPdfOnline";
import SecureElectronicSignature from "../src/pages/SecureElectronicSignature";
import FreeElectronicSignature from "../src/pages/FreeElectronicSignature";
import DocracyAlternative from "../src/pages/DocracyAlternative";
import TemplateMarketplace from "../src/pages/TemplateMarketplace";
import SubmitTemplate from "../src/pages/SubmitTemplate";
import About from "../src/pages/About";
import Pricing from "../src/pages/Pricing";
import Docs from "../src/pages/Docs";
import Imprint from "../src/pages/Imprint";
import Blog from "../src/pages/Blog";
import BlogPostDetail from "../src/pages/BlogPostDetail";
import Trust from "../src/pages/Trust";
import Verify from "../src/pages/Verify";
import ContractorPacket from "../src/pages/ContractorPacket";
import LatamContractorPacket from "../src/pages/LatamContractorPacket";
import JobPacket from "../src/pages/JobPacket";
import TaxYear from "../src/pages/TaxYear";
import Constancia from "../src/pages/Constancia";
import Cobro from "../src/pages/Cobro";
import LatamDesk from "../src/pages/LatamDesk";
import Dpa from "../src/pages/Dpa";
import Privacy from "../src/pages/Privacy";
import Terms from "../src/pages/Terms";
import Uptime from "../src/pages/Uptime";
import FeaturePage from "../src/pages/FeaturePage";
import AlternativePage from "../src/pages/AlternativePage";
import ExplainerPage from "../src/pages/ExplainerPage";
import ImportGuidePage from "../src/pages/ImportGuidePage";
import IndustryPage from "../src/pages/IndustryPage";
import PartnerPage from "../src/pages/PartnerPage";
import SeoLandingTemplate from "../src/components/SeoLandingTemplate";
import { SEO_LANDING_PAGES } from "../src/lib/seoPages";
import { PARTNER_PAGES } from "../src/lib/partnerPages";
import { ALTERNATIVE_PAGES, IMPORT_GUIDE_PAGES } from "../src/lib/marketingPages";

/** Renders the real app components to static markup for a single path — same components a
 *  browser gets, minus effects (which never run during static rendering, so Header's login-check
 *  fetch just stays in its default signed-out state, which is an accurate crawl-time snapshot).
 *  Pass `locale` so Spanish Phase 1 URLs prerender with the ES catalog.
 *  `/prepare` and `/es/preparar` stay client-only (pdf.js Vite `?url` import breaks the esbuild bundle). */
function renderPath(targetPath: string, locale: Locale = "en"): string {
  return renderToStaticMarkup(
    <LocaleProvider initialLocale={locale}>
      <MemoryRouter initialEntries={[targetPath]}>
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/es" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorksWatch />} />
          <Route path="/es/como-funciona" element={<HowItWorksWatch />} />
          <Route path="/free-templates" element={<FreeTemplates />} />
          <Route path="/es/plantillas-gratis" element={<FreeTemplates />} />
          <Route path="/free-templates/:slug" element={<FreeTemplateDetail />} />
          <Route path="/es/plantillas-gratis/:slug" element={<FreeTemplateDetail />} />
          <Route path="/mcp" element={<Mcp />} />
          <Route path="/es/mcp" element={<Mcp />} />
          <Route path="/ai" element={<Ai />} />
          <Route path="/es/ia" element={<Ai />} />
          <Route path="/esign-ueta" element={<EsignUeta />} />
          <Route path="/es/esign-ueta" element={<EsignUeta />} />
          <Route path="/electronic-signature-guide" element={<ElectronicSignatureGuide />} />
          <Route path="/create-a-digital-signature" element={<CreateDigitalSignature />} />
          <Route path="/es/crear-firma-digital" element={<CreateDigitalSignature />} />
          <Route path="/ai-contract-analysis" element={<AiContractAnalysis />} />
          <Route path="/es/analisis-de-contratos-ia" element={<AiContractAnalysis />} />
          <Route path="/esignature-software" element={<EsignatureSoftware />} />
          <Route path="/es/software-de-firma-electronica" element={<EsignatureSoftware />} />
          <Route path="/sign-pdf-online" element={<SignPdfOnline />} />
          <Route path="/es/firmar-pdf-en-linea" element={<SignPdfOnline />} />
          <Route path="/secure-electronic-signature" element={<SecureElectronicSignature />} />
          <Route path="/es/firma-electronica-segura" element={<SecureElectronicSignature />} />
          <Route path="/free-electronic-signature" element={<FreeElectronicSignature />} />
          <Route path="/es/firma-electronica-gratis" element={<FreeElectronicSignature />} />
          <Route path="/docracy-alternative" element={<DocracyAlternative />} />
          <Route path="/es/alternativa-a-docracy" element={<DocracyAlternative />} />
          <Route path="/template-marketplace" element={<TemplateMarketplace />} />
          <Route path="/es/marketplace-de-plantillas" element={<TemplateMarketplace />} />
          <Route path="/submit-template" element={<SubmitTemplate />} />
          <Route path="/es/enviar-plantilla" element={<SubmitTemplate />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/es/precios" element={<Pricing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/es/documentacion" element={<Docs />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/trust" element={<Trust />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/es/verificar" element={<Verify />} />
          <Route path="/packets/us-contractor" element={<ContractorPacket />} />
          <Route path="/es/kit-contratista" element={<ContractorPacket />} />
          <Route path="/packets/latam-contractor" element={<LatamContractorPacket />} />
          <Route path="/es/kit-contratista-latam" element={<LatamContractorPacket />} />
          <Route path="/packets/trades" element={<JobPacket packetId="trades" />} />
          <Route path="/es/kit-oficios" element={<JobPacket packetId="trades" />} />
          <Route path="/packets/latam-trade" element={<JobPacket packetId="latam-trade" />} />
          <Route path="/es/kit-comercio" element={<JobPacket packetId="latam-trade" />} />
          <Route path="/packets/collect" element={<JobPacket packetId="collect" />} />
          <Route path="/es/pide-documentos" element={<JobPacket packetId="collect" />} />
          <Route path="/1099-season" element={<TaxYear />} />
          <Route path="/es/temporada-1099" element={<TaxYear />} />
          <Route path="/income-proof" element={<Constancia />} />
          <Route path="/es/constancia" element={<Constancia />} />
          <Route path="/cobro" element={<Cobro />} />
          <Route path="/es/cobro" element={<Cobro />} />
          <Route path="/latam" element={<LatamDesk />} />
          <Route path="/es/latam" element={<LatamDesk />} />
          <Route path="/dpa" element={<Dpa />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/uptime" element={<Uptime />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostDetail />} />
          <Route path="/simple-agreements" element={<FeaturePage slug="simple-agreements" />} />
          <Route path="/nda-signing" element={<FeaturePage slug="nda-signing" />} />
          <Route path="/es/firma-de-nda" element={<FeaturePage slug="nda-signing" />} />
          <Route path="/client-contracts" element={<FeaturePage slug="client-contracts" />} />
          <Route path="/es/contratos-con-clientes" element={<FeaturePage slug="client-contracts" />} />
          <Route path="/onboarding-documents" element={<FeaturePage slug="onboarding-documents" />} />
          <Route path="/vendor-agreements" element={<FeaturePage slug="vendor-agreements" />} />
          <Route path="/compliance-documentation" element={<FeaturePage slug="compliance-documentation" />} />
          <Route path="/whatsapp-signing" element={<FeaturePage slug="whatsapp-signing" />} />
          <Route path="/advanced-electronic-signature" element={<FeaturePage slug="advanced-electronic-signature" />} />
          <Route path="/artist-contracts" element={<FeaturePage slug="artist-contracts" />} />
          <Route path="/creative-licensing" element={<FeaturePage slug="creative-licensing" />} />
          <Route path="/music-collaboration-contracts" element={<FeaturePage slug="music-collaboration-contracts" />} />
          <Route path="/freelancer-contracts" element={<FeaturePage slug="freelancer-contracts" />} />
          <Route path="/web-design-contract" element={<FeaturePage slug="web-design-contract" />} />
          <Route path="/developer-contracts" element={<FeaturePage slug="developer-contracts" />} />
          <Route path="/llc-legal-templates" element={<FeaturePage slug="llc-legal-templates" />} />
          <Route path="/startup-legal-templates" element={<FeaturePage slug="startup-legal-templates" />} />
          <Route path="/founder-agreement" element={<FeaturePage slug="founder-agreement" />} />
          <Route path="/seo-agency-contract" element={<FeaturePage slug="seo-agency-contract" />} />
          <Route path="/marketing-service-agreement" element={<FeaturePage slug="marketing-service-agreement" />} />
          <Route path="/education-forms" element={<FeaturePage slug="education-forms" />} />
          <Route path="/student-agreements" element={<FeaturePage slug="student-agreements" />} />
          <Route path="/import-google-doc" element={<FeaturePage slug="import-google-doc" />} />
          <Route path="/anonymous-signing" element={<FeaturePage slug="anonymous-signing" />} />
          <Route path="/quick-sign" element={<FeaturePage slug="quick-sign" />} />
          <Route path="/upload-and-sign" element={<FeaturePage slug="upload-and-sign" />} />
          <Route path="/simple-signing" element={<FeaturePage slug="simple-signing" />} />
          <Route path="/document-verification" element={<FeaturePage slug="document-verification" />} />
          <Route path="/blockchain-timestamp" element={<FeaturePage slug="blockchain-timestamp" />} />
          <Route path="/whatsapp-invoice" element={<FeaturePage slug="whatsapp-invoice" />} />
          <Route path="/es/factura-whatsapp" element={<FeaturePage slug="whatsapp-invoice" />} />
          <Route path="/1099-contractor-records" element={<FeaturePage slug="1099-contractor-records" />} />
          <Route path="/es/registros-1099" element={<FeaturePage slug="1099-contractor-records" />} />
          <Route path="/hire-contractor-abroad" element={<FeaturePage slug="hire-contractor-abroad" />} />
          <Route path="/es/contratar-en-el-extranjero" element={<FeaturePage slug="hire-contractor-abroad" />} />
          <Route path="/proof-of-income" element={<FeaturePage slug="proof-of-income" />} />
          <Route path="/es/prueba-de-ingresos" element={<FeaturePage slug="proof-of-income" />} />
          <Route path="/signed-work-order" element={<FeaturePage slug="signed-work-order" />} />
          <Route path="/es/orden-de-trabajo-firmada" element={<FeaturePage slug="signed-work-order" />} />
          <Route path="/contractor-payment-proof" element={<FeaturePage slug="contractor-payment-proof" />} />
          <Route path="/es/comprobante-pago-contratistas" element={<FeaturePage slug="contractor-payment-proof" />} />
          <Route path="/latam-export-documents" element={<FeaturePage slug="latam-export-documents" />} />
          <Route path="/es/documentos-exportacion" element={<FeaturePage slug="latam-export-documents" />} />
          <Route path="/request-w9" element={<FeaturePage slug="request-w9" />} />
          <Route path="/es/pedir-w9" element={<FeaturePage slug="request-w9" />} />
          {ALTERNATIVE_PAGES.map((p) => (
            <Route key={p.slug} path={`/${p.slug}`} element={<AlternativePage slug={p.slug} />} />
          ))}
          <Route path="/es/alternativa-a-eversign" element={<AlternativePage slug="eversign-alternative" />} />
          <Route path="/es/alternativa-a-docusign" element={<AlternativePage slug="docusign-alternative" />} />
          <Route path="/es/alternativa-a-hellosign" element={<AlternativePage slug="hellosign-alternative" />} />
          <Route path="/es/alternativa-a-pandadoc" element={<AlternativePage slug="pandadoc-alternative" />} />
          <Route path="/es/alternativa-a-adobe-sign" element={<AlternativePage slug="adobe-sign-alternative" />} />
          {IMPORT_GUIDE_PAGES.map((p) => (
            <Route key={p.slug} path={`/import-from-${p.slug}`} element={<ImportGuidePage slug={p.slug} />} />
          ))}
          <Route path="/industry/freelancers" element={<IndustryPage slug="freelancers" />} />
          <Route path="/industry/creative-agencies" element={<IndustryPage slug="creative-agencies" />} />
          <Route path="/industry/real-estate" element={<IndustryPage slug="real-estate" />} />
          <Route path="/industry/construction" element={<IndustryPage slug="construction" />} />
          <Route path="/industry/small-business" element={<IndustryPage slug="small-business" />} />
          <Route path="/industry/hr" element={<IndustryPage slug="hr" />} />
          <Route path="/industry/legal" element={<IndustryPage slug="legal" />} />
          <Route path="/industry/sales" element={<IndustryPage slug="sales" />} />
          <Route path="/industry/recruiting" element={<IndustryPage slug="recruiting" />} />
          <Route path="/industry/consulting" element={<IndustryPage slug="consulting" />} />
          <Route path="/industry/developers" element={<IndustryPage slug="developers" />} />
          <Route path="/industry/startups" element={<IndustryPage slug="startups" />} />
          <Route path="/industry/photographers" element={<IndustryPage slug="photographers" />} />
          <Route path="/industry/personal" element={<IndustryPage slug="personal" />} />
          <Route path="/what-is-an-nda" element={<ExplainerPage slug="what-is-an-nda" />} />
          <Route path="/are-electronic-signatures-legal" element={<ExplainerPage slug="are-electronic-signatures-legal" />} />
          <Route path="/ueta-electronic-signature" element={<ExplainerPage slug="ueta-electronic-signature" />} />
          <Route path="/docracy-ueta-compliance" element={<ExplainerPage slug="docracy-ueta-compliance" />} />
          {SEO_LANDING_PAGES.map((page) => (
            <Route key={page.slug} path={`/${page.slug}`} element={<SeoLandingTemplate slug={page.slug} />} />
          ))}
          {PARTNER_PAGES.map((page) => (
            <Route key={page.slug} path={`/for/${page.slug}`} element={<PartnerPage slug={page.slug} />} />
          ))}
        </Routes>
        <Footer />
      </MemoryRouter>
    </LocaleProvider>
  );
}

// Exposed for the bundled CJS output to call per-path (see prerender.mjs).
(globalThis as any).__renderPath = renderPath;
