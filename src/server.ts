import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import mercurius from 'mercurius';
import {
  serializerCompiler as zodSerializer,
  validatorCompiler as zodValidator,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import tasksRoute from './routes/tasks.js';
import { rabbitPlugin } from './plugins/rabbit.js';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fjs from 'fast-json-stringify';

export function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  // --- Mixed compilers: Zod OR JSON Schema ---
  const ajv = new Ajv({ coerceTypes: true, removeAdditional: 'all' });
  addFormats(ajv);

  app.setValidatorCompiler((req) => {
    const schema: any = req.schema;
    const isZod = schema && (typeof (schema as any).safeParse === 'function' || (schema as any)._def);
    // @ts-ignore
    return isZod ? zodValidator(req) : ajv.compile(schema);
  });

  app.setSerializerCompiler((req) => {
    const schema: any = req.schema;
    const isZod = schema && (typeof (schema as any).safeParse === 'function' || (schema as any)._def);
    // @ts-ignore
    return isZod ? zodSerializer(req) : fjs(schema);
  });
  // --- end Mixed compilers ---

  app.register(sensible);

  // RabbitMQ plugin (Direct exchange + queue + binding)
  app.register(rabbitPlugin, {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbit:5672',
    exchangeName: process.env.RABBITMQ_EXCHANGE || 'task.exchange',
    queueName: process.env.RABBITMQ_QUEUE || 'task.actions',
    routingKey: process.env.RABBITMQ_RK || 'task.action',
  });

  // GraphQL (пробрасываем mq в контекст)
  //@ts-ignore
  app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: true,
    path: '/graphql',
    context: () => ({ mq: app.mq }),
  });

  // REST
  app.register(tasksRoute, { prefix: '/api' });

  return app;
}
