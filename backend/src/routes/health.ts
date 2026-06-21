import { Router } from 'express';
import { prisma } from '../db/prisma';
import { redis } from '../db/redis';

const router = Router();

router.get('/health', async (_req, res, next) => {
  try {
    let dbStatus = 'UP';
    let redisStatus = 'UP';

    // Verify PostgreSQL Connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error('[Health Check] PostgreSQL down:', error);
      dbStatus = 'DOWN';
    }

    // Verify Redis Connection
    try {
      const pingResult = await redis.ping();
      if (pingResult !== 'PONG') {
        redisStatus = 'DOWN';
      }
    } catch (error) {
      console.error('[Health Check] Redis down:', error);
      redisStatus = 'DOWN';
    }

    const overallStatus = dbStatus === 'UP' && redisStatus === 'UP' ? 'OK' : 'DEGRADED';
    const statusCode = overallStatus === 'OK' ? 200 : 500;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
