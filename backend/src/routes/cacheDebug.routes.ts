import { Router } from 'express';
import { cacheDebugController } from '../controllers/cacheDebug.controller';

const router = Router();

// GET /cache/debug
router.get('/', cacheDebugController.handleCacheDebug.bind(cacheDebugController));

export default router;
