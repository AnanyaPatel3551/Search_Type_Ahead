import { Router } from 'express';
import { autocompleteController } from '../controllers/autocomplete.controller';

const router = Router();

// GET /autocomplete
router.get('/', autocompleteController.handleAutocomplete.bind(autocompleteController));

export default router;
