import { TaskStatus } from '../models/task.model.js';
import { getTaskById, listTasks, createTask, updateTask } from '../repositories/task.repo.js';

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

type Ctx = {
  mq: { publish: (routingKey: string, payload: unknown) => Promise<void> };
};

export const resolvers = {
  Query: {
    getTask: (_: unknown, args: ArgsGetTask) => getTaskById(args.id),
    getTasks: (_: unknown, args: ArgsGetTasks) => listTasks(args.status),
  },
  Mutation: {
    createTask: async (_: unknown, args: ArgsCreate, ctx: Ctx) => {
      const task = await createTask({
        title: args.title,
        description: args.description ?? null,
        dueDate: args.dueDate,
        status: args.status,
      });

      // Publish "created"
      await ctx.mq.publish('task.action', {
        taskId: task.id,
        action: 'created' as const,
        timestamp: new Date().toISOString(),
      });

      return task;
    },

    updateTask: async (_: unknown, args: ArgsUpdate, ctx: Ctx) => {
      const task = await updateTask(args.id, {
        title: args.title,
        description: args.description ?? undefined,
        status: args.status,
      });

      if (task) {
        // Publish "updated"
        await ctx.mq.publish('task.action', {
          taskId: task.id,
          action: 'updated' as const,
          timestamp: new Date().toISOString(),
        });
      }

      return task;
    },
  },
};
