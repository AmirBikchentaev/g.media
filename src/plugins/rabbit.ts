import { FastifyPluginAsync } from 'fastify';
import amqp from 'amqplib';
import type { Options } from 'amqplib';

interface MQ {
  connection: amqp.Connection;
  channel: amqp.ConfirmChannel;
  publish: (routingKey: string, payload: unknown, opts?: Options.Publish) => Promise<void>;
}

declare module 'fastify' {
  interface FastifyInstance {
    mq: MQ;
  }
}

type RabbitPluginOpts = {
  url: string;
  exchange: string;
};

export const rabbitPlugin: FastifyPluginAsync<RabbitPluginOpts> = async (app, opts) => {
  const { url, exchange } = opts;
// @ts-ignore 
  const amqpConn: amqp.Connection = await amqp.connect(url);

  // 👇 просто добавь ts-ignore здесь
  // @ts-ignore 
  const amqpChan: amqp.ConfirmChannel = await amqpConn.createConfirmChannel();

  await amqpChan.assertExchange(exchange, 'topic', { durable: true });

  async function publish(routingKey: string, payload: unknown, pubOpts?: Options.Publish) {
    const buf = Buffer.from(JSON.stringify(payload));
    await new Promise<void>((resolve, reject) => {
      amqpChan.publish(
        exchange,
        routingKey,
        buf,
        { contentType: 'application/json', persistent: true, ...pubOpts },
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  app.decorate<MQ>('mq', { connection: amqpConn, channel: amqpChan, publish });

  app.addHook('onClose', async () => {
    try { await amqpChan.close(); } catch {}
    // @ts-ignore 
    try { await amqpConn.close(); } catch {}
  });
};
