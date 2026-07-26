import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header";
import Footer from "../src/components/Footer";
import Landing from "../src/pages/Landing";
import FreeTemplates from "../src/pages/FreeTemplates";
import FreeTemplateDetail from "../src/pages/FreeTemplateDetail";
import Mcp from "../src/pages/Mcp";
import About from "../src/pages/About";
import Pricing from "../src/pages/Pricing";
import Docs from "../src/pages/Docs";
import Imprint from "../src/pages/Imprint";
import Blog from "../src/pages/Blog";
import BlogPostDetail from "../src/pages/BlogPostDetail";
import FeaturePage from "../src/pages/FeaturePage";
import AlternativePage from "../src/pages/AlternativePage";
import ExplainerPage from "../src/pages/ExplainerPage";

/** Renders the real app components to static markup for a single path — same components a
 *  browser gets, minus effects (which never run during static rendering, so Header's login-check
 *  fetch just stays in its default signed-out state, which is an accurate crawl-time snapshot). */
function renderPath(targetPath: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[targetPath]}>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/free-templates" element={<FreeTemplates />} />
        <Route path="/free-templates/:slug" element={<FreeTemplateDetail />} />
        <Route path="/mcp" element={<Mcp />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/imprint" element={<Imprint />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostDetail />} />
        <Route path="/simple-agreements" element={<FeaturePage slug="simple-agreements" />} />
        <Route path="/nda-signing" element={<FeaturePage slug="nda-signing" />} />
        <Route path="/client-contracts" element={<FeaturePage slug="client-contracts" />} />
        <Route path="/onboarding-documents" element={<FeaturePage slug="onboarding-documents" />} />
        <Route path="/vendor-agreements" element={<FeaturePage slug="vendor-agreements" />} />
        <Route path="/compliance-documentation" element={<FeaturePage slug="compliance-documentation" />} />
        <Route path="/eversign-alternative" element={<AlternativePage slug="eversign-alternative" />} />
        <Route path="/docusign-alternative" element={<AlternativePage slug="docusign-alternative" />} />
        <Route path="/what-is-an-nda" element={<ExplainerPage slug="what-is-an-nda" />} />
        <Route path="/are-electronic-signatures-legal" element={<ExplainerPage slug="are-electronic-signatures-legal" />} />
      </Routes>
      <Footer />
    </MemoryRouter>
  );
}

// Exposed for the bundled CJS output to call per-path (see prerender.mjs).
(globalThis as any).__renderPath = renderPath;
