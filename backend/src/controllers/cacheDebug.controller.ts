import { Request, Response, NextFunction } from 'express';
import { redis } from '../db/redis';
import { sharedHashRing } from '../utils/consistentHash';
import { AppError } from '../middleware/error';

export class CacheDebugController {
  /**
   * Diagnostic cache debugging endpoint
   * GET /cache/debug?prefix=iph
   */
  public async handleCacheDebug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { prefix } = req.query;

      if (prefix === undefined || prefix === null) {
        throw new AppError('Query parameter "prefix" is required', 400);
      }

      if (typeof prefix !== 'string') {
        throw new AppError('Query parameter "prefix" must be a string', 400);
      }

      const normalizedPrefix = prefix.trim().toLowerCase();
      if (normalizedPrefix === '') {
        throw new AppError('Query parameter "prefix" cannot be empty', 400);
      }

      // 1. Locate cache node and calculate consistent hash value
      const node = sharedHashRing.locateNode(normalizedPrefix);
      const hashValue = sharedHashRing.hashKey(normalizedPrefix);

      // 2. Query Redis for actual cache info
      const cacheKey = `autocomplete:prefix:${normalizedPrefix}`;
      const cachedValue = await redis.get(cacheKey);
      
      const cacheHit = cachedValue !== null;
      let ttl = -2;
      let sizeBytes = 0;

      if (cacheHit) {
        ttl = await redis.ttl(cacheKey);
        sizeBytes = Buffer.byteLength(cachedValue || '');
      }

      res.status(200).json({
        prefix: normalizedPrefix,
        cacheKey,
        cacheNodeSelected: node,
        consistentHashValue: hashValue,
        cacheHit,
        ttlRemainingSeconds: ttl,
        cachedValueSizeBytes: sizeBytes,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cacheDebugController = new CacheDebugController();
export default cacheDebugController;
