import { TaskStatus } from '../models/task.model.js';
import { publishTaskEvent } from '../mq/publisher.js';
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
  mq?: { publish: (routingKey: string, payload: unknown) => Promise<void> };
};

async function publishEvent(
  ctx: Ctx,
  payload: { taskId: string; action: 'created' | 'updated'; timestamp?: string },
  routingKey = 'task.action'
) {
  try {
    if (!ctx.mq) return;
    const msg = { ...payload, timestamp: payload.timestamp ?? new Date().toISOString() };
    await ctx.mq.publish(routingKey, msg);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[graphql] publishEvent error:', (err as Error).message);
  }
}

export const resolvers = {
  Query: {
    getTask: (_: unknown, args: ArgsGetTask) => getTaskById(args.id),
    getTasks: (_: unknown, args: ArgsGetTasks) => listTasks(args.status),
  },
  Mutation: {
    createTask: async (_: unknown, args: ArgsCreate) => {
      const task = await createTask({
        title: args.title,
        description: args.description ?? null,
        dueDate: args.dueDate,
        status: args.status,
      });
      await publishTaskEvent({ taskId: task.id, action: 'created' });
      return task;
    },
    updateTask: async (_: unknown, args: ArgsUpdate) => {
      const task = await updateTask(args.id, {
        title: args.title,
        description: args.description ?? undefined,
        status: args.status,
      });
      if (task) {
        await publishTaskEvent({ taskId: task.id, action: 'updated' });
      }
      return task;
    },
  },
};
