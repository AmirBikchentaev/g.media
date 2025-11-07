import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import mercurius from 'mercurius';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import tasksRoute from './routes/tasks.js';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

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

  app.register(tasksRoute, { prefix: '/api' });
  return app;
}
