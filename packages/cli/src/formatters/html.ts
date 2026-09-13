import type { RepositoryModel } from "@codexel/shared";

export function generateStandaloneHtml(model: RepositoryModel): string {
  const modelJson = JSON.stringify(model);
  const projectName = model.metadata?.name || "Project";
  const title = `Codexel Analysis — ${projectName}`;

  const totalFiles =
    model.fileSystem?.totalFiles ?? model.fileSystem?.files?.length ?? 0;
  const totalLoc = (model.fileSystem?.totalLinesOfCode ?? 0).toLocaleString();
  const componentsList = model.components?.components || [];
  const totalComponents =
    model.components?.totalComponents ?? componentsList.length;
  const routesList = model.routes?.routes || [];
  const layersList = model.architecture?.layers || [];
  const colorsList = model.designSystem?.colorPalette || [];
  const frameworks = (model.technologyStack?.frameworks || [])
    .map((f) => f.name)
    .join(", ");
  const styling = model.technologyStack?.styling || [];
  const uiLibraries = model.technologyStack?.uiLibraries || [];
  const database = model.technologyStack?.database || [];
  const durationMs = model.analysisStats?.totalDurationMs ?? 0;
  const engineVersion = model.analysisStats?.engineVersion || "1.0.0";

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #0a0d14;
      --bg-card: rgba(18, 24, 38, 0.75);
      --bg-card-hover: rgba(28, 36, 56, 0.85);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-glow: rgba(56, 189, 248, 0.2);
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #38bdf8;
      --primary-gradient: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
      --accent-green: #34d399;
      --accent-purple: #a855f7;
      --accent-amber: #fbbf24;
      --accent-rose: #fb7185;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-main);
      color: var(--text-main);
      min-height: 100vh;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.07) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(168, 85, 247, 0.06) 0%, transparent 40%);
    }

    header {
      border-bottom: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      background: rgba(10, 13, 20, 0.8);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--primary-gradient);
      display: grid;
      place-items: center;
      font-weight: 800;
      color: #000;
      font-family: 'Outfit', sans-serif;
      font-size: 1.1rem;
    }
    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.1);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.2);
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .btn {
      padding: 0.45rem 0.9rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .btn-primary {
      background: var(--primary);
      color: #000;
      font-weight: 600;
      border: none;
    }
    .btn-primary:hover {
      background: #7dd3fc;
    }

    main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Tabs Navigation */
    .tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 2rem;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 0.75rem 1.25rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-muted);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: var(--text-main);
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    /* Grid & Cards */
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      backdrop-filter: blur(8px);
      transition: border-color 0.2s;
    }
    .card:hover {
      border-color: var(--border-glow);
    }
    .stat-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      margin-bottom: 0.35rem;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
      color: #fff;
    }
    .stat-detail {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Badges & Pills */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      color: var(--text-main);
    }
    .pill-blue { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border-color: rgba(56, 189, 248, 0.25); }
    .pill-purple { background: rgba(168, 85, 247, 0.12); color: #c084fc; border-color: rgba(168, 85, 247, 0.25); }
    .pill-green { background: rgba(52, 211, 153, 0.12); color: #34d399; border-color: rgba(52, 211, 153, 0.25); }
    .pill-yellow { background: rgba(251, 191, 36, 0.12); color: #fbbf24; border-color: rgba(251, 191, 36, 0.25); }

    /* Search & Filter Bar */
    .filter-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .search-input {
      flex: 1;
      min-width: 250px;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: rgba(0, 0, 0, 0.3);
      color: #fff;
      font-size: 0.9rem;
      outline: none;
    }
    .search-input:focus {
      border-color: var(--primary);
    }
    .select-input {
      padding: 0.6rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: #111827;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
    }

    /* Component Cards */
    .components-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.25rem;
    }
    .comp-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .comp-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      background: var(--bg-card-hover);
    }
    .comp-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .comp-name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--primary);
    }
    .comp-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-dim);
      word-break: break-all;
    }
    .props-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.25rem;
    }
    .prop-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      padding: 0.15rem 0.45rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      color: var(--accent-amber);
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-card);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    th {
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-dim);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }
    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--text-main);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    /* Palette Swatches */
    .palette-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
    }
    .swatch-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .swatch-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
    }
    .swatch-color {
      height: 70px;
      width: 100%;
    }
    .swatch-info {
      padding: 0.6rem;
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
    }

    /* JSON Viewer */
    pre.code-block {
      background: #07090e;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.25rem;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #e2e8f0;
      max-height: 600px;
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <div class="brand-title">Codexel</div>
      <span class="brand-badge">CLI Report</span>
    </div>
    <div class="header-meta">
      <span><strong>Project:</strong> ${escapeHtml(projectName)}</span>
      <span><strong>Files:</strong> ${totalFiles}</span>
      <span><strong>Total LOC:</strong> ${totalLoc}</span>
      <button class="btn btn-primary" onclick="downloadJson()">⬇ Export Model JSON</button>
    </div>
  </header>

  <main>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('overview')">📊 Overview & Architecture</button>
      <button class="tab-btn" onclick="switchTab('components')">🧩 Component Explorer (${totalComponents})</button>
      <button class="tab-btn" onclick="switchTab('routes')">🛣️ Routes & APIs (${routesList.length})</button>
      <button class="tab-btn" onclick="switchTab('design')">🎨 Design System</button>
      <button class="tab-btn" onclick="switchTab('raw')">📄 Raw Model</button>
    </div>

    <!-- 1. Overview Tab -->
    <div id="tab-overview" class="tab-content active">
      <div class="grid-stats">
        <div class="card">
          <div class="stat-label">Total Files</div>
          <div class="stat-value">${totalFiles}</div>
          <div class="stat-detail">Across entire codebase</div>
        </div>
        <div class="card">
          <div class="stat-label">Lines of Code</div>
          <div class="stat-value">${totalLoc}</div>
          <div class="stat-detail">Excluding ignored folders</div>
        </div>
        <div class="card">
          <div class="stat-label">UI Components</div>
          <div class="stat-value">${totalComponents}</div>
          <div class="stat-detail">Discovered & mapped</div>
        </div>
        <div class="card">
          <div class="stat-label">Analysis Duration</div>
          <div class="stat-value">${durationMs} <span style="font-size: 1rem;">ms</span></div>
          <div class="stat-detail">Engine v${escapeHtml(engineVersion)}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="card">
          <div class="section-title">🛠️ Technology Stack</div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div>
              <span class="stat-label">Framework</span><br>
              <span class="pill pill-blue">${escapeHtml(frameworks || "Standard / Vanilla JS")}</span>
            </div>
            <div>
              <span class="stat-label">Language</span><br>
              <span class="pill pill-purple">${escapeHtml(model.technologyStack?.primaryLanguage || "TypeScript")}</span>
            </div>
            <div>
              <span class="stat-label">Styling</span><br>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.2rem;">
                ${
                  styling.length > 0
                    ? styling
                        .map(
                          (s) =>
                            `<span class="pill pill-green">${escapeHtml(s.name)}</span>`,
                        )
                        .join("")
                    : '<span class="pill">Standard CSS</span>'
                }
              </div>
            </div>
            <div>
              <span class="stat-label">UI Libraries & Primitives</span><br>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.2rem;">
                ${
                  uiLibraries.length > 0
                    ? uiLibraries
                        .map(
                          (u) =>
                            `<span class="pill pill-purple">${escapeHtml(u.name)}</span>`,
                        )
                        .join("")
                    : '<span class="pill">None detected</span>'
                }
              </div>
            </div>
            <div>
              <span class="stat-label">Database & ORM</span><br>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.2rem;">
                ${
                  database.length > 0
                    ? database
                        .map(
                          (d) =>
                            `<span class="pill pill-yellow">${escapeHtml(d.name)}</span>`,
                        )
                        .join("")
                    : '<span class="pill">None detected</span>'
                }
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="section-title">🏛️ Architectural Pattern</div>
          <p style="font-size: 1.1rem; font-weight: 600; color: var(--primary); margin-bottom: 0.5rem;">
            ${escapeHtml(model.routes?.routerType || "Modular Application")}
          </p>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.25rem;">
            Deterministic static structure synthesized from AST graphs and directory rules.
          </p>

          <div class="section-title" style="font-size: 1rem; margin-top: 1rem;">Detected Layers</div>
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${layersList
              .map(
                (layer) => `
              <div style="padding: 0.6rem; background: rgba(255,255,255,0.03); border-radius: 6px; border-left: 3px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 0.85rem;">
                  <span>${escapeHtml(layer.name)}</span>
                  <span class="pill" style="font-size: 0.75rem;">${layer.fileCount} files</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.2rem;">${escapeHtml(layer.role)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Component Explorer Tab -->
    <div id="tab-components" class="tab-content">
      <div class="filter-bar">
        <input type="text" id="compSearch" class="search-input" placeholder="Search components by name, prop, or path..." oninput="filterComponents()">
        <select id="categoryFilter" class="select-input" onchange="filterComponents()">
          <option value="ALL">All Categories</option>
          <option value="ui-primitive">UI Primitives</option>
          <option value="feature-component">Features</option>
          <option value="layout">Layouts</option>
          <option value="form">Forms</option>
        </select>
      </div>

      <div class="components-grid" id="componentsList">
        ${componentsList
          .map(
            (comp) => `
          <div class="comp-card" data-name="${escapeHtml(comp.name.toLowerCase())}" data-path="${escapeHtml(comp.filePath.toLowerCase())}" data-category="${escapeHtml(comp.category || "")}">
            <div class="comp-header">
              <span class="comp-name">${escapeHtml(comp.name)}</span>
              <span class="pill pill-blue">${escapeHtml(comp.category || "ui-primitive")}</span>
            </div>
            <div class="comp-path">${escapeHtml(comp.filePath)}</div>
            
            <div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.25rem;">PROPS (${comp.props?.length || 0})</div>
              <div class="props-list">
                ${
                  comp.props && comp.props.length > 0
                    ? comp.props
                        .map(
                          (p) =>
                            `<span class="prop-tag">${escapeHtml(p.name)}${p.isRequired ? "*" : ""}</span>`,
                        )
                        .join("")
                    : '<span style="font-size: 0.75rem; color: var(--text-dim);">No props required</span>'
                }
              </div>
            </div>

            <div style="margin-top: auto; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
              <span>Children: <strong>${comp.childComponents?.length || 0}</strong></span>
              <span>Used By: <strong>${comp.usedBy?.length || 0}</strong> components</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>

    <!-- 3. Routes Tab -->
    <div id="tab-routes" class="tab-content">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Route / Endpoint</th>
              <th>Kind</th>
              <th>File Path</th>
            </tr>
          </thead>
          <tbody>
            ${
              routesList.length > 0
                ? routesList
                    .map(
                      (r) => `
              <tr>
                <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--primary);">${escapeHtml(r.routePath)}</td>
                <td><span class="pill ${r.kind === "api" ? "pill-yellow" : "pill-purple"}">${escapeHtml(r.kind)}</span></td>
                <td style="font-family: 'JetBrains Mono', monospace; color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(r.filePath)}</td>
              </tr>
            `,
                    )
                    .join("")
                : `
              <tr><td colspan="3" style="text-align: center; color: var(--text-dim); padding: 2rem;">No routes or entrypoints detected.</td></tr>
            `
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. Design System Tab -->
    <div id="tab-design" class="tab-content">
      <div class="section-title">🎨 Color Palette (${colorsList.length})</div>
      <div class="palette-grid" style="margin-bottom: 2rem;">
        ${colorsList
          .map(
            (color) => `
          <div class="swatch-card" onclick="copyColor('${color.value}')" title="Click to copy">
            <div class="swatch-color" style="background-color: ${escapeHtml(color.value)};"></div>
            <div class="swatch-info">
              <div style="font-weight: 600; color: #fff;">${escapeHtml(color.name)}</div>
              <div style="color: var(--text-dim);">${escapeHtml(color.value)}</div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem;">
        <div class="card">
          <div class="section-title">🔤 Typography Ladder</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            Font Families: <strong style="color: #fff;">${escapeHtml((model.designSystem?.typography?.fontFamilies || []).join(", ") || "System Default")}</strong>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${(model.designSystem?.typography?.fontSizes || [])
              .map(
                (sz) => `
              <div style="display: flex; justify-content: space-between; padding: 0.4rem 0.6rem; background: rgba(255,255,255,0.03); border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;">
                <span>Font Size</span>
                <span style="color: var(--primary);">${escapeHtml(sz)}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>

        <div class="card">
          <div class="section-title">⚡ Top Tailwind Classes</div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
            ${(model.designSystem?.topTailwindClasses || [])
              .map(
                (cls) => `
              <span class="pill" style="font-family: 'JetBrains Mono', monospace;">
                ${escapeHtml(cls.className)} <span style="color: var(--text-dim);">(${cls.count})</span>
              </span>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Raw Model Tab -->
    <div id="tab-raw" class="tab-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div class="section-title" style="margin-bottom: 0;">📄 Complete JSON Repository Model</div>
        <button class="btn" onclick="copyModelJson()">📋 Copy JSON to Clipboard</button>
      </div>
      <pre class="code-block" id="rawJsonBlock">${escapeHtml(JSON.stringify(model, null, 2))}</pre>
    </div>
  </main>

  <script>
    const MODEL_DATA = ${modelJson};

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

      const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
      if (activeBtn) activeBtn.classList.add('active');

      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');
    }

    function filterComponents() {
      const q = (document.getElementById('compSearch').value || '').toLowerCase();
      const cat = document.getElementById('categoryFilter').value;
      const cards = document.querySelectorAll('.comp-card');

      cards.forEach(card => {
        const name = card.getAttribute('data-name') || '';
        const pth = card.getAttribute('data-path') || '';
        const cardCat = card.getAttribute('data-category') || '';

        const matchesQuery = !q || name.includes(q) || pth.includes(q);
        const matchesCategory = cat === 'ALL' || cardCat === cat;

        card.style.display = (matchesQuery && matchesCategory) ? 'flex' : 'none';
      });
    }

    function copyColor(val) {
      navigator.clipboard.writeText(val);
      alert('Color copied to clipboard: ' + val);
    }

    function copyModelJson() {
      navigator.clipboard.writeText(JSON.stringify(MODEL_DATA, null, 2));
      alert('Full Repository Model JSON copied to clipboard!');
    }

    function downloadJson() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(MODEL_DATA, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "${escapeHtml(projectName)}-codexel-model.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
