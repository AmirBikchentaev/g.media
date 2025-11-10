import { FastifyInstance } from 'fastify';

export default async function healthRoute(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));

  app.get('/health/mq', async (req) => {
    // @ts-ignore
    const hasMq = Boolean(app.mq);
    return { ok: true, mq: hasMq };
  });
}
