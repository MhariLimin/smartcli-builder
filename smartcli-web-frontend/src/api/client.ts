import type {
  Folder,
  HistoryEntry,
  PlaceholderInfo,
  SavedCommand,
  SavedCommandCreate,
  SavedCommandUpdate,
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
  },
  folders: {
    list(): Promise<Folder[]> {
      return request<Folder[]>('/folders');
    },
    create(name: string, parentId?: string | null): Promise<Folder> {
      return request<Folder>('/folders', {
        method: 'POST',
        body: JSON.stringify({ name, parentId: parentId ?? null })
      });
    },
    rename(id: string, name: string): Promise<Folder> {
      return request<Folder>(`/folders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name })
      });
    },
    delete(id: string): Promise<void> {
      return request<void>(`/folders/${id}`, { method: 'DELETE' });
    }
  },
  saved: {
    // folder accepts a folder id, the sentinel "uncategorized", or undefined
    // to skip the filter. tags is OR-combined server-side.
    list(folder?: string, tags?: string[]): Promise<SavedCommand[]> {
      const params = new URLSearchParams();
      if (folder) params.set('folder', folder);
      if (tags && tags.length) params.set('tags', tags.join(','));
      const qs = params.toString();
      return request<SavedCommand[]>('/saved' + (qs ? '?' + qs : ''));
    },
    tags(): Promise<string[]> {
      return request<string[]>('/saved/tags');
    },
    create(body: SavedCommandCreate): Promise<SavedCommand> {
      return request<SavedCommand>('/saved', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    },
    update(id: string, body: SavedCommandUpdate): Promise<SavedCommand> {
      return request<SavedCommand>(`/saved/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
    },
    delete(id: string): Promise<void> {
      return request<void>(`/saved/${id}`, { method: 'DELETE' });
    }
  }
};
