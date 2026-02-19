import prisma from '../lib/prisma.js';

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

export const getAllGuests = async () => {
    return await prisma.user.findMany({
        where: { role: 'GUEST' },
        select: { id: true, fullName: true, email: true, phone: true },
    });
};
