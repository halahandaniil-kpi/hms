import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        role: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Очікуємо "Bearer <TOKEN>"

    if (!token) {
        return res.status(401).json({ message: 'Доступ заборонено. Токен відсутній.' });
    }

    try {
        // Перевіряємо Access Token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };

        // Записуємо дані користувача в об'єкт запиту
        req.user = decoded;

        next();
    } catch (error: any) {
        // Якщо токен протермінований, повертаємо 401.
        if (error.name === 'TokenExpiredError') {
            return res
                .status(401)
                .json({ message: 'Термін дії токена закінчився', code: 'TOKEN_EXPIRED' });
        }

        res.status(403).json({ message: 'Невалідний токен' });
    }
};
