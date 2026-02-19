import { Router } from 'express';
import * as BookingController from '../controllers/booking.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as ReviewController from '../controllers/review.controller.js';

const router = Router();

// Тільки залогінені користувачі можуть бронювати та бачити свої броні
router.post('/', authenticate, authorize(['GUEST']), BookingController.create);
router.get('/my', authenticate, BookingController.getMyBookings);
router.post('/review', authenticate, ReviewController.addReview);
router.get('/room/:id/taken-dates', BookingController.getTakenDates);
router.patch('/:id/cancel', authenticate, BookingController.cancel);
router.post(
    '/admin-create',
    authenticate,
    authorize(['ADMIN', 'RECEPTIONIST']),
    BookingController.adminCreate,
);

// Отримати ВСІ бронювання (тільки для ADMIN та RECEPTIONIST)
router.get('/all', authenticate, authorize(['ADMIN', 'RECEPTIONIST']), BookingController.getAll);

// Змінити статус (Check-in, Check-out, Cancel)
router.patch(
    '/:id/status',
    authenticate,
    authorize(['ADMIN', 'RECEPTIONIST']),
    BookingController.updateStatus,
);

export default router;
