import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import { app } from './src/app.js';
import { initializeSocket } from './src/services/socketService.js';

dotenv.config();

// Debug: Check if environment variables are loaded
console.log('🔍 Environment Variables Debug:', {
  PORT: process.env.PORT,
  EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
  EMAIL_HOST: process.env.EMAIL_HOST ? 'Set' : 'Not set',
  NODE_ENV: process.env.NODE_ENV
});

const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO with broader dev CORS (match Express CORS above)
const socketAllowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (socketAllowedOrigins.includes(origin)) return callback(null, true);
      const lanOk = /^http:\/\/192\.168\.(\d{1,3})\.(\d{1,3}):5173$/.test(origin) ||
        /^http:\/\/10\.(\d{1,3})\.(\d{1,3})\.(\d{1,3}):5173$/.test(origin) ||
        origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173';
      return lanOk ? callback(null, true) : callback(new Error(`Socket CORS blocked for ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize socket handlers
try {
  initializeSocket(io);
  console.log('✅ Socket service initialized');
} catch (error) {
  console.error('❌ Socket service initialization failed:', error.message);
}

console.log('🚀 Starting server...');
console.log('📊 Environment:', {
  PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  USE_MOCK_DATA: process.env.USE_MOCK_DATA
});

// Start server regardless of database connection
server.listen(PORT, () => {
  console.log(`✅ Server is running at port: ${PORT}`);
  console.log(`🔌 WebSocket server initialized`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

server.on('error', (err) => {
  console.error("Server Error: ", err);
  throw err;
});

// Try to connect to database but don't block server startup
connectDB()
  .then(() => {
    console.log('📊 Database connection successful');
  })
  .catch((err) => {
    console.error("MONGO DB connection failed !!! ", err);
    console.log("⚠️  Server running with mock data");
  });
