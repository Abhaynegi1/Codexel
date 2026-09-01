import fs from "node:fs/promises";
import path from "node:path";

export const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".bmp",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".7z",
  ".mp4",
  ".webm",
  ".mp3",
  ".wav",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".wasm",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
]);

/**
 * Checks if a buffer likely represents binary content by inspecting for null bytes.
 */
function isBinaryBuffer(buffer: Buffer): boolean {
  const bytesToCheck = Math.min(buffer.length, 512);
  for (let i = 0; i < bytesToCheck; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

/**
 * Fast line counting for a file.
 * Returns 0 if the file is binary or empty.
 */
export async function countLinesOfCode(absoluteFilePath: string): Promise<number> {
  const ext = path.extname(absoluteFilePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    return 0;
  }

  try {
    const buffer = await fs.readFile(absoluteFilePath);
    if (buffer.length === 0) {
      return 0;
    }

    if (isBinaryBuffer(buffer)) {
      return 0;
    }

    let lineCount = 0;
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === 10) {
        // \n
        lineCount++;
      }
    }

    // If file does not end with newline but has characters, count the last line
    if (buffer[buffer.length - 1] !== 10) {
      lineCount++;
    }

    return lineCount;
  } catch {
    return 0;
  }
}
