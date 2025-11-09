import { FastifyPluginAsync } from 'fastify';
import amqp from 'amqplib';
import type { Options } from 'amqplib';

interface MQ {
  connection: amqp.Connection;
  channel: amqp.Channel;
  publish: (routingKey: string, payload: unknown, opts?: Options.Publish) => Promise<void>;
}

declare module 'fastify' {
  interface FastifyInstance {
    mq: MQ;
  }
}

type RabbitPluginOpts = {
  url: string;
  exchangeName?: string; // по умолчанию task.exchange
  queueName?: string;    // по умолчанию task.actions
  routingKey?: string;   // по умолчанию task.action
};

export const rabbitPlugin: FastifyPluginAsync<RabbitPluginOpts> = async (app, opts) => {
  const url        = opts.url || process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const exchange   = opts.exchangeName || process.env.RABBITMQ_EXCHANGE || 'task.exchange';
  const queue      = opts.queueName    || process.env.RABBITMQ_QUEUE    || 'task.actions';
  const routingKey = opts.routingKey   || process.env.RABBITMQ_RK       || 'task.action';

  //@ts-ignore
  const conn: amqp.Connection = await amqp.connect(url);
  //@ts-ignore
  const ch: amqp.Channel = await conn.createChannel();

  await ch.assertExchange(exchange, 'direct', { durable: true });
  await ch.assertQueue(queue, { durable: true });
  
  await ch.bindQueue(queue, exchange, routingKey);

  async function publish(rk: string, payload: unknown, pubOpts?: Options.Publish) {
    const buf = Buffer.from(JSON.stringify(payload));
    ch.publish(
      exchange,
      rk,
      buf,
      { contentType: 'application/json', persistent: true, ...pubOpts }
    );
    app.log.info({ rk }, '[rabbit] published');
    return Promise.resolve();
  }

  app.decorate<MQ>('mq', { connection: conn, channel: ch, publish });

  app.addHook('onClose', async () => {
    try { await ch.close(); } catch {}
    //@ts-ignore
    try { await conn.close(); } catch {}
  });
};
