import { useEffect } from "react";
import { writeJson } from "../lib/storage/storage";

export type WriteJsonFn = (key: string, value: unknown) => Promise<void>;

// Guardado: recién después de terminar la carga inicial, para no pisar
// datos guardados con los datos de ejemplo del primer render.
export function persistWhenLoaded(
  isLoaded: boolean,
  key: string,
  value: unknown,
  write: WriteJsonFn = writeJson,
): void {
  if (!isLoaded) return;
  write(key, value).catch(() => {});
}

export function useStorageSync(key: string, value: unknown, isLoaded: boolean): void {
  useEffect(() => {
    persistWhenLoaded(isLoaded, key, value);
  }, [isLoaded, key, value]);
}
