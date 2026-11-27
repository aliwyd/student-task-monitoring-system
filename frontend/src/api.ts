export class ApiError extends Error {
  constructor(message: string, public status: number, public details: Record<string, string> = {}) { super(message); this.name = 'ApiError'; }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, credentials: 'include', headers });
  } catch { throw new ApiError('Could not connect to the server. Is the backend running?', 0); }
  const payload = await response.json().catch(() => null) as { success?: boolean; data?: T; error?: { message?: string; details?: Record<string, string> } } | null;
  if (!response.ok || !payload?.success) throw new ApiError(payload?.error?.message ?? `Request failed (${response.status})`, response.status, payload?.error?.details);
  return payload.data as T;
}
export const json = (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export async function exportTasksCsv(): Promise<void> {
  const r = await fetch('/api/reports/export.csv', { credentials: 'include' });
  if (!r.ok) throw new ApiError(`CSV export failed (${r.status})`, r.status);
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'tasks.csv'; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
