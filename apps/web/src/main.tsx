import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./theme.css";
import Header from "./components/Header";
import Landing from "./pages/Landing";
import Prepare from "./pages/Prepare";
import PrepareSent from "./pages/PrepareSent";
import Sign from "./pages/Sign";
import Status from "./pages/Status";

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
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
