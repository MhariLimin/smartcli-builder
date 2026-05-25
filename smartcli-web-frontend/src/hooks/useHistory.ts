import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { HistoryEntry } from '../types';

interface UseHistoryValue {
  history: HistoryEntry[];
  loading: boolean;
  // Append a new entry on a successful Copy. Optimistic: applies the
  // dedupe-by-text rule locally to mirror what HistoryService does on the
  // server, so the UI reflects the canonical state without a refetch.
  add: (command: string, category: string) => Promise<HistoryEntry | null>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

// Page-local hook for now — every page that needs history calls this and
// pays the small re-fetch cost on mount. If cross-page sharing ever feels
// awkward, lift the state into a context provider (see the no-state-library
// invariant in .claude/CLAUDE.md).
export function useHistory(): UseHistoryValue {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.history
      .list()
      .then((list) => {
        if (alive) setHistory(list);
      })
      .catch(() => {
        if (alive) setHistory([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const add = useCallback(async (command: string, category: string) => {
    try {
      const entry = await api.history.add(command, category || 'misc');
      setHistory((prev) => [entry, ...prev.filter((p) => p.command !== entry.command)]);
      return entry;
    } catch {
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.history.delete(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const clear = useCallback(async () => {
    await api.history.clear();
    setHistory([]);
  }, []);

  return { history, loading, add, remove, clear };
}
