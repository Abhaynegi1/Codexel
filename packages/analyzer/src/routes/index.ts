import path from "node:path";
import type { RouteInventory, RouteEntry, FileMetadata } from "@codexel/shared";
import { RouteInventorySchema } from "@codexel/shared";
import type { FileAstSummary } from "../parsers/ast-walker";

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH"] as const);

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * Normalizes an App Router folder path into a clean URL path:
 * - Strips route groups like `(auth)`
 * - Replaces empty with `/`
 */
function normalizeAppRoute(relSubdir: string): string {
  if (!relSubdir || relSubdir === ".") {
    return "/";
  }

  const segments = relSubdir
    .replace(/\\/g, "/")
    .split("/")
    .filter((s) => s.length > 0 && !s.startsWith("(") && !s.endsWith(")"));

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

/**
 * Normalizes a Pages Router file path into a clean URL path.
 */
function normalizePagesRoute(relPathWithoutExt: string): string {
  const normalized = relPathWithoutExt.replace(/\\/g, "/");
  if (normalized === "index") {
    return "/";
  }
  if (normalized.endsWith("/index")) {
    return `/${normalized.slice(0, -"/index".length)}`;
  }
  return `/${normalized}`;
}

/**
 * Discovers routing entry points (Next.js App router, Pages router, API routes) across files.
 */
export function detectRoutes(
  files: FileMetadata[],
  astSummaries?: Map<string, FileAstSummary>,
): RouteInventory {
  const routes: RouteEntry[] = [];
  let hasAppRouter = false;
  let hasPagesRouter = false;

  // Regex patterns for Next.js routing
  const appRouteRegex = /(?:^|\/)app\/(.*\/)?(page|layout|route)\.(tsx|jsx|js|ts)$/i;
  const pagesRouteRegex = /(?:^|\/)pages\/(.*)\.(tsx|jsx|js|ts)$/i;

  for (const file of files) {
    const normPath = file.path.replace(/\\/g, "/");

    // 1. Next.js App Router Check
    const appMatch = normPath.match(appRouteRegex);
    if (appMatch) {
      hasAppRouter = true;
      const subDir = appMatch[1] ? appMatch[1].replace(/\/$/, "") : "";
      const fileType = appMatch[2]?.toLowerCase();
      const routePath = normalizeAppRoute(subDir);

      if (fileType === "page") {
        routes.push({
          routePath,
          filePath: file.path,
          kind: "page",
        });
      } else if (fileType === "layout") {
        routes.push({
          routePath,
          filePath: file.path,
          kind: "layout",
        });
      } else if (fileType === "route") {
        // API Route: extract exported HTTP methods if AST summary is available
        const summary = astSummaries?.get(file.path);
        const methods: HttpMethod[] = [];

        if (summary) {
          for (const exp of summary.exports) {
            const upper = exp.name.toUpperCase();
            if (HTTP_METHODS.has(upper as HttpMethod)) {
              methods.push(upper as HttpMethod);
            }
          }
        }

        routes.push({
          routePath,
          filePath: file.path,
          kind: "api",
          httpMethods: methods.length > 0 ? methods : undefined,
        });
      }
      continue;
    }

    // 2. Next.js Pages Router Check
    const pagesMatch = normPath.match(pagesRouteRegex);
    if (pagesMatch && pagesMatch[1]) {
      const relPage = pagesMatch[1];
      const baseName = path.basename(file.path);

      // Skip Next.js internal pages: _app, _document, _error
      if (baseName.startsWith("_")) {
        continue;
      }

      hasPagesRouter = true;
      const isApi = relPage.startsWith("api/") || relPage === "api";
      const routePath = normalizePagesRoute(relPage);

      routes.push({
        routePath,
        filePath: file.path,
        kind: isApi ? "api" : "page",
      });
    }
  }

  // Determine primary router type
  let routerType: RouteInventory["routerType"] = "unknown";
  if (hasAppRouter) {
    routerType = "next-app-router";
  } else if (hasPagesRouter) {
    routerType = "next-pages-router";
  }

  // Sort routes deterministically by routePath then kind
  routes.sort((a, b) => {
    const cmp = a.routePath.localeCompare(b.routePath);
    if (cmp !== 0) return cmp;
    return a.kind.localeCompare(b.kind);
  });

  const inventory: RouteInventory = {
    routerType,
    routes,
  };

  return RouteInventorySchema.parse(inventory);
}
