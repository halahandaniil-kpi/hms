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

    // Визначаємо початковий статус оплати
    // Якщо картка — вважаємо сплаченим (імітація шлюзу)
    // Якщо готівка — статус залишається "очікує", поки адмін не підтвердить
    const isOnline = paymentMethod !== 'CASH';
    const initialStatus = isOnline ? 'COMPLETED' : 'PENDING';

    // Використовуємо транзакцію ($transaction)
    // Це гарантує: або обидві дії (створення оплати + оновлення броні) виконаються, або ніхто
    return await prisma.$transaction(async (tx) => {
        // Створюємо запис про оплату
        const payment = await tx.payment.create({
            data: {
                bookingId: booking.id,
                amount: booking.totalPrice, // Сума береться автоматично з броні
                paymentMethod: paymentMethod, // "CARD", "CASH"
                status: 'COMPLETED', // Вважаємо, що банк підтвердив
                transactionId: (isOnline ? transactionId : `CASH_${Date.now()}`) ?? null, // Унікальний номер транзакції
            },
        });

        // Якщо оплачено онлайн, одразу підтверджуємо бронювання
        if (isOnline) {
            await tx.booking.update({
                where: { id: booking.id },
                data: { status: 'CONFIRMED' },
            });
        }
        return payment;
    });
};

// Підтвердження отримання готівки
export const confirmCashPayment = async (paymentId: number) => {
    return await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
            where: { id: paymentId },
            data: { status: 'COMPLETED' },
        });

        await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' },
        });

        return payment;
    });
};
