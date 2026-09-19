"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy, FileCode, Maximize2, Minimize2 } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";

interface CodeViewerProps {
  code: string;
  language?: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  className?: string;
}

export function CodeViewer({
  code,
  language = "tsx",
  filePath,
  lineStart,
  lineEnd,
  className = "",
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const highlightedHtml = useMemo(() => {
    if (!code) return "";
    try {
      const grammar =
        Prism.languages[language] ||
        Prism.languages.typescript ||
        Prism.languages.javascript;
      if (grammar) {
        return Prism.highlight(code, grammar, language);
      }
      return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } catch {
      return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }, [code, language]);

  const lines = useMemo(() => {
    return code.split("\n");
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-lg border border-border bg-[#191815] text-[#D8D3C9] overflow-hidden flex flex-col font-mono text-xs shadow-subtle ${
        isExpanded ? "fixed inset-4 z-50 shadow-2xl" : className
      }`}
    >
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#211F1B] border-b border-[#39362F] select-none text-[11px]">
        <div className="flex items-center gap-2 truncate">
          <FileCode className="w-3.5 h-3.5 text-primary shrink-0" />
          {filePath && (
            <span className="font-semibold text-[#F1EEE7] truncate">
              {filePath}
            </span>
          )}
          {lineStart !== undefined && lineEnd !== undefined && (
            <span className="text-[#817C72] text-[10px] shrink-0">
              L{lineStart}-{lineEnd} ({lines.length} lines)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#2A2823] text-[#B8B3A8] border border-[#39362F] uppercase font-semibold">
            {language}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#2A2823] hover:bg-[#302E28] text-[#D8D3C9] hover:text-[#F1EEE7] transition-colors border border-[#39362F]"
            title="Copy component source code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-semantic-green" />
                <span className="text-[10px] text-semantic-green">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-[#2A2823] hover:bg-[#302E28] text-[#D8D3C9] hover:text-[#F1EEE7] transition-colors border border-[#39362F]"
            title={isExpanded ? "Exit fullscreen" : "Fullscreen viewer"}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code Area with Line Numbers */}
      <div className="flex-1 overflow-auto p-3 text-[12px] leading-relaxed">
        <div className="flex">
          {/* Gutter / Line Numbers */}
          <div className="select-none pr-4 text-right text-[#68635A] font-mono text-[11px] border-r border-[#39362F]/60 shrink-0">
            {lines.map((_, i) => (
              <div key={i} className="leading-relaxed">
                {lineStart ? lineStart + i : i + 1}
              </div>
            ))}
          </div>

          {/* Syntax Highlighted Code */}
          <div className="pl-4 flex-1 overflow-x-auto">
            <pre className="!bg-transparent !p-0 !m-0 !font-mono overflow-visible">
              <code
                className={`language-${language} font-mono`}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
