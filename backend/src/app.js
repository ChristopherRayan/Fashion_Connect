import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/error.middleware.js';
const app = express();

// CORS: allow localhost and common LAN dev hosts (192.168.x.x, 10.x.x.x) on :5173
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
const envAllowed = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowed])];
const lanOriginRegexes = [
  /^http:\/\/192\.168\.(\d{1,3})\.(\d{1,3}):5173$/,
  /^http:\/\/10\.(\d{1,3})\.(\d{1,3})\.(\d{1,3}):5173$/
];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // allow non-browser or same-origin requests
  if (allowedOrigins.includes(origin)) return true;
  return lanOriginRegexes.some(rx => rx.test(origin));
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Additional CORS handling for preflight requests
app.options('*', (req, res) => {
  const requestOrigin = req.headers.origin;
  if (isOriginAllowed(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use('/uploads', express.static("uploads"));
app.use('/public', express.static("public"));
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});
// --- Import Routes ---
import authRoutes from './api/routes/auth.routes.js';
import productRoutes from './api/routes/product.routes.js';
import orderRoutes from './api/routes/order.routes.js';
import customOrderRoutes from './api/routes/customOrder.routes.js';
import designerRoutes from './api/routes/designer.routes.js';
import adminRoutes from './api/routes/admin.routes.js';
import uploadRoutes from './api/routes/upload.routes.js';
import messageRoutes from './api/routes/message.routes.js';
import analyticsRoutes from './api/routes/analytics.routes.js';
import notificationRoutes from './api/routes/notification.routes.js';
import databaseRoutes from './api/routes/database.routes.js';
import paymentRoutes from './api/routes/payment.routes.js';
import vectorSearchRoutes from './api/routes/vectorSearch.routes.js';
import complaintRoutes from './api/routes/complaint.routes.js';
import userRoutes from './api/routes/user.routes.js';
import emailVerificationRoutes from './api/routes/emailVerification.routes.js';
import tailorRoutes from './api/routes/tailor.routes.js';
import mockRoutes from './api/routes/mock.routes.js';

// Check if MongoDB is available
const isMongoAvailable = () => {
  try {
    console.log('🔍 Environment check:');
    console.log('  MONGO_URI:', process.env.MONGO_URI);
    console.log('  USE_MOCK_DATA:', process.env.USE_MOCK_DATA);
    console.log('  USE_MOCK_DATA type:', typeof process.env.USE_MOCK_DATA);

    // For development, always use mock data when USE_MOCK_DATA is true
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('  ❌ Using mock data because USE_MOCK_DATA is true');
      return false;
    }
    const result = process.env.MONGO_URI && process.env.USE_MOCK_DATA !== 'true';
    console.log('  ✅ Database available:', result);
    return result;
  } catch (error) {
    console.log('  ❌ Error checking database availability:', error);
    return false;
  }
};

// --- Route Declarations ---
if (isMongoAvailable()) {
  // Use real database routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/custom-orders', customOrderRoutes);
  app.use('/api/v1/designers', designerRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/upload', uploadRoutes);
  app.use('/api/v1/messages', messageRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/database', databaseRoutes);
  app.use('/api/v1/vector', vectorSearchRoutes);
  app.use('/api/v1/complaints', complaintRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/auth', emailVerificationRoutes);
  app.use('/api/v1/tailors', tailorRoutes);
  console.log('🔗 Using database routes');
} else {
  // Use mock routes when database is not available
  app.use('/api/v1', mockRoutes);
  console.log('🎭 Using mock routes (database not available)');
}
// --- Health Check Route ---
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});
// --- Error Handler Middleware ---
app.use(errorHandler);
export { app };
