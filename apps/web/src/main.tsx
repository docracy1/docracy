import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./theme.css";
import RootErrorBoundary from "./components/RootErrorBoundary";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import CookieConsentBanner from "./components/CookieConsentBanner";
import MobilePricingBar from "./components/MobilePricingBar";
// Landing stays eager — it's the single most-visited route, and lazy-loading it would add a
// chunk-fetch roundtrip before the homepage can render at all. Every other route is fetched
// on demand instead of shipping its code (pdf-lib, pdfjs, admin analytics, every SEO page, etc.)
// to visitors who never touch it. Prerendering (scripts/_render-entry.tsx) is a separate,
// eagerly-imported esbuild bundle unaffected by any of this.
import Landing from "./pages/Landing";
const Prepare = lazy(() => import("./pages/Prepare"));
const PrepareSent = lazy(() => import("./pages/PrepareSent"));
const Sign = lazy(() => import("./pages/Sign"));
const EmbedSign = lazy(() => import("./pages/EmbedSign"));
const BulkSend = lazy(() => import("./pages/BulkSend"));
const Status = lazy(() => import("./pages/Status"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Trust = lazy(() => import("./pages/Trust"));
const Verify = lazy(() => import("./pages/Verify"));
const Dpa = lazy(() => import("./pages/Dpa"));
const Login = lazy(() => import("./pages/Login"));
const AuthVerify = lazy(() => import("./pages/AuthVerify"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TeamAccept = lazy(() => import("./pages/TeamAccept"));
const FreeTemplates = lazy(() => import("./pages/FreeTemplates"));
const FreeTemplateDetail = lazy(() => import("./pages/FreeTemplateDetail"));
const Mcp = lazy(() => import("./pages/Mcp"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const About = lazy(() => import("./pages/About"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Ai = lazy(() => import("./pages/Ai"));
const EsignUeta = lazy(() => import("./pages/EsignUeta"));
const ElectronicSignatureGuide = lazy(() => import("./pages/ElectronicSignatureGuide"));
const CreateDigitalSignature = lazy(() => import("./pages/CreateDigitalSignature"));
const AiContractAnalysis = lazy(() => import("./pages/AiContractAnalysis"));
const Developers = lazy(() => import("./pages/Developers"));
const AiContractDrafting = lazy(() => import("./pages/AiContractDrafting"));
const Enterprise = lazy(() => import("./pages/Enterprise"));
const IntegrationsAiAssistants = lazy(() => import("./pages/IntegrationsAiAssistants"));
const EsignatureSoftware = lazy(() => import("./pages/EsignatureSoftware"));
const SignPdfOnline = lazy(() => import("./pages/SignPdfOnline"));
const SecureElectronicSignature = lazy(() => import("./pages/SecureElectronicSignature"));
const FreeElectronicSignature = lazy(() => import("./pages/FreeElectronicSignature"));
const DocracyAlternative = lazy(() => import("./pages/DocracyAlternative"));
const TemplateMarketplace = lazy(() => import("./pages/TemplateMarketplace"));
const SubmitTemplate = lazy(() => import("./pages/SubmitTemplate"));
const Docs = lazy(() => import("./pages/Docs"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Imprint = lazy(() => import("./pages/Imprint"));
const Uptime = lazy(() => import("./pages/Uptime"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostDetail = lazy(() => import("./pages/BlogPostDetail"));
const FeaturePage = lazy(() => import("./pages/FeaturePage"));
const AlternativePage = lazy(() => import("./pages/AlternativePage"));
const ExplainerPage = lazy(() => import("./pages/ExplainerPage"));
const ImportGuidePage = lazy(() => import("./pages/ImportGuidePage"));
const IndustryPage = lazy(() => import("./pages/IndustryPage"));
const PartnerPage = lazy(() => import("./pages/PartnerPage"));
const OutreachLanding = lazy(() => import("./pages/OutreachLanding"));
import NotFound from "./pages/NotFound";
const SeoLandingTemplate = lazy(() => import("./components/SeoLandingTemplate"));
import { SEO_LANDING_PAGES } from "./lib/seoPages";
import { PARTNER_PAGES } from "./lib/partnerPages";
import { ALTERNATIVE_PAGES, IMPORT_GUIDE_PAGES } from "./lib/marketingPages";
import {
  ShortGoRedirect,
  ShortMarketplaceRedirect,
  ShortNdaRedirect,
  ShortPriceRedirect,
  ShortSubmitRedirect,
  ShortTryRedirect,
} from "./pages/ShortLinkRedirect";
import { captureAttribution } from "./lib/attribution";
import { LocaleProvider } from "./lib/i18n";
import LocalePathSync from "./components/LocalePathSync";

// Before first render so the first funnel event already carries the channel that brought them.
captureAttribution();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/es" element={<Landing />} />
      <Route path="/try" element={<ShortTryRedirect />} />
      <Route path="/nda" element={<ShortNdaRedirect />} />
      <Route path="/price" element={<ShortPriceRedirect />} />
      <Route path="/submit" element={<ShortSubmitRedirect />} />
      <Route path="/marketplace" element={<ShortMarketplaceRedirect />} />
      <Route path="/go/:campaign" element={<ShortGoRedirect />} />
      <Route path="/prepare" element={<Prepare />} />
      <Route path="/es/preparar" element={<Prepare />} />
      <Route path="/prepare/sent" element={<PrepareSent />} />
      <Route path="/sign/:token" element={<Sign />} />
      <Route path="/status/:token" element={<Status />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/trust" element={<Trust />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/dpa" element={<Dpa />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/verify" element={<AuthVerify />} />
      <Route path="/team/accept" element={<TeamAccept />} />
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
      <Route path="/developers" element={<Developers />} />
      <Route path="/es/desarrolladores" element={<Developers />} />
      <Route path="/solutions/ai-contract-drafting" element={<AiContractDrafting />} />
      <Route path="/es/soluciones/redaccion-contratos-ia" element={<AiContractDrafting />} />
      <Route path="/enterprise" element={<Enterprise />} />
      <Route path="/es/empresas" element={<Enterprise />} />
      <Route path="/integrations/ai-assistants" element={<IntegrationsAiAssistants />} />
      <Route path="/es/integraciones/asistentes-ia" element={<IntegrationsAiAssistants />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/bulk-send" element={<BulkSend />} />
      <Route path="/about" element={<About />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/es/precios" element={<Pricing />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="/es/documentacion" element={<Docs />} />
      <Route path="/imprint" element={<Imprint />} />
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
      <Route path="/outreach/:persona" element={<OutreachLanding />} />
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LocaleProvider>
      <BrowserRouter>
        <RootErrorBoundary>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/embed/sign/:token" element={<EmbedSign />} />
              <Route
                path="*"
                element={
                  <>
                    <LocalePathSync />
                    <Header />
                    <AppRoutes />
                    <Footer />
                    <MobilePricingBar />
                    <ChatWidget />
                    <CookieConsentBanner />
                  </>
                }
              />
            </Routes>
          </Suspense>
        </RootErrorBoundary>
      </BrowserRouter>
    </LocaleProvider>
  </React.StrictMode>
);
