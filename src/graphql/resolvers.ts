import { TaskStatus } from '../models/task.model.js';
import { getTaskById, listTasks, createTask, updateTask } from '../repositories/task.repo.js';

type ArgsGetTask = { id: string };
type ArgsGetTasks = { status?: TaskStatus };
type ArgsCreate = { title: string; description?: string | null; dueDate: string; status?: TaskStatus; };
type ArgsUpdate = { id: string; title?: string; description?: string | null; status?: TaskStatus; };

export const resolvers = {
  Query: {
    getTask: (_: unknown, args: ArgsGetTask) => getTaskById(args.id),
    getTasks: (_: unknown, args: ArgsGetTasks) => listTasks(args.status),
  },
  Mutation: {
    createTask: (_: unknown, args: ArgsCreate) =>
      createTask({
        title: args.title,
        description: args.description ?? null,
        dueDate: args.dueDate,
        status: args.status,
      }),
    updateTask: async (_: unknown, args: ArgsUpdate) =>
      updateTask(args.id, {
        title: args.title,
        description: args.description ?? undefined,
        status: args.status,
      }),
  },
};
