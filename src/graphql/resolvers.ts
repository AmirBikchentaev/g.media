
import { tasks, Task, TaskStatus } from '../domain/task.js';
import crypto from 'node:crypto';

type ArgsGetTask = { id: string };
type ArgsGetTasks = { status?: TaskStatus };
type ArgsCreate = {
  title: string;
  description?: string | null;
  dueDate: string;
  status?: TaskStatus;
};
type ArgsUpdate = {
  id: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
};

export const resolvers = {
  Query: {
    getTask: (_: unknown, args: ArgsGetTask) => {
      return tasks.get(args.id) ?? null;
    },
    getTasks: (_: unknown, args: ArgsGetTasks) => {
      const list = Array.from(tasks.values());
      return args.status ? list.filter((t) => t.status === args.status) : list;
    }
  },
  Mutation: {
    createTask: (_: unknown, args: ArgsCreate): Task => {
      const id = crypto.randomUUID();
      const task: Task = {
        id,
        title: args.title,
        description: args.description ?? null,
        dueDate: new Date(args.dueDate).toISOString(),
        status: args.status ?? 'pending'
      };
      tasks.set(id, task);
      return task;
    },
    updateTask: (_: unknown, args: ArgsUpdate): Task | null => {
      const task = tasks.get(args.id);
      if (!task) return null;
      if (args.title !== undefined) task.title = args.title;
      if (args.description !== undefined) task.description = args.description;
      if (args.status !== undefined) task.status = args.status;
      tasks.set(task.id, task);
      return task;
    }
  }
};
