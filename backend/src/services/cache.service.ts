import { redis } from '../db/redis';

// Configure TTL (in seconds)
const CACHE_TTL = 60;

export class CacheService {
  private getCacheKey(prefix: string): string {
    return `autocomplete:prefix:${prefix}`;
  }

  /**
   * Retrieves suggestions from Redis cache.
   * Logs cache hits and misses.
   */
  public async getAutocompleteCache(prefix: string): Promise<Array<{ query: string; count: number }> | null> {
    try {
      const cacheKey = this.getCacheKey(prefix);
      const data = await redis.get(cacheKey);

      if (data) {
        console.log(`[Cache HIT] Prefix key: "${prefix}"`);
        return JSON.parse(data);
      }

      console.log(`[Cache MISS] Prefix key: "${prefix}"`);
      return null;
    } catch (error) {
      console.error('[Cache] Read error:', error);
      return null; // Return null so we fall back to Trie search
    }
  }

  /**
   * Caches suggestions in Redis.
   */
  public async setAutocompleteCache(prefix: string, results: Array<{ query: string; count: number }>): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(prefix);
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
    } catch (error) {
      console.error('[Cache] Write error:', error);
    }
  }

  /**
   * Invalidates autocomplete caches for all prefix variations of a query.
   * If query is "iphone", invalidates: "i", "ip", "iph", "ipho", "iphon", "iphone".
   */
  public async invalidatePrefixes(query: string): Promise<void> {
    try {
      if (!query) return;

      const keysToDel: string[] = [];
      
      // Build all prefixes
      for (let i = 1; i <= query.length; i++) {
        const prefix = query.substring(0, i);
        keysToDel.push(this.getCacheKey(prefix));
      }

      if (keysToDel.length > 0) {
        // Run atomic pipeline deletion
        const pipeline = redis.pipeline();
        keysToDel.forEach((key) => pipeline.del(key));
        await pipeline.exec();
        console.log(`[Cache Invalidation] Cleared ${keysToDel.length} keys matching prefixes for query: "${query}"`);
      }
    } catch (error) {
      console.error('[Cache Invalidation] Error clearing cache keys:', error);
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
