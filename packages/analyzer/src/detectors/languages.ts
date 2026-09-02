import type { FileMetadata } from "@codexel/shared";
import { EXTENSION_TO_LANGUAGE } from "../scanner/file-classifier";

export interface LanguageStats {
  primaryLanguage: string;
  languages: Array<{
    name: string;
    percentage: number;
    fileCount: number;
  }>;
}

const PRIORITY_SOURCE_LANGUAGES = new Set([
  "TypeScript",
  "JavaScript",
  "Vue",
  "Svelte",
  "Astro",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C++",
  "C#",
  "Ruby",
  "PHP",
  "HTML",
  "CSS",
]);

/**
 * Calculates language distribution and determines primary language from scanned files.
 */
export function calculateLanguageStats(files: FileMetadata[]): LanguageStats {
  if (!files || files.length === 0) {
    return {
      primaryLanguage: "Unknown",
      languages: [],
    };
  }

  const counts = new Map<string, number>();

  for (const file of files) {
    const ext = file.extension.toLowerCase();
    const lang =
      EXTENSION_TO_LANGUAGE[ext] ||
      (ext ? ext.slice(1).toUpperCase() : "Other");
    counts.set(lang, (counts.get(lang) || 0) + 1);
  }

  const totalFiles = files.length;
  const languages: Array<{
    name: string;
    percentage: number;
    fileCount: number;
  }> = [];

  for (const [name, count] of counts.entries()) {
    const rawPct = (count / totalFiles) * 100;
    // Round to 1 decimal place
    const percentage = Math.min(100, Math.max(0, Math.round(rawPct * 10) / 10));
    languages.push({
      name,
      percentage,
      fileCount: count,
    });
  }

  // Sort descending by fileCount
  languages.sort((a, b) => b.fileCount - a.fileCount);

  // Determine primaryLanguage: first look for dominant source language, else top overall
  let primaryLanguage = "Unknown";
  const dominantSource = languages.find((l) =>
    PRIORITY_SOURCE_LANGUAGES.has(l.name),
  );
  if (dominantSource) {
    primaryLanguage = dominantSource.name;
  } else if (languages.length > 0 && languages[0]) {
    primaryLanguage = languages[0].name;
  }

  return {
    primaryLanguage,
    languages,
  };
}
