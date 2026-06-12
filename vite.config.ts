import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleGenerateImage, handleImageProxy } from "./server/apiHandlers.js";

function aiApiPlugin(env: Record<string, string>) {
  const attachMiddleware = (server: any) => {
    server.middlewares.use(async (request: any, response: any, next: Function) => {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname === "/api/generate-image" && request.method === "POST") {
        let raw = "";
        let tooLarge = false;
        request.on("data", (chunk: Buffer) => {
          if (tooLarge) return;
          raw += chunk;
          if (raw.length > 10_000) {
            tooLarge = true;
            raw = "";
          }
        });
        request.on("end", async () => {
          if (tooLarge) {
            response.writeHead(413, { "Content-Type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: { message: "请求内容过大" } }));
            return;
          }
          let body = {};
          try {
            body = JSON.parse(raw || "{}");
          } catch {
            response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: { message: "请求内容不是有效 JSON" } }));
            return;
          }
          const result = await handleGenerateImage({ body, env });
          response.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8" });
          response.end(JSON.stringify(result.body));
        });
        return;
      }
      if (url.pathname === "/api/image-proxy" && request.method === "GET") {
        const result = await handleImageProxy({ token: url.searchParams.get("token"), env });
        if ("body" in result) {
          response.writeHead(result.status, { "Content-Type": "application/json; charset=utf-8" });
          response.end(JSON.stringify(result.body));
        } else {
          response.writeHead(200, { "Content-Type": result.contentType, "Cache-Control": "private, max-age=300" });
          response.end(result.bytes);
        }
        return;
      }
      next();
    });
  };
  return {
    name: "voice-canvas-ai-api",
    configureServer: attachMiddleware,
    configurePreviewServer: attachMiddleware,
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), aiApiPlugin(env)],
  };
});
