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

    return await prisma.payment.create({
        data: {
            bookingId: booking.id,
            amount: booking.totalPrice,
            paymentMethod: paymentMethod,
            status: 'PENDING',
            // Для картки transactionId прийде пізніше від LiqPay, тому поки null або тимчасовий
            transactionId:
                transactionId ?? (paymentMethod === 'CASH' ? `CASH_${Date.now()}` : null),
        },
    });
};

// Оновлення статусу після відповіді LiqPay
export const updatePaymentStatus = async (
    bookingId: number,
    status: 'COMPLETED' | 'FAILED',
    transactionId: string,
) => {
    return await prisma.payment.update({
        where: { bookingId: bookingId },
        data: {
            status: status,
            transactionId: transactionId,
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
    return await prisma.$transaction(async (tx) => {
        // Оновлюємо статус оплати
        const updatedPayment = await tx.payment.update({
            where: { id: paymentId },
            data: { status: 'REFUNDED' },
        });

        // Скасовуємо саму бронь (щоб звільнити номер)
        await tx.booking.update({
            where: { id: updatedPayment.bookingId },
            data: { status: 'CANCELLED' },
        });

        return updatedPayment;
    });
};
