export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string; // ISO string
  status: TaskStatus;
}

export const tasks = new Map<string, Task>();
