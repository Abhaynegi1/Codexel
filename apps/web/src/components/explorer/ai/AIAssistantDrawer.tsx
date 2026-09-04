"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Layers,
  KeyRound,
  Palette,
  BookOpen,
  Bot,
  User,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import type { RepositoryModel } from "@codexel/shared";
import { PRESET_PROMPTS } from "@codexel/analyzer";
import { renderMarkdownWithCitations } from "./CitationBadge";

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  model: RepositoryModel;
  onSelectCitation?: (
    filePath: string,
    lineStart?: number,
    lineEnd?: number,
  ) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export function AIAssistantDrawer({
  isOpen,
  onClose,
  model,
  onSelectCitation,
}: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I am your **Grounded AI Copilot** for **${model.metadata.owner}/${model.metadata.name}**.\n\nEvery answer I provide is strictly grounded in the verified static AST model of this repository \u2014 zero hallucinations, guaranteed.\n\nPick a quick topic below or ask any question about architecture, components, or design tokens!`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Append user message and placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: trimmed, timestamp },
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp,
        isStreaming: true,
      },
    ]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, model }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: accumulatedText, isStreaming: true }
                : msg,
            ),
          );
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg,
          ),
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `⚠️ Failed to fetch grounded response: ${err.message || "Unknown error"}`,
                isStreaming: false,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputQuery);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Chat session reset. What would you like to explore about **${model.metadata.name}**?`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-surface/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col font-sans transition-all animate-in slide-in-from-right duration-300">
      {/* Top Header */}
      <div className="h-14 min-h-[56px] px-4 border-b border-border flex items-center justify-between bg-surface-secondary/40 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-foreground">
                Grounded AI Layer
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-semantic-green/10 text-semantic-green border border-semantic-green/20">
                <ShieldCheck className="w-3 h-3" />
                <span>Zero Hallucinations</span>
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted font-mono">
              Model: {model.metadata.owner}/{model.metadata.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetChat}
            title="Reset conversation"
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-surface-secondary rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Assistant (Esc)"
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-surface-secondary rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="p-3 border-b border-border bg-surface-secondary/20 flex gap-1.5 overflow-x-auto scrollbar-thin">
        {PRESET_PROMPTS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={isLoading}
            onClick={() => handleSendMessage(preset.query)}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono bg-surface hover:bg-surface-secondary text-foreground-secondary hover:text-foreground border border-border hover:border-border-strong transition-all shadow-2xs disabled:opacity-50"
          >
            {preset.id === "architecture" && (
              <Layers className="w-3.5 h-3.5 text-primary" />
            )}
            {preset.id === "auth-data" && (
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            )}
            {preset.id === "design-system" && (
              <Palette className="w-3.5 h-3.5 text-pink-500" />
            )}
            {preset.id === "onboarding" && (
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs leading-relaxed ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[88%] rounded-xl p-3.5 border text-xs shadow-xs relative group ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface border-border text-foreground"
              }`}
            >
              {/* Copy button for assistant responses */}
              {msg.role === "assistant" && msg.content && (
                <button
                  type="button"
                  onClick={() => handleCopyText(msg.id, msg.content)}
                  title="Copy markdown"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-surface-secondary text-foreground-muted hover:text-foreground transition-all"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}

              {/* Message Content */}
              <div className="prose prose-xs max-w-none text-xs dark:prose-invert space-y-2 font-sans">
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap font-medium">
                    {msg.content}
                  </p>
                ) : (
                  <div className="space-y-2 whitespace-pre-wrap font-sans leading-relaxed">
                    {msg.content ? (
                      renderMarkdownWithCitations(msg.content, onSelectCitation)
                    ) : (
                      <div className="flex items-center gap-2 text-foreground-muted font-mono py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Querying verified AST facts...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp & Streaming indicator */}
              <div
                className={`mt-2 flex items-center justify-between text-[10px] font-mono ${
                  msg.role === "user"
                    ? "text-primary-foreground/70"
                    : "text-foreground-muted"
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.isStreaming && (
                  <span className="flex items-center gap-1 text-primary animate-pulse font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Streaming</span>
                  </span>
                )}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-foreground-secondary shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-3 border-t border-border bg-surface-secondary/40 select-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputQuery);
          }}
          className="relative flex items-end bg-surface border border-border rounded-xl shadow-inner focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
        >
          <textarea
            ref={inputRef}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about architecture, auth flows, component lines..."
            rows={2}
            className="w-full resize-none bg-transparent p-3 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none font-sans"
          />

          <div className="p-2 shrink-0">
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] font-mono text-foreground-muted">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="text-primary/80 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-semantic-green" /> Verified
            Citations
          </span>
        </div>
      </div>
    </div>
  );
}
