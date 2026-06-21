class MetricsService {
  private totalRequests = 0;
  private cacheHits = 0;
  private totalLatencySum = 0;
  private lastLatency = 0;
  private latencyHistory: number[] = [];

  // Database metrics
  private dbReads = 0;
  private dbWrites = 0;
  private searchSubmissions = 0;

  // Batch flusher stats
  private totalBatches = 0;
  private totalFlushedQueries = 0;
  private lastBatchSize = 0;
  private lastBatchDuration = 0;

  private lastTrendingRefreshDuration = 0;

  /**
   * Records autocomplete performance statistics.
   */
  public recordAutocomplete(latencyMs: number, isCacheHit: boolean): void {
    this.totalRequests++;
    if (isCacheHit) {
      this.cacheHits++;
    }
    this.totalLatencySum += latencyMs;
    this.lastLatency = latencyMs;
    
    // Store latency to compute P95 sliding window (bounded to 1000 entries)
    this.latencyHistory.push(latencyMs);
    if (this.latencyHistory.length > 1000) {
      this.latencyHistory.shift();
    }
  }

  /**
   * Increments database read counter.
   */
  public recordDatabaseReads(count: number = 1): void {
    this.dbReads += count;
  }

  /**
   * Increments database write counter.
   */
  public recordDatabaseWrites(count: number = 1): void {
    this.dbWrites += count;
  }

  /**
   * Increments total search requests posted.
   */
  public recordSearchSubmission(): void {
    this.searchSubmissions++;
  }

  /**
   * Records details of the background batch flusher.
   */
  public recordBatchFlush(batchSize: number, durationMs: number): void {
    this.totalBatches++;
    this.totalFlushedQueries += batchSize;
    this.dbWrites += batchSize;
    this.lastBatchSize = batchSize;
    this.lastBatchDuration = durationMs;
  }

  /**
   * Records details of trending query calculations.
   */
  public recordTrendingRefresh(durationMs: number): void {
    this.lastTrendingRefreshDuration = durationMs;
  }

  /**
   * Helper to calculate the 95th percentile (P95) latency.
   */
  private getP95Latency(): number {
    if (this.latencyHistory.length === 0) return 0;
    const sorted = [...this.latencyHistory].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  /**
   * Compiles and returns all collected metrics.
   */
  public getMetrics() {
    const hitRatio = this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0;
    const missRatio = this.totalRequests > 0 ? (this.totalRequests - this.cacheHits) / this.totalRequests : 0;
    const avgLatency = this.totalRequests > 0 ? this.totalLatencySum / this.totalRequests : 0;
    const p95Latency = this.getP95Latency();

    // Calculate database write reduction percentage
    // e.g. 100 search requests vs 5 database writes = 95% reduction
    const writeReduction = this.searchSubmissions > 0
      ? 1 - (this.dbWrites / this.searchSubmissions)
      : 0;

    const avgBatchSize = this.totalBatches > 0
      ? this.totalFlushedQueries / this.totalBatches
      : 0;

    return {
      timestamp: new Date().toISOString(),
      autocomplete: {
        totalRequests: this.totalRequests,
        cacheHits: this.cacheHits,
        cacheMisses: this.totalRequests - this.cacheHits,
        cacheHitRate: parseFloat((hitRatio * 100).toFixed(2)) + '%',
        cacheMissRate: parseFloat((missRatio * 100).toFixed(2)) + '%',
        cacheHitRatio: parseFloat(hitRatio.toFixed(4)),
        lastLatencyMs: parseFloat(this.lastLatency.toFixed(4)),
        avgLatencyMs: parseFloat(avgLatency.toFixed(4)),
        p95LatencyMs: parseFloat(p95Latency.toFixed(4)),
      },
      database: {
        reads: this.dbReads,
        writes: this.dbWrites,
        searchSubmissions: this.searchSubmissions,
        batchWriteReduction: parseFloat((writeReduction * 100).toFixed(2)) + '%',
        batchWriteReductionRatio: parseFloat(writeReduction.toFixed(4)),
      },
      batchWrites: {
        totalBatchesFlushed: this.totalBatches,
        totalFlushedQueries: this.totalFlushedQueries,
        avgBatchSize: parseFloat(avgBatchSize.toFixed(2)),
        lastBatchSize: this.lastBatchSize,
        lastBatchDurationMs: parseFloat(this.lastBatchDuration.toFixed(4)),
      },
      trending: {
        lastRefreshDurationMs: parseFloat(this.lastTrendingRefreshDuration.toFixed(4)),
      },
    };
  }
}

export const metricsService = new MetricsService();
export default metricsService;
