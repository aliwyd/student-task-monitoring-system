export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "SUBMITTED"] as const;
export type Priority = (typeof PRIORITIES)[number];
export type TaskStatus = (typeof STATUSES)[number];

export interface TaskData {
  title: string;
  description?: string | null;
  notes?: string | null;
  subjectId?: number | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: Date;
  completedAt?: Date | null;
  submittedAt?: Date | null;
}
export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };
