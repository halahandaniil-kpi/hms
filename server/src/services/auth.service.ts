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

    // Геруємо Access Token (на 15 хвилин)
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
        expiresIn: '15m',
    });

    // Генеруємо Refresh Token
    const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        { expiresIn: '7d' },
    );

    // Записуємо Refresh Token в базу даних
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 днів
        },
    });

    return { user, accessToken, refreshToken };
};

export const refresh = async (token: string) => {
    // Шукаємо токен в таблиці refresh_tokens
    const savedToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }, // Отримуємо дані користувача одразу
    });

    // Якщо токена немає або він протермінований
    if (!savedToken || savedToken.expiresAt < new Date()) {
        // Якщо токен невалідний, видаляємо його (якщо він був)
        if (savedToken) await prisma.refreshToken.delete({ where: { id: savedToken.id } });
        throw new Error('Refresh token недійсний або термін дії минув');
    }

    // Генеруємо новий Access Token
    const accessToken = jwt.sign(
        { userId: savedToken.userId, role: savedToken.user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' },
    );

    return accessToken;
};
