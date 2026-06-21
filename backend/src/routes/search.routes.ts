import { Router } from 'express';
import { searchController } from '../controllers/search.controller';

const router = Router();

// POST /search
router.post('/', searchController.handleSearch.bind(searchController));

export default router;
