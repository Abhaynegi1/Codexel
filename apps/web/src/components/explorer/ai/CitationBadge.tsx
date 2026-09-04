"use client";

import React from "react";
import { FileCode, Layers, ExternalLink } from "lucide-react";

interface CitationBadgeProps {
  citation: string; // e.g. "src/components/ui/button.tsx:12-56" or "src/app/api/auth/route.ts"
  onClick?: (filePath: string, lineStart?: number, lineEnd?: number) => void;
}

export function parseCitation(raw: string): {
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
} {
  const clean = raw.replace(/^\[|\]$/g, "").trim();
  const colonIndex = clean.lastIndexOf(":");

  if (colonIndex !== -1) {
    const filePath = clean.substring(0, colonIndex);
    const linePart = clean.substring(colonIndex + 1);
    const parts = linePart.split("-");
    const startStr = parts[0] || "";
    const endStr = parts[1];
    const lineStart = parseInt(startStr, 10);
    const lineEnd = endStr ? parseInt(endStr, 10) : lineStart;

    if (!isNaN(lineStart)) {
      return { filePath, lineStart, lineEnd };
    }
  }

  return { filePath: clean };
}

export function CitationBadge({ citation, onClick }: CitationBadgeProps) {
  const { filePath, lineStart, lineEnd } = parseCitation(citation);
  const fileName = filePath.split("/").pop() || filePath;
  const isComponent = filePath.endsWith(".tsx") || filePath.endsWith(".jsx");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(filePath, lineStart, lineEnd);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Inspect ${filePath}${lineStart ? ` (Lines ${lineStart}-${lineEnd})` : ""}`}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 my-0.5 rounded text-[11px] font-mono bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all cursor-pointer select-none group align-baseline shadow-xs"
    >
      {isComponent ? (
        <Layers className="w-3 h-3 shrink-0 text-primary group-hover:scale-110 transition-transform" />
      ) : (
        <FileCode className="w-3 h-3 shrink-0 text-primary group-hover:scale-110 transition-transform" />
      )}
      <span className="font-semibold">{fileName}</span>
      {lineStart && (
        <span className="text-[10px] text-primary/70">
          :{lineStart}
          {lineEnd && lineEnd !== lineStart ? `-${lineEnd}` : ""}
        </span>
      )}
    </button>
  );
}

/**
 * Parses a markdown text string and replaces [path:lines] with interactive CitationBadge elements.
 */
export function renderMarkdownWithCitations(
  text: string,
  onSelectCitation?: (
    filePath: string,
    lineStart?: number,
    lineEnd?: number,
  ) => void,
): React.ReactNode[] {
  // Regex to match citations in format [path/to/file.ext:start-end] or [path/to/file.ext]
  const citationRegex =
    /\[([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+(?::\d+(?:-\d+)?)?)\]/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(text)) !== null) {
    // Add plain text before match
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    const citationText = match[1];
    if (citationText) {
      elements.push(
        <CitationBadge
          key={`citation-${match.index}-${citationText}`}
          citation={citationText}
          onClick={onSelectCitation}
        />,
      );
    }

    lastIndex = citationRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements;
}
