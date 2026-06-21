import { Router } from 'express';
import { consistentHashController } from '../controllers/consistentHash.controller';

const router = Router();

// GET /consistent-hash/simulate
router.get('/simulate', consistentHashController.handleSimulation.bind(consistentHashController));

export default router;
