import { Request, Response, NextFunction } from 'express';
import { batchService } from '../services/batch.service';
import { trendingService } from '../services/trending.service';
import { metricsService } from '../services/metrics.service';
import { AppError } from '../middleware/error';

export class SearchController {
  /**
   * Processes a new user search query.
   * POST /search
   */
  public async handleSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.body;

      // 1. Validate query input presence and data type
      if (query === undefined || query === null) {
        throw new AppError('Search query is required', 400);
      }

      if (typeof query !== 'string') {
        throw new AppError('Search query must be a string', 400);
      }

      // 2. Trim whitespace and normalize to lowercase
      const normalizedQuery = query.trim().toLowerCase();

      // 3. Ignore empty strings and return early with error or success response
      if (normalizedQuery === '') {
        throw new AppError('Search query cannot be empty or whitespace only', 400);
      }

      // 4. Push search to the memory buffer for bulk DB writing
      batchService.pushToBuffer(normalizedQuery);

      // 5. Record trending query event immediately (non-blocking)
      trendingService.recordSearchEvent(normalizedQuery).catch((err) => {
        console.error('[SearchController] Failed to log trending search:', err);
      });

      // 6. Record search submission telemetry metric
      metricsService.recordSearchSubmission();

      res.status(200).json({
        status: 'success',
        message: 'Search query received and queued for batch writing',
        query: normalizedQuery,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
export default searchController;
