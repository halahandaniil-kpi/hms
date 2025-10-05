import prisma from '../lib/prisma.js';

export const createReview = async (
    userId: number,
    bookingId: number,
    rating: number,
    comment?: string,
) => {
    // Шукаємо бронювання та перевіряємо, чи воно належить цьому юзеру
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
        throw new Error('Бронювання не знайдено або ви не є його власником');
    }

    // Перевіряємо статус (відгук тільки після виїзду)
    if (booking.status !== 'CHECKED_OUT') {
        throw new Error(
            'Ви можете залишити відгук тільки після завершення проживання (статус CHECKED_OUT)',
        );
    }

    // Перевіряємо, чи не залишив користувач відгук раніше
    const existingReview = await prisma.review.findUnique({
        where: { bookingId },
    });

    if (existingReview) {
        throw new Error('Ви вже залишили відгук для цього бронювання');
    }

    // Створюємо відгук
    return await prisma.review.create({
        data: {
            bookingId,
            rating,
            comment: comment ?? null,
        },
    });
};

// Отримати відгуки для конкретного типу номера
export const getRoomTypeReviews = async (roomTypeId: number) => {
    return await prisma.review.findMany({
        where: {
            booking: {
                room: {
                    roomTypeId: roomTypeId,
                },
            },
        },
        include: {
            booking: {
                include: {
                    user: { select: { fullName: true } }, // Беремо тільки ім'я автора
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};
