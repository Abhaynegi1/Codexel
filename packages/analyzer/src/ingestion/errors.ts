/**
 * Custom error hierarchy for repository ingestion and sandboxing operations.
 */

export class IngestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestionError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidGitHubUrlError extends IngestionError {
  public readonly rawUrl: string;

  constructor(rawUrl: string, reason: string) {
    super(`Invalid GitHub URL "${rawUrl}": ${reason}`);
    this.name = "InvalidGitHubUrlError";
    this.rawUrl = rawUrl;
  }
}

export class RemoteResolutionError extends IngestionError {
  public readonly cloneUrl: string;
  public readonly ref?: string;

  constructor(cloneUrl: string, ref: string | undefined, message: string) {
    super(
      `Failed to resolve remote repository at "${cloneUrl}"${ref ? ` (ref: ${ref})` : ""}: ${message}`,
    );
    this.name = "RemoteResolutionError";
    this.cloneUrl = cloneUrl;
    this.ref = ref;
  }
}

export type LimitType = "MAX_FILES" | "MAX_SIZE";

export class RepositoryLimitExceededError extends IngestionError {
  public readonly limitType: LimitType;
  public readonly currentValue: number;
  public readonly limitValue: number;

  constructor(limitType: LimitType, currentValue: number, limitValue: number) {
    const formattedCurrent =
      limitType === "MAX_SIZE"
        ? `${(currentValue / (1024 * 1024)).toFixed(2)} MB`
        : `${currentValue.toLocaleString()} files`;
    const formattedLimit =
      limitType === "MAX_SIZE"
        ? `${(limitValue / (1024 * 1024)).toFixed(2)} MB`
        : `${limitValue.toLocaleString()} files`;

    super(
      `Repository safety limit exceeded: ${limitType} limit is ${formattedLimit}, but repository has ${formattedCurrent}.`,
    );
    this.name = "RepositoryLimitExceededError";
    this.limitType = limitType;
    this.currentValue = currentValue;
    this.limitValue = limitValue;
  }
}

export class SandboxTimeoutError extends IngestionError {
  public readonly stage: "remote-resolve" | "clone" | "inspection";
  public readonly timeoutMs: number;

  constructor(
    stage: "remote-resolve" | "clone" | "inspection",
    timeoutMs: number,
  ) {
    super(
      `Sandbox operation timed out during stage "${stage}" after ${timeoutMs / 1000}s.`,
    );
    this.name = "SandboxTimeoutError";
    this.stage = stage;
    this.timeoutMs = timeoutMs;
  }
}

export class SandboxCleanupError extends IngestionError {
  public readonly path: string;

  constructor(path: string, originalError?: unknown) {
    const errMessage =
      originalError instanceof Error
        ? originalError.message
        : String(originalError);
    super(
      `Failed to clean up ephemeral sandbox directory at "${path}": ${errMessage}`,
    );
    this.name = "SandboxCleanupError";
    this.path = path;
  }
}
