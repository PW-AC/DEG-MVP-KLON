import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");
// Ensure in-app portal container exists for overlays/tooltips
let portalRoot = document.getElementById("app-portal-root");
if (!portalRoot) {
  portalRoot = document.createElement("div");
  portalRoot.id = "app-portal-root";
  rootElement.appendChild(portalRoot);
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
