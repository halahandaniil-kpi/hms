import { Request, Response } from 'express';
import * as BookingService from '../services/booking.service.js';

export const create = async (req: any, res: Response) => {
    try {
        const { roomId, checkIn, checkOut } = req.body;
        // userId ми взяли з токена в authMiddleware (req.user)
        const userId = req.user.userId;

        const booking = await BookingService.createBooking(userId, roomId, checkIn, checkOut);

        res.status(201).json(booking);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getMyBookings = async (req: any, res: Response) => {
    try {
        const userId = req.user.userId;
        const bookings = await BookingService.getUserBookings(userId);
        res.json(bookings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
