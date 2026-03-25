import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createTailor,
  completeTailorSetup,
  verifyTailorInvitation,
  resendTailorInvitation,
  getDesignerTailors,
  getTailorDetails,
  getTailorOrders,
  getTailorOrderById,
  updateOrderStatus,
  getTailorDashboard,
  assignOrderToTailor,
  getTailors,
  updateTailorStatus,
  getTailorStats,
  getTailorProfile,
  updateTailorProfile,
  getTailorContacts
} from '../controllers/tailor.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

// Ensure uploads/profiles directory exists
const profilesDir = 'uploads/profiles/';
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
  console.log('📁 Created uploads/profiles directory');
}

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'tailor-profile-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP images are allowed.'), false);
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

// Public routes (no authentication required)
router.post('/setup', completeTailorSetup); // Complete tailor account setup
router.get('/verify/:token', verifyTailorInvitation); // Verify invitation token

// All other routes require authentication
router.use(verifyJWT);

// Designer routes
router.post('/invite', createTailor); // Send tailor invitation
router.post('/:tailorId/resend-invitation', resendTailorInvitation); // Resend invitation
router.get('/my-tailors', getDesignerTailors); // Get designer's tailors
router.get('/:tailorId/details', getTailorDetails); // Get individual tailor details
router.get('/', getTailors); // Get all tailors and pending invitations
router.patch('/:tailorId/status', updateTailorStatus); // Update tailor status (activate/deactivate only)
router.post('/assign-order/:orderId', assignOrderToTailor); // Assign order to tailor

// Tailor routes
router.get('/dashboard', getTailorDashboard); // Get tailor dashboard
router.get('/stats', getTailorStats); // Get tailor stats
router.get('/profile', getTailorProfile); // Get tailor profile
router.patch('/profile', upload.single('image'), updateTailorProfile); // Update tailor profile with optional image
router.get('/orders', getTailorOrders); // Get assigned orders
router.get('/orders/:orderId', getTailorOrderById); // Get order details for tailor
router.patch('/orders/:orderId/status', updateOrderStatus); // Update order status
router.get('/contacts', getTailorContacts); // Get tailor contacts

export default router;