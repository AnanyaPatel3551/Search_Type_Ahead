import { prisma } from '../db/prisma';
import { trieService } from './trie/TrieService';
import { cacheService } from './cache.service';
import { metricsService } from './metrics.service';
import { performance } from 'perf_hooks';

export class BatchService {
  private buffer: Map<string, number> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isFlushing = false;

  /**
   * Pushes a query to the memory buffer and increments its counter.
   */
  public pushToBuffer(query: string): void {
    const currentCount = this.buffer.get(query) || 0;
    this.buffer.set(query, currentCount + 1);
    console.log(`[Batch Buffer] Buffered query: "${query}" (Queue count: ${currentCount + 1})`);
  }

  /**
   * Starts the 5-second background flush loop.
   */
  public startInterval(): void {
    if (this.intervalId) return;

    console.log('[Batch Service] Initiating 5s background database flusher.');
    this.intervalId = setInterval(async () => {
      await this.flushToDatabase();
    }, 5000);
  }

  /**
   * Stops the background flushing cron loop.
   */
  public stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Returns current size of the buffer queue.
   */
  public getBufferSize(): number {
    return this.buffer.size;
  }

  /**
   * Flushes in-memory search counts into PostgreSQL using a Prisma transaction.
   */
  public async flushToDatabase(): Promise<void> {
    if (this.buffer.size === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const start = performance.now();

    // 1. Snapshot the active buffer and clear it
    const currentBuffer = new Map(this.buffer);
    this.buffer.clear();

    const batchSize = currentBuffer.size;
    console.log(`[Batch Flush] Starting flush of ${batchSize} unique queries to database...`);

    try {
      const prismaOps = [];

      // 2. Build upsert instructions for each unique query
      for (const [query, count] of currentBuffer.entries()) {
        prismaOps.push(
          prisma.searchQuery.upsert({
            where: { query },
            update: {
              searchCount: {
                increment: count,
              },
            },
            create: {
              query,
              searchCount: count,
            },
          })
        );
      }

      // 3. Execute all writes atomically inside a transaction
      await prisma.$transaction(prismaOps);

      // 4. Update the in-memory Trie with the aggregated search updates
      for (const [query, count] of currentBuffer.entries()) {
        trieService.insertOrIncrement(query, count);
      }

      // 5. Invalidate the Redis cache for all affected prefixes
      for (const query of currentBuffer.keys()) {
        await cacheService.invalidatePrefixes(query);
      }

      const duration = performance.now() - start;
      console.log(`[Batch Flush] Successfully flushed ${batchSize} records in ${duration.toFixed(2)}ms`);

      // Record telemetry metrics
      metricsService.recordBatchFlush(batchSize, duration);
    } catch (error) {
      console.error('[Batch Flush ERROR] Transaction failed. Restoring queue buffer:', error);

      // Fault-tolerance: Re-add elements to the buffer to prevent data loss
      for (const [query, count] of currentBuffer.entries()) {
        const existingCount = this.buffer.get(query) || 0;
        this.buffer.set(query, existingCount + count);
      }
    } finally {
      this.isFlushing = false;
    }
  }
}

export const batchService = new BatchService();
export default batchService;
