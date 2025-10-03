import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service.js';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName } = req.body;
        const user = await AuthService.register(email, password, fullName);
        res.status(201).json({ message: 'Користувача створено', userId: user.id });
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
