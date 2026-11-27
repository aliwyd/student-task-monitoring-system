import type { Priority, TaskStatus } from "../domain/types";

export interface User { id: number; email: string; name: string; passwordHash: string; createdAt: Date }
export interface Subject { id: number; userId: number; name: string; code: string | null; description: string | null; color: string; createdAt: Date }
export interface Task {
  id: number; userId: number; subjectId: number | null; title: string;
  description: string | null; notes: string | null;
  priority: Priority; status: TaskStatus; dueDate: Date;
  completedAt: Date | null; submittedAt: Date | null; createdAt: Date; updatedAt: Date;
}

export type NewTask = {
  title: string; priority: Priority; status: TaskStatus; dueDate: Date;
  description?: string | null; notes?: string | null; subjectId?: number | null;
};
export type TaskPatch = Partial<Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">>;
export interface TaskFilters { status?: TaskStatus; priority?: Priority; subjectId?: number; search?: string; sort?: "dueDate" | "-dueDate" }
export type SubjectInput = { name: string; code?: string | null; description?: string | null; color: string };

// Every task/subject method takes userId, so ownership is enforced in the data layer.
export interface UserRepo {
  create(d: { email: string; name: string; passwordHash: string }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
}
export interface SubjectRepo {
  create(userId: number, d: SubjectInput): Promise<Subject>;
  list(userId: number): Promise<Subject[]>;
  get(userId: number, id: number): Promise<Subject | null>;
  findByName(userId: number, name: string): Promise<Subject | null>;
  update(userId: number, id: number, d: Partial<SubjectInput>): Promise<Subject | null>;
  delete(userId: number, id: number): Promise<boolean>;
}
export interface TaskRepo {
  create(userId: number, d: NewTask): Promise<Task>;
  list(userId: number, f?: TaskFilters): Promise<Task[]>;
  get(userId: number, id: number): Promise<Task | null>;
  update(userId: number, id: number, p: TaskPatch): Promise<Task | null>;
  delete(userId: number, id: number): Promise<boolean>;
}
export interface Repos { users: UserRepo; subjects: SubjectRepo; tasks: TaskRepo }
