import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/callback', PaymentController.liqpayCallback);
router.post('/pay', authenticate, PaymentController.pay);
router.patch(
    '/:paymentId/confirm',
    authenticate,
    authorize(['ADMIN', 'RECEPTIONIST']),
    PaymentController.confirmCash,
);
router.patch('/:paymentId/refund', authenticate, authorize(['ADMIN']), PaymentController.refund);
router.post('/liqpay-params', authenticate, PaymentController.getLiqPayParams);

export default router;
