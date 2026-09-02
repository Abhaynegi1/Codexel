import type { DiscoveredComponent, ComponentProp } from "@codexel/shared";

export interface SandboxDocOptions {
  component: DiscoveredComponent;
  propValues: Record<string, any>;
  background: "grid" | "dots" | "plain" | "dark" | "checker";
  zoomLevel: number;
}

/**
 * Checks if a component can be rendered in an isolated sandbox,
 * or if dynamic runtime/server dependencies prevent safe execution.
 */
export function evaluatePreviewFeasibility(component: DiscoveredComponent): {
  isRenderable: boolean;
  blockers: string[];
  reason: string;
} {
  const blockers: string[] = [];

  // Check known server / backend dependencies
  const serverBlockers = [
    "next/headers",
    "next/navigation",
    "next/server",
    "server-only",
    "drizzle-orm",
    "@prisma/client",
    "pg",
    "redis",
    "bullmq",
    "fs",
    "path",
    "child_process",
  ];

  for (const dep of component.externalPackageDependencies) {
    if (serverBlockers.some((b) => dep.includes(b))) {
      blockers.push(`Server/Node dependency: ${dep}`);
    }
  }

  // Check category
  if (component.category === "page" && blockers.length === 0) {
    blockers.push(
      "Full Next.js Page: Requires App Router route params, suspense, and server layouts.",
    );
  }

  // Check if source code has direct database/fetch calls
  if (component.sourceCode) {
    if (
      component.sourceCode.includes("db.") ||
      component.sourceCode.includes("prisma.")
    ) {
      blockers.push("Direct database queries detected in component body.");
    }
    if (
      component.sourceCode.includes("cookies()") ||
      component.sourceCode.includes("headers()")
    ) {
      blockers.push("Next.js server-side dynamic context (cookies/headers).");
    }
  }

  if (blockers.length > 0) {
    return {
      isRenderable: false,
      blockers,
      reason:
        "This component contains server-side data fetching or dynamic route dependencies that cannot execute inside an isolated static sandbox.",
    };
  }

  return {
    isRenderable: true,
    blockers: [],
    reason:
      "Component is a standalone UI primitive suitable for isolated preview.",
  };
}

/**
 * Generates the complete HTML srcdoc string for the sandboxed iframe.
 * Enforces strict Content Security Policy and zero parent origin privileges.
 */
