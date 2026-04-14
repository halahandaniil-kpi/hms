import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service.js';
import prisma from '../lib/prisma.js';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName, phone } = req.body;
        const data = await AuthService.register(email, password, fullName, phone);
        res.status(201).json(data);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const data = await AuthService.login(email, password);
        res.json(data);
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Потрібен Refresh token' });

        const newAccessToken = await AuthService.refresh(refreshToken);
        res.json({ accessToken: newAccessToken });
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};

export const getMe = async (req: any, res: Response) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, fullName: true, role: true, phone: true },
        });

        if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        await AuthService.requestPasswordReset(email);
        res.json({ message: 'Якщо цей email зареєстрований, ви отримаєте лист із інструкціями' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        await AuthService.resetPassword(token, newPassword);
        res.json({ message: 'Пароль успішно змінено' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
