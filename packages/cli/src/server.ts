import http from "node:http";
import { exec } from "node:child_process";
import type { RepositoryModel } from "@codexel/shared";
import { generateStandaloneHtml } from "./formatters/html";

export interface StartServerOptions {
  model: RepositoryModel;
  port?: number;
  open?: boolean;
}

export interface ServerInstance {
  server: http.Server;
  port: number;
  url: string;
  close: () => Promise<void>;
}

export async function startLocalViewerServer(
  options: StartServerOptions,
): Promise<ServerInstance> {
  const port = options.port || 3800;
  const htmlContent = generateStandaloneHtml(options.model);
  const jsonContent = JSON.stringify(options.model, null, 2);

  const server = http.createServer((req, res) => {
    const url = req.url || "/";

    // Enable CORS for API consumption if needed
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url === "/api/model") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(jsonContent);
      return;
    }

    if (url === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "ok", name: options.model.metadata.name }),
      );
      return;
    }

    // Default: serve the interactive single-page dashboard
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlContent);
  });

  return new Promise((resolve, reject) => {
    server.on("error", (err) => {
      reject(err);
    });

    server.listen(port, () => {
      const serverUrl = `http://localhost:${port}`;
      if (options.open) {
        openBrowser(serverUrl);
      }

      resolve({
        server,
        port,
        url: serverUrl,
        close: () =>
          new Promise((resClose, rejClose) => {
            server.close((err) => (err ? rejClose(err) : resClose()));
          }),
      });
    });
  });
}

export function openBrowser(url: string): void {
  const platform = process.platform;
  let command = "";

  if (platform === "win32") {
    command = `start "" "${url}"`;
  } else if (platform === "darwin") {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  exec(command, () => {
    // Ignore browser open errors silently (e.g. headless/CI environments)
  });
}
