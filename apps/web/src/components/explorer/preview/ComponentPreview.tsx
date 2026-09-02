"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  Grid,
  CircleDot,
  Moon,
  Sun,
  Layers,
  RotateCcw,
  ShieldCheck,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
} from "lucide-react";
import type { DiscoveredComponent, ComponentProp } from "@codexel/shared";
import {
  generateSandboxDoc,
  evaluatePreviewFeasibility,
} from "./sandbox-bundle";
import { ComponentFallbackPlaceholder } from "./ComponentFallbackPlaceholder";

interface ComponentPreviewProps {
  component: DiscoveredComponent;
  onNavigateToTab: (tab: "code" | "props" | "usage" | "deps") => void;
}

type ViewportMode = "desktop" | "tablet" | "mobile";
type BackgroundStyle = "grid" | "dots" | "plain" | "dark" | "checker";

export function ComponentPreview({
  component,
  onNavigateToTab,
}: ComponentPreviewProps) {
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [background, setBackground] = useState<BackgroundStyle>("grid");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showPropsPanel, setShowPropsPanel] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Initial prop values derived from component prop specifications
  const initialPropValues = useMemo(() => {
    const defaults: Record<string, any> = {};

    for (const prop of component.props) {
      if (prop.defaultValue !== undefined) {
        // Strip quotes if string literal default
        let val: any = prop.defaultValue.replace(/^['"]|['"]$/g, "");
        if (val === "true") val = true;
        if (val === "false") val = false;
        defaults[prop.name] = val;
      } else if (prop.type.includes("boolean")) {
        defaults[prop.name] = false;
      } else if (prop.name === "variant") {
        defaults[prop.name] = "default";
      } else if (prop.name === "size") {
        defaults[prop.name] = "default";
      } else if (prop.name === "children" || prop.name === "text") {
        defaults[prop.name] = component.name;
      }
    }

    if (!defaults.children && !defaults.text) {
      defaults.children = component.name;
    }

    return defaults;
  }, [component]);

  const [propValues, setPropValues] = useState<Record<string, any>>(initialPropValues);

  // Reset props when component changes
  useEffect(() => {
    setPropValues(initialPropValues);
  }, [initialPropValues]);

  // Check if component can be rendered safely in isolated sandbox
  const feasibility = useMemo(() => {
    return evaluatePreviewFeasibility(component);
  }, [component]);

  // Generate sandboxed srcDoc
  const sandboxHtml = useMemo(() => {
    if (!feasibility.isRenderable) return "";
    return generateSandboxDoc({
      component,
      propValues,
      background,
      zoomLevel,
    });
  }, [feasibility.isRenderable, component, propValues, background, zoomLevel, reloadKey]);

  const handlePropChange = (name: string, value: any) => {
    setPropValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetProps = () => {
    setPropValues(initialPropValues);
    setReloadKey((k) => k + 1);
  };

  if (!feasibility.isRenderable) {
    return (
      <ComponentFallbackPlaceholder
        component={component}
        blockers={feasibility.blockers}
        reason={feasibility.reason}
        onNavigateToTab={onNavigateToTab}
      />
    );
  }

  // Parse enum options from union type strings like "'default' | 'destructive' | 'outline'"
  const parseEnumOptions = (typeStr: string): string[] => {
    if (!typeStr.includes("|")) return [];
    return typeStr
      .split("|")
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
      .filter((s) => s.length > 0 && !s.includes("("));
  };

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden select-none">
      {/* Top Preview Control Bar */}
      <div className="px-4 py-2 bg-surface border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Viewport switcher */}
        <div className="flex items-center gap-1 bg-surface-secondary p-0.5 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            title="Desktop Viewport (100%)"
            className={`p-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 transition-colors ${
              viewport === "desktop"
                ? "bg-surface text-primary shadow-subtle font-semibold"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport("tablet")}
            title="Tablet Viewport (768px)"
            className={`p-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 transition-colors ${
              viewport === "tablet"
                ? "bg-surface text-primary shadow-subtle font-semibold"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport("mobile")}
            title="Mobile Viewport (375px)"
            className={`p-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 transition-colors ${
              viewport === "mobile"
                ? "bg-surface text-primary shadow-subtle font-semibold"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Canvas Background and Zoom controls */}
        <div className="flex items-center gap-2">
          {/* Background styles */}
          <div className="flex items-center gap-1 bg-surface-secondary p-0.5 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setBackground("grid")}
              title="Blueprint Grid Canvas"
              className={`p-1.5 rounded-md transition-colors ${
                background === "grid"
                  ? "bg-surface text-primary shadow-subtle"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setBackground("dots")}
              title="Dotted Canvas"
              className={`p-1.5 rounded-md transition-colors ${
                background === "dots"
                  ? "bg-surface text-primary shadow-subtle"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setBackground("plain")}
              title="Plain White Canvas"
              className={`p-1.5 rounded-md transition-colors ${
                background === "plain"
                  ? "bg-surface text-primary shadow-subtle"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setBackground("dark")}
              title="Dark Blueprint Canvas"
              className={`p-1.5 rounded-md transition-colors ${
                background === "dark"
                  ? "bg-surface text-primary shadow-subtle"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-surface-secondary p-0.5 rounded-lg border border-border text-xs font-mono">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              title="Zoom out"
              className="p-1 rounded text-foreground-muted hover:text-foreground"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1 text-[11px] text-foreground font-semibold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
              title="Zoom in"
              className="p-1 rounded text-foreground-muted hover:text-foreground"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Props Toolbar Toggle */}
          <button
            type="button"
            onClick={() => setShowPropsPanel((v) => !v)}
            title="Toggle Live Props Controller"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
              showPropsPanel
                ? "bg-primary/10 border-primary/20 text-primary font-semibold"
                : "bg-surface border-border text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Live Props</span>
          </button>

          {/* Re-render sandbox */}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            title="Reload Sandbox"
            className="p-1.5 rounded-md bg-surface hover:bg-surface-secondary border border-border text-foreground-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Area with Sandbox iframe & Optional Live Props sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Iframe Container */}
        <div className="flex-1 h-full flex items-center justify-center p-4 overflow-auto bg-surface-secondary/20">
          <div
            className={`h-full w-full flex items-center justify-center transition-all duration-200 ${
              viewport === "tablet"
                ? "max-w-[768px] border-2 border-border shadow-2xl rounded-2xl overflow-hidden bg-surface"
                : viewport === "mobile"
                  ? "max-w-[375px] border-2 border-border shadow-2xl rounded-3xl overflow-hidden bg-surface"
                  : "w-full"
            }`}
          >
            <iframe
              key={reloadKey}
              sandbox="allow-scripts"
              srcDoc={sandboxHtml}
              title={`${component.name} Isolated Preview`}
              className="w-full h-full border-0 rounded-md"
            />
          </div>
        </div>

        {/* Live Props Controller Drawer / Panel */}
        {showPropsPanel && (
          <div className="w-72 bg-surface border-l border-border flex flex-col shrink-0 overflow-y-auto shadow-panel">
            <div className="p-3 border-b border-border bg-surface-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                  Live Props Controls
                </h4>
              </div>
              <button
                type="button"
                onClick={handleResetProps}
                className="text-[10px] font-mono text-primary hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="p-3.5 space-y-4">
              {/* Children / Text Prop */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-semibold text-foreground-secondary flex items-center justify-between">
                  <span>children / label</span>
                  <span className="text-[9px] text-foreground-muted font-normal">string</span>
                </label>
                <input
                  type="text"
                  value={propValues.children || propValues.text || ""}
                  onChange={(e) => {
                    handlePropChange("children", e.target.value);
                    handlePropChange("text", e.target.value);
                  }}
                  className="w-full text-xs font-mono bg-surface-secondary border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                  placeholder={component.name}
                />
              </div>

              {/* Inspect other detected props */}
              {component.props.map((prop) => {
                if (prop.name === "children" || prop.name === "text" || prop.name === "className" || prop.name === "asChild") {
                  return null;
                }

                const enumOpts = parseEnumOptions(prop.type);
                const isBoolean = prop.type.includes("boolean");

                return (
                  <div key={prop.name} className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold text-foreground-secondary flex items-center justify-between">
                      <span className="truncate">{prop.name}</span>
                      <span className="text-[9px] text-foreground-muted font-normal truncate max-w-[100px]">
                        {prop.type}
                      </span>
                    </label>

                    {/* Enum dropdown */}
                    {enumOpts.length > 0 ? (
                      <select
                        value={propValues[prop.name] ?? enumOpts[0]}
                        onChange={(e) => handlePropChange(prop.name, e.target.value)}
                        className="w-full text-xs font-mono bg-surface-secondary border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                      >
                        {enumOpts.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : isBoolean ? (
                      /* Boolean switch */
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`prop-${prop.name}`}
                          checked={Boolean(propValues[prop.name])}
                          onChange={(e) => handlePropChange(prop.name, e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-primary focus:ring-0 border-border"
                        />
                        <label
                          htmlFor={`prop-${prop.name}`}
                          className="text-xs font-mono text-foreground-secondary cursor-pointer select-none"
                        >
                          {propValues[prop.name] ? "true" : "false"}
                        </label>
                      </div>
                    ) : (
                      /* Generic string input */
                      <input
                        type="text"
                        value={propValues[prop.name] || ""}
                        onChange={(e) => handlePropChange(prop.name, e.target.value)}
                        placeholder={prop.defaultValue || "default"}
                        className="w-full text-xs font-mono bg-surface-secondary border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                      />
                    )}
                  </div>
                );
              })}

              {/* Disabled switch if supported */}
              <div className="pt-2 border-t border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-foreground-secondary">
                    disabled
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(propValues.disabled)}
                    onChange={(e) => handlePropChange("disabled", e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-primary focus:ring-0 border-border"
                  />
                </div>
              </div>
            </div>

            {/* Security Guarantee Box at bottom of props panel */}
            <div className="mt-auto p-3 m-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Strict CSP Enforced</span>
              </div>
              <p className="text-[10px] font-mono leading-tight text-foreground-muted">
                Isolated sandbox execution with null origin. Parent storage &amp; network exfiltration blocked.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-4 py-1.5 bg-surface border-t border-border flex items-center justify-between text-[11px] font-mono text-foreground-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            SANDBOX ACTIVE
          </span>
          <span>Target: {component.filePath}</span>
        </div>

        <div className="flex items-center gap-4">
          <span>Viewport: {viewport}</span>
          <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
