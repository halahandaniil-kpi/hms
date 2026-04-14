import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

export const updateUserProfile = async (
    userId: number,
    data: { fullName?: string; phone?: string; email?: string },
) => {
    return await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
        },
    });
};

export const getUsersByRole = async (role: 'RECEPTIONIST' | 'GUEST') => {
    return await prisma.user.findMany({
        where: { role },
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            createdAt: true,
        },
    });
};

export const createStaff = async (data: {
    email: string;
    fullName: string;
    phone?: string;
    passwordHash: string;
}) => {
    return await prisma.user.create({
        data: {
            ...data,
            role: 'RECEPTIONIST',
        },
    });
};

export const deleteUser = async (id: number) => {
    return await prisma.user.delete({ where: { id } });
};

export const changeUserPassword = async (userId: number, oldPass: string, newPass: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Користувача не знайдено');

    // Перевіряємо старий пароль
    const isOldValid = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isOldValid) {
        throw new Error('Поточний пароль вказано невірно');
    }

    const hashedNewPassword = await bcrypt.hash(newPass, 10);

    return await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedNewPassword },
    });
};
