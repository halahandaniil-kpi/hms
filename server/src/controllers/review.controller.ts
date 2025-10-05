import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as ReviewService from '../services/review.service.js';

export const addReview = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId, rating, comment } = req.body;
        const userId = req.user!.userId;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Рейтинг має бути від 1 до 5' });
        }

        const review = await ReviewService.createReview(userId, Number(bookingId), rating, comment);
        res.status(201).json(review);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
