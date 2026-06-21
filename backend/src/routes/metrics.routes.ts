import { Router } from 'express';
import { metricsController } from '../controllers/metrics.controller';

const router = Router();

// GET /metrics
router.get('/', metricsController.getMetrics.bind(metricsController));

export default router;
