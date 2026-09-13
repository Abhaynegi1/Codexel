#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, "../dist/index.js");

if (existsSync(distPath)) {
  await import(distPath);
} else {
  const srcPath = resolve(__dirname, "../src/index.ts");
  const child = spawn(
    process.execPath,
    ["--import", "tsx", srcPath, ...process.argv.slice(2)],
    {
      stdio: "inherit",
      env: process.env,
    }
  );
  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}
