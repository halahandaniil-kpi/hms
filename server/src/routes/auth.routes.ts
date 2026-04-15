import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as UserController from '../controllers/user.controller.js';
import {
    RegisterSchema,
    LoginSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    CreateStaffSchema,
} from '../lib/schemas.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.post('/register', validate(RegisterSchema), AuthController.register);
router.post('/login', validate(LoginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.get('/me', authenticate, AuthController.getMe);
router.patch('/update-me', authenticate, UserController.updateMe);
router.patch('/change-password', authenticate, UserController.changePassword);
router.get('/guests', authenticate, authorize(['ADMIN', 'RECEPTIONIST']), UserController.getGuests);
router.get('/staff', authenticate, authorize(['ADMIN']), UserController.getReceptionists);
router.post(
    '/staff',
    authenticate,
    authorize(['ADMIN']),
    validate(CreateStaffSchema),
    UserController.addReceptionist,
);
router.delete('/staff/:id', authenticate, authorize(['ADMIN']), UserController.removeUser);
router.post('/forgot-password', validate(ForgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(ResetPasswordSchema), AuthController.resetPassword);

export default router;
