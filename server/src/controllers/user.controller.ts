import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as UserService from '../services/user.service.js';
import { Prisma } from '@prisma/client';

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { fullName, phone, email } = req.body;

        const updatedUser = await UserService.updateUserProfile(userId, { fullName, phone, email });
        res.json(updatedUser);
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(400).json({ message: 'Ця електронна пошта вже зайнята' });
        }
        res.status(500).json({ message: 'Помилка при оновленні профілю' });
    }
};
