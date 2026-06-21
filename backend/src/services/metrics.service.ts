class MetricsService {
  private totalRequests = 0;
  private cacheHits = 0;
  private totalLatencySum = 0;
  private lastLatency = 0;

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
  }

  /**
   * Records details of the background batch flusher.
   */
  public recordBatchFlush(batchSize: number, durationMs: number): void {
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
   * Compiles and returns all collected metrics.
   */
  public getMetrics() {
    const hitRatio = this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0;
    const avgLatency = this.totalRequests > 0 ? this.totalLatencySum / this.totalRequests : 0;

    return {
      timestamp: new Date().toISOString(),
      autocomplete: {
        totalRequests: this.totalRequests,
        cacheHits: this.cacheHits,
        cacheMisses: this.totalRequests - this.cacheHits,
        cacheHitRatio: parseFloat(hitRatio.toFixed(4)),
        lastLatencyMs: parseFloat(this.lastLatency.toFixed(4)),
        avgLatencyMs: parseFloat(avgLatency.toFixed(4)),
      },
      batchWrites: {
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
