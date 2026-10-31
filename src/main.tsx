import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SenseiGallery } from "./components/sensei/SenseiGallery";
import "../color-system.css";
import "./fonts.css";
import "./styles.css";
import "./workspace.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {import.meta.env.DEV &&
    new URLSearchParams(location.search).has("sensei-gallery") ? (
      <SenseiGallery />
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
