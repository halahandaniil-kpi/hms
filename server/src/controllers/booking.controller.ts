import { Request, Response } from 'express';
import * as BookingService from '../services/booking.service.js';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import bcrypt from 'bcrypt';

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
                payment: true,
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

export const cancel = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        await BookingService.cancelBooking(Number(id), userId);
        res.json({ message: 'Бронювання успішно скасовано' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Бронювання для користувача
export const adminCreate = async (req: Request, res: Response) => {
    try {
        let { targetUserId } = req.body;
        const { roomId, checkIn, checkOut, specialRequests, newGuest } = req.body;

        // Якщо обрано "Новий гість", спочатку створюємо його акаунт
        if (newGuest) {
            const { email, fullName, phone } = newGuest;

            // Перевіряємо, чи немає вже такого користувача
            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                const randomPassword = Math.random().toString(36).slice(-10); // Випадковий пароль
                const hashedPassword = await bcrypt.hash(randomPassword, 10);

                user = await prisma.user.create({
                    data: {
                        email,
                        fullName,
                        phone: phone || null,
                        passwordHash: hashedPassword,
                        role: 'GUEST',
                    },
                });
            }
            targetUserId = user.id;
        }

        const booking = await BookingService.createBooking(
            Number(targetUserId),
            Number(roomId),
            checkIn,
            checkOut,
            specialRequests,
        );
        res.status(201).json(booking);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
