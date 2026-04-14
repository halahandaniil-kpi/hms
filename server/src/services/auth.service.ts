import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { sendResetEmail } from '../lib/mailer.js';

export const register = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
) => {
    try {
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

        // Геруємо Access Token (на 15 хвилин)
        const accessToken = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET!,
            {
                expiresIn: '15m',
            },
        );

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
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                throw new Error('Користувач з такою електронною поштою вже зареєстрований', {
                    cause: error,
                });
            }
        }
        throw error;
    }
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

// Запит на скидання
export const requestPasswordReset = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Для безпеки не кажемо, чи є такий email

    // Генеруємо токен на 15 хв, зашивши туди ID юзера
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '15m' });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendResetEmail(email, resetLink);
};

// Зміна пароля
export const resetPassword = async (token: string, newPassword: string) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: decoded.userId },
            data: { passwordHash: hashedPassword },
        });

        // Після зміни пароля видаляємо всі Refresh токени юзера для безпеки
        await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
    } catch {
        throw new Error('Посилання недійсне або термін його дії закінчився');
    }
};
