import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./theme.css";
import RootErrorBoundary from "./components/RootErrorBoundary";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import Landing from "./pages/Landing";
import Prepare from "./pages/Prepare";
import PrepareSent from "./pages/PrepareSent";
import Sign from "./pages/Sign";
import EmbedSign from "./pages/EmbedSign";
import BulkSend from "./pages/BulkSend";
import Status from "./pages/Status";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
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
import Imprint from "./pages/Imprint";
import Uptime from "./pages/Uptime";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import FeaturePage from "./pages/FeaturePage";
import AlternativePage from "./pages/AlternativePage";
import ExplainerPage from "./pages/ExplainerPage";
import NotFound from "./pages/NotFound";
import { ShortGoRedirect, ShortNdaRedirect, ShortPriceRedirect, ShortTryRedirect } from "./pages/ShortLinkRedirect";
import { captureAttribution } from "./lib/attribution";

// Before first render so the first funnel event already carries the channel that brought them.
captureAttribution();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/try" element={<ShortTryRedirect />} />
      <Route path="/nda" element={<ShortNdaRedirect />} />
      <Route path="/price" element={<ShortPriceRedirect />} />
      <Route path="/go/:campaign" element={<ShortGoRedirect />} />
      <Route path="/prepare" element={<Prepare />} />
      <Route path="/prepare/sent" element={<PrepareSent />} />
      <Route path="/sign/:token" element={<Sign />} />
      <Route path="/status/:token" element={<Status />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/verify" element={<AuthVerify />} />
      <Route path="/team/accept" element={<TeamAccept />} />
      <Route path="/free-templates" element={<FreeTemplates />} />
      <Route path="/free-templates/:slug" element={<FreeTemplateDetail />} />
      <Route path="/mcp" element={<Mcp />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/bulk-send" element={<BulkSend />} />
      <Route path="/about" element={<About />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/imprint" element={<Imprint />} />
      <Route path="/uptime" element={<Uptime />} />
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
      <Route path="/hellosign-alternative" element={<AlternativePage slug="hellosign-alternative" />} />
      <Route path="/pandadoc-alternative" element={<AlternativePage slug="pandadoc-alternative" />} />
      <Route path="/adobe-sign-alternative" element={<AlternativePage slug="adobe-sign-alternative" />} />
      <Route path="/what-is-an-nda" element={<ExplainerPage slug="what-is-an-nda" />} />
      <Route path="/are-electronic-signatures-legal" element={<ExplainerPage slug="are-electronic-signatures-legal" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RootErrorBoundary>
        <Routes>
          <Route path="/embed/sign/:token" element={<EmbedSign />} />
          <Route
            path="*"
            element={
              <>
                <Header />
                <AppRoutes />
                <Footer />
                <ChatWidget />
              </>
            }
          />
        </Routes>
      </RootErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
