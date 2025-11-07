import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import mercurius from 'mercurius';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import tasksRoute from './routes/tasks.js';
import { rabbitPlugin } from './plugins/rabbit.js';

export function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(sensible);

  app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: true,
    path: '/graphql',
  });

  // ⬇️ RabbitMQ
  app.register(rabbitPlugin, {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'tasks',
  });

  app.register(tasksRoute, { prefix: '/api' });
  return app;
}
