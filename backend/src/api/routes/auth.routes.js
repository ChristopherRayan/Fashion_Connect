import { Router } from 'express';
import { registerUser, loginUser, logoutUser, getCurrentUser, requestEmailVerification } from '../controllers/auth.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
const router = Router();
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/request-verification').post(requestEmailVerification);
// Secured routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/me').get(verifyJWT, getCurrentUser);
export default router;
