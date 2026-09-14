import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import KeyboardLabPage from "./pages/KeyboardLabPage";
import MarkdownPage from "./pages/MarkdownPage";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/keyboardlab" element={<KeyboardLabPage />} />
      <Route path="/markdown" element={<MarkdownPage />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
