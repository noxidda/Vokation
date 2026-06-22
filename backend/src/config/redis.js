import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('[Redis] Connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('error', (err) => {
  console.error('[Redis] Error:', err);
});

export default redis;