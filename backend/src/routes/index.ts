import { Router } from 'express';
import healthRouter from './health';
import searchRouter from './search.routes';
import autocompleteRouter from './autocomplete.routes';
import trendingRouter from './trending.routes';
import metricsRouter from './metrics.routes';
import consistentHashRouter from './consistentHash.routes';

const router = Router();

// Register sub-routers
router.use('/', healthRouter);
router.use('/search', searchRouter);
router.use('/autocomplete', autocompleteRouter);
router.use('/trending', trendingRouter);
router.use('/metrics', metricsRouter);
router.use('/consistent-hash', consistentHashRouter);

export default router;
