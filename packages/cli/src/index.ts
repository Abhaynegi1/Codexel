import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import pc from "picocolors";
import { runCliAnalysis } from "./analyzer-runner";
import { formatTerminalSummary } from "./formatters/terminal";
import { generateStandaloneHtml } from "./formatters/html";
import { startLocalViewerServer } from "./server";
import {
  ANALYZER_ENGINE_VERSION,
  CURRENT_SCHEMA_VERSION,
} from "@codexel/analyzer";

export * from "./analyzer-runner";
export * from "./formatters/terminal";
export * from "./formatters/html";
export * from "./server";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("codexel")
    .description("⚡ Deterministic Codebase Intelligence & Architecture Engine")
    .version("0.1.0");

  program
    .command("analyze [targetPath]")
    .description(
      "Analyze a local codebase and inspect its architecture, components, and design system",
    )
    .option(
      "-o, --output <path>",
      "Save JSON or HTML report to the specified file path",
    )
    .option("--json", "Output pure JSON repository model to stdout or file")
    .option("--html [path]", "Generate a self-contained standalone HTML report")
    .option(
      "--serve",
      "Launch a local interactive web viewer on localhost:3800",
    )
    .option("-p, --port <port>", "Port to use for local web viewer", "3800")
    .option(
      "--no-open",
      "Do not open browser automatically when launching server",
    )
    .option("--ci", "Run in CI mode with simplified non-interactive output")
    .action(async (targetPath = ".", options) => {
      const isCi = !!options.ci;
      const resolvedPath = path.resolve(process.cwd(), targetPath);

      if (!options.json && !isCi) {
        console.log(
          pc.cyan(`\n🔍 Analyzing codebase at: ${pc.bold(resolvedPath)}...\n`),
        );
      }

      try {
        const model = await runCliAnalysis({
          targetPath: resolvedPath,
          onProgress: (step) => {
            if (!options.json && !isCi) {
              console.log(pc.dim(`  ⚡ ${step}`));
            }
          },
        });

        // 1. JSON Export Mode
        if (options.json) {
          const jsonStr = JSON.stringify(model, null, 2);
          if (options.output) {
            const outPath = path.resolve(process.cwd(), options.output);
            await fs.writeFile(outPath, jsonStr, "utf-8");
            console.log(
              pc.green(`✔ JSON repository model written to: ${outPath}`),
            );
          } else {
            console.log(jsonStr);
          }
          return;
        }

        // 2. HTML Export Mode
        if (options.html !== undefined) {
          const htmlStr = generateStandaloneHtml(model);
          const defaultHtmlName = `${model.metadata.name}-codexel-report.html`;
          const htmlTarget =
            typeof options.html === "string" && options.html.length > 0
              ? options.html
              : options.output || defaultHtmlName;
          const outPath = path.resolve(process.cwd(), htmlTarget);
          await fs.writeFile(outPath, htmlStr, "utf-8");
          console.log(
            pc.green(
              `\n✔ Standalone HTML report generated: ${pc.bold(outPath)}`,
            ),
          );
        }

        // 3. Terminal Summary
        const summary = formatTerminalSummary(model, resolvedPath);
        console.log(summary);

        // 4. Output if specified without --json or --html
        if (options.output && options.html === undefined) {
          const outPath = path.resolve(process.cwd(), options.output);
          if (outPath.endsWith(".html")) {
            await fs.writeFile(outPath, generateStandaloneHtml(model), "utf-8");
            console.log(pc.green(`✔ HTML report saved to: ${outPath}`));
          } else {
            await fs.writeFile(
              outPath,
              JSON.stringify(model, null, 2),
              "utf-8",
            );
            console.log(pc.green(`✔ JSON report saved to: ${outPath}`));
          }
        }

        // 5. Local Web Viewer Server Mode
        if (options.serve) {
          const port = parseInt(options.port, 10) || 3800;
          console.log(
            pc.cyan(
              `\n🚀 Starting local interactive explorer at: ${pc.bold(`http://localhost:${port}`)}`,
            ),
          );
          console.log(pc.dim(`   Press Ctrl+C to stop server.\n`));

          const serverInstance = await startLocalViewerServer({
            model,
            port,
            open: options.open !== false,
          });

          // Keep process alive for user interaction
          await new Promise<void>(() => {});
        } else if (!isCi && options.html === undefined) {
          console.log(
            pc.dim(
              `💡 Tip: Run ${pc.cyan(`codexel analyze ${targetPath} --serve`)} to launch the local web viewer.`,
            ),
          );
          console.log(
            pc.dim(
              `💡 Tip: Run ${pc.cyan(`codexel analyze ${targetPath} --html`)} to generate a single-file HTML report.\n`,
            ),
          );
        }
      } catch (err: any) {
        console.error(pc.red(`\n❌ Analysis failed: ${err.message || err}\n`));
        process.exit(1);
      }
    });

  program
    .command("info")
    .description("Display Codexel CLI and analyzer engine versions")
    .action(() => {
      console.log(pc.cyan(`\n⚡ CODEXEL Code Intelligence Engine`));
      console.log(`  • CLI Version:             0.1.0`);
      console.log(`  • Analyzer Engine Version: ${ANALYZER_ENGINE_VERSION}`);
      console.log(`  • Schema Version:          ${CURRENT_SCHEMA_VERSION}`);
      console.log(`  • Node.js:                 ${process.version}`);
      console.log(
        `  • Platform:                ${process.platform} (${process.arch})\n`,
      );
    });

  return program;
}

// Auto-run when executed directly via CLI
if (typeof process !== "undefined" && process.argv && process.argv[1]) {
  const isDirectRun =
    process.argv[1].endsWith("codexel.js") ||
    process.argv[1].endsWith("index.ts");
  if (isDirectRun) {
    const program = createProgram();
    program.parse(process.argv);
  }
}
