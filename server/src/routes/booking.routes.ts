import { Router } from 'express';
import * as BookingController from '../controllers/booking.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Тільки залогінені користувачі можуть бронювати та бачити свої броні
router.post('/', authenticate, BookingController.create);
router.get('/my', authenticate, BookingController.getMyBookings);

export default router;
