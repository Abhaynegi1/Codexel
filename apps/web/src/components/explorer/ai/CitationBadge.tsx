"use client";

import React from "react";
import { FileCode, Layers, Info } from "lucide-react";

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
      className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all cursor-pointer select-none group align-baseline shadow-xs"
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
 * Parses inline formatting: citations, bold (**text**), italics (*text*), and inline code (`code`)
 */
export function renderInlineMarkdown(
  text: string,
  onSelectCitation?: (
    filePath: string,
    lineStart?: number,
    lineEnd?: number,
  ) => void,
  keyPrefix = "inline",
): React.ReactNode[] {
  // Regex to match:
  // 1. Citations: [path/file.ext:1-10]
  // 2. Bold: **text**
  // 3. Inline Code: `code`
  // 4. Italics: *text* or _text_
  const tokenRegex =
    /(\[[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+(?::\d+(?:-\d+)?)?\])|(\*\*[^*]+\*\*)|(`[^`]+`)|(\*[^*]+\*)/g;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${tokenIdx++}`;

    // 1. Citation [file.ts:1-10]
    if (token.startsWith("[") && token.endsWith("]")) {
      const citationContent = token.slice(1, -1);
      result.push(
        <CitationBadge
          key={key}
          citation={citationContent}
          onClick={onSelectCitation}
        />,
      );
    }
    // 2. Bold **text**
    else if (token.startsWith("**") && token.endsWith("**")) {
      const boldContent = token.slice(2, -2);
      result.push(
        <strong key={key} className="font-bold text-foreground">
          {renderInlineMarkdown(boldContent, onSelectCitation, `${key}-b`)}
        </strong>,
      );
    }
    // 3. Inline code `code`
    else if (token.startsWith("`") && token.endsWith("`")) {
      const codeContent = token.slice(1, -1);
      result.push(
        <code
          key={key}
          className="px-1 py-0.5 mx-0.5 rounded text-[11px] font-mono bg-surface-secondary text-primary border border-border"
        >
          {codeContent}
        </code>,
      );
    }
    // 4. Italic *text*
    else if (token.startsWith("*") && token.endsWith("*")) {
      const italicContent = token.slice(1, -1);
      result.push(
        <em key={key} className="italic text-foreground-secondary">
          {renderInlineMarkdown(italicContent, onSelectCitation, `${key}-i`)}
        </em>,
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
}

/**
 * Parses full multi-line markdown with headings, lists, code blocks, alerts, and inline styling.
 */
export function renderMarkdownWithCitations(
  text: string,
  onSelectCitation?: (
    filePath: string,
    lineStart?: number,
    lineEnd?: number,
  ) => void,
): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = "";
  let codeBlockLines: string[] = [];
  let currentQuoteLines: string[] = [];

  const flushQuote = (idx: number) => {
    if (currentQuoteLines.length > 0) {
      const quoteText = currentQuoteLines.join("\n");
      const isAlert =
        quoteText.includes("[!NOTE]") ||
        quoteText.includes("[!TIP]") ||
        quoteText.includes("[!IMPORTANT]");
      const cleanText = quoteText
        .replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/g, "")
        .trim();

      blocks.push(
        <div
          key={`quote-${idx}`}
          className="my-2 p-2.5 rounded-lg bg-surface-secondary border-l-2 border-primary text-xs text-foreground-secondary space-y-1"
        >
          {isAlert && (
            <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px] font-mono">
              <Info className="w-3.5 h-3.5" />
              <span>NOTE</span>
            </div>
          )}
          <div className="leading-relaxed">
            {renderInlineMarkdown(cleanText, onSelectCitation, `q-${idx}`)}
          </div>
        </div>,
      );
      currentQuoteLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] || "";
    const trimmed = rawLine.trim();

    // 1. Code Block Fence (```)
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        blocks.push(
          <pre
            key={`code-block-${i}`}
            className="my-2 p-3 rounded-lg bg-surface-secondary border border-border font-mono text-[11px] text-foreground overflow-x-auto"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>,
        );
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLanguage = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // 2. Blockquotes / Alerts (> ...)
    if (trimmed.startsWith(">")) {
      currentQuoteLines.push(trimmed.slice(1).trim());
      continue;
    } else {
      flushQuote(i);
    }

    // 3. Headings
    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h4
          key={`h3-${i}`}
          className="text-xs font-bold text-foreground tracking-tight pt-2 pb-0.5 flex items-center gap-1.5 font-sans"
        >
          {renderInlineMarkdown(trimmed.slice(4), onSelectCitation, `h3-${i}`)}
        </h4>,
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h3
          key={`h2-${i}`}
          className="text-sm font-bold text-foreground tracking-tight pt-3 pb-1 border-b border-border/40 font-sans"
        >
          {renderInlineMarkdown(trimmed.slice(3), onSelectCitation, `h2-${i}`)}
        </h3>,
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h2
          key={`h1-${i}`}
          className="text-base font-bold text-foreground tracking-tight pt-3 pb-1 border-b border-border font-sans"
        >
          {renderInlineMarkdown(trimmed.slice(2), onSelectCitation, `h1-${i}`)}
        </h2>,
      );
      continue;
    }

    // 4. Nested Bullet Lists
    if (rawLine.startsWith("  - ") || rawLine.startsWith("    - ")) {
      const content = rawLine.replace(/^\s+-\s+/, "");
      blocks.push(
        <div
          key={`sub-li-${i}`}
          className="flex items-start gap-2 pl-5 text-xs text-foreground-secondary leading-relaxed"
        >
          <span className="text-foreground-muted text-[10px] mt-1 shrink-0">
            ◦
          </span>
          <div className="flex-1">
            {renderInlineMarkdown(content, onSelectCitation, `sub-li-${i}`)}
          </div>
        </div>,
      );
      continue;
    }

    // 5. Main Bullet Lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.slice(2);
      blocks.push(
        <div
          key={`li-${i}`}
          className="flex items-start gap-2 pl-1 text-xs text-foreground leading-relaxed mt-1"
        >
          <span className="text-primary text-[12px] font-bold mt-0.5 shrink-0">
            •
          </span>
          <div className="flex-1">
            {renderInlineMarkdown(content, onSelectCitation, `li-${i}`)}
          </div>
        </div>,
      );
      continue;
    }

    // 6. Horizontal Rule (---)
    if (trimmed === "---" || trimmed === "***") {
      blocks.push(<hr key={`hr-${i}`} className="my-2 border-border" />);
      continue;
    }

    // 7. Empty Line
    if (!trimmed) {
      continue;
    }

    // 8. Standard Paragraph
    blocks.push(
      <p key={`p-${i}`} className="text-xs text-foreground leading-relaxed">
        {renderInlineMarkdown(rawLine, onSelectCitation, `p-${i}`)}
      </p>,
    );
  }

  flushQuote(lines.length);

  return <div className="space-y-1.5">{blocks}</div>;
}
