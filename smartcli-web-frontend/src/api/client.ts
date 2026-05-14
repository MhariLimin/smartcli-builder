import type {
  HistoryEntry,
  PlaceholderInfo,
  Suggestion
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  suggestions(q: string, limit = 30): Promise<Suggestion[]> {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return request<Suggestion[]>(`/suggestions?${params.toString()}`);
  },
  placeholders(template: string): Promise<PlaceholderInfo[]> {
    const params = new URLSearchParams({ template });
    return request<PlaceholderInfo[]>(`/placeholders?${params.toString()}`);
  },
  categories(): Promise<string[]> {
    return request<string[]>('/categories');
  },
  history: {
    list(): Promise<HistoryEntry[]> {
      return request<HistoryEntry[]>('/history');
    },
    add(command: string, category: string): Promise<HistoryEntry> {
      return request<HistoryEntry>('/history', {
        method: 'POST',
        body: JSON.stringify({ command, category })
      });
    },
    delete(id: string): Promise<void> {
      return request<void>(`/history/${id}`, { method: 'DELETE' });
    },
    clear(): Promise<void> {
      return request<void>('/history', { method: 'DELETE' });
    }
  }
};
