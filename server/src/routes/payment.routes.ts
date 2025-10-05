import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/pay', authenticate, PaymentController.pay);
router.patch('/:paymentId/confirm', authenticate, PaymentController.confirmCash);

export default router;
