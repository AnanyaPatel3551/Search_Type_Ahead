import Redis from 'ioredis';
import { config } from '../config';

// Initialize Redis client using settings from config
export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  // Recommended configuration to handle connection failures and avoid blocking queries
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

// Event listeners to log client connection state
redis.on('connect', () => {
  console.log('[Redis] Connecting...');
});

redis.on('ready', () => {
  console.log('[Redis] Connected and ready to use.');
});

redis.on('error', (error) => {
  console.error('[Redis] Connection error:', error.message || error);
});

redis.on('end', () => {
  console.warn('[Redis] Connection closed.');
});
