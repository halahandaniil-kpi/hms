import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
) => {
    // Хешуємо пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Створюємо запис у БД
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
            fullName,
            phone,
        },
    });

    return user;
};

export const login = async (email: string, password: string) => {
    // Шукаємо користувача
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Користувача не знайдено');

    // Перевіряємо пароль
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new Error('Невірний пароль');

    // Генеруємо токен (в ньому зашифровані id та роль)
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    return { user, token };
};
