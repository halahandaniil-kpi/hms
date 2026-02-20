import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as UserController from '../controllers/user.controller.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.get('/me', authenticate, AuthController.getMe);
router.patch('/update-me', authenticate, UserController.updateMe);
router.get('/guests', authenticate, authorize(['ADMIN', 'RECEPTIONIST']), UserController.getGuests);
router.get('/staff', authenticate, authorize(['ADMIN']), UserController.getReceptionists);
router.post('/staff', authenticate, authorize(['ADMIN']), UserController.addReceptionist);
router.delete('/staff/:id', authenticate, authorize(['ADMIN']), UserController.removeUser);

export default router;
