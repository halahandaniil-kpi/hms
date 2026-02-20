import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as UserService from '../services/user.service.js';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const parseId = (id: string | string[] | undefined): number => {
    const val = Array.isArray(id) ? id[0] : id;
    return parseInt(val as string, 10);
};

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

export const getGuests = async (req: Request, res: Response) => {
    try {
        const guests = await UserService.getUsersByRole('GUEST');
        res.json(guests);
    } catch (error: any) {
        res.status(500).json({ message: 'Помилка при отриманні списку гостей' });
    }
};

export const getReceptionists = async (req: Request, res: Response) => {
    try {
        const staff = await UserService.getUsersByRole('RECEPTIONIST');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Помилка отримання списку персоналу' });
    }
};

export const addReceptionist = async (req: Request, res: Response) => {
    try {
        const { email, fullName, phone, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await UserService.createStaff({
            email,
            fullName,
            phone,
            passwordHash: hashedPassword,
        });
        res.status(201).json(newUser);
    } catch (error: any) {
        res.status(400).json({ message: 'Користувач з такою поштою вже існує' });
    }
};

export const removeUser = async (req: Request, res: Response) => {
    try {
        const id = parseId(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Невалідний ID користувача' });
        }
        await UserService.deleteUser(id);
        res.json({ message: 'Користувача видалено' });
    } catch (error) {
        res.status(400).json({ message: 'Неможливо видалити користувача (є пов’язані записи)' });
    }
};
