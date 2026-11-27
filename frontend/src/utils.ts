import type { Priority, Status, Task } from './types';
export const statusText: Record<Status, string> = { PENDING: 'To do', IN_PROGRESS: 'In progress', COMPLETED: 'Completed', SUBMITTED: 'Submitted' };
export const priorityText: Record<Priority, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
export function dateText(value?: string | null, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—'; return new Date(value).toLocaleDateString(undefined, options);
}
export function dateTimeText(value?: string | null) { return value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'; }
export function toLocalInput(iso?: string) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 86_400_000);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0,16);
}
export function safeDate(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toISOString(); }
export function initials(name: string) { return name.trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase()).join('') || 'ST'; }
export function nextStatuses(task: Task): Status[] {
  return ({ PENDING: ['IN_PROGRESS', 'COMPLETED'], IN_PROGRESS: ['PENDING', 'COMPLETED'], COMPLETED: ['IN_PROGRESS'], SUBMITTED: [] } satisfies Record<Status, Status[]>)[task.status];
}
export function errorMessage(err: unknown) { return err instanceof Error ? err.message : 'Something went wrong. Please try again.'; }

export function localDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
