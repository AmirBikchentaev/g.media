import amqp from 'amqplib';

const url        = process.env.RABBITMQ_URL      || 'amqp://guest:guest@localhost:5672';
const exchange   = process.env.RABBITMQ_EXCHANGE || 'task.exchange';
const queue      = process.env.RABBITMQ_QUEUE    || 'task.actions';

async function main() {
  const conn = await amqp.connect(url);
  const ch = await conn.createChannel();

  await ch.assertExchange(exchange, 'direct', { durable: true });
  await ch.assertQueue(queue, { durable: true });

  await ch.consume(queue, (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString()) as {
        taskId: string;
        action: 'created' | 'updated';
        timestamp: string;
      };

      console.log(`Task ${content.taskId} was ${content.action} at ${content.timestamp}`);
      ch.ack(msg);
    } catch (e) {
      console.error('[consumer] parse error', e);
      ch.nack(msg, false, false);
    }
  }, { noAck: false });

  console.log('[consumer] listening on queue:', queue);
}

main().catch((e) => {
  console.error('[consumer] fatal', e);
  process.exit(1);
});
