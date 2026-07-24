import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header";
import Footer from "../src/components/Footer";
import FreeTemplates from "../src/pages/FreeTemplates";
import FreeTemplateDetail from "../src/pages/FreeTemplateDetail";
import Mcp from "../src/pages/Mcp";
import About from "../src/pages/About";
import Pricing from "../src/pages/Pricing";
import Docs from "../src/pages/Docs";
import Imprint from "../src/pages/Imprint";
import Blog from "../src/pages/Blog";
import BlogPostDetail from "../src/pages/BlogPostDetail";

/** Renders the real app components to static markup for a single path — same components a
 *  browser gets, minus effects (which never run during static rendering, so Header's login-check
 *  fetch just stays in its default signed-out state, which is an accurate crawl-time snapshot). */
function renderPath(targetPath: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[targetPath]}>
      <Header />
      <Routes>
        <Route path="/free-templates" element={<FreeTemplates />} />
        <Route path="/free-templates/:slug" element={<FreeTemplateDetail />} />
        <Route path="/mcp" element={<Mcp />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/imprint" element={<Imprint />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostDetail />} />
      </Routes>
      <Footer />
    </MemoryRouter>
  );
}

// Exposed for the bundled CJS output to call per-path (see prerender.mjs).
(globalThis as any).__renderPath = renderPath;
