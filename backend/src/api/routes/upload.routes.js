import { Router } from 'express';
import {
  uploadImage,
  uploadMultipleImages,
  uploadSingleImage,
  uploadMultipleImagesMiddleware
} from '../controllers/upload.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';

const router = Router();

// Upload single image (for designers, admins, and clients for custom color references)
router.route('/image').post(
  verifyJWT,
  authorizeRoles('DESIGNER', 'ADMIN', 'CLIENT'),
  uploadSingleImage,
  uploadImage
);

// Upload multiple images (for designers and admins)
router.route('/images').post(
  verifyJWT,
  authorizeRoles('DESIGNER', 'ADMIN'),
  uploadMultipleImagesMiddleware,
  uploadMultipleImages
);

export default router;
