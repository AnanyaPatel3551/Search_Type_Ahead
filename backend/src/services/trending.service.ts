import { redis } from '../db/redis';
import { metricsService } from './metrics.service';
import { performance } from 'perf_hooks';
import { trieService } from './trie/TrieService';

const TRENDING_ZSET_KEY = 'trending:log';
const TRENDING_CACHE_KEY = 'trending:top10:cache';
const TRENDING_CACHE_TTL = 10; // Cache compiled trending list for 10 seconds
const ONE_HOUR_MS = 3600 * 1000;

export class TrendingService {
  /**
   * Logs a search event in the Redis Sorted Set.
   * Score is the current timestamp.
   * Member is formatted as "query:unique_suffix" to allow duplicates.
   */
  public async recordSearchEvent(query: string): Promise<void> {
    try {
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 11);
      const member = `${query}:${timestamp}:${uniqueId}`;

      await redis.zadd(TRENDING_ZSET_KEY, timestamp, member);
      console.log(`[Trending Log] Logged trending event for query: "${query}"`);
    } catch (error) {
      console.error('[Trending] Failed to log search event:', error);
    }
  }

  /**
   * Compiles the top 10 trending searches of the last hour.
   * Uses caching to limit database processing.
   */
  public async getTrendingSearches(): Promise<Array<{ query: string; count: number; score?: number; historicalCount?: number }>> {
    const startTime = performance.now();
    try {
      // 1. Check compiled list cache
      const cached = await redis.get(TRENDING_CACHE_KEY);
      if (cached) {
        const results = JSON.parse(cached);
        const duration = performance.now() - startTime;
        metricsService.recordTrendingRefresh(duration);
        return results;
      }

      const now = Date.now();
      const oneHourAgo = now - ONE_HOUR_MS;

      // 2. Prune old elements (sliding window cleanup)
      await redis.zremrangebyscore(TRENDING_ZSET_KEY, '-inf', oneHourAgo);

      // 3. Fetch active window elements
      const events = await redis.zrangebyscore(TRENDING_ZSET_KEY, oneHourAgo, '+inf');

      // 4. Aggregate frequencies in memory
      const frequencies: Record<string, number> = {};
      for (const event of events) {
        // Event format is: "query:timestamp:uniqueId"
        const lastColonIdx = event.lastIndexOf(':');
        if (lastColonIdx === -1) continue;
        
        const timestampPartIdx = event.lastIndexOf(':', lastColonIdx - 1);
        if (timestampPartIdx === -1) continue;

        const query = event.substring(0, timestampPartIdx);
        frequencies[query] = (frequencies[query] || 0) + 1;
      }

      // 5. Apply trending scoring formula: 0.7 * recentCount + 0.3 * historicalCount
      // where historicalCount is retrieved directly from Trie index
      const sortedTrending = Object.entries(frequencies)
        .map(([query, recentCount]) => {
          const historicalCount = trieService.getCount(query);
          const score = 0.7 * recentCount + 0.3 * historicalCount;
          return {
            query,
            count: recentCount,
            historicalCount,
            score: parseFloat(score.toFixed(2)),
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // 6. Cache the aggregated trending result
      await redis.setex(TRENDING_CACHE_KEY, TRENDING_CACHE_TTL, JSON.stringify(sortedTrending));

      const duration = performance.now() - startTime;
      console.log(`[Trending Compile] Compiled ${sortedTrending.length} trending items in ${duration.toFixed(2)}ms`);
      
      metricsService.recordTrendingRefresh(duration);

      return sortedTrending;
    } catch (error) {
      console.error('[Trending] Failed to get trending searches:', error);
      return [];
    }
  }
}

export const trendingService = new TrendingService();
export default trendingService;
