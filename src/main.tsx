import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  document.body.innerHTML =
    '<div style="padding:24px;font-family:system-ui">Missing #root — check index.html contains &lt;div id="root"&gt;&lt;/div&gt;</div>';
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
