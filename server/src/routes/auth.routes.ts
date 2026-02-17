import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as UserController from '../controllers/user.controller.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.get('/me', authenticate, AuthController.getMe);
router.patch('/update-me', authenticate, UserController.updateMe);

export default router;
