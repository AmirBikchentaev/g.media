import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export default async function healthRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/health',
    {
      schema: {
        querystring: z.object({ ping: z.string().default('pong') }),
        response: {
          200: z.object({ ok: z.boolean(), echo: z.string() })
        }
      }
    },
    async (req, reply) => {
      return { ok: true, echo: req.query.ping };
    }
  );
}
