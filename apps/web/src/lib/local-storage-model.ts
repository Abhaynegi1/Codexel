import type { RepositoryModel } from "@codexel/shared";

const STORAGE_PREFIX = "codexel:local-model:";

/**
 * Saves a local repository model in sessionStorage and returns its unique lookup key.
 */
export function saveLocalModel(model: RepositoryModel): string {
  if (typeof window === "undefined") return "";

  const key = `local:${model.metadata.name.toLowerCase()}`;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(model));
    // Also save in localStorage as backup if size permits
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(model));
    } catch {
      // localStorage may quota exceed for large models
    }
  } catch (err) {
    console.warn("Failed to persist local model to web storage:", err);
  }

  return key;
}

/**
 * Retrieves a locally saved RepositoryModel by its key (e.g. "local:my-app").
 */
export function getLocalModel(key: string): RepositoryModel | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionData = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (sessionData) {
      return JSON.parse(sessionData) as RepositoryModel;
    }

    const localData = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (localData) {
      return JSON.parse(localData) as RepositoryModel;
    }
  } catch (err) {
    console.warn("Failed to retrieve local model from storage:", err);
  }

  return null;
}
