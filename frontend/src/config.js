// Centralized frontend configuration
// Computes API base URL with sensible fallbacks for development and production

// Note: In development with CRA, leaving API_BASE empty and adding
// a "proxy" in package.json enables relative "/api" calls without CORS issues.

const envBackendUrl = process.env.REACT_APP_BACKEND_URL 
  ? String(process.env.REACT_APP_BACKEND_URL).trim()
  : "";

function inferApiBaseFromWindow() {
  if (typeof window === "undefined") {
    return "";
  }
  const { origin, port } = window.location;
  // If running CRA dev server on port 3000 and no env override, prefer proxy
  if (!envBackendUrl && (port === "3000" || origin.includes(":3000"))) {
    return ""; // use package.json proxy with relative "/api" calls
  }
  return origin;
}

export const API_BASE = envBackendUrl || inferApiBaseFromWindow();

