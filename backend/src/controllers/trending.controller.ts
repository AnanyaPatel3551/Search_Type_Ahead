import { Request, Response, NextFunction } from 'express';
import { trendingService } from '../services/trending.service';

export class TrendingController {
  /**
   * Responds with the top 10 trending searches from the last hour.
   * GET /trending
   */
  public async getTrending(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await trendingService.getTrendingSearches();
      res.status(200).json({
        status: 'success',
        results,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const trendingController = new TrendingController();
export default trendingController;
