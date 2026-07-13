import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./theme.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Prepare from "./pages/Prepare";
import PrepareSent from "./pages/PrepareSent";
import Sign from "./pages/Sign";
import Status from "./pages/Status";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import AuthVerify from "./pages/AuthVerify";
import Dashboard from "./pages/Dashboard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/prepare" element={<Prepare />} />
        <Route path="/prepare/sent" element={<PrepareSent />} />
        <Route path="/sign/:token" element={<Sign />} />
        <Route path="/status/:token" element={<Status />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/verify" element={<AuthVerify />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  </React.StrictMode>
);
