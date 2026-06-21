import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';

export class MetricsController {
  /**
   * Responds with current system metrics.
   * GET /metrics
   */
  public getMetrics(_req: Request, res: Response, next: NextFunction): void {
    try {
      const stats = metricsService.getMetrics();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const metricsController = new MetricsController();
export default metricsController;
