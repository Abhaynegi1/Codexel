"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderUp,
  FolderOpen,
  X,
  Loader2,
  FileCode,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import type { RepositoryModel } from "@codexel/shared";
import { saveLocalModel } from "@/lib/local-storage-model";

interface LocalFolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (model: RepositoryModel) => void;
}

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".turbo",
  ".cache",
  ".husky",
  ".vscode",
  ".idea",
]);

const IGNORED_FILES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  ".DS_Store",
  "Thumbs.db",
]);

const PARSABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".md",
  ".html",
]);

export function LocalFolderPicker({
  isOpen,
  onClose,
  onSuccess,
}: LocalFolderPickerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "reading" | "analyzing" | "success" | "error"
  >("idle");
  const [statusText, setStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);

  const resetState = () => {
    setStatus("idle");
    setStatusText("");
    setErrorMessage(null);
    setFileCount(0);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  /**
   * Reads files recursively from a FileSystemDirectoryHandle (File System Access API)
   */
  const readDirectoryHandle = async (
    dirHandle: FileSystemDirectoryHandle,
    currentPath = "",
  ): Promise<Array<{ path: string; content: string }>> => {
    const files: Array<{ path: string; content: string }> = [];

    for await (const entry of (dirHandle as any).values()) {
      if (entry.kind === "directory") {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          const subFiles = await readDirectoryHandle(
            entry,
            currentPath ? `${currentPath}/${entry.name}` : entry.name,
          );
          files.push(...subFiles);
        }
      } else if (entry.kind === "file") {
        if (!IGNORED_FILES.has(entry.name)) {
          const ext = entry.name
            .slice(entry.name.lastIndexOf("."))
            .toLowerCase();
          if (PARSABLE_EXTENSIONS.has(ext)) {
            try {
              const file = await (entry as FileSystemFileHandle).getFile();
              // Skip large binary files (> 1MB)
              if (file.size < 1024 * 1024) {
                const content = await file.text();
                const filePath = currentPath
                  ? `${currentPath}/${entry.name}`
                  : entry.name;
                files.push({ path: filePath, content });
              }
            } catch {
              // Ignore unreadable files
            }
          }
        }
      }
    }

    return files;
  };

  /**
   * Reads files from drag and drop DataTransferItem or FileList
   */
  const readDroppedFiles = async (
    items: DataTransferItemList | FileList,
  ): Promise<{
    name: string;
    files: Array<{ path: string; content: string }>;
  }> => {
    const files: Array<{ path: string; content: string }> = [];
    let rootName = "local-project";

    // Standard FileList from <input type="file" webkitdirectory />
    if (items instanceof FileList) {
      for (let i = 0; i < items.length; i++) {
        const file = items[i];
        if (!file) continue;
        const relativePath = file.webkitRelativePath || file.name;

        // Skip ignored directories
        const pathSegments = relativePath.split("/");
        if (rootName === "local-project" && pathSegments.length > 1) {
          rootName = pathSegments[0] || "local-project";
        }

        const isIgnored = pathSegments.some(
          (seg) => IGNORED_DIRECTORIES.has(seg) || IGNORED_FILES.has(seg),
        );
        if (isIgnored) continue;

        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        if (PARSABLE_EXTENSIONS.has(ext) && file.size < 1024 * 1024) {
          try {
            const content = await file.text();
            // Strip the root folder name from relative path
            const cleanPath =
              pathSegments.length > 1
                ? pathSegments.slice(1).join("/")
                : relativePath;
            files.push({ path: cleanPath, content });
          } catch {
            // Ignore read error
          }
        }
      }
      return { name: rootName, files };
    }

    // Modern WebKit GetAsEntry for Drag-and-Drop folders
    const traverseEntry = async (
      entry: any,
      currentPath = "",
    ): Promise<void> => {
      if (!entry) return;

      if (entry.isDirectory) {
        if (IGNORED_DIRECTORIES.has(entry.name)) return;
        if (!currentPath) rootName = entry.name;

        const dirReader = entry.createReader();
        const entries: any[] = await new Promise((resolve) => {
          dirReader.readEntries((results: any[]) => resolve(results));
        });

        for (const child of entries) {
          await traverseEntry(
            child,
            currentPath ? `${currentPath}/${entry.name}` : "",
          );
        }
      } else if (entry.isFile) {
        if (IGNORED_FILES.has(entry.name)) return;
        const ext = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
        if (!PARSABLE_EXTENSIONS.has(ext)) return;

        const file: File = await new Promise((resolve, reject) => {
          entry.file(resolve, reject);
        });

        if (file.size < 1024 * 1024) {
          const content = await file.text();
          const filePath = currentPath
            ? `${currentPath}/${entry.name}`
            : entry.name;
          files.push({ path: filePath, content });
        }
      }
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = (item as any)?.webkitGetAsEntry
        ? (item as any).webkitGetAsEntry()
        : null;
      if (entry) {
        await traverseEntry(entry);
      }
    }

    return { name: rootName, files };
  };

  /**
   * Submits parsed files to backend analysis route and transitions to explorer
   */
  const processAndAnalyze = async (
    name: string,
    files: Array<{ path: string; content: string }>,
  ) => {
    if (files.length === 0) {
      setStatus("error");
      setErrorMessage(
        "No parsable source files found. Please ensure you selected a TypeScript/JavaScript project folder.",
      );
      return;
    }

    setFileCount(files.length);
    setStatus("analyzing");
    setStatusText(
      `Synthesizing AST & architecture across ${files.length} files...`,
    );

    try {
      const response = await fetch("/api/analyze/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, files }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Analysis failed with status ${response.status}`,
        );
      }

      const model: RepositoryModel = await response.json();

      setStatus("success");
      setStatusText("Architecture synthesized successfully!");

      const modelKey = saveLocalModel(model);

      if (onSuccess) {
        onSuccess(model);
      }

      setTimeout(() => {
        handleClose();
        router.push(`/explore?repo=${encodeURIComponent(modelKey)}`);
      }, 600);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to analyze local repository.");
    }
  };

  /**
   * Native showDirectoryPicker handler
   */
  const handlePickDirectory = async () => {
    try {
      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: "read",
        });

        setStatus("reading");
        setStatusText(
          `Reading local workspace files from "${dirHandle.name}"...`,
        );

        const files = await readDirectoryHandle(dirHandle);
        await processAndAnalyze(dirHandle.name, files);
      } else {
        // Fallback for browsers without showDirectoryPicker
        fileInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setStatus("error");
        setErrorMessage(err.message || "Failed to access local folder.");
      }
    }
  };

  /**
   * Fallback input change handler
   */
  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setStatus("reading");
    setStatusText("Reading folder files...");

    const parsed = await readDroppedFiles(files);
    await processAndAnalyze(parsed.name, parsed.files);
  };

  /**
   * Drag-and-drop event handlers
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setStatus("reading");
      setStatusText("Reading dropped directory tree...");
      const parsed = await readDroppedFiles(e.dataTransfer.items);
      await processAndAnalyze(parsed.name, parsed.files);
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setStatus("reading");
      setStatusText("Reading dropped files...");
      const parsed = await readDroppedFiles(e.dataTransfer.files);
      await processAndAnalyze(parsed.name, parsed.files);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-secondary/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <FolderUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Open Local Workspace</h3>
              <p className="text-xs text-foreground-muted font-mono">
                Analyze private or offline repositories directly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-surface-secondary text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={
              status === "idle" || status === "error"
                ? handlePickDirectory
                : undefined
            }
            className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center group ${
              isDragging
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-border hover:border-border-strong hover:bg-surface-secondary/50"
            } ${status !== "idle" && status !== "error" ? "pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              // @ts-expect-error - webkitdirectory
              webkitdirectory="true"
              directory="true"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />

            {status === "idle" || status === "error" ? (
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-surface-secondary border border-border flex items-center justify-center group-hover:scale-110 group-hover:border-primary/50 group-hover:text-primary transition-all text-foreground-secondary">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Drag and drop your project folder here
                  </p>
                  <p className="text-xs text-foreground-muted font-mono">
                    or click to browse local directory
                  </p>
                </div>
              </div>
            ) : status === "reading" || status === "analyzing" ? (
              <div className="space-y-3 py-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {status === "reading"
                      ? "Reading Files"
                      : "Synthesizing Architecture"}
                  </p>
                  <p className="text-xs text-foreground-muted font-mono">
                    {statusText}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto animate-in zoom-in-50" />
                <p className="text-sm font-medium text-emerald-500">
                  {statusText}
                </p>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Security & Feature Badges */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs text-foreground-muted font-mono">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-secondary border border-border">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>100% Private &bull; AST In-Memory</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-secondary border border-border">
              <HardDrive className="w-4 h-4 text-primary shrink-0" />
              <span>Auto-filters node_modules</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-surface-secondary/40 text-xs">
          <span className="text-foreground-muted font-mono">
            Supports Next.js, Vite, React & TypeScript
          </span>
          <button
            type="button"
            onClick={handlePickDirectory}
            disabled={status === "reading" || status === "analyzing"}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Select Folder</span>
          </button>
        </div>
      </div>
    </div>
  );
}
