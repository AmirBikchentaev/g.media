import cors from '@fastify/cors';
import { buildServer } from './server.js';
import { connectMongo } from './db/mongoose.js';

async function main() {
  await connectMongo();

  const app = buildServer();
  await app.register(cors, { origin: true });

  const PORT = Number(process.env.PORT ?? 3000);
  await app.listen({ port: PORT, host: '0.0.0.0' });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
