import { Router } from 'express';
import {
  getMockProducts,
  getMockProductById,
  getMockDesigners,
  getMockDesignerProfile,
  getMockOrders,
  createMockOrder,
  mockLogin,
  mockRegister,
  mockGetCurrentUser,
  mockRequestEmailVerification
} from '../controllers/mock.controller.js';

const router = Router();

// Mock Product routes
router.get('/products', getMockProducts);
router.get('/products/:productId', getMockProductById);

// Mock Designer routes
router.get('/designers', getMockDesigners);
router.get('/designers/:designerId', getMockDesignerProfile);

// Mock Order routes
router.get('/orders/my-orders', getMockOrders);
router.post('/orders', createMockOrder);

// Mock Auth routes
router.post('/auth/login', mockLogin);
router.post('/auth/register', mockRegister);
router.post('/auth/request-verification', mockRequestEmailVerification);
router.get('/auth/me', mockGetCurrentUser);
router.post('/auth/logout', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: null,
    message: 'Logged out successfully (mock)'
  });
});

// Mock Tailor routes (temporary to prevent 404 errors)
router.get('/tailors/:tailorId/details', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      id: req.params.tailorId,
      name: 'Mock Tailor',
      email: 'mock@tailor.com',
      phone: '123-456-7890',
      specialties: ['Mock Speciality'],
      experience: 5,
      profileImage: null
    },
    message: 'Mock tailor details'
  });
});

router.get('/tailors/my-tailors', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: [],
    message: 'Mock tailor list'
  });
});

// Mock Order routes for designer
router.get('/orders/designer-orders', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      limit: 10
    },
    message: 'Mock designer orders'
  });
});

// Mock Product routes for designer
router.get('/products/designer/out-of-stock-count', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: { count: 0 },
    message: 'Mock out of stock count'
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: null,
    message: 'API is healthy (mock mode)'
  });
});

export default router;