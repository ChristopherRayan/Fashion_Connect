import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  startConversationWithDesigner,
  markMessagesAsRead
} from '../controllers/message.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and common document types
  const allowedTypes = [
    'image/',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
  
  if (isAllowed) {
    console.log('📎 File accepted:', file.originalname, file.mimetype);
    cb(null, true);
  } else {
    console.log('❌ File rejected:', file.originalname, file.mimetype);
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
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

// All message routes require authentication
router.use(verifyJWT);

// Get user's conversations
router.route('/conversations').get(getUserConversations);

// Get messages for a specific conversation
router.route('/conversations/:conversationId/messages').get(getConversationMessages);

// Send a message (with optional file attachments)
router.route('/send').post(upload.array('attachments', 5), sendMessage);

// Start conversation with designer (from product page)
router.route('/start-conversation').post(startConversationWithDesigner);

// Mark messages as read
router.route('/conversations/:conversationId/read').patch(markMessagesAsRead);

export default router;
