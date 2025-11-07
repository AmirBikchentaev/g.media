export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string; // ISO string
  status: TaskStatus;
}

// очень простой ин-мемори стор
export const tasks = new Map<string, Task>();