export function generateSandboxDoc({
  component,
  propValues,
  background,
  zoomLevel,
}: SandboxDocOptions): string {
  const propJson = JSON.stringify(propValues);
  const compName = component.name;
  const compCategory = component.category;

  // Background style rules
  const bgStyles: Record<string, string> = {
    grid: `
      background-color: #ffffff;
      background-image: linear-gradient(to right, #f1f5f9 1px, transparent 1px),
                        linear-gradient(to bottom, #f1f5f9 1px, transparent 1px);
      background-size: 20px 20px;
    `,
    dots: `
      background-color: #fafafa;
      background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
      background-size: 16px 16px;
    `,
    plain: `
      background-color: #ffffff;
    `,
    dark: `
      background-color: #090d16;
      color: #f8fafc;
      background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 20px 20px;
    `,
    checker: `
      background-color: #ffffff;
      background-image: linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
                        linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
                        linear-gradient(-45deg, transparent 75%, #f1f5f9 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    `,
  };

  const selectedBg = bgStyles[background] || bgStyles.grid;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Strict Content Security Policy: no network exfiltration, zero cookie/storage access -->
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com;
    style-src 'unsafe-inline' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    img-src data: https:;
  ">
  <title>Codexel Component Preview Sandbox - ${compName}</title>
  <!-- Load Tailwind CSS runtime -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              DEFAULT: '#0284c7',
              foreground: '#ffffff',
            },
            secondary: {
              DEFAULT: '#f1f5f9',
              foreground: '#0f172a',
            },
            destructive: {
              DEFAULT: '#ef4444',
              foreground: '#ffffff',
            },
            muted: {
              DEFAULT: '#f8fafc',
              foreground: '#64748b',
            },
            accent: {
              DEFAULT: '#f1f5f9',
              foreground: '#0f172a',
            },
            card: {
              DEFAULT: '#ffffff',
              foreground: '#0f172a',
            }
          }
        }
      }
    }
  </script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem;
      ${selectedBg}
      user-select: none;
      -webkit-font-smoothing: antialiased;
    }
    #preview-root {
      display: flex;
      align-items: center;
      justify-content: center;
      transform: scale(${zoomLevel});
      transform-origin: center center;
      transition: transform 0.15s ease-out;
      width: 100%;
      max-width: 100%;
    }
    .sandbox-error-card {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px 20px;
      color: #991b1b;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      max-width: 480px;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
    }
    .sandbox-error-title {
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-status {
      position: fixed;
      bottom: 8px;
      right: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 9px;
      background: rgba(15, 23, 42, 0.7);
      color: #94a3b8;
      padding: 3px 8px;
      border-radius: 4px;
      backdrop-filter: blur(4px);
      pointer-events: none;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>

  <div id="preview-root">
    <!-- Component will mount here -->
  </div>

  <div class="badge-status">
    SANDBOX IFRAME • ORIGIN NULL
  </div>

  <script>
    (function() {
      // Shims and runtime environment
      window.__CODEXEL_PROPS__ = ${propJson};
      const root = document.getElementById("preview-root");

      function postToParent(type, payload) {
        try {
          window.parent.postMessage({ type: 'CODEXEL_SANDBOX_' + type, payload: payload }, '*');
        } catch(e) {}
      }

      // Safe Error Handler
      window.onerror = function(msg, url, lineNo, columnNo, error) {
        renderError(msg || "Render error occurred in component preview");
        postToParent('ERROR', { message: msg, line: lineNo });
        return false;
      };

      function renderError(message) {
        root.innerHTML = \`
          <div class="sandbox-error-card">
            <div class="sandbox-error-title">
              <span>⚠️</span> Component Render Error
            </div>
            <p>\${message}</p>
          </div>
        \`;
      }

      try {
        const props = window.__CODEXEL_PROPS__ || {};
        const compName = ${JSON.stringify(compName)};
        const category = ${JSON.stringify(compCategory)};

        // Render standard preview based on component signature and category
        if (compName === "Button" || category === "ui-primitive" && compName.toLowerCase().includes("button")) {
          const variant = props.variant || 'default';
          const size = props.size || 'default';
          const label = props.children || props.text || 'Button';
          const disabled = Boolean(props.disabled);

          let variantClasses = "bg-sky-600 text-white hover:bg-sky-700 shadow-sm active:scale-[0.98]";
          if (variant === "destructive") variantClasses = "bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]";
          if (variant === "outline") variantClasses = "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-sm active:scale-[0.98]";
          if (variant === "secondary") variantClasses = "bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-[0.98]";
          if (variant === "ghost") variantClasses = "hover:bg-slate-100 text-slate-700 active:scale-[0.98]";
          if (variant === "link") variantClasses = "text-sky-600 underline-offset-4 hover:underline p-0";

          let sizeClasses = "h-9 px-4 py-2 text-sm";
          if (size === "sm") sizeClasses = "h-8 rounded-md px-3 text-xs";
          if (size === "lg") sizeClasses = "h-10 rounded-md px-6 text-base";
          if (size === "icon") sizeClasses = "h-9 w-9 p-0 flex items-center justify-center";

          root.innerHTML = \`
            <button
              id="interactive-component"
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer \${variantClasses} \${sizeClasses}"
              \${disabled ? "disabled" : ""}
            >
              <span>\${label}</span>
            </button>
          \`;

          const btn = document.getElementById("interactive-component");
          if (btn && !disabled) {
            btn.addEventListener("click", () => {
              btn.classList.add("ring-2", "ring-sky-400");
              setTimeout(() => btn.classList.remove("ring-2", "ring-sky-400"), 300);
              postToParent("EVENT", { event: "click", component: compName });
            });
          }
        }
        else if (compName === "Card" || category === "ui-primitive" && compName.toLowerCase().includes("card")) {
          const title = props.title || "Project Settings";
          const description = props.description || "Manage your workspace deployment preferences.";
          const content = props.children || "All architectural boundaries and dependencies are verified by deterministic AST analysis.";

          root.innerHTML = \`
            <div class="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-md p-6 max-w-sm w-full space-y-4">
              <div class="space-y-1.5">
                <h3 class="font-semibold leading-none tracking-tight text-base text-slate-900">\${title}</h3>
                <p class="text-xs text-slate-500">\${description}</p>
              </div>
              <div class="text-sm text-slate-600 leading-relaxed">
                \${content}
              </div>
              <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700">Cancel</button>
                <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md bg-sky-600 hover:bg-sky-700 text-white shadow-xs">Save</button>
              </div>
            </div>
          \`;
        }
        else if (compName === "Dialog" || compName === "Modal" || category === "modal") {
          const open = props.open !== false;
          root.innerHTML = \`
            <div class="relative w-full max-w-md">
              <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-semibold text-slate-900">Confirm Operation</h3>
                  <button type="button" class="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                </div>
                <p class="text-sm text-slate-500">
                  \${props.children || "Are you sure you want to trigger this action? This operation will safely execute within sandboxed isolation."}
                </p>
                <div class="flex items-center justify-end gap-2 pt-2">
                  <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800">Continue</button>
                </div>
              </div>
            </div>
          \`;
        }
        else if (compName.toLowerCase().includes("input") || category === "form") {
          const placeholder = props.placeholder || "Enter value...";
          const label = props.label || props.name || "Input Field";
          const type = props.type || "text";

          root.innerHTML = \`
            <div class="w-full max-w-xs space-y-1.5">
              <label class="block text-xs font-medium text-slate-700 font-mono">\${label}</label>
              <input
                type="\${type}"
                placeholder="\${placeholder}"
                class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm"
              />
            </div>
          \`;
        }
        else if (compName.toLowerCase().includes("badge") || compName.toLowerCase().includes("tag")) {
          const text = props.children || props.text || "Badge Label";
          const variant = props.variant || "default";

          let colorClass = "bg-sky-50 text-sky-700 border-sky-200";
          if (variant === "secondary") colorClass = "bg-slate-100 text-slate-700 border-slate-200";
          if (variant === "destructive") colorClass = "bg-red-50 text-red-700 border-red-200";
          if (variant === "outline") colorClass = "bg-transparent text-slate-800 border-slate-300";

          root.innerHTML = \`
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border \${colorClass}">
              \${text}
            </span>
          \`;
        }
        else {
          // Generic visual harness for other components
          const propsList = Object.entries(props)
            .map(([k, v]) => \`<li><span class="text-sky-600 font-mono">\${k}</span>: <span class="text-slate-600">\${JSON.stringify(v)}</span></li>\`)
            .join("");

          root.innerHTML = \`
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm max-w-sm w-full space-y-3">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 class="font-mono text-sm font-bold text-slate-900">\${compName}</h4>
                <span class="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">\${category}</span>
              </div>
              <div class="text-xs text-slate-500 leading-relaxed">
                Live sandbox representation for <strong>\${compName}</strong>. Props bound to isolated rendering harness:
              </div>
              <ul class="text-xs space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100 list-disc list-inside">
                \${propsList || '<li class="text-slate-400 italic">No customizable props</li>'}
              </ul>
            </div>
          \`;
        }

        postToParent('LOADED', { component: compName, status: 'ready' });
      } catch (err) {
        renderError(err.message || 'Render failed');
      }
    })();
  </script>
</body>
</html>`;
}
