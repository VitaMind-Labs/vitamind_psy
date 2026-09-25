"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "vm:local-storage";

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/**
 * Per-device preference backed by localStorage. Server render and storage
 * failures (private mode, blocked site data) fall back to `fallback`.
 */
export function useLocalStorage<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  const value = raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        /* storage unavailable: value stays at fallback */
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return [value, setValue] as const;
}
