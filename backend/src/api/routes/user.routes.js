import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  updateProfile,
  uploadProfilePicture,
  uploadBusinessLogo,
  deleteProfilePicture,
  uploadDesignerDocuments,
  uploadProfileImage,
  uploadPortfolioImages
} from '../controllers/user.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP images and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

const router = Router();

// All user routes require authentication
router.use(verifyJWT);

// Update user profile
router.route('/profile').put(updateProfile);

// Upload profile picture
router.route('/profile/picture').post(upload.single('profileImage'), uploadProfilePicture);

// Upload business logo (for designers)
router.route('/business/logo').post(upload.single('businessLogo'), uploadBusinessLogo);

// Delete profile picture
router.route('/profile/picture').delete(deleteProfilePicture);

// Upload designer verification documents
router.route('/designer/documents').post(upload.fields([
  { name: 'nationalId', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 },
  { name: 'taxCertificate', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 }
]), uploadDesignerDocuments);

// New profile management routes
router.route('/upload-profile-image').post(upload.single('profileImage'), uploadProfileImage);
router.route('/upload-portfolio-images').post(upload.array('portfolioImages', 10), uploadPortfolioImages);

export default router;
