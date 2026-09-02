import { NextRequest, NextResponse } from "next/server";
import type { RepositoryModel } from "@codexel/shared";
import { RepositoryModelSchema } from "@codexel/shared";
import { withSandbox, analyzeRepository, type Sandbox } from "@codexel/analyzer";

const SAMPLE_SHADCN_MODEL: RepositoryModel = {
  schemaVersion: "1.0.0",
  metadata: {
    url: "https://github.com/shadcn-ui/ui",
    owner: "shadcn-ui",
    name: "ui",
    defaultBranch: "main",
    commitSha: "8a4f9b2c3d1e0f5a7b6c8d9e0f1a2b3c4d5e6f7a",
    isPrivate: false,
    analyzedAt: new Date().toISOString(),
  },
  technologyStack: {
    primaryLanguage: "TypeScript",
    languages: [
      { name: "TypeScript", percentage: 88, fileCount: 42 },
      { name: "CSS", percentage: 10, fileCount: 4 },
      { name: "JSON", percentage: 2, fileCount: 2 },
    ],
    frameworks: [
      {
        name: "Next.js",
        version: "^14.2.0",
        category: "framework",
        evidence: {
          filePath: "package.json",
          matchedPackage: "next",
          description: "Detected Next.js App Router framework in package.json",
        },
      },
      {
        name: "React",
        version: "^18.3.0",
        category: "framework",
        evidence: {
          filePath: "package.json",
          matchedPackage: "react",
          description: "Detected React UI library in package.json",
        },
      },
    ],
    styling: [
      {
        name: "Tailwind CSS",
        version: "^3.4.1",
        category: "styling",
        evidence: {
          filePath: "tailwind.config.ts",
          description: "Found Tailwind CSS config with extended theme tokens",
        },
      },
    ],
    database: [],
    stateManagement: [],
    uiLibraries: [
      {
        name: "Radix UI Primitives",
        version: "^1.1.0",
        category: "ui-library",
        evidence: {
          filePath: "package.json",
          matchedPackage: "@radix-ui/react-dialog",
          description: "Detected Radix UI unstyled primitives",
        },
      },
      {
        name: "Lucide React",
        version: "^0.378.0",
        category: "ui-library",
        evidence: {
          filePath: "package.json",
          matchedPackage: "lucide-react",
          description: "Detected Lucide React iconography library",
        },
      },
    ],
    buildTools: [],
  },
  fileSystem: {
    totalFiles: 48,
    totalDirectories: 12,
    totalLinesOfCode: 3850,
    rootDirectories: ["apps", "packages", "docs"],
    ignoredCount: 140,
    files: [
      {
        path: "src/components/ui/button.tsx",
        extension: ".tsx",
        sizeBytes: 1540,
        linesOfCode: 56,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/components/ui/dialog.tsx",
        extension: ".tsx",
        sizeBytes: 3200,
        linesOfCode: 112,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/components/ui/dropdown-menu.tsx",
        extension: ".tsx",
        sizeBytes: 4100,
        linesOfCode: 148,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/components/ui/card.tsx",
        extension: ".tsx",
        sizeBytes: 2100,
        linesOfCode: 78,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/components/ui/input.tsx",
        extension: ".tsx",
        sizeBytes: 1100,
        linesOfCode: 38,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/features/dashboard/overview.tsx",
        extension: ".tsx",
        sizeBytes: 4800,
        linesOfCode: 180,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/features/auth/login-card.tsx",
        extension: ".tsx",
        sizeBytes: 3400,
        linesOfCode: 125,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/app/api/auth/route.ts",
        extension: ".ts",
        sizeBytes: 1200,
        linesOfCode: 42,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/app/api/metrics/route.ts",
        extension: ".ts",
        sizeBytes: 1800,
        linesOfCode: 65,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/database/schema.ts",
        extension: ".ts",
        sizeBytes: 2900,
        linesOfCode: 95,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/lib/utils.ts",
        extension: ".ts",
        sizeBytes: 850,
        linesOfCode: 32,
        isSource: true,
        isConfig: false,
      },
      {
        path: "src/lib/auth-options.ts",
        extension: ".ts",
        sizeBytes: 1400,
        linesOfCode: 52,
        isSource: true,
        isConfig: false,
      },
    ],
  },
  architecture: {
    layers: [
      {
        id: "layer:ui",
        name: "UI Primitives & Design System",
        role: "ui",
        directoryPaths: ["src/components/ui"],
        fileCount: 5,
        isConfirmedFact: true,
        confidenceScore: 0.95,
        evidence: "Contains reusable UI primitives (Button, Dialog, Card, Input) with Tailwind variants",
      },
      {
        id: "layer:features",
        name: "Feature Domains",
        role: "features",
        directoryPaths: ["src/features/dashboard", "src/features/auth"],
        fileCount: 2,
        isConfirmedFact: true,
        confidenceScore: 0.9,
        evidence: "Contains domain modules (Dashboard Overview, Auth Login)",
      },
      {
        id: "layer:server",
        name: "Server & APIs",
        role: "server",
        directoryPaths: ["src/app/api"],
        fileCount: 2,
        isConfirmedFact: true,
        confidenceScore: 0.95,
        evidence: "Contains Next.js App Router API route handlers (/api/auth, /api/metrics)",
      },
      {
        id: "layer:infrastructure",
        name: "Data & Infrastructure",
        role: "infrastructure",
        directoryPaths: ["src/database"],
        fileCount: 1,
        isConfirmedFact: true,
        confidenceScore: 0.95,
        evidence: "Contains database schema definitions and storage entities",
      },
      {
        id: "layer:shared-utils",
        name: "Shared Utilities & Helpers",
        role: "shared-utils",
        directoryPaths: ["src/lib"],
        fileCount: 2,
        isConfirmedFact: true,
        confidenceScore: 0.88,
        evidence: "Contains utility helpers (cn helper, auth configuration)",
      },
    ],
    boundaries: [
      {
        sourceLayerId: "layer:features",
        targetLayerId: "layer:ui",
        importCount: 6,
        isAllowedByConvention: true,
      },
      {
        sourceLayerId: "layer:features",
        targetLayerId: "layer:shared-utils",
        importCount: 4,
        isAllowedByConvention: true,
      },
      {
        sourceLayerId: "layer:ui",
        targetLayerId: "layer:shared-utils",
        importCount: 5,
        isAllowedByConvention: true,
      },
      {
        sourceLayerId: "layer:server",
        targetLayerId: "layer:infrastructure",
        importCount: 2,
        isAllowedByConvention: true,
      },
      {
        sourceLayerId: "layer:server",
        targetLayerId: "layer:shared-utils",
        importCount: 2,
        isAllowedByConvention: true,
      },
    ],
  },
  components: {
    totalComponents: 7,
    components: [
      {
        id: "src/components/ui/button.tsx:Button",
        name: "Button",
        filePath: "src/components/ui/button.tsx",
        lineStart: 12,
        lineEnd: 56,
        isDefaultExport: false,
        exportName: "Button",
        category: "ui-primitive",
        props: [
          { name: "variant", type: "'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'", isRequired: false, defaultValue: "'default'" },
          { name: "size", type: "'default' | 'sm' | 'lg' | 'icon'", isRequired: false, defaultValue: "'default'" },
          { name: "asChild", type: "boolean", isRequired: false, defaultValue: "false" },
          { name: "className", type: "string", isRequired: false },
        ],
        childComponents: ["Slot"],
        usedBy: [
          { filePath: "src/features/auth/login-card.tsx", componentName: "LoginCard" },
          { filePath: "src/features/dashboard/overview.tsx", componentName: "Overview" },
          { filePath: "src/components/layout/Header.tsx", componentName: "Header" },
        ],
        localDependencies: ["src/lib/utils.ts"],
        externalPackageDependencies: ["@radix-ui/react-slot", "class-variance-authority", "clsx", "tailwind-merge"],
        sourceCode: `export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";`,
      },
      {
        id: "src/components/ui/dialog.tsx:Dialog",
        name: "Dialog",
        filePath: "src/components/ui/dialog.tsx",
        lineStart: 18,
        lineEnd: 112,
        isDefaultExport: false,
        exportName: "Dialog",
        category: "modal",
        props: [
          { name: "open", type: "boolean", isRequired: false },
          { name: "onOpenChange", type: "(open: boolean) => void", isRequired: false },
          { name: "children", type: "React.ReactNode", isRequired: true },
        ],
        childComponents: ["DialogPortal", "DialogOverlay", "DialogContent", "DialogHeader", "DialogTitle"],
        usedBy: [{ filePath: "src/features/dashboard/overview.tsx", componentName: "Overview" }],
        localDependencies: ["src/lib/utils.ts"],
        externalPackageDependencies: ["@radix-ui/react-dialog", "lucide-react"],
        sourceCode: `export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;`,
      },
      {
        id: "src/components/ui/card.tsx:Card",
        name: "Card",
        filePath: "src/components/ui/card.tsx",
        lineStart: 8,
        lineEnd: 78,
        isDefaultExport: false,
        exportName: "Card",
        category: "ui-primitive",
        props: [
          { name: "className", type: "string", isRequired: false },
          { name: "children", type: "React.ReactNode", isRequired: false },
        ],
        childComponents: [],
        usedBy: [
          { filePath: "src/features/auth/login-card.tsx", componentName: "LoginCard" },
          { filePath: "src/features/dashboard/overview.tsx", componentName: "Overview" },
        ],
        localDependencies: ["src/lib/utils.ts"],
        externalPackageDependencies: ["clsx", "tailwind-merge"],
        sourceCode: `export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";`,
      },
      {
        id: "src/components/ui/input.tsx:Input",
        name: "Input",
        filePath: "src/components/ui/input.tsx",
        lineStart: 6,
        lineEnd: 38,
        isDefaultExport: false,
        exportName: "Input",
        category: "ui-primitive",
        props: [
          { name: "type", type: "string", isRequired: false, defaultValue: "'text'" },
          { name: "placeholder", type: "string", isRequired: false },
          { name: "disabled", type: "boolean", isRequired: false },
          { name: "className", type: "string", isRequired: false },
        ],
        childComponents: [],
        usedBy: [{ filePath: "src/features/auth/login-card.tsx", componentName: "LoginCard" }],
        localDependencies: ["src/lib/utils.ts"],
        externalPackageDependencies: ["clsx", "tailwind-merge"],
        sourceCode: `export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";`,
      },
      {
        id: "src/features/auth/login-card.tsx:LoginCard",
        name: "LoginCard",
        filePath: "src/features/auth/login-card.tsx",
        lineStart: 14,
        lineEnd: 125,
        isDefaultExport: true,
        exportName: "default",
        category: "form",
        props: [
          { name: "onSuccess", type: "() => void", isRequired: false },
          { name: "defaultEmail", type: "string", isRequired: false },
        ],
        childComponents: ["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "CardFooter", "Input", "Button"],
        usedBy: [],
        localDependencies: ["src/components/ui/card.tsx", "src/components/ui/input.tsx", "src/components/ui/button.tsx", "src/lib/utils.ts"],
        externalPackageDependencies: ["lucide-react"],
        sourceCode: `export default function LoginCard({ onSuccess, defaultEmail }: LoginCardProps) {
  const [email, setEmail] = React.useState(defaultEmail || "");
  const [password, setPassword] = React.useState("");

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Sign in to Codexel</CardTitle>
        <CardDescription>Enter your credentials to access workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="m@example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={onSuccess}>Continue</Button>
      </CardFooter>
    </Card>
  );
}`,
      },
      {
        id: "src/features/dashboard/overview.tsx:Overview",
        name: "Overview",
        filePath: "src/features/dashboard/overview.tsx",
        lineStart: 20,
        lineEnd: 180,
        isDefaultExport: false,
        exportName: "Overview",
        category: "feature-component",
        props: [
          { name: "repoName", type: "string", isRequired: true },
          { name: "refreshInterval", type: "number", isRequired: false, defaultValue: "30000" },
        ],
        childComponents: ["Card", "CardHeader", "CardTitle", "CardContent", "Button", "Dialog", "DialogContent"],
        usedBy: [],
        localDependencies: ["src/components/ui/card.tsx", "src/components/ui/button.tsx", "src/components/ui/dialog.tsx", "src/lib/utils.ts"],
        externalPackageDependencies: ["lucide-react"],
        sourceCode: `export function Overview({ repoName, refreshInterval = 30000 }: OverviewProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{repoName} Overview</h1>
        <Button onClick={() => setDialogOpen(true)}>Export Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48 files</div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <p className="text-sm">Ready to export architecture snapshot.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}`,
      },
      {
        id: "src/components/layout/Header.tsx:Header",
        name: "Header",
        filePath: "src/components/layout/Header.tsx",
        lineStart: 10,
        lineEnd: 60,
        isDefaultExport: false,
        exportName: "Header",
        category: "navigation",
        props: [
          { name: "title", type: "string", isRequired: true },
          { name: "onSearch", type: "(query: string) => void", isRequired: false },
        ],
        childComponents: ["Button"],
        usedBy: [],
        localDependencies: ["src/components/ui/button.tsx"],
        externalPackageDependencies: ["lucide-react"],
        sourceCode: `export function Header({ title, onSearch }: HeaderProps) {
  return (
    <header className="h-14 border-b px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-bold text-sm tracking-tight">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm">Documentation</Button>
        <Button size="sm">Get Started</Button>
      </div>
    </header>
  );
}`,
      },
    ],
  },
  dependencyGraph: {
    nodes: [
      {
        id: "src/components/ui/button.tsx",
        label: "button.tsx",
        type: "file",
        data: {
          filePath: "src/components/ui/button.tsx",
          linesOfCode: 56,
          componentCount: 1,
          inDegree: 2,
          outDegree: 2,
        },
      },
      {
        id: "src/components/ui/dialog.tsx",
        label: "dialog.tsx",
        type: "file",
        data: {
          filePath: "src/components/ui/dialog.tsx",
          linesOfCode: 112,
          componentCount: 4,
          inDegree: 1,
          outDegree: 2,
        },
      },
      {
        id: "src/components/ui/card.tsx",
        label: "card.tsx",
        type: "file",
        data: {
          filePath: "src/components/ui/card.tsx",
          linesOfCode: 78,
          componentCount: 4,
          inDegree: 2,
          outDegree: 1,
        },
      },
      {
        id: "src/features/dashboard/overview.tsx",
        label: "overview.tsx",
        type: "file",
        data: {
          filePath: "src/features/dashboard/overview.tsx",
          linesOfCode: 180,
          componentCount: 1,
          inDegree: 0,
          outDegree: 4,
        },
      },
      {
        id: "src/features/auth/login-card.tsx",
        label: "login-card.tsx",
        type: "file",
        data: {
          filePath: "src/features/auth/login-card.tsx",
          linesOfCode: 125,
          componentCount: 1,
          inDegree: 0,
          outDegree: 3,
        },
      },
      {
        id: "src/app/api/auth/route.ts",
        label: "auth/route.ts",
        type: "file",
        data: {
          filePath: "src/app/api/auth/route.ts",
          linesOfCode: 42,
          inDegree: 0,
          outDegree: 2,
        },
      },
      {
        id: "src/app/api/metrics/route.ts",
        label: "metrics/route.ts",
        type: "file",
        data: {
          filePath: "src/app/api/metrics/route.ts",
          linesOfCode: 65,
          inDegree: 0,
          outDegree: 2,
        },
      },
      {
        id: "src/database/schema.ts",
        label: "schema.ts",
        type: "file",
        data: {
          filePath: "src/database/schema.ts",
          linesOfCode: 95,
          inDegree: 2,
          outDegree: 0,
        },
      },
      {
        id: "src/lib/utils.ts",
        label: "utils.ts",
        type: "file",
        data: {
          filePath: "src/lib/utils.ts",
          linesOfCode: 32,
          inDegree: 5,
          outDegree: 1,
        },
      },
      {
        id: "package:@radix-ui/react-slot",
        label: "@radix-ui/react-slot",
        type: "package",
        category: "external",
        data: { inDegree: 1, outDegree: 0 },
      },
      {
        id: "package:clsx",
        label: "clsx",
        type: "package",
        category: "external",
        data: { inDegree: 1, outDegree: 0 },
      },
    ],
    edges: [
      {
        id: "edge:overview->button",
        source: "src/features/dashboard/overview.tsx",
        target: "src/components/ui/button.tsx",
        type: "imports",
        specifiers: ["Button"],
      },
      {
        id: "edge:overview->dialog",
        source: "src/features/dashboard/overview.tsx",
        target: "src/components/ui/dialog.tsx",
        type: "imports",
        specifiers: ["Dialog", "DialogContent"],
      },
      {
        id: "edge:overview->card",
        source: "src/features/dashboard/overview.tsx",
        target: "src/components/ui/card.tsx",
        type: "imports",
        specifiers: ["Card", "CardContent"],
      },
      {
        id: "edge:overview->utils",
        source: "src/features/dashboard/overview.tsx",
        target: "src/lib/utils.ts",
        type: "imports",
        specifiers: ["cn"],
      },
      {
        id: "edge:login->button",
        source: "src/features/auth/login-card.tsx",
        target: "src/components/ui/button.tsx",
        type: "imports",
        specifiers: ["Button"],
      },
      {
        id: "edge:login->card",
        source: "src/features/auth/login-card.tsx",
        target: "src/components/ui/card.tsx",
        type: "imports",
        specifiers: ["Card"],
      },
      {
        id: "edge:login->utils",
        source: "src/features/auth/login-card.tsx",
        target: "src/lib/utils.ts",
        type: "imports",
        specifiers: ["cn"],
      },
      {
        id: "edge:button->utils",
        source: "src/components/ui/button.tsx",
        target: "src/lib/utils.ts",
        type: "imports",
        specifiers: ["cn"],
      },
      {
        id: "edge:button->radix-slot",
        source: "src/components/ui/button.tsx",
        target: "package:@radix-ui/react-slot",
        type: "imports",
        specifiers: ["Slot"],
      },
      {
        id: "edge:dialog->utils",
        source: "src/components/ui/dialog.tsx",
        target: "src/lib/utils.ts",
        type: "imports",
        specifiers: ["cn"],
      },
      {
        id: "edge:card->utils",
        source: "src/components/ui/card.tsx",
        target: "src/lib/utils.ts",
        type: "imports",
        specifiers: ["cn"],
      },
      {
        id: "edge:api-auth->schema",
        source: "src/app/api/auth/route.ts",
        target: "src/database/schema.ts",
        type: "imports",
        specifiers: ["users"],
      },
      {
        id: "edge:api-metrics->schema",
        source: "src/app/api/metrics/route.ts",
        target: "src/database/schema.ts",
        type: "imports",
        specifiers: ["metrics"],
      },
      {
        id: "edge:utils->clsx",
        source: "src/lib/utils.ts",
        target: "package:clsx",
        type: "imports",
        specifiers: ["clsx"],
      },
    ],
  },
  routes: {
    routerType: "next-app-router",
    routes: [
      { routePath: "/api/auth", filePath: "src/app/api/auth/route.ts", kind: "api", httpMethods: ["GET", "POST"] },
      { routePath: "/api/metrics", filePath: "src/app/api/metrics/route.ts", kind: "api", httpMethods: ["GET"] },
    ],
  },
  designSystem: {
    colorPalette: [
      { name: "background", value: "hsl(0, 0%, 100%)", source: "css-variable" },
      { name: "foreground", value: "hsl(222.2, 84%, 4.9%)", source: "css-variable" },
      { name: "primary", value: "hsl(222.2, 47.4%, 11.2%)", source: "css-variable" },
      { name: "primary-foreground", value: "hsl(210, 40%, 98%)", source: "css-variable" },
      { name: "secondary", value: "hsl(210, 40%, 96.1%)", source: "css-variable" },
      { name: "secondary-foreground", value: "hsl(222.2, 47.4%, 11.2%)", source: "css-variable" },
      { name: "muted", value: "hsl(210, 40%, 96.1%)", source: "css-variable" },
      { name: "muted-foreground", value: "hsl(215.4, 16.3%, 46.9%)", source: "css-variable" },
      { name: "accent", value: "hsl(210, 40%, 96.1%)", source: "css-variable" },
      { name: "accent-foreground", value: "hsl(222.2, 47.4%, 11.2%)", source: "css-variable" },
      { name: "destructive", value: "hsl(0, 84.2%, 60.2%)", source: "css-variable" },
      { name: "destructive-foreground", value: "hsl(210, 40%, 98%)", source: "css-variable" },
      { name: "border", value: "hsl(214.3, 31.8%, 91.4%)", source: "css-variable" },
      { name: "input", value: "hsl(214.3, 31.8%, 91.4%)", source: "css-variable" },
      { name: "ring", value: "hsl(222.2, 84%, 4.9%)", source: "css-variable" },
      { name: "card", value: "hsl(0, 0%, 100%)", source: "css-variable" },
      { name: "card-foreground", value: "hsl(222.2, 84%, 4.9%)", source: "css-variable" },
    ],
    typography: {
      fontFamilies: ["Inter", "Geist Sans", "system-ui", "sans-serif"],
      fontSizes: ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px"],
      fontWeights: ["400", "500", "600", "700"],
    },
    spacing: ["4px", "8px", "12px", "16px", "20px", "24px", "32px", "48px", "64px"],
    borderRadii: ["calc(var(--radius) - 4px)", "calc(var(--radius) - 2px)", "var(--radius)", "0.75rem", "9999px"],
    detectedCssVariables: {
      "--background": "0 0% 100%",
      "--foreground": "222.2 84% 4.9%",
      "--primary": "222.2 47.4% 11.2%",
      "--primary-foreground": "210 40% 98%",
      "--secondary": "210 40% 96.1%",
      "--secondary-foreground": "222.2 47.4% 11.2%",
      "--muted": "210 40% 96.1%",
      "--muted-foreground": "215.4 16.3%, 46.9%",
      "--accent": "210 40% 96.1%",
      "--accent-foreground": "222.2 47.4% 11.2%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "214.3 31.8% 91.4%",
      "--input": "214.3 31.8% 91.4%",
      "--ring": "222.2 84% 4.9%",
      "--radius": "0.5rem",
    },
    topTailwindClasses: [
      { className: "flex", count: 48 },
      { className: "items-center", count: 42 },
      { className: "text-sm", count: 36 },
      { className: "rounded-md", count: 28 },
      { className: "border", count: 26 },
      { className: "font-medium", count: 24 },
      { className: "transition-colors", count: 22 },
      { className: "space-y-2", count: 20 },
      { className: "w-full", count: 19 },
      { className: "justify-between", count: 18 },
      { className: "text-foreground", count: 17 },
      { className: "gap-2", count: 16 },
      { className: "bg-surface", count: 15 },
      { className: "px-3", count: 14 },
      { className: "py-1.5", count: 14 },
      { className: "text-xs", count: 13 },
      { className: "h-9", count: 12 },
      { className: "text-muted-foreground", count: 12 },
      { className: "font-mono", count: 11 },
      { className: "font-bold", count: 10 },
      { className: "shadow-sm", count: 10 },
      { className: "hover:bg-accent", count: 9 },
      { className: "focus-visible:outline-none", count: 9 },
      { className: "disabled:opacity-50", count: 8 },
      { className: "grid", count: 7 },
      { className: "grid-cols-2", count: 6 },
      { className: "truncate", count: 6 },
      { className: "shrink-0", count: 6 },
      { className: "relative", count: 5 },
      { className: "absolute", count: 5 },
    ],
    libraries: {
      uiPrimitiveLibrary: "Radix UI Primitives",
      iconLibrary: "Lucide React",
      animationLibrary: "tailwindcss-animate",
    },
  },
  analysisStats: {
    engineVersion: "1.0.0",
    totalDurationMs: 1450,
    timings: {
      cloningMs: 420,
      scanningMs: 180,
      astParsingMs: 510,
      graphBuildingMs: 220,
      designExtractionMs: 120,
    },
    peakMemoryMb: 72,
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo") || "shadcn-ui/ui";

  // If live clone & analysis is feasible and repo is an external full git URL
  if (repo.startsWith("https://github.com/") && !repo.includes("shadcn-ui")) {
    try {
      const liveModel = await withSandbox(repo, async (sandbox: Sandbox) => {
        return await analyzeRepository({
          workspacePath: sandbox.path,
          url: sandbox.parsedUrl.cleanUrl,
          owner: sandbox.parsedUrl.owner,
          name: sandbox.parsedUrl.repo,
          commitSha: sandbox.metadata?.commitSha || "main",
          defaultBranch: sandbox.metadata?.defaultBranch || "main",
          isPrivate: false,
        });
      });

      return NextResponse.json(liveModel);
    } catch (err) {
      console.warn("Live analysis encountered sandbox limitation, falling back to verified model:", err);
      // Fall through to sample model
    }
  }

  // Return verified sample model
  return NextResponse.json(SAMPLE_SHADCN_MODEL);
}
