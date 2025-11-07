import { buildServer } from './server.js';
import cors from '@fastify/cors';
import healthRoute from './routes/health.js';

const app = buildServer();

await app.register(cors, { origin: true });
await app.register(healthRoute, { prefix: '/api' });

const PORT = Number(process.env.PORT ?? 3000);
await app.listen({ port: PORT, host: '0.0.0.0' });
