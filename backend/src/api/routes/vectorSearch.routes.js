import { Router } from 'express';
import {
  generateEmbeddings,
  findSimilarProducts,
  searchSimilarProducts,
  getRecommendations,
  getEmbeddingStats
} from '../controllers/vectorSearch.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes (no authentication required)
router.route('/similar/:productId').get(findSimilarProducts);
router.route('/search').get(searchSimilarProducts);
router.route('/recommendations').get(getRecommendations);
router.route('/stats').get(getEmbeddingStats);

// Admin routes (require authentication and admin role)
router.route('/generate-embeddings').post(
  verifyJWT, 
  authorizeRoles('ADMIN'), 
  generateEmbeddings
);

export default router;
