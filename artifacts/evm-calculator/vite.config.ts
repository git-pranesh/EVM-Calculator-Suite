import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import fs from "fs";

// Dev-only: serve public/foo/index.html when the URL is /foo/ (mirrors prod static hosts).
const publicDirectoryIndex = () => ({
  name: "public-directory-index",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use((req, res, next) => {
      if (!req.url) return next();
      const qIndex = req.url.indexOf("?");
      const pathname = qIndex >= 0 ? req.url.slice(0, qIndex) : req.url;
      const query = qIndex >= 0 ? req.url.slice(qIndex) : "";
      if (pathname === "/" || pathname.includes(".")) return next();
      const dirCandidate = path.resolve(
        import.meta.dirname,
        "public",
        "." + pathname.replace(/\/$/, ""),
        "index.html",
      );
      if (fs.existsSync(dirCandidate)) {
        if (pathname.endsWith("/")) {
          req.url = pathname + "index.html" + query;
        } else {
          res.writeHead(301, { Location: pathname + "/" + query });
          res.end();
          return;
        }
      }
      next();
    });
  },
});

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    publicDirectoryIndex(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
