import amqp from 'amqplib';

const URL       = process.env.RABBITMQ_URL      || 'amqp://guest:guest@localhost:5672';
const EXCHANGE  = process.env.RABBITMQ_EXCHANGE || 'task.exchange';
const ROUTING   = process.env.RABBITMQ_RK       || 'task.action';

let conn: amqp.Connection | null = null;
let ch: amqp.Channel | null = null;

async function ensureChannel(): Promise<amqp.Channel> {
  if (ch) return ch;
//@ts-ignore
  conn = await amqp.connect(URL);
  //@ts-ignore
  ch = await conn.createChannel();
  //@ts-ignore
  await ch.assertExchange(EXCHANGE, 'direct', { durable: true });
  //@ts-ignore
  return ch;
}

export async function publishTaskEvent(payload: {
  taskId: string;
  action: 'created' | 'updated';
  timestamp?: string;
}) {
  const channel = await ensureChannel();
  const msg = { ...payload, timestamp: payload.timestamp ?? new Date().toISOString() };
  const buf = Buffer.from(JSON.stringify(msg));
  channel.publish(EXCHANGE, ROUTING, buf, {
    contentType: 'application/json',
    persistent: true,
  });
}

export async function closeMq() {
  try { await ch?.close(); } catch {}
  //@ts-ignore
  try { await conn?.close(); } catch {}
  ch = null;
  conn = null;
}
