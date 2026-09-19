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
  const rawSourceCode = component.sourceCode || "";

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
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com;
    style-src 'unsafe-inline' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    img-src data: https:;
  ">
  <title>Codexel Component Preview Sandbox - ${compName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: {
              DEFAULT: '#f59e0b',
              hover: '#d97706',
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
    <!-- Component mounts here -->
  </div>

  <div class="badge-status">
    CODEXEL LIVE SANDBOX
  </div>

  <script>
    (function() {
      window.__CODEXEL_PROPS__ = ${propJson};
      window.__CODEXEL_SOURCE__ = ${JSON.stringify(rawSourceCode)};
      const root = document.getElementById("preview-root");

      function postToParent(type, payload) {
        try {
          window.parent.postMessage({ type: 'CODEXEL_SANDBOX_' + type, payload: payload }, '*');
        } catch(e) {}
      }

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

      // Try extracting real JSX structure from source code
      function tryExtractJsx(source, props, name) {
        if (!source) return null;
        try {
          // Match return statement
          const returnMatch = source.match(/return\\s*\\([\\s\\n]*([\\s\\S]*?)[\\s\\n]*\\)\\s*;?/m) ||
                              source.match(/return\\s+(<[A-Za-z][\\s\\S]*?>[\\s\\S]*?<\\/[A-Za-z]+>)/m);
          if (!returnMatch) return null;

          let raw = returnMatch[1].trim();
          if (!raw.startsWith('<') || raw.length < 5) return null;

          // Don't use if it's just delegating to another component
          if (raw.startsWith('<' + name)) return null;

          // Convert className with cn(...) or string
          let cleaned = raw
            .replace(/className=\\{cn\\(([^)]+)\\)\\}/g, function(_, args) {
              const classes = (args.match(/(["'])(?:(?=(\\\\?))\\2.)*?\\1/g) || [])
                .map(s => s.slice(1, -1))
                .join(" ");
              return 'class="' + classes + '"';
            })
            .replace(/className=\\{([^}]+)\\}/g, 'class="$1"')
            .replace(/className="([^"]+)"/g, 'class="$1"')
            .replace(/\\{props\\.(children|text)\\s*\\|\\|\\s*(["'])(.*?)\\2\\}/g, props.children || '$3')
            .replace(/\\{props\\.(children|text)\\}/g, props.children || name)
            .replace(/\\{children\\}/g, props.children || name)
            .replace(/\\{title\\}/g, props.title || name)
            .replace(/\\{description\\}/g, props.description || 'Description text')
            .replace(/\\{label\\}/g, props.label || name)
            .replace(/\\{[^}]+\\}/g, '') // remove remaining interpolations
            .replace(/<Slot([^>]*)>([\\s\\S]*?)<\\/Slot>/g, '<div$1>$2</div>')
            .replace(/<(\\w+)([^>]*?)\\/>/g, '<$1$2></$1>')
            .replace(/<\\/?React\\.Fragment>/g, '')
            .replace(/<\\/?>/g, '');

          if (cleaned.includes('class=') && cleaned.startsWith('<')) {
            return cleaned;
          }
        } catch (e) {}
        return null;
      }

      try {
        const props = window.__CODEXEL_PROPS__ || {};
        const source = window.__CODEXEL_SOURCE__ || "";
        const compName = ${JSON.stringify(compName)};
        const lowerName = compName.toLowerCase();
        const category = ${JSON.stringify(compCategory)};

        // 1. Check for DotMatrix or Canvas/Grid/Dot visual effect components
        if (lowerName.includes("dotmatrix") || lowerName.includes("canvasreveal") || lowerName.includes("matrix") || lowerName.includes("dotgrid")) {
          const dotSize = Number(props.dotSize) || 2;
          const totalSize = Number(props.totalSize) || 4;
          const colors = Array.isArray(props.colors) && props.colors.length > 0 ? props.colors : [[245, 158, 11], [59, 130, 246]];
          const opacities = Array.isArray(props.opacities) && props.opacities.length > 0 ? props.opacities : [0.1, 0.2, 0.4, 0.6, 0.8, 1.0];

          root.innerHTML = \`
            <div class="relative flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-xl overflow-hidden w-full max-w-md">
              <div class="absolute inset-0 opacity-80" id="matrix-canvas-container"></div>
              <div class="relative z-10 text-center space-y-2 py-8 px-4">
                <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>\${compName} Live Matrix</span>
                </div>
                <h3 class="text-xl font-bold tracking-tight text-white font-mono">\${props.children || compName}</h3>
                <p class="text-xs text-slate-400 max-w-xs mx-auto">
                  Interactive DotMatrix canvas rendering with \${totalSize}px grid spacing & \${dotSize}px dot radius.
                </p>
              </div>
            </div>
          \`;

          const container = document.getElementById("matrix-canvas-container");
          if (container) {
            const canvas = document.createElement("canvas");
            canvas.width = 400;
            canvas.height = 240;
            canvas.className = "w-full h-full object-cover";
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const cols = Math.floor(canvas.width / (totalSize * 4 || 16));
              const rows = Math.floor(canvas.height / (totalSize * 4 || 16));
              const step = totalSize * 4 || 16;

              for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                  const x = c * step + step / 2;
                  const y = r * step + step / 2;
                  const opIndex = (r * cols + c) % opacities.length;
                  const opacity = opacities[opIndex] || 0.3;
                  const colorPair = colors[(r + c) % colors.length] || [245, 158, 11];

                  ctx.beginPath();
                  ctx.arc(x, y, dotSize, 0, Math.PI * 2);
                  ctx.fillStyle = \`rgba(\${colorPair[0] || 245}, \${colorPair[1] || 158}, \${colorPair[2] || 11}, \${opacity})\`;
                  ctx.fill();
                }
              }
            }
            container.appendChild(canvas);
          }
        }
        // 2. Button
        else if (lowerName.includes("button")) {
          const variant = props.variant || 'default';
          const size = props.size || 'default';
          const label = props.children || props.text || compName;
          const disabled = Boolean(props.disabled);

          let variantClasses = "bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm active:scale-[0.98]";
          if (variant === "destructive") variantClasses = "bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]";
          if (variant === "outline") variantClasses = "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-sm active:scale-[0.98]";
          if (variant === "secondary") variantClasses = "bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-[0.98]";
          if (variant === "ghost") variantClasses = "hover:bg-slate-100 text-slate-700 active:scale-[0.98]";
          if (variant === "link") variantClasses = "text-amber-600 underline-offset-4 hover:underline p-0";

          let sizeClasses = "h-9 px-4 py-2 text-sm";
          if (size === "sm") sizeClasses = "h-8 rounded-md px-3 text-xs";
          if (size === "lg") sizeClasses = "h-10 rounded-md px-6 text-base";
          if (size === "icon") sizeClasses = "h-9 w-9 p-0 flex items-center justify-center";

          root.innerHTML = \`
            <button
              id="interactive-component"
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer \${variantClasses} \${sizeClasses}"
              \${disabled ? "disabled" : ""}
            >
              <span>\${label}</span>
            </button>
          \`;

          const btn = document.getElementById("interactive-component");
          if (btn && !disabled) {
            btn.addEventListener("click", () => {
              btn.classList.add("ring-2", "ring-amber-400");
              setTimeout(() => btn.classList.remove("ring-2", "ring-amber-400"), 300);
              postToParent("EVENT", { event: "click", component: compName });
            });
          }
        }
        // 3. Card subcomponents
        else if (lowerName === "cardtitle") {
          root.innerHTML = \`
            <div class="p-4 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
              <h3 class="text-2xl font-bold tracking-tight text-slate-900 font-sans">\${props.children || compName}</h3>
              <p class="text-xs text-slate-400 font-mono mt-1">CardTitle Primitive</p>
            </div>
          \`;
        }
        else if (lowerName === "carddescription") {
          root.innerHTML = \`
            <div class="p-4 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
              <p class="text-sm text-slate-600 leading-relaxed max-w-sm">\${props.children || "Descriptive subtitle rendered inside the card header context."}</p>
              <p class="text-xs text-slate-400 font-mono mt-1">CardDescription Primitive</p>
            </div>
          \`;
        }
        else if (lowerName === "cardheader") {
          root.innerHTML = \`
            <div class="rounded-xl border border-slate-200 bg-white p-6 max-w-sm w-full shadow-sm space-y-1.5">
              <h3 class="text-lg font-bold text-slate-900 leading-none tracking-tight">\${props.title || "Header Title"}</h3>
              <p class="text-xs text-slate-500">\${props.description || "Header supporting caption."}</p>
            </div>
          \`;
        }
        else if (lowerName === "cardcontent") {
          root.innerHTML = \`
            <div class="rounded-xl border border-slate-200 bg-white p-6 max-w-sm w-full shadow-sm text-sm text-slate-700 leading-relaxed">
              \${props.children || "Main card content container rendering arbitrary body elements."}
            </div>
          \`;
        }
        else if (lowerName === "cardfooter") {
          root.innerHTML = \`
            <div class="rounded-xl border border-slate-200 bg-white p-4 max-w-sm w-full shadow-sm flex items-center justify-end gap-2">
              <button class="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700">Cancel</button>
              <button class="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs">Action</button>
            </div>
          \`;
        }
        else if (lowerName.includes("card")) {
          const title = props.title || props.name || compName;
          const description = props.description || "Component surface container with elevation";
          const content = props.children || "Visual preview representation demonstrating card border, spacing, and elevation hierarchy.";

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
                <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs">Save</button>
              </div>
            </div>
          \`;
        }
        // 4. Badge / Tag
        else if (lowerName.includes("badge") || lowerName.includes("tag")) {
          const text = props.children || props.text || compName;
          const variant = props.variant || "default";

          let colorClass = "bg-amber-100 text-amber-800 border-amber-200";
          if (variant === "secondary") colorClass = "bg-slate-100 text-slate-700 border-slate-200";
          if (variant === "destructive") colorClass = "bg-red-50 text-red-700 border-red-200";
          if (variant === "outline") colorClass = "bg-transparent text-slate-800 border-slate-300";
          if (variant === "success") colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";

          root.innerHTML = \`
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border shadow-xs \${colorClass}">
              \${text}
            </span>
          \`;
        }
        // 5. Avatar
        else if (lowerName.includes("avatar")) {
          root.innerHTML = \`
            <div class="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div class="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-amber-100 text-amber-900 font-bold text-sm flex items-center justify-center shadow-xs">
                <span>CX</span>
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-900">\${props.name || "Alex Morgan"}</div>
                <div class="text-xs text-slate-500 font-mono">\${props.email || "alex@example.com"}</div>
              </div>
            </div>
          \`;
        }
        // 6. Switch / Toggle
        else if (lowerName.includes("switch") || lowerName.includes("toggle")) {
          let checked = Boolean(props.checked !== false);
          root.innerHTML = \`
            <div class="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer select-none" id="switch-container">
              <div id="switch-track" class="w-11 h-6 \${checked ? 'bg-amber-500' : 'bg-slate-200'} rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center">
                <div id="switch-thumb" class="bg-white w-4 h-4 rounded-full shadow-md transform \${checked ? 'translate-x-5' : 'translate-x-0'} transition-transform duration-200 ease-in-out"></div>
              </div>
              <span class="text-xs font-medium text-slate-700">\${props.label || compName}</span>
            </div>
          \`;
          const container = document.getElementById("switch-container");
          if (container) {
            container.addEventListener("click", () => {
              checked = !checked;
              const track = document.getElementById("switch-track");
              const thumb = document.getElementById("switch-thumb");
              if (track && thumb) {
                track.className = \`w-11 h-6 \${checked ? 'bg-amber-500' : 'bg-slate-200'} rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center\`;
                thumb.className = \`bg-white w-4 h-4 rounded-full shadow-md transform \${checked ? 'translate-x-5' : 'translate-x-0'} transition-transform duration-200 ease-in-out\`;
              }
              postToParent("EVENT", { event: "change", checked });
            });
          }
        }
        // 7. Checkbox
        else if (lowerName.includes("checkbox")) {
          let checked = Boolean(props.checked !== false);
          root.innerHTML = \`
            <label class="inline-flex items-center gap-2.5 p-3 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer select-none" id="chk-label">
              <input type="checkbox" id="chk-input" \${checked ? 'checked' : ''} class="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500">
              <span class="text-xs font-medium text-slate-800">\${props.label || props.children || compName}</span>
            </label>
          \`;
        }
        // 8. Slider / Range
        else if (lowerName.includes("slider") || lowerName.includes("range")) {
          const val = props.value || props.defaultValue || 50;
          root.innerHTML = \`
            <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm w-full max-w-xs space-y-2">
              <div class="flex justify-between text-xs font-mono text-slate-600">
                <span>\${props.label || compName}</span>
                <span id="slider-val" class="font-bold text-amber-600">\${val}%</span>
              </div>
              <input type="range" min="0" max="100" value="\${val}" id="live-slider" class="w-full accent-amber-500 cursor-pointer">
            </div>
          \`;
          const s = document.getElementById("live-slider");
          if (s) {
            s.addEventListener("input", (e) => {
              const v = document.getElementById("slider-val");
              if (v) v.textContent = e.target.value + '%';
            });
          }
        }
        // 9. Progress
        else if (lowerName.includes("progress")) {
          const val = Number(props.value) || 68;
          root.innerHTML = \`
            <div class="p-5 bg-white rounded-xl border border-slate-200 shadow-sm w-full max-w-xs space-y-2.5">
              <div class="flex justify-between text-xs font-medium text-slate-700">
                <span>\${props.label || "Analysis Progress"}</span>
                <span class="font-mono text-amber-600 font-bold">\${val}%</span>
              </div>
              <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full transition-all duration-500" style="width: \${val}%"></div>
              </div>
            </div>
          \`;
        }
        // 10. Accordion / Collapsible
        else if (lowerName.includes("accordion") || lowerName.includes("collapsible")) {
          let open = true;
          root.innerHTML = \`
            <div class="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden" id="acc-root">
              <div class="p-4 flex items-center justify-between font-medium text-xs text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100" id="acc-trigger">
                <span>\${props.title || "Is this component accessible?"}</span>
                <span id="acc-chevron" class="text-slate-400 transform transition-transform duration-200 font-mono">\${open ? '▲' : '▼'}</span>
              </div>
              <div id="acc-content" class="p-4 text-xs text-slate-600 leading-relaxed bg-slate-50/50 \${open ? '' : 'hidden'}">
                \${props.children || "Yes. It adheres strictly to WAI-ARIA design patterns and handles keyboard navigation."}
              </div>
            </div>
          \`;
          const trigger = document.getElementById("acc-trigger");
          if (trigger) {
            trigger.addEventListener("click", () => {
              open = !open;
              const c = document.getElementById("acc-content");
              const chev = document.getElementById("acc-chevron");
              if (c && chev) {
                c.className = \`p-4 text-xs text-slate-600 leading-relaxed bg-slate-50/50 \${open ? '' : 'hidden'}\`;
                chev.textContent = open ? '▲' : '▼';
              }
            });
          }
        }
        // 11. Tabs
        else if (lowerName.includes("tabs") || lowerName.includes("tab")) {
          let activeTab = 0;
          const tabNames = ["Account", "Password", "Settings"];
          root.innerHTML = \`
            <div class="w-full max-w-sm p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
              <div class="flex p-1 bg-slate-100 rounded-lg text-xs font-medium">
                \${tabNames.map((t, i) => \`<button class="tab-btn flex-1 py-1.5 rounded-md text-center transition-all \${i === 0 ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}" data-tab="\${i}">\${t}</button>\`).join('')}
              </div>
              <div id="tab-content-panel" class="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 min-h-[60px] flex items-center justify-center">
                Managing \${tabNames[0]} configuration settings.
              </div>
            </div>
          \`;
          document.querySelectorAll('.tab-btn').forEach(b => {
            b.addEventListener('click', (e) => {
              const idx = Number(e.currentTarget.getAttribute('data-tab'));
              document.querySelectorAll('.tab-btn').forEach((btn, i) => {
                btn.className = \`tab-btn flex-1 py-1.5 rounded-md text-center transition-all \${i === idx ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}\`;
              });
              const panel = document.getElementById('tab-content-panel');
              if (panel) panel.textContent = \`Managing \${tabNames[idx]} configuration settings.\`;
            });
          });
        }
        // 12. Alert
        else if (lowerName.includes("alert")) {
          root.innerHTML = \`
            <div class="rounded-xl border border-amber-200 bg-amber-50/80 p-4 max-w-sm w-full shadow-sm text-left flex gap-3">
              <span class="text-amber-600 text-base shrink-0">⚡</span>
              <div class="space-y-1">
                <h4 class="text-xs font-semibold text-amber-900">\${props.title || compName}</h4>
                <p class="text-xs text-amber-800 leading-relaxed">
                  \${props.children || "You can add components to your app using the CLI or standard package installs."}
                </p>
              </div>
            </div>
          \`;
        }
        // 13. Skeleton
        else if (lowerName.includes("skeleton")) {
          root.innerHTML = \`
            <div class="w-full max-w-xs p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div class="h-4 bg-slate-200 rounded-md animate-pulse w-3/4"></div>
              <div class="h-3 bg-slate-100 rounded-md animate-pulse w-full"></div>
              <div class="h-3 bg-slate-100 rounded-md animate-pulse w-5/6"></div>
              <div class="h-8 bg-slate-200 rounded-md animate-pulse w-1/3 mt-2"></div>
            </div>
          \`;
        }
        // 14. Input / Textarea
        else if (lowerName.includes("input") || lowerName.includes("textfield") || category === "form") {
          const placeholder = props.placeholder || "Enter text here...";
          const label = props.label || props.name || compName;
          const type = props.type || "text";

          root.innerHTML = \`
            <div class="w-full max-w-xs space-y-1.5 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label class="block text-xs font-medium text-slate-700 font-mono">\${label}</label>
              <input
                type="\${type}"
                placeholder="\${placeholder}"
                class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
              />
            </div>
          \`;
        }
        // 15. Dialog / Modal
        else if (lowerName.includes("dialog") || lowerName.includes("modal") || category === "modal") {
          root.innerHTML = \`
            <div class="relative w-full max-w-md">
              <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-semibold text-slate-900">\${props.title || compName}</h3>
                  <button type="button" class="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">
                  \${props.children || "Are you sure you want to proceed with this operation? Changes will be recorded in the local repository model."}
                </p>
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-500 text-slate-950 font-semibold hover:bg-amber-600">Continue</button>
                </div>
              </div>
            </div>
          \`;
        }
        // 16. Fallback: Attempt JSX extraction from sourceCode, else interactive component card
        else {
          const extractedHtml = tryExtractJsx(source, props, compName);
          if (extractedHtml) {
            root.innerHTML = extractedHtml;
          } else {
            // High-fidelity interactive component representation
            root.innerHTML = \`
              <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-md max-w-sm w-full space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h4 class="font-bold text-sm text-slate-900 font-sans">\${compName}</h4>
                  </div>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">\${category}</span>
                </div>

                <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2">
                  <div class="w-10 h-10 mx-auto rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center font-bold font-mono text-sm">
                    &lt;/&gt;
                  </div>
                  <div class="text-xs font-semibold text-slate-800">\${props.children || compName}</div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    Interactive primitive ready for composition. Adjust live props in the right controller.
                  </p>
                </div>

                \${Object.keys(props).length > 0 ? \`
                  <div class="pt-2 border-t border-slate-100 space-y-1.5">
                    <div class="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Active Prop Bindings</div>
                    <div class="flex flex-wrap gap-1">
                      \${Object.entries(props).slice(0, 4).map(([k, v]) => \`
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          <strong class="text-amber-600">\${k}:</strong> \${typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      \`).join('')}
                    </div>
                  </div>
                \` : ''}
              </div>
            \`;
          }
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
