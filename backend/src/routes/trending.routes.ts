import { Router } from 'express';
import { trendingController } from '../controllers/trending.controller';

const router = Router();

// GET /trending
router.get('/', trendingController.getTrending.bind(trendingController));

export default router;
