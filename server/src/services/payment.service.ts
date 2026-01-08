import prisma from '../lib/prisma.js';

export const processPayment = async (
    bookingId: number,
    paymentMethod: string,
    transactionId?: string, // Номер транзакції від банку
) => {
    // Шукаємо бронювання, щоб знати суму до оплати
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    if (!booking) throw new Error('Бронювання не знайдено');
    if (booking.status === 'CANCELLED') throw new Error('Неможливо оплатити скасоване бронювання');

    const isOnline = paymentMethod !== 'CASH';
    // Онлайн оплата одразу COMPLETED, готівка - PENDING
    const initialStatus = isOnline ? 'COMPLETED' : 'PENDING';

    return await prisma.payment.create({
        data: {
            bookingId: booking.id,
            amount: booking.totalPrice,
            paymentMethod: paymentMethod,
            status: initialStatus,
            transactionId: (isOnline ? transactionId : `CASH_${Date.now()}`) ?? null,
        },
    });
};

// Підтвердження отримання готівки
export const confirmCashPayment = async (paymentId: number) => {
    return await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED' },
    });
};

// Оформити повернення коштів
export const refundPayment = async (paymentId: number) => {
    return await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
    });
};

// Позначити оплату як невдалу
export const markAsFailed = async (paymentId: number) => {
    return await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
    });
};
