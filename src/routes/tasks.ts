import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { tasks, Task, TaskStatus } from '../domain/task.js';
import crypto from 'node:crypto';

const StatusEnum = z.enum(['pending', 'in_progress', 'done']);
const TaskDTO = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  dueDate: z.string(), // ISO
  status: StatusEnum
});

const CreateTaskBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().or(z.string()), // допускаем строку-дату, можно усилить
  status: StatusEnum.default('pending')
});

const UpdateTaskBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: StatusEnum.optional()
});

export default async function tasksRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>(); // можно оставить

  // GET /tasks/:id — получить по id
  app.get(
    '/tasks/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: { 200: TaskDTO }
      }
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const task = tasks.get(id);
      if (!task) return reply.notFound('Task not found');
      return task;
    }
  );

  // GET /tasks?status=... — список (фильтр по статусу)
  app.get(
    '/tasks',
    {
      schema: {
        querystring: z.object({ status: StatusEnum.optional() }),
        response: { 200: z.array(TaskDTO) }
      }
    },
    async (req) => {
      const { status } = req.query as { status?: TaskStatus };
      let list = Array.from(tasks.values());
      if (status) list = list.filter((t) => t.status === status);
      return list;
    }
  );

  // POST /tasks — создание
  app.post(
    '/tasks',
    {
      schema: {
        body: CreateTaskBody,
        response: { 201: TaskDTO }
      }
    },
    async (req, reply) => {
      const body = req.body as z.infer<typeof CreateTaskBody>;
      const id = crypto.randomUUID();
      const task: Task = {
        id,
        title: body.title,
        description: body.description ?? null,
        dueDate: new Date(body.dueDate).toISOString(),
        status: body.status ?? 'pending'
      };
      tasks.set(id, task);
      reply.code(201);
      return task;
    }
  );

  // PATCH /tasks/:id — обновление
  app.patch(
    '/tasks/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: UpdateTaskBody,
        response: { 200: TaskDTO }
      }
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = req.body as z.infer<typeof UpdateTaskBody>;
      const task = tasks.get(id);
      if (!task) return reply.notFound('Task not found');

      if (body.title !== undefined) task.title = body.title;
      if (body.description !== undefined) task.description = body.description;
      if (body.status !== undefined) task.status = body.status;

      tasks.set(id, task);
      return task;
    }
  );
}
