import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");

  return {
    envDir: projectRoot,
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
    },
    define: {
      // Client-readable MVP gate (also set Netlify env ADMIN_PASSWORD for builds).
      "import.meta.env.ADMIN_PASSWORD": JSON.stringify(env.ADMIN_PASSWORD ?? ""),
    },
  };
});
