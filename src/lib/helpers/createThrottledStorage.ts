import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { isRecord } from '@/lib/helpers/isRecord';

interface PendingWrite {
  readonly name: string;
  readonly value: StorageValue<unknown>;
}

/**
 * Creates a zustand `persist` storage on top of localStorage that writes at most
 * once per `throttleMs`. A knob drag updates the store on every pointer move;
 * serializing and writing synchronously each time would block the main thread
 * for no benefit, since only the last value matters. Pending writes are flushed
 * when the page is hidden or unloaded, so nothing is lost on close.
 *
 * The stored state is typed `unknown` on purpose: whatever is read back must be
 * validated by the store's `merge` before use.
 * @param throttleMs - Minimum time between two writes to localStorage
 * @returns The storage, or undefined during server rendering (persistence is then a no-op)
 */
export function createThrottledStorage(throttleMs: number): PersistStorage<unknown> | undefined {
  if (typeof window === 'undefined') return undefined;

  let pendingWrite: PendingWrite | null = null;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (pendingWrite === null) return;

    const { name, value } = pendingWrite;
    pendingWrite = null;
    try {
      window.localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Storage full or blocked (private mode) — losing persistence must not break the app
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) flush();
  };

  // `visibilitychange` is the last event mobile browsers reliably fire; `pagehide` covers desktop unloads
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return {
    getItem: (name) => {
      // A not-yet-flushed write is newer than what is in localStorage
      if (pendingWrite?.name === name) return pendingWrite.value;

      try {
        const raw = window.localStorage.getItem(name);
        if (raw === null) return null;

        const parsed: unknown = JSON.parse(raw);
        if (!isRecord(parsed) || !('state' in parsed)) return null;
        return {
          state: parsed.state,
          version: typeof parsed.version === 'number' ? parsed.version : undefined,
        };
      } catch {
        // Corrupt JSON or blocked storage — behave as if nothing was stored
        return null;
      }
    },
    setItem: (name, value) => {
      // Only one write is buffered, so a write for another key must not overwrite it
      if (pendingWrite !== null && pendingWrite.name !== name) flush();
      pendingWrite = { name, value };
      flushTimer ??= setTimeout(flush, throttleMs);
    },
    removeItem: (name) => {
      if (pendingWrite?.name === name) pendingWrite = null;
      try {
        window.localStorage.removeItem(name);
      } catch {
        // Blocked storage — nothing to remove
      }
    },
  };
}
