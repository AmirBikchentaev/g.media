import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import mercurius from 'mercurius';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import tasksRoute from './routes/tasks.js';

// 👇 добавь это:
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';

export function buildServer() {
  // 👇 сразу типизируем сервер Zod-провайдером
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.register(sensible);

  // 👇 говорим Fastify использовать Zod, а не AJV
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // GraphQL
  app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: true,
    path: '/graphql',
  });

  // REST
  app.register(tasksRoute, { prefix: '/api' });

  return app;
}
