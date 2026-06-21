import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { trieService } from '../services/trie/TrieService';
import { cacheService } from '../services/cache.service';
import { metricsService } from '../services/metrics.service';
import { AppError } from '../middleware/error';

export class AutocompleteController {
  /**
   * Serves search suggestions matching a prefix.
   * GET /autocomplete?prefix=iph
   */
  public async handleAutocomplete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { prefix } = req.query;

      // 1. Validate prefix presence
      if (prefix === undefined || prefix === null) {
        throw new AppError('Query parameter "prefix" is required', 400);
      }

      if (typeof prefix !== 'string') {
        throw new AppError('Query parameter "prefix" must be a string', 400);
      }

      // Start timing with microsecond precision
      const startTime = performance.now();

      // 2. Normalize input prefix
      const normalizedPrefix = prefix.trim().toLowerCase();

      // 3. Return early if prefix is empty after trimming
      if (normalizedPrefix === '') {
        const endTime = performance.now();
        const latency = parseFloat((endTime - startTime).toFixed(4));
        // Record metrics for empty search as a hit
        metricsService.recordAutocomplete(latency, true);
        res.status(200).json({
          latencyMs: latency,
          results: [],
        });
        return;
      }

      // 4. Query Redis Cache first
      const cachedSuggestions = await cacheService.getAutocompleteCache(normalizedPrefix);

      if (cachedSuggestions !== null) {
        const endTime = performance.now();
        const latency = parseFloat((endTime - startTime).toFixed(4));

        // Record metrics (Cache HIT)
        metricsService.recordAutocomplete(latency, true);

        res.status(200).json({
          latencyMs: latency,
          results: cachedSuggestions,
          fromCache: true,
        });
        return;
      }

      // 5. Cache MISS: Query the in-memory Trie index
      const suggestions = trieService.getSuggestions(normalizedPrefix);

      // Write results to Redis cache asynchronously
      cacheService.setAutocompleteCache(normalizedPrefix, suggestions).catch((err) => {
        console.error('[AutocompleteController] Failed to write cache:', err);
      });

      const endTime = performance.now();
      const latency = parseFloat((endTime - startTime).toFixed(4));

      // Record metrics (Cache MISS)
      metricsService.recordAutocomplete(latency, false);

      res.status(200).json({
        latencyMs: latency,
        results: suggestions,
        fromCache: false,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const autocompleteController = new AutocompleteController();
export default autocompleteController;
