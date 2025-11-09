// src/plugins/rabbit.ts
import { FastifyPluginAsync } from 'fastify';
import amqp from 'amqplib';
import type { Options } from 'amqplib';

interface MQ {
  connection: amqp.Connection;
  channel: amqp.Channel;
  publish: (routingKey: string, payload: unknown, opts?: Options.Publish) => Promise<void>;
}

declare module 'fastify' {
  interface FastifyInstance { mq: MQ }
}

type RabbitPluginOpts = {
  url: string;
  exchangeName?: string;
  queueName?: string;
  routingKey?: string;
};

async function connectAmqp(url: string, retries = 20, delayMs = 1500): Promise<amqp.Connection> {
  let lastErr: any;
  for (let i = 1; i <= retries; i++) {
    try {
      //@ts-ignore
      return await amqp.connect(url);
    } catch (e: any) {
      lastErr = e;
      // ECONNREFUSED / ETIMEDOUT — ждём и пробуем снова
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

export const rabbitPlugin: FastifyPluginAsync<RabbitPluginOpts> = async (app, opts) => {
  const url        = opts.url || process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const exchange   = opts.exchangeName || process.env.RABBITMQ_EXCHANGE || 'task.exchange';
  const queue      = opts.queueName    || process.env.RABBITMQ_QUEUE    || 'task.actions';
  const routingKey = opts.routingKey   || process.env.RABBITMQ_RK       || 'task.action';

  app.log.info({ url }, '[rabbit] connecting...');
  const conn = await connectAmqp(url);
  //@ts-ignore
  const ch = await conn.createChannel();

  await ch.assertExchange(exchange, 'direct', { durable: true });
  await ch.assertQueue(queue, { durable: true });
  await ch.bindQueue(queue, exchange, routingKey);

  async function publish(rk: string, payload: unknown, pubOpts?: Options.Publish) {
    const buf = Buffer.from(JSON.stringify(payload));
    ch.publish(exchange, rk, buf, { contentType: 'application/json', persistent: true, ...pubOpts });
    app.log.info({ rk }, '[rabbit] published');
  }

  app.decorate<MQ>('mq', { connection: conn, channel: ch, publish });

  app.addHook('onClose', async () => {
    try { await ch.close(); } catch {}
    //@ts-ignore
    try { await conn.close(); } catch {}
  });

  app.log.info('[rabbit] ready');
};
