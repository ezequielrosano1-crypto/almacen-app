import type { StorageDeleteResult } from "../../types/window";

export async function readJson<T>(key: string, shared = false): Promise<T> {
  const entry = await window.storage.get(key, shared);
  return typeof entry.value === "string" ? JSON.parse(entry.value) : entry.value;
}

export async function writeJson(key: string, value: unknown, shared = false): Promise<void> {
  await window.storage.set(key, JSON.stringify(value), shared);
}

export async function listKeys(prefix = "", shared = false): Promise<string[]> {
  const result = await window.storage.list(prefix, shared);
  return result.keys;
}

export async function removeKey(key: string, shared = false): Promise<StorageDeleteResult> {
  return await window.storage.delete(key, shared);
}
