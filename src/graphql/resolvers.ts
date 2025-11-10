import { TaskStatus } from '../models/task.model.js';
import { getTaskById, listTasks, createTask, updateTask } from '../repositories/task.repo.js';

// ---- Args ----
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

// ---- Context (mq is optional, чтобы не падать если плагин не инициализировался) ----
type Ctx = {
  mq?: { publish: (routingKey: string, payload: unknown) => Promise<void> };
};

// ---- Helper: безопасная публикация события ----
async function publishEvent(
  ctx: Ctx,
  payload: { taskId: string; action: 'created' | 'updated'; timestamp?: string },
  routingKey = 'task.action'
) {
  try {
    if (!ctx.mq) return; // mq не инициализирован — тихо пропускаем
    const msg = { ...payload, timestamp: payload.timestamp ?? new Date().toISOString() };
    await ctx.mq.publish(routingKey, msg);
  } catch (err) {
    // Не валим GraphQL-операцию из-за MQ; просто логируем (при желании можно кинуть error)
    // eslint-disable-next-line no-console
    console.error('[graphql] publishEvent error:', (err as Error).message);
  }
}

export const resolvers = {
  Query: {
    // Возвращает null, если не найдено — это соответствует схеме
    getTask: async (_: unknown, args: ArgsGetTask) => {
      return getTaskById(args.id);
    },

    // Возвращает массив (возможно пустой)
    getTasks: async (_: unknown, args: ArgsGetTasks) => {
      return listTasks(args.status);
    },
  },

  Mutation: {
    createTask: async (_: unknown, args: ArgsCreate, ctx: Ctx) => {
      // Бизнес-логика создания
      const task = await createTask({
        title: args.title,
        description: args.description ?? null,
        dueDate: args.dueDate,
        status: args.status,
      });

      // Публикация события (не ломает основной флоу)
      await publishEvent(ctx, { taskId: task.id, action: 'created' });

      return task;
    },

    updateTask: async (_: unknown, args: ArgsUpdate, ctx: Ctx) => {
      const task = await updateTask(args.id, {
        title: args.title,
        description: args.description ?? undefined,
        status: args.status,
      });

      if (task) {
        await publishEvent(ctx, { taskId: task.id, action: 'updated' });
      }
      // Если null — по схеме это ок (могут запросить несуществующий id)
      return task;
    },
  },
};
