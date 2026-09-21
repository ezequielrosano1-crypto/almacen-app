import { listKeys, readJson, writeJson } from "../lib/storage/storage";
import type { ClosingSummary } from "../types/domain";
import type { StoredClosingSummary } from "../types/storage";
import { fromStoredClosingSummary, toStoredClosingSummary } from "./mappers";

export async function readClosing(dateKey: string): Promise<ClosingSummary | null> {
  try {
    const raw = await readJson<StoredClosingSummary>(dateKey);
    if (!raw) return null;
    return fromStoredClosingSummary(raw);
  } catch {
    return null;
  }
}

export async function listClosings(): Promise<ClosingSummary[]> {
  const keys = (await listKeys("cierre:")).slice().sort().reverse();
  const res: ClosingSummary[] = [];

  for (const k of keys) {
    try {
      const raw = await readJson<StoredClosingSummary>(k);
      if (raw) {
        res.push(fromStoredClosingSummary(raw));
      }
    } catch {}
  }

  return res;
}

export async function writeClosing(dateKey: string, summary: ClosingSummary): Promise<void> {
  await writeJson(dateKey, toStoredClosingSummary(summary));
}
