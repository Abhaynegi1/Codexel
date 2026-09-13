import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import http from "node:http";
import { runCliAnalysis } from "../src/analyzer-runner";
import { formatTerminalSummary } from "../src/formatters/terminal";
import { generateStandaloneHtml } from "../src/formatters/html";
import { startLocalViewerServer } from "../src/server";
import { createProgram } from "../src/index";

describe("Codexel CLI Engine", () => {
  const targetDir = path.resolve(__dirname, "../../shared");

  it("should create Commander program with expected commands", () => {
    const program = createProgram();
    expect(program.name()).toBe("codexel");
    const commands = program.commands.map((c) => c.name());
    expect(commands).toContain("analyze");
    expect(commands).toContain("info");
  });

  it("should analyze a local target directory and return structured RepositoryModel", async () => {
    const model = await runCliAnalysis({
      targetPath: targetDir,
    });

    expect(model).toBeDefined();
    expect(model.schemaVersion).toBeDefined();
    expect(model.metadata.name).toBe("shared");
    expect(model.fileSystem.totalFiles).toBeGreaterThan(0);
    expect(model.technologyStack).toBeDefined();
    expect(model.analysisStats.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("should format rich terminal summary with all essential sections", async () => {
    const model = await runCliAnalysis({ targetPath: targetDir });
    const output = formatTerminalSummary(model, targetDir);

    expect(output).toContain("CODEXEL");
    expect(output).toContain("FILESYSTEM & REPOSITORY METRICS");
    expect(output).toContain("TECHNOLOGY STACK");
    expect(output).toContain("ARCHITECTURE & ROUTES");
    expect(output).toContain("PERFORMANCE & TIMINGS");
  });

  it("should generate self-contained standalone HTML report with embedded model data", async () => {
    const model = await runCliAnalysis({ targetPath: targetDir });
    const html = generateStandaloneHtml(model);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Codexel Analysis — shared");
    expect(html).toContain("MODEL_DATA =");
    expect(html).toContain("Component Explorer");
    expect(html).toContain("Design System");
    expect(html).toContain("Raw Model");
  });

  it("should start local web viewer server and respond to HTTP and API requests", async () => {
    const model = await runCliAnalysis({ targetPath: targetDir });
    const testPort = 3899;

    const serverInstance = await startLocalViewerServer({
      model,
      port: testPort,
      open: false,
    });

    expect(serverInstance.url).toBe(`http://localhost:${testPort}`);

    // Test GET /
    const htmlResponse = await makeHttpGet(`http://localhost:${testPort}/`);
    expect(htmlResponse.status).toBe(200);
    expect(htmlResponse.headers["content-type"]).toContain("text/html");
    expect(htmlResponse.body).toContain("Codexel");

    // Test GET /api/model
    const modelResponse = await makeHttpGet(
      `http://localhost:${testPort}/api/model`,
    );
    expect(modelResponse.status).toBe(200);
    expect(modelResponse.headers["content-type"]).toContain("application/json");
    const jsonBody = JSON.parse(modelResponse.body);
    expect(jsonBody.metadata.name).toBe("shared");

    // Test GET /api/health
    const healthResponse = await makeHttpGet(
      `http://localhost:${testPort}/api/health`,
    );
    expect(healthResponse.status).toBe(200);
    expect(JSON.parse(healthResponse.body).status).toBe("ok");

    // Clean up server
    await serverInstance.close();
  });
});

function makeHttpGet(urlStr: string): Promise<{
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    http
      .get(urlStr, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: data,
          });
        });
      })
      .on("error", reject);
  });
}
