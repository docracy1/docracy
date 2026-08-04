import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./theme.css";
import RootErrorBoundary from "./components/RootErrorBoundary";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import CookieConsentBanner from "./components/CookieConsentBanner";
import Landing from "./pages/Landing";
import Prepare from "./pages/Prepare";
import PrepareSent from "./pages/PrepareSent";
import Sign from "./pages/Sign";
import EmbedSign from "./pages/EmbedSign";
import BulkSend from "./pages/BulkSend";
import Status from "./pages/Status";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Trust from "./pages/Trust";
import Dpa from "./pages/Dpa";
import Login from "./pages/Login";
import AuthVerify from "./pages/AuthVerify";
import Dashboard from "./pages/Dashboard";
import TeamAccept from "./pages/TeamAccept";
import FreeTemplates from "./pages/FreeTemplates";
import FreeTemplateDetail from "./pages/FreeTemplateDetail";
import Mcp from "./pages/Mcp";
import AdminAnalytics from "./pages/AdminAnalytics";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";
import Roadmap from "./pages/Roadmap";
import Imprint from "./pages/Imprint";
import Uptime from "./pages/Uptime";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import FeaturePage from "./pages/FeaturePage";
import AlternativePage from "./pages/AlternativePage";
import ExplainerPage from "./pages/ExplainerPage";
import ImportGuidePage from "./pages/ImportGuidePage";
import IndustryPage from "./pages/IndustryPage";
import OutreachLanding from "./pages/OutreachLanding";
import NotFound from "./pages/NotFound";
import { ShortGoRedirect, ShortNdaRedirect, ShortPriceRedirect, ShortTryRedirect } from "./pages/ShortLinkRedirect";
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
      <Route path="/go/:campaign" element={<ShortGoRedirect />} />
      <Route path="/prepare" element={<Prepare />} />
      <Route path="/es/preparar" element={<Prepare />} />
      <Route path="/prepare/sent" element={<PrepareSent />} />
      <Route path="/sign/:token" element={<Sign />} />
      <Route path="/status/:token" element={<Status />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/trust" element={<Trust />} />
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
      <Route path="/outreach/:persona" element={<OutreachLanding />} />
      <Route path="/what-is-an-nda" element={<ExplainerPage slug="what-is-an-nda" />} />
      <Route path="/are-electronic-signatures-legal" element={<ExplainerPage slug="are-electronic-signatures-legal" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LocaleProvider>
      <BrowserRouter>
        <RootErrorBoundary>
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
                  <ChatWidget />
                  <CookieConsentBanner />
                </>
              }
            />
          </Routes>
        </RootErrorBoundary>
      </BrowserRouter>
    </LocaleProvider>
  </React.StrictMode>
);
