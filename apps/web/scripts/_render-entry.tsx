import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header";
import Footer from "../src/components/Footer";
import { LocaleProvider, type Locale } from "../src/lib/i18n";
import Landing from "../src/pages/Landing";
import FreeTemplates from "../src/pages/FreeTemplates";
import FreeTemplateDetail from "../src/pages/FreeTemplateDetail";
import Mcp from "../src/pages/Mcp";
import Ai from "../src/pages/Ai";
import EsignUeta from "../src/pages/EsignUeta";
import ElectronicSignatureGuide from "../src/pages/ElectronicSignatureGuide";
import About from "../src/pages/About";
import Pricing from "../src/pages/Pricing";
import Docs from "../src/pages/Docs";
import Imprint from "../src/pages/Imprint";
import Blog from "../src/pages/Blog";
import BlogPostDetail from "../src/pages/BlogPostDetail";
import Trust from "../src/pages/Trust";
import Dpa from "../src/pages/Dpa";
import Privacy from "../src/pages/Privacy";
import Terms from "../src/pages/Terms";
import Uptime from "../src/pages/Uptime";
import FeaturePage from "../src/pages/FeaturePage";
import AlternativePage from "../src/pages/AlternativePage";
import ExplainerPage from "../src/pages/ExplainerPage";
import ImportGuidePage from "../src/pages/ImportGuidePage";
import IndustryPage from "../src/pages/IndustryPage";
import SeoLandingTemplate from "../src/components/SeoLandingTemplate";
import { SEO_LANDING_PAGES } from "../src/lib/seoPages";

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
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/es/precios" element={<Pricing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/es/documentacion" element={<Docs />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/trust" element={<Trust />} />
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
          <Route path="/eversign-alternative" element={<AlternativePage slug="eversign-alternative" />} />
          <Route path="/es/alternativa-a-eversign" element={<AlternativePage slug="eversign-alternative" />} />
          <Route path="/docusign-alternative" element={<AlternativePage slug="docusign-alternative" />} />
          <Route path="/es/alternativa-a-docusign" element={<AlternativePage slug="docusign-alternative" />} />
          <Route path="/hellosign-alternative" element={<AlternativePage slug="hellosign-alternative" />} />
          <Route path="/es/alternativa-a-hellosign" element={<AlternativePage slug="hellosign-alternative" />} />
          <Route path="/pandadoc-alternative" element={<AlternativePage slug="pandadoc-alternative" />} />
          <Route path="/es/alternativa-a-pandadoc" element={<AlternativePage slug="pandadoc-alternative" />} />
          <Route path="/adobe-sign-alternative" element={<AlternativePage slug="adobe-sign-alternative" />} />
          <Route path="/es/alternativa-a-adobe-sign" element={<AlternativePage slug="adobe-sign-alternative" />} />
          <Route path="/import-from-docusign" element={<ImportGuidePage slug="docusign" />} />
          <Route path="/import-from-eversign" element={<ImportGuidePage slug="eversign" />} />
          <Route path="/import-from-hellosign" element={<ImportGuidePage slug="hellosign" />} />
          <Route path="/import-from-pandadoc" element={<ImportGuidePage slug="pandadoc" />} />
          <Route path="/import-from-adobe-sign" element={<ImportGuidePage slug="adobe-sign" />} />
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
          <Route path="/what-is-an-nda" element={<ExplainerPage slug="what-is-an-nda" />} />
          <Route path="/are-electronic-signatures-legal" element={<ExplainerPage slug="are-electronic-signatures-legal" />} />
          {SEO_LANDING_PAGES.map((page) => (
            <Route key={page.slug} path={`/${page.slug}`} element={<SeoLandingTemplate slug={page.slug} />} />
          ))}
        </Routes>
        <Footer />
      </MemoryRouter>
    </LocaleProvider>
  );
}

// Exposed for the bundled CJS output to call per-path (see prerender.mjs).
(globalThis as any).__renderPath = renderPath;
