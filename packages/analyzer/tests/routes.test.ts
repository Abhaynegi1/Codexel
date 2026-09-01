import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { scanFileSystem } from "../src/scanner/index";
import { parseAllSourceFiles } from "../src/parsers/ast-walker";
import { detectRoutes } from "../src/routes/index";
import { RouteInventorySchema } from "@codexel/shared";

describe("Route Discovery Engine", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codexel-routes-test-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  });

  it("detects Next.js App Router pages, layouts, and API routes with HTTP methods", async () => {
    await fs.mkdir(path.join(tempDir, "src", "app", "(auth)", "login"), {
      recursive: true,
    });
    await fs.mkdir(path.join(tempDir, "src", "app", "api", "users"), {
      recursive: true,
    });
    await fs.mkdir(path.join(tempDir, "src", "app", "dashboard"), {
      recursive: true,
    });

    // Root page and layout
    await fs.writeFile(
      path.join(tempDir, "src", "app", "page.tsx"),
      "export default function HomePage() { return <div>Home</div>; }",
    );
    await fs.writeFile(
      path.join(tempDir, "src", "app", "layout.tsx"),
      "export default function RootLayout({ children }: { children: any }) { return <html><body>{children}</body></html>; }",
    );

    // Grouped route: (auth)/login/page.tsx
    await fs.writeFile(
      path.join(tempDir, "src", "app", "(auth)", "login", "page.tsx"),
      "export default function LoginPage() { return <div>Login</div>; }",
    );

    // Nested page: dashboard/page.tsx
    await fs.writeFile(
      path.join(tempDir, "src", "app", "dashboard", "page.tsx"),
      "export default function Dashboard() { return <div>Dashboard</div>; }",
    );

    // API Route with GET and POST handlers
    await fs.writeFile(
      path.join(tempDir, "src", "app", "api", "users", "route.ts"),
      `export async function GET() { return new Response("OK"); }
       export async function POST() { return new Response("Created"); }`,
    );

    const scan = await scanFileSystem({ workspacePath: tempDir });
    const ast = await parseAllSourceFiles(tempDir, scan.files);
    const routes = detectRoutes(scan.files, ast);

    // Validate with Zod schema
    expect(() => RouteInventorySchema.parse(routes)).not.toThrow();

    expect(routes.routerType).toBe("next-app-router");

    const paths = routes.routes.map((r) => r.routePath);
    expect(paths).toContain("/");
    expect(paths).toContain("/login");
    expect(paths).toContain("/dashboard");
    expect(paths).toContain("/api/users");

    // Check API route methods
    const apiRoute = routes.routes.find((r) => r.routePath === "/api/users");
    expect(apiRoute?.kind).toBe("api");
    expect(apiRoute?.httpMethods).toContain("GET");
    expect(apiRoute?.httpMethods).toContain("POST");

    // Check layout
    const layout = routes.routes.find((r) => r.kind === "layout");
    expect(layout).toBeDefined();
    expect(layout?.routePath).toBe("/");
  });

  it("detects Next.js Pages Router routes", async () => {
    await fs.mkdir(path.join(tempDir, "pages", "api"), { recursive: true });

    await fs.writeFile(
      path.join(tempDir, "pages", "index.tsx"),
      "export default function Index() { return null; }",
    );
    await fs.writeFile(
      path.join(tempDir, "pages", "about.tsx"),
      "export default function About() { return null; }",
    );
    await fs.writeFile(
      path.join(tempDir, "pages", "api", "health.ts"),
      "export default function handler(req: any, res: any) {}",
    );

    const scan = await scanFileSystem({ workspacePath: tempDir });
    const routes = detectRoutes(scan.files);

    expect(() => RouteInventorySchema.parse(routes)).not.toThrow();
    expect(routes.routerType).toBe("next-pages-router");

    const paths = routes.routes.map((r) => r.routePath);
    expect(paths).toContain("/");
    expect(paths).toContain("/about");
    expect(paths).toContain("/api/health");
  });
});
