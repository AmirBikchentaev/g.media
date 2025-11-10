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

  // mixed compilers
  const ajv = new Ajv({ coerceTypes: true, removeAdditional: 'all' });
  addFormats(ajv);
  app.setValidatorCompiler((req) => {
    const schema: any = req.schema;
    // @ts-ignore
    const isZod = schema && (typeof schema.safeParse === 'function' || schema?._def);
    // @ts-ignore
    return isZod ? zodValidator(req) : ajv.compile(schema);
  });
  app.setSerializerCompiler((req) => {
    const schema: any = req.schema;
    // @ts-ignore
    const isZod = schema && (typeof schema.safeParse === 'function' || schema?._def);
    // @ts-ignore
    return isZod ? zodSerializer(req) : fjs(schema);
  });

  app.register(sensible);

  // 1) СНАЧАЛА — RabbitMQ (и лучше с await в index.ts через app.ready())
  app.register(rabbitPlugin, {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbit:5672',
    exchangeName: process.env.RABBITMQ_EXCHANGE || 'task.exchange',
    queueName: process.env.RABBITMQ_QUEUE || 'task.actions',
    routingKey: process.env.RABBITMQ_RK || 'task.action',
  });

  // 2) GraphQL — контекст забирает app.mq (после регистрации плагина)
  //@ts-ignore
  app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: true,
    path: '/graphql',
    context: () => ({ mq: app.mq }), // будет доступно после инициализации плагина
  });

  // 3) REST
  app.register(tasksRoute, { prefix: '/api' });

  return app;
}
