import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { TaskStatus } from '../models/task.model.js';
import { getTaskById, listTasks, createTask, updateTask } from '../repositories/task.repo.js';

const StatusEnum = z.enum(['pending', 'in_progress', 'done']);
const ObjectIdLike = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const TaskDTO = z.object({
  id: ObjectIdLike,
  title: z.string(),
  description: z.string().nullable().optional(),
  dueDate: z.string(),
  status: StatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreateTaskBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string(), // можно усилить .datetime()
  status: StatusEnum.default('pending'),
});

const UpdateTaskBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: StatusEnum.optional(),
});

export default async function tasksRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>();

  app.get(
    '/tasks/:id',
    {
      schema: {
        params: z.object({ id: ObjectIdLike }),
        response: { 200: TaskDTO },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const task = await getTaskById(id);
      if (!task) return reply.notFound('Task not found');
      return task;
    }
  );

  app.get(
    '/tasks',
    {
      schema: {
        querystring: z.object({ status: StatusEnum.optional() }),
        response: { 200: z.array(TaskDTO) },
      },
    },
    async (req) => {
      const { status } = req.query as { status?: TaskStatus };
      return listTasks(status);
    }
  );

app.post('/tasks', {
  schema: { body: CreateTaskBody, response: { 201: TaskDTO } },
}, async (req, reply) => {
  const body = req.body as z.infer<typeof CreateTaskBody>;
  const task = await createTask({
    title: body.title,
    description: body.description,
    dueDate: body.dueDate,
    status: body.status,
  });

  // защита на случай отсутствия mq
  if (!app.mq) {
    req.log.warn('RabbitMQ is not initialized; skipping publish');
  } else {
    await app.mq.publish('task.action', {
      taskId: task.id,
      action: 'created' as const,
      timestamp: new Date().toISOString(),
    });
  }

  reply.code(201);
  return task;
});

app.patch('/tasks/:id', {
  schema: {
    params: z.object({ id: ObjectIdLike }),
    body: UpdateTaskBody,
    response: { 200: TaskDTO },
  },
}, async (req, reply) => {
  const { id } = req.params as { id: string };
  const task = await updateTask(id, req.body as any);
  if (!task) return reply.notFound('Task not found');

  if (!app.mq) {
    req.log.warn('RabbitMQ is not initialized; skipping publish');
  } else {
    await app.mq.publish('task.action', {
      taskId: task.id,
      action: 'updated' as const,
      timestamp: new Date().toISOString(),
    });
  }

  return task;
});
}
