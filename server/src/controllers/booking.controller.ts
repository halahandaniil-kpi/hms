import { Request, Response } from 'express';
import * as BookingService from '../services/booking.service.js';
import prisma from '../lib/prisma.js';

export const create = async (req: any, res: Response) => {
    try {
        const { roomId, checkIn, checkOut } = req.body;
        // userId взяли з токена в authMiddleware (req.user)
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

export const getTakenDates = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'ID кімнати не вказано' });
        }

        const dates = await BookingService.getTakenDates(Number(id));
        res.json(dates);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAll = async (req: Request, res: Response) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                user: { select: { fullName: true, email: true, phone: true } },
                room: { include: { roomType: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(bookings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await prisma.booking.update({
            where: { id: Number(id) },
            data: { status },
        });
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
