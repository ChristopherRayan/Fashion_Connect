import { Router } from 'express';
import {
 getAllProducts,
 getProductById,
 createProduct,
 updateProduct,
 deleteProduct,
 getDesignerProducts,
 getProductReviews,
 createProductReview,
 getCategories,
 getCategoryStats,
 getOutOfStockCount
} from '../controllers/product.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';
const router = Router();
// Public routes
router.route('/').get(getAllProducts);
router.route('/categories').get(getCategories);
router.route('/categories/stats').get(getCategoryStats);
router.route('/:productId').get(getProductById);
router.route('/:productId/reviews').get(getProductReviews);
// Secured routes
router.route('/').post(verifyJWT, authorizeRoles('DESIGNER', 'ADMIN'), createProduct);
router.route('/:productId').put(verifyJWT, authorizeRoles('DESIGNER', 'ADMIN'), updateProduct);
router.route('/:productId').delete(verifyJWT, authorizeRoles('DESIGNER', 'ADMIN'), deleteProduct);
router.route('/designer/my-products').get(verifyJWT, authorizeRoles('DESIGNER'), getDesignerProducts);
router.route('/designer/out-of-stock-count').get(verifyJWT, authorizeRoles('DESIGNER'), getOutOfStockCount);
router.route('/:productId/reviews').post(verifyJWT, authorizeRoles('CLIENT'), createProductReview);
export default router;
